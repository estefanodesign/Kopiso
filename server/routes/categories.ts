import express from 'express'
import Joi from 'joi'
import { randomUUID } from 'crypto'
import { authenticate, requireAdmin } from '../middleware/auth.js'
import { asyncHandler, successResponse, createValidationError, AppError, NotFoundError } from '../middleware/errorHandler.js'
import db from '../services/database.js'
import { Category } from '../../src/types/index.js'

const router = express.Router()

// Validation schemas
const createCategorySchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  description: Joi.string().max(500).optional(),
  image: Joi.string().uri().optional(),
  parentId: Joi.string().optional()
})

const updateCategorySchema = Joi.object({
  name: Joi.string().min(1).max(100).optional(),
  description: Joi.string().max(500).optional(),
  image: Joi.string().uri().optional(),
  parentId: Joi.string().optional()
})

// GET /api/categories - Get all categories
router.get('/', asyncHandler(async (req, res) => {
  const categories = await db.read<Category>('categories')
  
  // Sort categories alphabetically
  categories.sort((a, b) => a.name.localeCompare(b.name))

  successResponse(res, categories, 'Categories retrieved successfully')
}))

// GET /api/categories/tree - Get categories in tree structure
router.get('/tree', asyncHandler(async (req, res) => {
  const categories = await db.read<Category>('categories')
  
  // Build tree structure
  const categoryMap = new Map()
  const rootCategories: any[] = []

  // First pass: create map of all categories
  categories.forEach(category => {
    categoryMap.set(category.id, { ...category, children: [] })
  })

  // Second pass: build tree structure
  categories.forEach(category => {
    const categoryWithChildren = categoryMap.get(category.id)
    
    if (category.parentId && categoryMap.has(category.parentId)) {
      // Add to parent's children
      categoryMap.get(category.parentId).children.push(categoryWithChildren)
    } else {
      // Root category
      rootCategories.push(categoryWithChildren)
    }
  })

  // Sort root categories and their children
  const sortCategories = (cats: any[]) => {
    cats.sort((a, b) => a.name.localeCompare(b.name))
    cats.forEach(cat => {
      if (cat.children.length > 0) {
        sortCategories(cat.children)
      }
    })
  }

  sortCategories(rootCategories)

  successResponse(res, rootCategories, 'Category tree retrieved successfully')
}))

// GET /api/categories/:id - Get single category by ID
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params
  
  const category = await db.findById<Category>('categories', id)
  
  if (!category) {
    throw new NotFoundError('Category')
  }

  // Get subcategories
  const subcategories = await db.find<Category>('categories', cat => cat.parentId === id)
  
  // Get parent category if exists
  let parentCategory = null
  if (category.parentId) {
    parentCategory = await db.findById<Category>('categories', category.parentId)
  }

  // Count products in this category
  const products = await db.find('products', (product: any) => product.category === id)
  const productCount = products.length

  successResponse(res, {
    category,
    subcategories,
    parentCategory,
    productCount
  }, 'Category retrieved successfully')
}))

// POST /api/categories - Create new category (Admin only)
router.post('/', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  // Validate request body
  const { error, value } = createCategorySchema.validate(req.body)
  if (error) {
    const validationErrors = error.details.map(detail => ({
      field: detail.path[0] as string,
      message: detail.message
    }))
    throw createValidationError(validationErrors)
  }

  // Check if category name already exists
  const existingCategory = await db.findOne<Category>('categories', cat => 
    cat.name.toLowerCase() === value.name.toLowerCase()
  )
  if (existingCategory) {
    throw new AppError('Category with this name already exists', 409)
  }

  // Check if parent category exists (if parentId provided)
  if (value.parentId) {
    const parentCategory = await db.findById<Category>('categories', value.parentId)
    if (!parentCategory) {
      throw new AppError('Parent category not found', 400)
    }
  }

  // Create new category
  const newCategory: Category = {
    id: randomUUID(),
    name: value.name,
    description: value.description,
    image: value.image,
    parentId: value.parentId,
    createdAt: new Date().toISOString()
  }

  // Save category
  await db.insert('categories', newCategory)

  successResponse(res, newCategory, 'Category created successfully', 201)
}))

// PUT /api/categories/:id - Update category (Admin only)
router.put('/:id', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params

  // Validate request body
  const { error, value } = updateCategorySchema.validate(req.body)
  if (error) {
    const validationErrors = error.details.map(detail => ({
      field: detail.path[0] as string,
      message: detail.message
    }))
    throw createValidationError(validationErrors)
  }

  // Check if category exists
  const existingCategory = await db.findById<Category>('categories', id)
  if (!existingCategory) {
    throw new NotFoundError('Category')
  }

  // Check if new name conflicts with existing categories (if name is being updated)
  if (value.name && value.name.toLowerCase() !== existingCategory.name.toLowerCase()) {
    const conflictingCategory = await db.findOne<Category>('categories', cat => 
      cat.name.toLowerCase() === value.name.toLowerCase() && cat.id !== id
    )
    if (conflictingCategory) {
      throw new AppError('Category with this name already exists', 409)
    }
  }

  // Check if parent category exists (if parentId is being updated)
  if (value.parentId) {
    if (value.parentId === id) {
      throw new AppError('Category cannot be its own parent', 400)
    }
    
    const parentCategory = await db.findById<Category>('categories', value.parentId)
    if (!parentCategory) {
      throw new AppError('Parent category not found', 400)
    }

    // Check for circular reference
    const checkCircularReference = async (parentId: string, originalId: string): Promise<boolean> => {
      if (parentId === originalId) return true
      
      const parent = await db.findById<Category>('categories', parentId)
      if (parent && parent.parentId) {
        return await checkCircularReference(parent.parentId, originalId)
      }
      
      return false
    }

    const hasCircularReference = await checkCircularReference(value.parentId, id)
    if (hasCircularReference) {
      throw new AppError('Circular reference detected in category hierarchy', 400)
    }
  }

  // Update category
  const updatedCategory = await db.updateById('categories', id, value)

  successResponse(res, updatedCategory, 'Category updated successfully')
}))

// DELETE /api/categories/:id - Delete category (Admin only)
router.delete('/:id', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params

  // Check if category exists
  const category = await db.findById<Category>('categories', id)
  if (!category) {
    throw new NotFoundError('Category')
  }

  // Check if category has products
  const products = await db.find('products', (product: any) => product.category === id)
  if (products.length > 0) {
    throw new AppError('Cannot delete category that contains products', 400)
  }

  // Check if category has subcategories
  const subcategories = await db.find<Category>('categories', cat => cat.parentId === id)
  if (subcategories.length > 0) {
    throw new AppError('Cannot delete category that has subcategories', 400)
  }

  // Delete category
  const deleted = await db.deleteById('categories', id)
  
  if (!deleted) {
    throw new AppError('Failed to delete category', 500)
  }

  successResponse(res, null, 'Category deleted successfully')
}))

// GET /api/categories/:id/products - Get products in category
router.get('/:id/products', asyncHandler(async (req, res) => {
  const { id } = req.params
  const page = parseInt(req.query.page as string) || 1
  const limit = Math.min(parseInt(req.query.limit as string) || 12, 50)

  // Check if category exists
  const category = await db.findById<Category>('categories', id)
  if (!category) {
    throw new NotFoundError('Category')
  }

  // Get products in category with pagination
  const result = await db.paginate(
    'products',
    page,
    limit,
    (product: any) => product.category === id,
    (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  successResponse(res, {
    category,
    products: result.data,
    pagination: {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages
    }
  }, 'Category products retrieved successfully')
}))

export default router