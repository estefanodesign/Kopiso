import express from 'express'
import Joi from 'joi'
import { randomUUID } from 'crypto'
import { authenticate, requireAdmin } from '../middleware/auth.js'
import { asyncHandler, successResponse, paginatedResponse, createValidationError, AppError, NotFoundError } from '../middleware/errorHandler.js'
import db from '../services/database.js'
import { Order, OrderItem, Address, PaymentMethod, Transaction } from '../../src/types/index.js'

const router = express.Router()

// Validation schemas
const addressSchema = Joi.object({
  id: Joi.string().optional(),
  name: Joi.string().required(),
  phone: Joi.string().required(),
  street: Joi.string().required(),
  city: Joi.string().required(),
  state: Joi.string().required(),
  zipCode: Joi.string().required(),
  country: Joi.string().required(),
  isDefault: Joi.boolean().default(false)
})

const paymentMethodSchema = Joi.object({
  type: Joi.string().valid('credit_card', 'debit_card', 'paypal', 'bank_transfer', 'cash_on_delivery').required(),
  provider: Joi.string().optional(),
  last4: Joi.string().optional(),
  expiryMonth: Joi.number().min(1).max(12).optional(),
  expiryYear: Joi.number().min(new Date().getFullYear()).optional()
})

const orderItemSchema = Joi.object({
  productId: Joi.string().required(),
  productName: Joi.string().required(),
  productImage: Joi.string().required(),
  price: Joi.number().positive().required(),
  quantity: Joi.number().integer().min(1).required(),
  total: Joi.number().positive().required(),
  selectedVariant: Joi.object().optional()
})

const createOrderSchema = Joi.object({
  items: Joi.array().items(orderItemSchema).min(1).required(),
  shippingAddress: addressSchema.required(),
  paymentMethod: paymentMethodSchema.required(),
  notes: Joi.string().max(500).optional()
})

const updateOrderStatusSchema = Joi.object({
  status: Joi.string().valid(
    'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'
  ).required()
})

// Helper function to calculate order totals
const calculateOrderTotals = (items: OrderItem[]) => {
  const subtotal = items.reduce((sum, item) => sum + item.total, 0)
  const shipping = subtotal > 50 ? 0 : 5.99 // Free shipping over $50
  const tax = subtotal * 0.1 // 10% tax rate
  const total = subtotal + shipping + tax

  return { subtotal, shipping, tax, total }
}

// Helper function to validate order items against products
const validateOrderItems = async (items: OrderItem[]) => {
  for (const item of items) {
    const product = await db.findById('products', item.productId)
    
    if (!product) {
      throw new AppError(`Product ${item.productName} is no longer available`, 400)
    }

    if (product.stock < item.quantity) {
      throw new AppError(`Insufficient stock for ${item.productName}. Available: ${product.stock}`, 400)
    }

    // Verify price hasn't changed significantly (allow 5% variance)
    const currentPrice = product.discountPrice || product.price
    const priceVariance = Math.abs(currentPrice - item.price) / item.price
    
    if (priceVariance > 0.05) {
      throw new AppError(`Price for ${item.productName} has changed. Please refresh your cart.`, 400)
    }
  }
}

// Helper function to update product stock
const updateProductStock = async (items: OrderItem[], operation: 'decrease' | 'increase') => {
  for (const item of items) {
    const product = await db.findById('products', item.productId)
    
    if (product) {
      const stockChange = operation === 'decrease' ? -item.quantity : item.quantity
      const newStock = Math.max(0, product.stock + stockChange)
      
      await db.updateById('products', item.productId, {
        stock: newStock,
        updatedAt: new Date().toISOString()
      })
    }
  }
}

// GET /api/orders - Get user's orders
router.get('/', authenticate, asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page as string) || 1
  const limit = Math.min(parseInt(req.query.limit as string) || 10, 50)
  const status = req.query.status as string

  // Build filter criteria
  const filterCriteria = (order: Order) => {
    if (order.userId !== req.user!.id) return false
    if (status && order.status !== status) return false
    return true
  }

  // Get paginated orders
  const result = await db.paginate(
    'orders',
    page,
    limit,
    filterCriteria,
    (a: Order, b: Order) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  paginatedResponse(res, result.data, {
    page: result.page,
    limit: result.limit,
    total: result.total,
    totalPages: result.totalPages
  }, 'Orders retrieved successfully')
}))

// GET /api/orders/:id - Get single order
router.get('/:id', authenticate, asyncHandler(async (req, res) => {
  const { id } = req.params
  
  const order = await db.findById<Order>('orders', id)
  
  if (!order) {
    throw new NotFoundError('Order')
  }

  // Check if user owns the order (unless admin)
  if (req.user!.role !== 'admin' && order.userId !== req.user!.id) {
    throw new AppError('Access denied', 403)
  }

  successResponse(res, order, 'Order retrieved successfully')
}))

// POST /api/orders - Create new order
router.post('/', authenticate, asyncHandler(async (req, res) => {
  // Validate request body
  const { error, value } = createOrderSchema.validate(req.body)
  if (error) {
    const validationErrors = error.details.map(detail => ({
      field: detail.path[0] as string,
      message: detail.message
    }))
    throw createValidationError(validationErrors)
  }

  const { items, shippingAddress, paymentMethod, notes } = value

  // Validate order items
  await validateOrderItems(items)

  // Calculate totals
  const { subtotal, shipping, tax, total } = calculateOrderTotals(items)

  // Create order
  const newOrder: Order = {
    id: randomUUID(),
    userId: req.user!.id,
    items,
    status: 'pending',
    subtotal,
    shipping,
    tax,
    total,
    shippingAddress,
    paymentMethod,
    paymentStatus: 'pending',
    notes,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }

  // Save order
  await db.insert('orders', newOrder)

  // Update product stock
  await updateProductStock(items, 'decrease')

  // Create revenue transaction
  const transaction: Transaction = {
    id: randomUUID(),
    orderId: newOrder.id,
    type: 'revenue',
    amount: total,
    description: `Order #${newOrder.id.slice(-8)}`,
    category: 'sales',
    date: new Date().toISOString(),
    createdAt: new Date().toISOString()
  }

  await db.insert('transactions', transaction)

  successResponse(res, newOrder, 'Order created successfully', 201)
}))

// PUT /api/orders/:id/status - Update order status
router.put('/:id/status', authenticate, asyncHandler(async (req, res) => {
  const { id } = req.params

  // Validate request body
  const { error, value } = updateOrderStatusSchema.validate(req.body)
  if (error) {
    const validationErrors = error.details.map(detail => ({
      field: detail.path[0] as string,
      message: detail.message
    }))
    throw createValidationError(validationErrors)
  }

  const { status } = value

  // Get order
  const order = await db.findById<Order>('orders', id)
  if (!order) {
    throw new NotFoundError('Order')
  }

  // Check permissions
  if (req.user!.role !== 'admin' && order.userId !== req.user!.id) {
    throw new AppError('Access denied', 403)
  }

  // Customers can only cancel pending orders
  if (req.user!.role !== 'admin' && status !== 'cancelled') {
    throw new AppError('Customers can only cancel orders', 403)
  }

  if (req.user!.role !== 'admin' && order.status !== 'pending') {
    throw new AppError('Only pending orders can be cancelled', 400)
  }

  // Handle stock updates for cancellations and refunds
  if ((status === 'cancelled' || status === 'refunded') && 
      !['cancelled', 'refunded'].includes(order.status)) {
    await updateProductStock(order.items, 'increase')
  }

  // Handle refund transaction
  if (status === 'refunded' && order.status !== 'refunded') {
    const refundTransaction: Transaction = {
      id: randomUUID(),
      orderId: order.id,
      type: 'refund',
      amount: order.total,
      description: `Refund for Order #${order.id.slice(-8)}`,
      category: 'refunds',
      date: new Date().toISOString(),
      createdAt: new Date().toISOString()
    }

    await db.insert('transactions', refundTransaction)
  }

  // Update order status
  const updatedOrder = await db.updateById('orders', id, {
    status,
    paymentStatus: status === 'refunded' ? 'refunded' : order.paymentStatus,
    updatedAt: new Date().toISOString()
  })

  successResponse(res, updatedOrder, 'Order status updated successfully')
}))

// PUT /api/orders/:id/payment-status - Update payment status (Admin only)
router.put('/:id/payment-status', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params
  const { paymentStatus } = req.body

  if (!['pending', 'paid', 'failed', 'refunded'].includes(paymentStatus)) {
    throw new AppError('Invalid payment status', 400)
  }

  const order = await db.findById<Order>('orders', id)
  if (!order) {
    throw new NotFoundError('Order')
  }

  const updatedOrder = await db.updateById('orders', id, {
    paymentStatus,
    updatedAt: new Date().toISOString()
  })

  successResponse(res, updatedOrder, 'Payment status updated successfully')
}))

// POST /api/orders/:id/tracking - Add tracking number (Admin only)
router.post('/:id/tracking', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params
  const { trackingNumber } = req.body

  if (!trackingNumber || typeof trackingNumber !== 'string') {
    throw new AppError('Valid tracking number is required', 400)
  }

  const order = await db.findById<Order>('orders', id)
  if (!order) {
    throw new NotFoundError('Order')
  }

  const updatedOrder = await db.updateById('orders', id, {
    trackingNumber,
    status: order.status === 'confirmed' || order.status === 'processing' ? 'shipped' : order.status,
    updatedAt: new Date().toISOString()
  })

  successResponse(res, updatedOrder, 'Tracking number added successfully')
}))

// GET /api/orders/track/:trackingNumber - Track order by tracking number
router.get('/track/:trackingNumber', asyncHandler(async (req, res) => {
  const { trackingNumber } = req.params

  const order = await db.findOne<Order>('orders', order => order.trackingNumber === trackingNumber)

  if (!order) {
    throw new NotFoundError('Order with this tracking number')
  }

  // Return limited information for security
  const trackingInfo = {
    id: order.id,
    status: order.status,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    trackingNumber: order.trackingNumber,
    shippingAddress: {
      city: order.shippingAddress.city,
      state: order.shippingAddress.state,
      country: order.shippingAddress.country
    }
  }

  successResponse(res, trackingInfo, 'Order tracking information retrieved')
}))

// GET /api/orders/stats/summary - Get order statistics for user
router.get('/stats/summary', authenticate, asyncHandler(async (req, res) => {
  const userOrders = await db.find<Order>('orders', order => order.userId === req.user!.id)

  const stats = {
    totalOrders: userOrders.length,
    totalSpent: userOrders.reduce((sum, order) => sum + order.total, 0),
    pendingOrders: userOrders.filter(order => order.status === 'pending').length,
    deliveredOrders: userOrders.filter(order => order.status === 'delivered').length,
    recentOrders: userOrders
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
  }

  successResponse(res, stats, 'Order statistics retrieved successfully')
}))

// POST /api/orders/:id/cancel - Cancel order
router.post('/:id/cancel', authenticate, asyncHandler(async (req, res) => {
  const { id } = req.params
  const { reason } = req.body

  const order = await db.findById<Order>('orders', id)
  if (!order) {
    throw new NotFoundError('Order')
  }

  // Check if user owns the order
  if (order.userId !== req.user!.id) {
    throw new AppError('Access denied', 403)
  }

  // Check if order can be cancelled
  if (!['pending', 'confirmed'].includes(order.status)) {
    throw new AppError('Order cannot be cancelled at this stage', 400)
  }

  // Update order status
  await db.updateById('orders', id, {
    status: 'cancelled',
    notes: reason ? `${order.notes || ''}\nCancellation reason: ${reason}`.trim() : order.notes,
    updatedAt: new Date().toISOString()
  })

  // Restore product stock
  await updateProductStock(order.items, 'increase')

  successResponse(res, null, 'Order cancelled successfully')
}))

export default router