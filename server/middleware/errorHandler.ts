import { Request, Response, NextFunction } from 'express'

// Custom error class
export class AppError extends Error {
  public statusCode: number
  public isOperational: boolean

  constructor(message: string, statusCode: number = 500) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = true

    Error.captureStackTrace(this, this.constructor)
  }
}

// Validation error class
export class ValidationError extends AppError {
  public errors: Array<{ field: string; message: string }>

  constructor(errors: Array<{ field: string; message: string }>) {
    super('Validation failed')
    this.statusCode = 400
    this.errors = errors
  }
}

// Not found error
export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`)
    this.statusCode = 404
  }
}

// Unauthorized error
export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized access') {
    super(message)
    this.statusCode = 401
  }
}

// Forbidden error
export class ForbiddenError extends AppError {
  constructor(message: string = 'Access forbidden') {
    super(message)
    this.statusCode = 403
  }
}

// Conflict error
export class ConflictError extends AppError {
  constructor(message: string = 'Resource conflict') {
    super(message)
    this.statusCode = 409
  }
}

// Global error handler middleware
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error occurred:', {
    message: error.message,
    stack: error.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  })

  // Handle specific error types
  if (error instanceof ValidationError) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
      errors: error.errors
    })
  }

  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message
    })
  }

  // Handle JSON parsing errors
  if (error instanceof SyntaxError && 'body' in error) {
    return res.status(400).json({
      success: false,
      message: 'Invalid JSON format'
    })
  }

  // Handle MongoDB/Database errors (if using different database in future)
  if (error.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format'
    })
  }

  if (error.name === 'ValidationError') {
    const errors = Object.values((error as any).errors).map((err: any) => ({
      field: err.path,
      message: err.message
    }))

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    })
  }

  // Handle duplicate key errors
  if ((error as any).code === 11000) {
    const field = Object.keys((error as any).keyValue)[0]
    return res.status(409).json({
      success: false,
      message: `${field} already exists`
    })
  }

  // Handle JWT errors
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    })
  }

  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired'
    })
  }

  // Handle file upload errors
  if (error.message?.includes('File too large')) {
    return res.status(413).json({
      success: false,
      message: 'File size too large'
    })
  }

  if (error.message?.includes('Unexpected field')) {
    return res.status(400).json({
      success: false,
      message: 'Invalid file field'
    })
  }

  // Default error response
  const statusCode = (error as any).statusCode || 500
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : error.message

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  })
}

// 404 handler
export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    method: req.method
  })
}

// Async error wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

// Validation error helper
export const createValidationError = (errors: Array<{ field: string; message: string }>) => {
  return new ValidationError(errors)
}

// Success response helper
export const successResponse = (
  res: Response,
  data: any = null,
  message: string = 'Success',
  statusCode: number = 200
) => {
  res.status(statusCode).json({
    success: true,
    message,
    data
  })
}

// Paginated response helper
export const paginatedResponse = (
  res: Response,
  data: any[],
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  },
  message: string = 'Success'
) => {
  res.status(200).json({
    success: true,
    message,
    data,
    meta
  })
}