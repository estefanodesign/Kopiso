import { promises as fs } from 'fs'
import path from 'path'

// Cache for data to avoid repeated file reads
const dataCache: Record<string, { data: any; timestamp: number }> = {}
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

/**
 * Read JSON data with caching for Vercel serverless functions
 */
export async function readJsonData(filename: string): Promise<any> {
  const cacheKey = filename
  const now = Date.now()
  
  // Check cache first
  if (dataCache[cacheKey] && (now - dataCache[cacheKey].timestamp) < CACHE_TTL) {
    return dataCache[cacheKey].data
  }

  try {
    let filePath: string
    
    // Handle different deployment environments
    if (process.env.VERCEL_ENV) {
      // Vercel environment - data files should be in the project root
      filePath = path.join(process.cwd(), 'data', filename)
    } else {
      // Local development
      filePath = path.join(process.cwd(), 'data', filename)
    }

    const jsonData = await fs.readFile(filePath, 'utf8')
    const parsedData = JSON.parse(jsonData)
    
    // Cache the result
    dataCache[cacheKey] = {
      data: parsedData,
      timestamp: now
    }
    
    return parsedData
  } catch (error) {
    console.error(`Error reading ${filename}:`, error)
    
    // Fallback to empty array/object depending on filename
    const fallbackData = filename.includes('users') ? [] : 
                        filename.includes('products') ? [] :
                        filename.includes('categories') ? [] :
                        filename.includes('orders') ? [] : {}
    
    return fallbackData
  }
}

/**
 * Write JSON data (for Vercel, this might need to use external storage)
 */
export async function writeJsonData(filename: string, data: any): Promise<boolean> {
  try {
    // In Vercel, file writes don't persist. This is for local development only.
    if (process.env.VERCEL_ENV) {
      console.warn('File writes are not persistent in Vercel. Consider using a database.')
      return false
    }
    
    const filePath = path.join(process.cwd(), 'data', filename)
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8')
    
    // Clear cache for this file
    delete dataCache[filename]
    
    return true
  } catch (error) {
    console.error(`Error writing ${filename}:`, error)
    return false
  }
}

/**
 * Initialize data files if they don't exist (for local development)
 */
export async function initializeDataFiles(): Promise<void> {
  const dataDir = path.join(process.cwd(), 'data')
  
  try {
    await fs.mkdir(dataDir, { recursive: true })
  } catch (error) {
    // Directory might already exist
  }
  
  // Initialize files with default data if they don't exist
  const defaultData = {
    'users.json': [
      {
        id: 'admin-1',
        email: 'admin@kopiso.com',
        password: 'admin123',
        name: 'Admin User',
        role: 'admin',
        avatar: '/uploads/admin-avatar.jpg',
        phone: '+1234567890',
        addresses: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'user-1',
        email: 'user@kopiso.com',
        password: 'user123',
        name: 'Demo User',
        role: 'customer',
        avatar: '/uploads/user-avatar.jpg',
        phone: '+1234567891',
        addresses: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ],
    'products.json': [],
    'categories.json': [],
    'orders.json': []
  }
  
  for (const [filename, data] of Object.entries(defaultData)) {
    const filePath = path.join(dataDir, filename)
    try {
      await fs.access(filePath)
    } catch (error) {
      // File doesn't exist, create it
      await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8')
    }
  }
}

/**
 * Get environment-specific configuration
 */
export function getEnvironmentConfig() {
  return {
    isVercel: !!process.env.VERCEL_ENV,
    isProduction: process.env.NODE_ENV === 'production',
    isDevelopment: process.env.NODE_ENV === 'development',
    region: process.env.VERCEL_REGION || 'local',
    url: process.env.VERCEL_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  }
}