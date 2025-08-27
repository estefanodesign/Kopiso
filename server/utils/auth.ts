import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

// Environment variables with defaults
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'
const BCRYPT_ROUNDS = 12

// JWT payload interface
interface JWTPayload {
  userId: string
  email: string
  role: 'customer' | 'admin'
}

// Token generation
export const generateToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  })
}

// Token verification
export const verifyToken = (token: string): JWTPayload | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload
    return decoded
  } catch (error) {
    return null
  }
}

// Token extraction from Authorization header
export const extractTokenFromHeader = (authHeader: string | undefined): string | null => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }
  return authHeader.substring(7) // Remove 'Bearer ' prefix
}

// Password hashing
export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(BCRYPT_ROUNDS)
  return bcrypt.hash(password, salt)
}

// Password comparison
export const comparePassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword)
}

// Generate refresh token
export const generateRefreshToken = (): string => {
  return jwt.sign(
    { type: 'refresh', timestamp: Date.now() },
    JWT_SECRET,
    { expiresIn: '30d' }
  )
}

// Verify refresh token
export const verifyRefreshToken = (token: string): boolean => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any
    return decoded.type === 'refresh'
  } catch (error) {
    return false
  }
}

// Generate random string for temporary tokens
export const generateRandomString = (length: number = 32): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// Check if token is expired
export const isTokenExpired = (token: string): boolean => {
  try {
    const decoded = jwt.decode(token) as any
    if (!decoded || !decoded.exp) {
      return true
    }
    return Date.now() >= decoded.exp * 1000
  } catch (error) {
    return true
  }
}

// Get token expiration date
export const getTokenExpiration = (token: string): Date | null => {
  try {
    const decoded = jwt.decode(token) as any
    if (!decoded || !decoded.exp) {
      return null
    }
    return new Date(decoded.exp * 1000)
  } catch (error) {
    return null
  }
}