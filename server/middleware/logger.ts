import { Request, Response, NextFunction } from 'express'

// Request logger middleware
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now()
  const timestamp = new Date().toISOString()

  // Log request start
  console.log(`[${timestamp}] ${req.method} ${req.originalUrl} - IP: ${req.ip}`)

  // Override res.end to log response
  const originalEnd = res.end
  res.end = function(chunk?: any, encoding?: any) {
    const duration = Date.now() - start
    const statusCode = res.statusCode

    // Determine log level based on status code
    const logLevel = statusCode >= 500 ? 'ERROR' : statusCode >= 400 ? 'WARN' : 'INFO'
    
    console.log(
      `[${new Date().toISOString()}] ${logLevel} - ${req.method} ${req.originalUrl} - ` +
      `Status: ${statusCode} - Duration: ${duration}ms - IP: ${req.ip}`
    )

    // Log additional details for errors
    if (statusCode >= 400) {
      console.log(`  User-Agent: ${req.get('User-Agent')}`)
      console.log(`  Referer: ${req.get('Referer') || 'Direct'}`)
      
      if (req.body && Object.keys(req.body).length > 0) {
        // Log request body for errors (without sensitive data)
        const sanitizedBody = { ...req.body }
        delete sanitizedBody.password
        delete sanitizedBody.token
        console.log(`  Request Body:`, JSON.stringify(sanitizedBody, null, 2))
      }
    }

    originalEnd.call(this, chunk, encoding)
  }

  next()
}

// Enhanced logger for production
export const productionLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now()
  const timestamp = new Date().toISOString()

  // Override res.end to log response
  const originalEnd = res.end
  res.end = function(chunk?: any, encoding?: any) {
    const duration = Date.now() - start
    const statusCode = res.statusCode

    // Create log entry
    const logEntry = {
      timestamp,
      method: req.method,
      url: req.originalUrl,
      statusCode,
      duration,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      referer: req.get('Referer'),
      contentLength: res.get('Content-Length') || 0,
      userId: (req as any).user?.id || null,
      userRole: (req as any).user?.role || null
    }

    // In production, you might want to send this to a logging service
    // For now, we'll just console.log it
    if (statusCode >= 400) {
      console.error('HTTP Error:', JSON.stringify(logEntry, null, 2))
    } else {
      console.log('HTTP Request:', JSON.stringify(logEntry))
    }

    originalEnd.call(this, chunk, encoding)
  }

  next()
}

// Security logger for suspicious activities
export const securityLogger = (event: string, details: any, req?: Request) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    event,
    details,
    ip: req?.ip || 'unknown',
    userAgent: req?.get('User-Agent') || 'unknown',
    userId: (req as any)?.user?.id || null,
    url: req?.originalUrl || null
  }

  console.warn('SECURITY EVENT:', JSON.stringify(logEntry, null, 2))
}

// API usage analytics logger
export const analyticsLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now()

  res.on('finish', () => {
    const duration = Date.now() - start
    
    // Analytics data
    const analytics = {
      timestamp: new Date().toISOString(),
      endpoint: req.route?.path || req.originalUrl,
      method: req.method,
      statusCode: res.statusCode,
      duration,
      userAgent: req.get('User-Agent'),
      userId: (req as any).user?.id || null,
      isAuthenticated: !!(req as any).user,
      userRole: (req as any).user?.role || null
    }

    // In production, send this to analytics service
    console.log('ANALYTICS:', JSON.stringify(analytics))
  })

  next()
}

export default requestLogger