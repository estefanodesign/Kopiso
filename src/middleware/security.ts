/**
 * Security Middleware and Utilities for Kopiso E-commerce Platform
 * Implements comprehensive security measures for production deployment
 */

import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import slowDown from 'express-slow-down'
import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { config } from '@/config/environment'

// =============================================================================
// HELMET CONFIGURATION - Security Headers
// =============================================================================

export const helmetConfig = helmet({
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: [
        "'self'",
        "'unsafe-inline'",
        "https://fonts.googleapis.com",
        "https://cdnjs.cloudflare.com"
      ],
      scriptSrc: [
        "'self'",
        "'unsafe-eval'", // Required for Next.js in development
        ...(config.nodeEnv === 'development' ? ["'unsafe-inline'"] : []),
        "https://js.stripe.com",
        "https://www.googletagmanager.com",
        "https://www.google-analytics.com"
      ],
      fontSrc: [
        "'self'",
        "https://fonts.gstatic.com",
        "data:"
      ],
      imgSrc: [
        "'self'",
        "data:",
        "blob:",
        "https:",
        config.storage.provider === 's3' ? `https://${config.storage.aws?.bucket}.s3.amazonaws.com` : ""
      ].filter(Boolean),
      connectSrc: [
        "'self'",
        config.apiUrl,
        "https://api.stripe.com",
        "https://www.google-analytics.com",
        ...(config.monitoring.sentry ? [config.monitoring.sentry.dsn] : [])
      ].filter(Boolean),
      frameSrc: [
        "'self'",
        "https://js.stripe.com",
        "https://hooks.stripe.com"
      ],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      manifestSrc: ["'self'"],
      workerSrc: ["'self'", "blob:"],
      upgradeInsecureRequests: config.nodeEnv === 'production' ? [] : null
    },
    reportOnly: config.nodeEnv === 'development'
  },

  // HTTP Strict Transport Security
  hsts: {
    maxAge: config.security.headers.hstsMaxAge,
    includeSubDomains: true,
    preload: true
  },

  // Prevent clickjacking
  frameguard: {
    action: config.security.headers.frameOptions.toLowerCase() as 'deny' | 'sameorigin'
  },

  // Prevent MIME type sniffing
  noSniff: true,

  // XSS Protection
  xssFilter: true,

  // Referrer Policy
  referrerPolicy: {
    policy: ['strict-origin-when-cross-origin']
  },

  // DNS Prefetch Control
  dnsPrefetchControl: {
    allow: false
  },

  // Hide X-Powered-By header
  hidePoweredBy: true,

  // Expect-CT header
  expectCt: {
    maxAge: 86400,
    enforce: config.nodeEnv === 'production'
  }
})

// =============================================================================
// RATE LIMITING
// =============================================================================

// General API rate limiting
export const apiRateLimit = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.ceil(config.rateLimit.windowMs / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter: Math.ceil(config.rateLimit.windowMs / 1000)
    })
  }
})

// Strict rate limiting for authentication endpoints
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Maximum 5 attempts
  skipSuccessfulRequests: true,
  message: {
    error: 'Too many authentication attempts, please try again later.',
    retryAfter: 900
  }
})

// Admin endpoint rate limiting
export const adminRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 50, // Lower limit for admin endpoints
  message: {
    error: 'Too many admin requests, please try again later.',
    retryAfter: 300
  }
})

// Speed limiting for expensive operations
export const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 100, // Allow 100 requests per 15 minutes at full speed
  delayMs: 500 // Add 500ms delay per request after delayAfter
})

// =============================================================================
// INPUT VALIDATION & SANITIZATION
// =============================================================================

export class SecurityValidator {
  // Validate and sanitize string input
  static sanitizeString(input: string, maxLength = 1000): string {
    if (typeof input !== 'string') {
      throw new Error('Input must be a string')
    }
    
    return input
      .trim()
      .substring(0, maxLength)
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
  }

  // Validate email format
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email) && email.length <= 254
  }

  // Validate password strength
  static validatePassword(password: string): {
    isValid: boolean
    errors: string[]
  } {
    const errors: string[] = []
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long')
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter')
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter')
    }
    
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number')
    }
    
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character')
    }
    
    // Check for common weak passwords
    const commonPasswords = [
      'password', '123456', 'password123', 'admin', 'qwerty',
      'letmein', 'welcome', 'monkey', '1234567890'
    ]
    
    if (commonPasswords.includes(password.toLowerCase())) {
      errors.push('Password is too common and easily guessable')
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }

  // Validate file upload
  static validateFileUpload(file: any): {
    isValid: boolean
    errors: string[]
  } {
    const errors: string[] = []
    const allowedTypes = config.security.allowedFileTypes?.split(',') || [
      'image/jpeg', 'image/png', 'image/webp'
    ]
    const maxSize = 10 * 1024 * 1024 // 10MB
    
    if (!file) {
      errors.push('No file provided')
      return { isValid: false, errors }
    }
    
    if (!allowedTypes.includes(file.mimetype)) {
      errors.push(`File type ${file.mimetype} is not allowed`)
    }
    
    if (file.size > maxSize) {
      errors.push(`File size exceeds maximum limit of ${maxSize / 1024 / 1024}MB`)
    }
    
    // Check for malicious file names
    if (/[<>:"/\\|?*]/.test(file.originalname)) {
      errors.push('File name contains invalid characters')
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }

  // SQL injection prevention
  static preventSQLInjection(input: string): string {
    return input.replace(/['"`;\\]/g, '')
  }

  // XSS prevention
  static preventXSS(input: string): string {
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;')
  }
}

// =============================================================================
// AUTHENTICATION SECURITY
// =============================================================================

export class AuthSecurity {
  // Generate secure random token
  static generateSecureToken(length = 32): string {
    return crypto.randomBytes(length).toString('hex')
  }

  // Hash password with bcrypt
  static async hashPassword(password: string): Promise<string> {
    const saltRounds = config.auth.bcrypt.rounds
    return bcrypt.hash(password, saltRounds)
  }

  // Verify password
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash)
  }

  // Generate JWT token with security claims
  static generateJWT(payload: any, expiresIn?: string): string {
    const claims = {
      ...payload,
      iat: Math.floor(Date.now() / 1000),
      jti: crypto.randomUUID(), // JWT ID for token tracking
      aud: config.baseUrl, // Audience
      iss: config.baseUrl, // Issuer
    }

    return jwt.sign(claims, config.auth.jwt.secret, {
      expiresIn: expiresIn || config.auth.jwt.expiresIn,
      algorithm: 'HS256'
    })
  }

  // Verify JWT token
  static verifyJWT(token: string): any {
    try {
      return jwt.verify(token, config.auth.jwt.secret, {
        algorithms: ['HS256'],
        audience: config.baseUrl,
        issuer: config.baseUrl
      })
    } catch (error) {
      throw new Error('Invalid or expired token')
    }
  }

  // Generate refresh token
  static generateRefreshToken(userId: string): string {
    return jwt.sign(
      { 
        userId, 
        type: 'refresh',
        jti: crypto.randomUUID()
      },
      config.auth.jwt.refreshSecret,
      { 
        expiresIn: config.auth.jwt.refreshExpiresIn,
        algorithm: 'HS256'
      }
    )
  }

  // Verify refresh token
  static verifyRefreshToken(token: string): any {
    try {
      const decoded = jwt.verify(token, config.auth.jwt.refreshSecret, {
        algorithms: ['HS256']
      })
      
      if (decoded.type !== 'refresh') {
        throw new Error('Invalid token type')
      }
      
      return decoded
    } catch (error) {
      throw new Error('Invalid or expired refresh token')
    }
  }
}

// =============================================================================
// MIDDLEWARE FUNCTIONS
// =============================================================================

// Authentication middleware
export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access token required'
    })
  }

  try {
    const user = AuthSecurity.verifyJWT(token)
    req.user = user
    next()
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: 'Invalid or expired token'
    })
  }
}

// Admin authorization middleware
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    })
  }
  next()
}

// Input validation middleware
export const validateInput = (schema: any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body)
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map((detail: any) => detail.message)
      })
    }
    
    next()
  }
}

// CSRF protection middleware
export const csrfProtection = (req: Request, res: Response, next: NextFunction) => {
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    const token = req.headers['x-csrf-token'] || req.body._csrf
    const sessionToken = req.session?.csrfToken
    
    if (!token || !sessionToken || token !== sessionToken) {
      return res.status(403).json({
        success: false,
        message: 'Invalid CSRF token'
      })
    }
  }
  
  next()
}

// Security logging middleware
export const securityLogger = (req: Request, res: Response, next: NextFunction) => {
  const sensitiveEndpoints = ['/auth', '/admin', '/payment']
  const isSensitive = sensitiveEndpoints.some(endpoint => req.path.includes(endpoint))
  
  if (isSensitive) {
    console.log(`[SECURITY] ${req.method} ${req.path} - IP: ${req.ip} - User-Agent: ${req.get('User-Agent')}`)
  }
  
  // Log failed authentication attempts
  res.on('finish', () => {
    if (req.path.includes('/auth') && res.statusCode === 401) {
      console.warn(`[SECURITY] Failed authentication attempt - IP: ${req.ip} - Path: ${req.path}`)
    }
  })
  
  next()
}

// =============================================================================
// SECURITY UTILITIES
// =============================================================================

export class SecurityUtils {
  // Generate secure session ID
  static generateSessionId(): string {
    return crypto.randomBytes(32).toString('hex')
  }

  // Create secure cookie options
  static getSecureCookieOptions() {
    return {
      httpOnly: config.auth.session.httpOnly,
      secure: config.auth.session.secure,
      sameSite: config.auth.session.sameSite as 'strict' | 'lax' | 'none',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      domain: config.nodeEnv === 'production' ? '.kopiso.com' : undefined
    }
  }

  // Encrypt sensitive data
  static encrypt(text: string, key?: string): string {
    const algorithm = 'aes-256-gcm'
    const secretKey = key || config.auth.session.secret
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipher(algorithm, secretKey)
    
    let encrypted = cipher.update(text, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    
    return iv.toString('hex') + ':' + encrypted
  }

  // Decrypt sensitive data
  static decrypt(encryptedText: string, key?: string): string {
    const algorithm = 'aes-256-gcm'
    const secretKey = key || config.auth.session.secret
    const [ivHex, encrypted] = encryptedText.split(':')
    const iv = Buffer.from(ivHex, 'hex')
    const decipher = crypto.createDecipher(algorithm, secretKey)
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    
    return decrypted
  }

  // Generate CSRF token
  static generateCSRFToken(): string {
    return crypto.randomBytes(32).toString('hex')
  }

  // Validate origin header
  static validateOrigin(origin: string): boolean {
    const allowedOrigins = [
      config.baseUrl,
      'http://localhost:3000',
      'http://localhost:3001'
    ]
    
    return allowedOrigins.includes(origin)
  }

  // IP whitelist check
  static isIPWhitelisted(ip: string): boolean {
    // Add your trusted IPs here
    const whitelistedIPs = [
      '127.0.0.1',
      '::1'
    ]
    
    return whitelistedIPs.includes(ip)
  }

  // Detect suspicious activity
  static detectSuspiciousActivity(req: Request): boolean {
    const userAgent = req.get('User-Agent') || ''
    const suspiciousPatterns = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /scanner/i,
      /sqlmap/i,
      /nmap/i
    ]
    
    return suspiciousPatterns.some(pattern => pattern.test(userAgent))
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export default {
  helmetConfig,
  apiRateLimit,
  authRateLimit,
  adminRateLimit,
  speedLimiter,
  SecurityValidator,
  AuthSecurity,
  authenticateToken,
  requireAdmin,
  validateInput,
  csrfProtection,
  securityLogger,
  SecurityUtils
}