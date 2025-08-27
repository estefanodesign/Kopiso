import { Request, Response, NextFunction } from 'express'
import { verifyToken, extractTokenFromHeader } from '../utils/auth.js'
import db from '../services/database.js'

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string
        email: string
        role: 'customer' | 'admin'
        name: string
      }
    }
  }
}

// Authentication middleware
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization)

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token is required'
      })
    }

    const payload = verifyToken(token)

    if (!payload) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      })
    }

    // Get user from database
    const user = await db.findById('users', payload.userId)

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      })
    }

    // Add user to request object
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name
    }

    next()
  } catch (error) {
    console.error('Authentication error:', error)
    res.status(500).json({
      success: false,
      message: 'Authentication failed'
    })
  }
}

// Authorization middleware for admin routes
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    })
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    })
  }

  next()
}

// Authorization middleware for customer routes
export const requireCustomer = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    })
  }

  if (req.user.role !== 'customer') {
    return res.status(403).json({
      success: false,
      message: 'Customer access required'
    })
  }

  next()
}

// Optional authentication middleware (doesn't fail if no token)
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization)

    if (token) {
      const payload = verifyToken(token)

      if (payload) {
        const user = await db.findById('users', payload.userId)

        if (user) {
          req.user = {
            id: user.id,
            email: user.email,
            role: user.role,
            name: user.name
          }
        }
      }
    }

    next()
  } catch (error) {
    // Continue without authentication
    next()
  }
}

// Middleware to check if user owns resource
export const requireOwnership = (resourceKey: string = 'userId') => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      })
    }

    // Admin can access any resource
    if (req.user.role === 'admin') {
      return next()
    }

    // Check if user owns the resource
    const resourceUserId = req.params[resourceKey] || req.body[resourceKey]

    if (req.user.id !== resourceUserId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You can only access your own resources'
      })
    }

    next()
  }
}

// Middleware to rate limit by user
export const userRateLimit = (maxRequests: number = 100, windowMs: number = 15 * 60 * 1000) => {
  const userRequests = new Map()

  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next()
    }

    const userId = req.user.id
    const now = Date.now()
    const windowStart = now - windowMs

    // Get user's request history
    let requests = userRequests.get(userId) || []

    // Remove old requests outside the window
    requests = requests.filter((timestamp: number) => timestamp > windowStart)

    // Check if user has exceeded the limit
    if (requests.length >= maxRequests) {
      return res.status(429).json({
        success: false,
        message: 'Too many requests. Please try again later.',
        retryAfter: Math.ceil(windowMs / 1000)
      })
    }

    // Add current request
    requests.push(now)
    userRequests.set(userId, requests)

    next()
  }
}