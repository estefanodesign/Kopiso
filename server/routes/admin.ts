import express from 'express'
import { authenticate, requireAdmin } from '../middleware/auth.js'
import { asyncHandler, successResponse, paginatedResponse, AppError } from '../middleware/errorHandler.js'
import db from '../services/database.js'
import { User, Product, Order, Transaction, DashboardStats, SalesData } from '../../src/types/index.js'

const router = express.Router()

// All admin routes require authentication and admin role
router.use(authenticate, requireAdmin)

// GET /api/admin/dashboard - Get dashboard statistics
router.get('/dashboard', asyncHandler(async (req, res) => {
  // Get all data for calculations
  const [orders, users, products, transactions] = await Promise.all([
    db.read<Order>('orders'),
    db.read<User>('users'),
    db.read<Product>('products'),
    db.read<Transaction>('transactions')
  ])

  // Calculate current period stats (last 30 days)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const recentOrders = orders.filter(order => 
    new Date(order.createdAt) >= thirtyDaysAgo
  )

  // Calculate totals
  const totalRevenue = transactions
    .filter(t => t.type === 'revenue')
    .reduce((sum, t) => sum + t.amount, 0)

  const totalOrders = orders.length
  const totalCustomers = users.filter(u => u.role === 'customer').length
  const totalProducts = products.length

  // Calculate growth rates (comparing last 30 days to previous 30 days)
  const sixtyDaysAgo = new Date()
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)

  const previousPeriodOrders = orders.filter(order => {
    const orderDate = new Date(order.createdAt)
    return orderDate >= sixtyDaysAgo && orderDate < thirtyDaysAgo
  })

  const currentRevenue = recentOrders.reduce((sum, order) => sum + order.total, 0)
  const previousRevenue = previousPeriodOrders.reduce((sum, order) => sum + order.total, 0)

  const revenueGrowth = previousRevenue === 0 ? 100 : 
    ((currentRevenue - previousRevenue) / previousRevenue) * 100

  const orderGrowth = previousPeriodOrders.length === 0 ? 100 :
    ((recentOrders.length - previousPeriodOrders.length) / previousPeriodOrders.length) * 100

  // Get new customers in last 30 days
  const newCustomers = users.filter(user => 
    user.role === 'customer' && new Date(user.createdAt) >= thirtyDaysAgo
  )

  const previousNewCustomers = users.filter(user => {
    const userDate = new Date(user.createdAt)
    return user.role === 'customer' && userDate >= sixtyDaysAgo && userDate < thirtyDaysAgo
  })

  const customerGrowth = previousNewCustomers.length === 0 ? 100 :
    ((newCustomers.length - previousNewCustomers.length) / previousNewCustomers.length) * 100

  // Get top products by sales
  const productSales = new Map<string, { product: Product; totalSold: number; revenue: number }>()
  
  orders.forEach(order => {
    order.items.forEach(item => {
      const existing = productSales.get(item.productId)
      const product = products.find(p => p.id === item.productId)
      
      if (product) {
        if (existing) {
          existing.totalSold += item.quantity
          existing.revenue += item.total
        } else {
          productSales.set(item.productId, {
            product,
            totalSold: item.quantity,
            revenue: item.total
          })
        }
      }
    })
  })

  const topProducts = Array.from(productSales.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)
    .map(item => item.product)

  // Get recent orders
  const recentOrdersList = orders
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10)

  // Get low stock products
  const lowStockProducts = products
    .filter(product => product.stock <= 10)
    .sort((a, b) => a.stock - b.stock)
    .slice(0, 10)

  const stats: DashboardStats = {
    totalRevenue,
    totalOrders,
    totalCustomers,
    totalProducts,
    revenueGrowth,
    orderGrowth,
    customerGrowth,
    topProducts,
    recentOrders: recentOrdersList,
    lowStockProducts
  }

  successResponse(res, stats, 'Dashboard statistics retrieved successfully')
}))

// GET /api/admin/users - Get all users with pagination
router.get('/users', asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page as string) || 1
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100)
  const search = req.query.search as string
  const role = req.query.role as string

  // Build filter criteria
  const filterCriteria = (user: User) => {
    if (search) {
      const searchTerm = search.toLowerCase()
      const matchesSearch = 
        user.name.toLowerCase().includes(searchTerm) ||
        user.email.toLowerCase().includes(searchTerm)
      if (!matchesSearch) return false
    }
    
    if (role && user.role !== role) return false
    
    return true
  }

  // Get paginated users
  const result = await db.paginate(
    'users',
    page,
    limit,
    filterCriteria,
    (a: User, b: User) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  // Remove passwords from response
  const usersWithoutPasswords = result.data.map(user => {
    const { password, ...userWithoutPassword } = user
    return userWithoutPassword
  })

  paginatedResponse(res, usersWithoutPasswords, {
    page: result.page,
    limit: result.limit,
    total: result.total,
    totalPages: result.totalPages
  }, 'Users retrieved successfully')
}))

// GET /api/admin/users/:id - Get single user
router.get('/users/:id', asyncHandler(async (req, res) => {
  const { id } = req.params
  
  const user = await db.findById<User>('users', id)
  
  if (!user) {
    throw new AppError('User not found', 404)
  }

  // Remove password from response
  const { password, ...userWithoutPassword } = user
  
  // Get user's orders
  const userOrders = await db.find<Order>('orders', order => order.userId === id)
  
  successResponse(res, {
    user: userWithoutPassword,
    orders: userOrders,
    orderCount: userOrders.length,
    totalSpent: userOrders.reduce((sum, order) => sum + order.total, 0)
  }, 'User details retrieved successfully')
}))

// PUT /api/admin/users/:id/role - Update user role
router.put('/users/:id/role', asyncHandler(async (req, res) => {
  const { id } = req.params
  const { role } = req.body

  if (!['customer', 'admin'].includes(role)) {
    throw new AppError('Invalid role. Must be customer or admin', 400)
  }

  const user = await db.findById<User>('users', id)
  
  if (!user) {
    throw new AppError('User not found', 404)
  }

  const updatedUser = await db.updateById('users', id, {
    role,
    updatedAt: new Date().toISOString()
  })

  // Remove password from response
  const { password, ...userWithoutPassword } = updatedUser as User

  successResponse(res, userWithoutPassword, 'User role updated successfully')
}))

// DELETE /api/admin/users/:id - Delete user (soft delete by deactivating)
router.delete('/users/:id', asyncHandler(async (req, res) => {
  const { id } = req.params

  const user = await db.findById<User>('users', id)
  
  if (!user) {
    throw new AppError('User not found', 404)
  }

  // Check if user has pending orders
  const pendingOrders = await db.find<Order>('orders', order => 
    order.userId === id && ['pending', 'confirmed', 'processing', 'shipped'].includes(order.status)
  )

  if (pendingOrders.length > 0) {
    throw new AppError('Cannot delete user with pending orders', 400)
  }

  // For now, we'll actually delete the user
  // In production, you might want to soft delete instead
  const deleted = await db.deleteById('users', id)
  
  if (!deleted) {
    throw new AppError('Failed to delete user', 500)
  }

  successResponse(res, null, 'User deleted successfully')
}))

// GET /api/admin/orders - Get all orders with pagination
router.get('/orders', asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page as string) || 1
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100)
  const status = req.query.status as string
  const search = req.query.search as string

  // Build filter criteria
  const filterCriteria = (order: Order) => {
    if (status && order.status !== status) return false
    
    if (search) {
      const searchTerm = search.toLowerCase()
      const matchesSearch = 
        order.id.toLowerCase().includes(searchTerm) ||
        order.shippingAddress.name.toLowerCase().includes(searchTerm) ||
        order.shippingAddress.email?.toLowerCase().includes(searchTerm)
      if (!matchesSearch) return false
    }
    
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

// GET /api/admin/products - Get all products with pagination
router.get('/products', asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page as string) || 1
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100)
  const category = req.query.category as string
  const search = req.query.search as string
  const lowStock = req.query.lowStock === 'true'

  // Build filter criteria
  const filterCriteria = (product: Product) => {
    if (category && product.category !== category) return false
    
    if (search) {
      const searchTerm = search.toLowerCase()
      const matchesSearch = 
        product.name.toLowerCase().includes(searchTerm) ||
        product.description.toLowerCase().includes(searchTerm)
      if (!matchesSearch) return false
    }
    
    if (lowStock && product.stock > 10) return false
    
    return true
  }

  // Get paginated products
  const result = await db.paginate(
    'products',
    page,
    limit,
    filterCriteria,
    (a: Product, b: Product) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  paginatedResponse(res, result.data, {
    page: result.page,
    limit: result.limit,
    total: result.total,
    totalPages: result.totalPages
  }, 'Products retrieved successfully')
}))

// GET /api/admin/analytics/sales - Get sales analytics
router.get('/analytics/sales', asyncHandler(async (req, res) => {
  const period = req.query.period as string || 'month' // week, month, year
  
  const orders = await db.read<Order>('orders')
  const completedOrders = orders.filter(order => order.status === 'delivered')

  let startDate: Date
  const now = new Date()

  switch (period) {
    case 'week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      break
    case 'year':
      startDate = new Date(now.getFullYear(), 0, 1)
      break
    default: // month
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
  }

  // Group sales by date
  const salesByDate = new Map<string, { revenue: number; orders: number; customers: Set<string> }>()

  completedOrders
    .filter(order => new Date(order.createdAt) >= startDate)
    .forEach(order => {
      const dateKey = new Date(order.createdAt).toISOString().split('T')[0]
      
      if (!salesByDate.has(dateKey)) {
        salesByDate.set(dateKey, {
          revenue: 0,
          orders: 0,
          customers: new Set()
        })
      }

      const dayData = salesByDate.get(dateKey)!
      dayData.revenue += order.total
      dayData.orders += 1
      dayData.customers.add(order.userId)
    })

  // Convert to array and sort by date
  const salesData: SalesData[] = Array.from(salesByDate.entries())
    .map(([date, data]) => ({
      date,
      revenue: data.revenue,
      orders: data.orders,
      customers: data.customers.size
    }))
    .sort((a, b) => a.date.localeCompare(b.date))

  successResponse(res, salesData, 'Sales analytics retrieved successfully')
}))

// GET /api/admin/accounting/summary - Get accounting summary
router.get('/accounting/summary', asyncHandler(async (req, res) => {
  const transactions = await db.read<Transaction>('transactions')
  
  const summary = {
    totalRevenue: transactions
      .filter(t => t.type === 'revenue')
      .reduce((sum, t) => sum + t.amount, 0),
    totalExpenses: transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0),
    totalRefunds: transactions
      .filter(t => t.type === 'refund')
      .reduce((sum, t) => sum + t.amount, 0),
    netProfit: 0 // Will be calculated below
  }

  summary.netProfit = summary.totalRevenue - summary.totalExpenses - summary.totalRefunds

  // Get monthly breakdown for current year
  const currentYear = new Date().getFullYear()
  const monthlyData = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1
    const monthTransactions = transactions.filter(t => {
      const tDate = new Date(t.date)
      return tDate.getFullYear() === currentYear && tDate.getMonth() + 1 === month
    })

    return {
      month,
      revenue: monthTransactions
        .filter(t => t.type === 'revenue')
        .reduce((sum, t) => sum + t.amount, 0),
      expenses: monthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0),
      refunds: monthTransactions
        .filter(t => t.type === 'refund')
        .reduce((sum, t) => sum + t.amount, 0)
    }
  })

  successResponse(res, {
    summary,
    monthlyData
  }, 'Accounting summary retrieved successfully')
}))

// GET /api/admin/accounting/transactions - Get all transactions with pagination
router.get('/accounting/transactions', asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page as string) || 1
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100)
  const type = req.query.type as string
  const category = req.query.category as string

  // Build filter criteria
  const filterCriteria = (transaction: Transaction) => {
    if (type && transaction.type !== type) return false
    if (category && transaction.category !== category) return false
    return true
  }

  // Get paginated transactions
  const result = await db.paginate(
    'transactions',
    page,
    limit,
    filterCriteria,
    (a: Transaction, b: Transaction) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  paginatedResponse(res, result.data, {
    page: result.page,
    limit: result.limit,
    total: result.total,
    totalPages: result.totalPages
  }, 'Transactions retrieved successfully')
}))

// POST /api/admin/accounting/transactions - Add manual transaction
router.post('/accounting/transactions', asyncHandler(async (req, res) => {
  const { type, amount, description, category, reference } = req.body

  if (!['revenue', 'expense', 'refund'].includes(type)) {
    throw new AppError('Invalid transaction type', 400)
  }

  if (!amount || amount <= 0) {
    throw new AppError('Amount must be positive', 400)
  }

  if (!description || !category) {
    throw new AppError('Description and category are required', 400)
  }

  const transaction: Transaction = {
    id: crypto.randomUUID(),
    type,
    amount,
    description,
    category,
    reference,
    date: new Date().toISOString(),
    createdAt: new Date().toISOString()
  }

  await db.insert('transactions', transaction)

  successResponse(res, transaction, 'Transaction added successfully', 201)
}))

// DELETE /api/admin/accounting/transactions/:id - Delete transaction
router.delete('/accounting/transactions/:id', asyncHandler(async (req, res) => {
  const { id } = req.params

  const transaction = await db.findById<Transaction>('transactions', id)
  
  if (!transaction) {
    throw new AppError('Transaction not found', 404)
  }

  // Don't allow deletion of order-related transactions
  if (transaction.orderId) {
    throw new AppError('Cannot delete order-related transactions', 400)
  }

  const deleted = await db.deleteById('transactions', id)
  
  if (!deleted) {
    throw new AppError('Failed to delete transaction', 500)
  }

  successResponse(res, null, 'Transaction deleted successfully')
}))

export default router