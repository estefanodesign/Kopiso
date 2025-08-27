import { Request, Response, NextFunction } from 'express'

// Rate limiter store interface
interface RateLimitStore {
  [key: string]: {
    count: number
    resetTime: number
  }
}

// In-memory store for rate limiting
const rateLimitStore: RateLimitStore = {}

// Rate limiting middleware
export const rateLimiter = (
  maxRequests: number = 100,
  windowMs: number = 15 * 60 * 1000, // 15 minutes
  message: string = 'Too many requests from this IP, please try again later.'
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.connection.remoteAddress || 'unknown'
    const now = Date.now()

    // Clean up expired entries
    Object.keys(rateLimitStore).forEach(key => {
      if (rateLimitStore[key].resetTime < now) {
        delete rateLimitStore[key]
      }
    })

    // Get or create entry for this IP
    if (!rateLimitStore[ip]) {
      rateLimitStore[ip] = {
        count: 0,
        resetTime: now + windowMs
      }
    }

    const ipData = rateLimitStore[ip]

    // Reset if window has expired
    if (ipData.resetTime < now) {
      ipData.count = 0
      ipData.resetTime = now + windowMs
    }

    // Increment request count
    ipData.count++

    // Set rate limit headers
    res.set({
      'X-RateLimit-Limit': maxRequests.toString(),
      'X-RateLimit-Remaining': Math.max(0, maxRequests - ipData.count).toString(),
      'X-RateLimit-Reset': new Date(ipData.resetTime).toISOString()
    })

    // Check if limit exceeded
    if (ipData.count > maxRequests) {
      return res.status(429).json({
        success: false,
        message,
        retryAfter: Math.ceil((ipData.resetTime - now) / 1000)
      })
    }

    next()
  }
}

// Specific rate limiters for different endpoints
export const authRateLimit = rateLimiter(5, 15 * 60 * 1000, 'Too many authentication attempts')
export const uploadRateLimit = rateLimiter(10, 60 * 60 * 1000, 'Too many upload attempts')
export const apiRateLimit = rateLimiter(1000, 15 * 60 * 1000, 'API rate limit exceeded')

export default rateLimiter