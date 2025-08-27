import express from 'express'
import Joi from 'joi'
import { randomUUID } from 'crypto'
import { authenticate, optionalAuth, requireAdmin } from '../middleware/auth.js'
import { asyncHandler, successResponse, paginatedResponse, createValidationError, AppError, NotFoundError } from '../middleware/errorHandler.js'
import db from '../services/database.js'
import { Product, ProductFilters, SortOptions } from '../../src/types/index.js'

const router = express.Router()

// Validation schemas
const createProductSchema = Joi.object({
  name: Joi.string().min(1).max(200).required(),
  description: Joi.string().min(1).max(2000).required(),
  price: Joi.number().positive().required(),
  discountPrice: Joi.number().positive().optional(),
  images: Joi.array().items(Joi.string().uri()).min(1).required(),
  category: Joi.string().required(),
  stock: Joi.number().integer().min(0).required(),
  specifications: Joi.object().pattern(Joi.string(), Joi.string()).optional(),
  tags: Joi.array().items(Joi.string()).optional(),
  featured: Joi.boolean().default(false)
})

const updateProductSchema = Joi.object({
  name: Joi.string().min(1).max(200).optional(),
  description: Joi.string().min(1).max(2000).optional(),
  price: Joi.number().positive().optional(),
  discountPrice: Joi.number().positive().optional(),
  images: Joi.array().items(Joi.string().uri()).min(1).optional(),
  category: Joi.string().optional(),
  stock: Joi.number().integer().min(0).optional(),
  specifications: Joi.object().pattern(Joi.string(), Joi.string()).optional(),
  tags: Joi.array().items(Joi.string()).optional(),
  featured: Joi.boolean().optional()
})

// Helper function to parse sort options
const parseSortOptions = (sortQuery: string): SortOptions => {
  const [field, order] = sortQuery.split(':')
  const validFields = ['name', 'price', 'rating', 'createdAt', 'popularity']
  const validOrders = ['asc', 'desc']

  return {
    field: validFields.includes(field) ? field as any : 'createdAt',
    order: validOrders.includes(order) ? order as any : 'desc'
  }
}

// Helper function to create sort function
const createSortFunction = (sortOptions: SortOptions) => {
  return (a: Product, b: Product) => {
    let aValue: any = a[sortOptions.field]
    let bValue: any = b[sortOptions.field]

    // Handle special cases
    if (sortOptions.field === 'popularity') {
      aValue = a.reviewCount * a.rating
      bValue = b.reviewCount * b.rating
    }

    // Handle date strings
    if (sortOptions.field === 'createdAt') {
      aValue = new Date(aValue).getTime()
      bValue = new Date(bValue).getTime()
    }

    if (sortOptions.order === 'asc') {
      return aValue > bValue ? 1 : aValue < bValue ? -1 : 0
    } else {
      return aValue < bValue ? 1 : aValue > bValue ? -1 : 0
    }
  }
}

// Helper function to apply filters
const applyFilters = (products: Product[], filters: ProductFilters): Product[] => {
  return products.filter(product => {
    // Category filter
    if (filters.category && product.category !== filters.category) {
      return false
    }

    // Price range filter
    const price = product.discountPrice || product.price
    if (filters.minPrice && price < filters.minPrice) {
      return false
    }
    if (filters.maxPrice && price > filters.maxPrice) {
      return false
    }

    // Rating filter
    if (filters.rating && product.rating < filters.rating) {
      return false
    }

    // Stock filter
    if (filters.inStock && product.stock <= 0) {
      return false
    }

    // Featured filter
    if (filters.featured && !product.featured) {
      return false
    }

    // Tags filter
    if (filters.tags && filters.tags.length > 0) {
      const hasMatchingTag = filters.tags.some(tag => 
        product.tags.some(productTag => 
          productTag.toLowerCase().includes(tag.toLowerCase())
        )
      )
      if (!hasMatchingTag) {
        return false
      }
    }

    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase()
      const searchableText = [
        product.name,
        product.description,
        ...product.tags,
        ...Object.values(product.specifications || {})
      ].join(' ').toLowerCase()

      if (!searchableText.includes(searchTerm)) {
        return false
      }
    }

    return true
  })
}

// GET /api/products - Get products with filtering, searching, and pagination
router.get('/', optionalAuth, asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page as string) || 1
  const limit = Math.min(parseInt(req.query.limit as string) || 12, 50) // Max 50 items per page
  const sortQuery = req.query.sort as string || 'createdAt:desc'
  const search = req.query.search as string

  // Parse filters from query parameters
  const filters: ProductFilters = {
    category: req.query.category as string,
    minPrice: req.query.filter_minPrice ? parseFloat(req.query.filter_minPrice as string) : undefined,
    maxPrice: req.query.filter_maxPrice ? parseFloat(req.query.filter_maxPrice as string) : undefined,
    rating: req.query.filter_rating ? parseFloat(req.query.filter_rating as string) : undefined,
    inStock: req.query.filter_inStock === 'true',
    featured: req.query.filter_featured === 'true',
    tags: req.query.filter_tags ? (req.query.filter_tags as string).split(',') : undefined,
    search
  }

  // Remove undefined values
  Object.keys(filters).forEach(key => {
    if (filters[key as keyof ProductFilters] === undefined) {
      delete filters[key as keyof ProductFilters]
    }
  })

  // Get all products
  const allProducts = await db.read<Product>('products')

  // Apply filters
  const filteredProducts = applyFilters(allProducts, filters)

  // Apply sorting
  const sortOptions = parseSortOptions(sortQuery)
  const sortFunction = createSortFunction(sortOptions)
  filteredProducts.sort(sortFunction)

  // Apply pagination
  const total = filteredProducts.length
  const totalPages = Math.ceil(total / limit)
  const startIndex = (page - 1) * limit
  const endIndex = startIndex + limit
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex)

  paginatedResponse(res, paginatedProducts, {
    page,
    limit,
    total,
    totalPages
  }, 'Products retrieved successfully')
}))

// GET /api/products/featured - Get featured products
router.get('/featured', asyncHandler(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit as string) || 8, 20)
  
  const products = await db.find<Product>('products', product => product.featured === true)
  
  // Sort by rating and limit results
  products.sort((a, b) => b.rating - a.rating)
  const featuredProducts = products.slice(0, limit)

  successResponse(res, featuredProducts, 'Featured products retrieved successfully')
}))

// GET /api/products/search - Advanced search with suggestions
router.get('/search', asyncHandler(async (req, res) => {
  const query = req.query.q as string
  
  if (!query || query.trim().length < 2) {
    return successResponse(res, [], 'Search query must be at least 2 characters')
  }

  const searchTerm = query.toLowerCase().trim()
  const allProducts = await db.read<Product>('products')

  // Search products
  const matchedProducts = allProducts.filter(product => {
    const searchableText = [
      product.name,
      product.description,
      ...product.tags,
      ...Object.values(product.specifications || {})
    ].join(' ').toLowerCase()

    return searchableText.includes(searchTerm)
  })

  // Sort by relevance (name matches first, then description, then tags)
  matchedProducts.sort((a, b) => {
    const aNameMatch = a.name.toLowerCase().includes(searchTerm)
    const bNameMatch = b.name.toLowerCase().includes(searchTerm)
    
    if (aNameMatch && !bNameMatch) return -1
    if (!aNameMatch && bNameMatch) return 1
    
    return b.rating - a.rating
  })

  // Generate search suggestions
  const suggestions = Array.from(new Set([
    ...allProducts.map(p => p.name),
    ...allProducts.flatMap(p => p.tags)
  ]))
    .filter(suggestion => suggestion.toLowerCase().includes(searchTerm))
    .slice(0, 5)

  successResponse(res, {
    products: matchedProducts.slice(0, 20), // Limit to 20 results
    suggestions,
    total: matchedProducts.length
  }, 'Search completed successfully')
}))

// GET /api/products/:id - Get single product by ID
router.get('/:id', optionalAuth, asyncHandler(async (req, res) => {
  const { id } = req.params
  
  const product = await db.findById<Product>('products', id)
  
  if (!product) {
    throw new NotFoundError('Product')
  }

  // Get related products (same category, excluding current product)
  const relatedProducts = await db.find<Product>('products', p => 
    p.category === product.category && p.id !== product.id
  )
  
  // Sort by rating and limit to 4
  relatedProducts.sort((a, b) => b.rating - a.rating)
  const limitedRelatedProducts = relatedProducts.slice(0, 4)

  successResponse(res, {
    product,
    relatedProducts: limitedRelatedProducts
  }, 'Product retrieved successfully')
}))

// POST /api/products - Create new product (Admin only)
router.post('/', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  // Validate request body
  const { error, value } = createProductSchema.validate(req.body)
  if (error) {
    const validationErrors = error.details.map(detail => ({
      field: detail.path[0] as string,
      message: detail.message
    }))
    throw createValidationError(validationErrors)
  }

  // Check if category exists
  const category = await db.findById('categories', value.category)
  if (!category) {
    throw new AppError('Category not found', 400)
  }

  // Validate discount price
  if (value.discountPrice && value.discountPrice >= value.price) {
    throw new AppError('Discount price must be less than regular price', 400)
  }

  // Create new product
  const newProduct: Product = {
    id: randomUUID(),
    ...value,
    rating: 0,
    reviewCount: 0,
    specifications: value.specifications || {},
    tags: value.tags || [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }

  // Save product
  await db.insert('products', newProduct)

  successResponse(res, newProduct, 'Product created successfully', 201)
}))

// PUT /api/products/:id - Update product (Admin only)
router.put('/:id', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params

  // Validate request body
  const { error, value } = updateProductSchema.validate(req.body)
  if (error) {
    const validationErrors = error.details.map(detail => ({
      field: detail.path[0] as string,
      message: detail.message
    }))
    throw createValidationError(validationErrors)
  }

  // Check if product exists
  const existingProduct = await db.findById<Product>('products', id)
  if (!existingProduct) {
    throw new NotFoundError('Product')
  }

  // Check if category exists (if category is being updated)
  if (value.category) {
    const category = await db.findById('categories', value.category)
    if (!category) {
      throw new AppError('Category not found', 400)
    }
  }

  // Validate discount price
  const finalPrice = value.price || existingProduct.price
  if (value.discountPrice && value.discountPrice >= finalPrice) {
    throw new AppError('Discount price must be less than regular price', 400)
  }

  // Update product
  const updatedProduct = await db.updateById('products', id, {
    ...value,
    updatedAt: new Date().toISOString()
  })

  successResponse(res, updatedProduct, 'Product updated successfully')
}))

// DELETE /api/products/:id - Delete product (Admin only)
router.delete('/:id', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params

  // Check if product exists
  const product = await db.findById<Product>('products', id)
  if (!product) {
    throw new NotFoundError('Product')
  }

  // Delete product
  const deleted = await db.deleteById('products', id)
  
  if (!deleted) {
    throw new AppError('Failed to delete product', 500)
  }

  successResponse(res, null, 'Product deleted successfully')
}))

// PUT /api/products/:id/stock - Update product stock (Admin only)
router.put('/:id/stock', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params
  const { stock, operation } = req.body

  if (typeof stock !== 'number' || stock < 0) {
    throw new AppError('Stock must be a non-negative number', 400)
  }

  const product = await db.findById<Product>('products', id)
  if (!product) {
    throw new NotFoundError('Product')
  }

  let newStock = stock
  if (operation === 'add') {
    newStock = product.stock + stock
  } else if (operation === 'subtract') {
    newStock = Math.max(0, product.stock - stock)
  }

  const updatedProduct = await db.updateById('products', id, {
    stock: newStock,
    updatedAt: new Date().toISOString()
  })

  successResponse(res, {
    product: updatedProduct,
    previousStock: product.stock,
    newStock
  }, 'Stock updated successfully')
}))

// GET /api/products/:id/reviews - Get product reviews (placeholder for future implementation)
router.get('/:id/reviews', asyncHandler(async (req, res) => {
  const { id } = req.params
  
  // Check if product exists
  const product = await db.findById<Product>('products', id)
  if (!product) {
    throw new NotFoundError('Product')
  }

  // For now, return empty reviews (to be implemented with review system)
  successResponse(res, [], 'Product reviews retrieved successfully')
}))

export default router