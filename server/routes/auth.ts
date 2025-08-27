import express from 'express'
import Joi from 'joi'
import { randomUUID } from 'crypto'
import { generateToken, hashPassword, comparePassword } from '../utils/auth.js'
import { authenticate, optionalAuth } from '../middleware/auth.js'
import { authRateLimit } from '../middleware/rateLimiter.js'
import { asyncHandler, successResponse, createValidationError, AppError } from '../middleware/errorHandler.js'
import db from '../services/database.js'
import { User, AuthResponse, LoginCredentials, RegisterData } from '../../src/types/index.js'

const router = express.Router()

// Validation schemas
const registerSchema = Joi.object({
  name: Joi.string().min(2).max(50).required().messages({
    'string.min': 'Name must be at least 2 characters long',
    'string.max': 'Name cannot exceed 50 characters',
    'any.required': 'Name is required'
  }),
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
  }),
  password: Joi.string().min(6).max(128).required().messages({
    'string.min': 'Password must be at least 6 characters long',
    'string.max': 'Password cannot exceed 128 characters',
    'any.required': 'Password is required'
  })
})

const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
  }),
  password: Joi.string().required().messages({
    'any.required': 'Password is required'
  })
})

const updateProfileSchema = Joi.object({
  name: Joi.string().min(2).max(50).optional(),
  email: Joi.string().email().optional(),
  avatar: Joi.string().uri().optional()
})

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required().messages({
    'any.required': 'Current password is required'
  }),
  newPassword: Joi.string().min(6).max(128).required().messages({
    'string.min': 'New password must be at least 6 characters long',
    'string.max': 'New password cannot exceed 128 characters',
    'any.required': 'New password is required'
  })
})

// POST /api/auth/register - User Registration
router.post('/register', authRateLimit, asyncHandler(async (req, res) => {
  // Validate request body
  const { error, value } = registerSchema.validate(req.body)
  if (error) {
    const validationErrors = error.details.map(detail => ({
      field: detail.path[0] as string,
      message: detail.message
    }))
    throw createValidationError(validationErrors)
  }

  const { name, email, password }: RegisterData = value

  // Check if user already exists
  const existingUser = await db.findOne('users', (user: User) => user.email === email)
  if (existingUser) {
    throw new AppError('User with this email already exists', 409)
  }

  // Hash password
  const hashedPassword = await hashPassword(password)

  // Create new user
  const newUser: User = {
    id: randomUUID(),
    name,
    email,
    password: hashedPassword,
    role: 'customer',
    addresses: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }

  // Save user to database
  await db.insert('users', newUser)

  // Generate JWT token
  const token = generateToken({
    userId: newUser.id,
    email: newUser.email,
    role: newUser.role
  })

  // Remove password from response
  const userResponse = { ...newUser }
  delete (userResponse as any).password

  successResponse(res, {
    user: userResponse,
    token
  }, 'User registered successfully', 201)
}))

// POST /api/auth/login - User Login
router.post('/login', authRateLimit, asyncHandler(async (req, res) => {
  // Validate request body
  const { error, value } = loginSchema.validate(req.body)
  if (error) {
    const validationErrors = error.details.map(detail => ({
      field: detail.path[0] as string,
      message: detail.message
    }))
    throw createValidationError(validationErrors)
  }

  const { email, password }: LoginCredentials = value

  // Find user by email
  const user = await db.findOne('users', (user: User) => user.email === email)
  if (!user) {
    throw new AppError('Invalid email or password', 401)
  }

  // Compare password
  const isPasswordValid = await comparePassword(password, user.password)
  if (!isPasswordValid) {
    throw new AppError('Invalid email or password', 401)
  }

  // Generate JWT token
  const token = generateToken({
    userId: user.id,
    email: user.email,
    role: user.role
  })

  // Update last login
  await db.updateById('users', user.id, {
    updatedAt: new Date().toISOString()
  })

  // Remove password from response
  const userResponse = { ...user }
  delete (userResponse as any).password

  successResponse(res, {
    user: userResponse,
    token
  }, 'Login successful')
}))

// POST /api/auth/logout - User Logout
router.post('/logout', authenticate, asyncHandler(async (req, res) => {
  // In a more advanced implementation, you would invalidate the token
  // For now, we'll just return success (client will remove token)
  successResponse(res, null, 'Logout successful')
}))

// GET /api/auth/me - Get Current User
router.get('/me', authenticate, asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new AppError('User not authenticated', 401)
  }

  // Get fresh user data from database
  const user = await db.findById('users', req.user.id)
  if (!user) {
    throw new AppError('User not found', 404)
  }

  // Remove password from response
  const userResponse = { ...user }
  delete (userResponse as any).password

  successResponse(res, { user: userResponse }, 'User profile retrieved')
}))

// PUT /api/auth/profile - Update User Profile
router.put('/profile', authenticate, asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new AppError('User not authenticated', 401)
  }

  // Validate request body
  const { error, value } = updateProfileSchema.validate(req.body)
  if (error) {
    const validationErrors = error.details.map(detail => ({
      field: detail.path[0] as string,
      message: detail.message
    }))
    throw createValidationError(validationErrors)
  }

  // Check if email is being changed and if it's already taken
  if (value.email && value.email !== req.user.email) {
    const existingUser = await db.findOne('users', (user: User) => user.email === value.email)
    if (existingUser) {
      throw new AppError('Email is already taken', 409)
    }
  }

  // Update user
  const updatedUser = await db.updateById('users', req.user.id, {
    ...value,
    updatedAt: new Date().toISOString()
  })

  if (!updatedUser) {
    throw new AppError('User not found', 404)
  }

  // Remove password from response
  const userResponse = { ...updatedUser }
  delete (userResponse as any).password

  successResponse(res, { user: userResponse }, 'Profile updated successfully')
}))

// PUT /api/auth/change-password - Change Password
router.put('/change-password', authenticate, asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new AppError('User not authenticated', 401)
  }

  // Validate request body
  const { error, value } = changePasswordSchema.validate(req.body)
  if (error) {
    const validationErrors = error.details.map(detail => ({
      field: detail.path[0] as string,
      message: detail.message
    }))
    throw createValidationError(validationErrors)
  }

  const { currentPassword, newPassword } = value

  // Get user from database
  const user = await db.findById('users', req.user.id)
  if (!user) {
    throw new AppError('User not found', 404)
  }

  // Verify current password
  const isCurrentPasswordValid = await comparePassword(currentPassword, user.password)
  if (!isCurrentPasswordValid) {
    throw new AppError('Current password is incorrect', 400)
  }

  // Hash new password
  const hashedNewPassword = await hashPassword(newPassword)

  // Update password
  await db.updateById('users', req.user.id, {
    password: hashedNewPassword,
    updatedAt: new Date().toISOString()
  })

  successResponse(res, null, 'Password changed successfully')
}))

// POST /api/auth/addresses - Add Address
router.post('/addresses', authenticate, asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new AppError('User not authenticated', 401)
  }

  const addressSchema = Joi.object({
    name: Joi.string().required(),
    phone: Joi.string().required(),
    street: Joi.string().required(),
    city: Joi.string().required(),
    state: Joi.string().required(),
    zipCode: Joi.string().required(),
    country: Joi.string().required(),
    isDefault: Joi.boolean().default(false)
  })

  const { error, value } = addressSchema.validate(req.body)
  if (error) {
    const validationErrors = error.details.map(detail => ({
      field: detail.path[0] as string,
      message: detail.message
    }))
    throw createValidationError(validationErrors)
  }

  // Get user
  const user = await db.findById('users', req.user.id)
  if (!user) {
    throw new AppError('User not found', 404)
  }

  // Create new address
  const newAddress = {
    id: randomUUID(),
    ...value
  }

  // If this is set as default, remove default from other addresses
  if (newAddress.isDefault) {
    user.addresses = user.addresses.map(addr => ({ ...addr, isDefault: false }))
  }

  // Add new address
  user.addresses.push(newAddress)

  // Update user
  await db.updateById('users', req.user.id, {
    addresses: user.addresses,
    updatedAt: new Date().toISOString()
  })

  successResponse(res, { address: newAddress }, 'Address added successfully', 201)
}))

// PUT /api/auth/addresses/:addressId - Update Address
router.put('/addresses/:addressId', authenticate, asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new AppError('User not authenticated', 401)
  }

  const { addressId } = req.params

  // Get user
  const user = await db.findById('users', req.user.id)
  if (!user) {
    throw new AppError('User not found', 404)
  }

  // Find address
  const addressIndex = user.addresses.findIndex(addr => addr.id === addressId)
  if (addressIndex === -1) {
    throw new AppError('Address not found', 404)
  }

  // Update address
  user.addresses[addressIndex] = {
    ...user.addresses[addressIndex],
    ...req.body
  }

  // If this is set as default, remove default from other addresses
  if (req.body.isDefault) {
    user.addresses = user.addresses.map((addr, index) => ({
      ...addr,
      isDefault: index === addressIndex
    }))
  }

  // Update user
  await db.updateById('users', req.user.id, {
    addresses: user.addresses,
    updatedAt: new Date().toISOString()
  })

  successResponse(res, { address: user.addresses[addressIndex] }, 'Address updated successfully')
}))

// DELETE /api/auth/addresses/:addressId - Delete Address
router.delete('/addresses/:addressId', authenticate, asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new AppError('User not authenticated', 401)
  }

  const { addressId } = req.params

  // Get user
  const user = await db.findById('users', req.user.id)
  if (!user) {
    throw new AppError('User not found', 404)
  }

  // Remove address
  const initialLength = user.addresses.length
  user.addresses = user.addresses.filter(addr => addr.id !== addressId)

  if (user.addresses.length === initialLength) {
    throw new AppError('Address not found', 404)
  }

  // Update user
  await db.updateById('users', req.user.id, {
    addresses: user.addresses,
    updatedAt: new Date().toISOString()
  })

  successResponse(res, null, 'Address deleted successfully')
}))

export default router