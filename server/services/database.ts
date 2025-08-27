import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Data directory path
const DATA_DIR = path.join(__dirname, '../../data')

// Database interface for TypeScript
interface Database {
  users: any[]
  products: any[]
  orders: any[]
  categories: any[]
  transactions: any[]
  reviews: any[]
  wishlists: any[]
}

class LocalStorageService {
  private dataPath: string

  constructor() {
    this.dataPath = DATA_DIR
    this.ensureDataDirectory()
  }

  // Ensure data directory exists
  private async ensureDataDirectory(): Promise<void> {
    try {
      await fs.access(this.dataPath)
    } catch {
      await fs.mkdir(this.dataPath, { recursive: true })
    }
  }

  // Get file path for a collection
  private getFilePath(collection: string): string {
    return path.join(this.dataPath, `${collection}.json`)
  }

  // Read data from a collection
  async read<T = any>(collection: string): Promise<T[]> {
    try {
      const filePath = this.getFilePath(collection)
      const data = await fs.readFile(filePath, 'utf-8')
      return JSON.parse(data)
    } catch (error) {
      // If file doesn't exist, return empty array
      if ((error as any).code === 'ENOENT') {
        await this.write(collection, [])
        return []
      }
      throw error
    }
  }

  // Write data to a collection
  async write<T = any>(collection: string, data: T[]): Promise<void> {
    const filePath = this.getFilePath(collection)
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8')
  }

  // Find items in a collection by criteria
  async find<T = any>(
    collection: string, 
    criteria: (item: T) => boolean
  ): Promise<T[]> {
    const data = await this.read<T>(collection)
    return data.filter(criteria)
  }

  // Find a single item in a collection
  async findOne<T = any>(
    collection: string, 
    criteria: (item: T) => boolean
  ): Promise<T | null> {
    const data = await this.read<T>(collection)
    return data.find(criteria) || null
  }

  // Find item by ID
  async findById<T = any>(collection: string, id: string): Promise<T | null> {
    return this.findOne(collection, (item: any) => item.id === id)
  }

  // Insert a new item
  async insert<T = any>(collection: string, item: T): Promise<T> {
    const data = await this.read<T>(collection)
    data.push(item)
    await this.write(collection, data)
    return item
  }

  // Insert multiple items
  async insertMany<T = any>(collection: string, items: T[]): Promise<T[]> {
    const data = await this.read<T>(collection)
    data.push(...items)
    await this.write(collection, data)
    return items
  }

  // Update an item by ID
  async updateById<T = any>(
    collection: string, 
    id: string, 
    updates: Partial<T>
  ): Promise<T | null> {
    const data = await this.read<T>(collection)
    const index = data.findIndex((item: any) => item.id === id)
    
    if (index === -1) {
      return null
    }

    data[index] = { ...data[index], ...updates, id } as T
    await this.write(collection, data)
    return data[index]
  }

  // Update items by criteria
  async updateMany<T = any>(
    collection: string,
    criteria: (item: T) => boolean,
    updates: Partial<T>
  ): Promise<number> {
    const data = await this.read<T>(collection)
    let count = 0

    for (let i = 0; i < data.length; i++) {
      if (criteria(data[i])) {
        data[i] = { ...data[i], ...updates } as T
        count++
      }
    }

    if (count > 0) {
      await this.write(collection, data)
    }

    return count
  }

  // Delete an item by ID
  async deleteById<T = any>(collection: string, id: string): Promise<boolean> {
    const data = await this.read<T>(collection)
    const initialLength = data.length
    const filteredData = data.filter((item: any) => item.id !== id)

    if (filteredData.length < initialLength) {
      await this.write(collection, filteredData)
      return true
    }

    return false
  }

  // Delete items by criteria
  async deleteMany<T = any>(
    collection: string,
    criteria: (item: T) => boolean
  ): Promise<number> {
    const data = await this.read<T>(collection)
    const initialLength = data.length
    const filteredData = data.filter(item => !criteria(item))

    if (filteredData.length < initialLength) {
      await this.write(collection, filteredData)
      return initialLength - filteredData.length
    }

    return 0
  }

  // Count items in collection
  async count<T = any>(
    collection: string, 
    criteria?: (item: T) => boolean
  ): Promise<number> {
    const data = await this.read<T>(collection)
    return criteria ? data.filter(criteria).length : data.length
  }

  // Get paginated results
  async paginate<T = any>(
    collection: string,
    page: number = 1,
    limit: number = 10,
    criteria?: (item: T) => boolean,
    sortFn?: (a: T, b: T) => number
  ): Promise<{
    data: T[]
    page: number
    limit: number
    total: number
    totalPages: number
  }> {
    let data = await this.read<T>(collection)

    // Apply filtering
    if (criteria) {
      data = data.filter(criteria)
    }

    // Apply sorting
    if (sortFn) {
      data.sort(sortFn)
    }

    const total = data.length
    const totalPages = Math.ceil(total / limit)
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit

    return {
      data: data.slice(startIndex, endIndex),
      page,
      limit,
      total,
      totalPages
    }
  }

  // Backup all data
  async backup(): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const backupDir = path.join(this.dataPath, 'backups')
    
    // Ensure backup directory exists
    try {
      await fs.access(backupDir)
    } catch {
      await fs.mkdir(backupDir, { recursive: true })
    }

    const backupPath = path.join(backupDir, `backup-${timestamp}.json`)
    
    // Read all collections
    const collections = ['users', 'products', 'orders', 'categories', 'transactions', 'reviews', 'wishlists']
    const backup: Database = {
      users: [],
      products: [],
      orders: [],
      categories: [],
      transactions: [],
      reviews: [],
      wishlists: []
    }

    for (const collection of collections) {
      backup[collection as keyof Database] = await this.read(collection)
    }

    await fs.writeFile(backupPath, JSON.stringify(backup, null, 2), 'utf-8')
    return backupPath
  }

  // Restore from backup
  async restore(backupPath: string): Promise<void> {
    const backupData = await fs.readFile(backupPath, 'utf-8')
    const backup: Database = JSON.parse(backupData)

    // Restore each collection
    for (const [collection, data] of Object.entries(backup)) {
      await this.write(collection, data)
    }
  }

  // Clear a collection
  async clear(collection: string): Promise<void> {
    await this.write(collection, [])
  }

  // Clear all data
  async clearAll(): Promise<void> {
    const collections = ['users', 'products', 'orders', 'categories', 'transactions', 'reviews', 'wishlists']
    for (const collection of collections) {
      await this.clear(collection)
    }
  }
}

// Create and export a singleton instance
const db = new LocalStorageService()
export default db

// Initialize database with sample data if collections are empty
export async function initializeDatabase(): Promise<void> {
  try {
    // Initialize categories if empty
    const categories = await db.read('categories')
    if (categories.length === 0) {
      const sampleCategories = [
        {
          id: 'cat-1',
          name: 'Electronics',
          description: 'Latest gadgets and electronic devices',
          image: '/api/placeholder/64/64',
          createdAt: new Date().toISOString()
        },
        {
          id: 'cat-2',
          name: 'Fashion',
          description: 'Clothing and accessories for men and women',
          image: '/api/placeholder/64/64',
          createdAt: new Date().toISOString()
        },
        {
          id: 'cat-3',
          name: 'Home & Garden',
          description: 'Everything for your home and garden',
          image: '/api/placeholder/64/64',
          createdAt: new Date().toISOString()
        },
        {
          id: 'cat-4',
          name: 'Sports & Outdoors',
          description: 'Sports equipment and outdoor gear',
          image: '/api/placeholder/64/64',
          createdAt: new Date().toISOString()
        },
        {
          id: 'cat-5',
          name: 'Books',
          description: 'Books, audiobooks, and e-readers',
          image: '/api/placeholder/64/64',
          createdAt: new Date().toISOString()
        },
        {
          id: 'cat-6',
          name: 'Health & Beauty',
          description: 'Health products and beauty essentials',
          image: '/api/placeholder/64/64',
          createdAt: new Date().toISOString()
        }
      ]
      await db.write('categories', sampleCategories)
    }

    // Initialize products if empty
    const products = await db.read('products')
    if (products.length === 0) {
      const sampleProducts = [
        {
          id: 'prod-1',
          name: 'Premium Wireless Headphones',
          description: 'High-quality wireless headphones with noise cancellation and premium sound quality.',
          price: 99.99,
          discountPrice: 79.99,
          images: ['/api/placeholder/300/250'],
          category: 'cat-1',
          stock: 50,
          specifications: {
            'Battery Life': '30 hours',
            'Connectivity': 'Bluetooth 5.0',
            'Noise Cancellation': 'Active',
            'Weight': '250g'
          },
          rating: 4.5,
          reviewCount: 128,
          tags: ['wireless', 'bluetooth', 'headphones', 'audio'],
          featured: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'prod-2',
          name: 'Smart Fitness Watch',
          description: 'Advanced fitness tracking with heart rate monitoring and GPS.',
          price: 199.99,
          discountPrice: 149.99,
          images: ['/api/placeholder/300/250'],
          category: 'cat-1',
          stock: 30,
          specifications: {
            'Display': '1.4" AMOLED',
            'Battery': '7 days',
            'Water Resistance': '5ATM',
            'GPS': 'Built-in'
          },
          rating: 4.7,
          reviewCount: 89,
          tags: ['smartwatch', 'fitness', 'health', 'gps'],
          featured: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]
      await db.write('products', sampleProducts)
    }

    console.log('✅ Database initialized successfully')
  } catch (error) {
    console.error('❌ Failed to initialize database:', error)
  }
}