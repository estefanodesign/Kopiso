import express from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { randomUUID } from 'crypto'
import { authenticate, requireAdmin } from '../middleware/auth.js'
import { uploadRateLimit } from '../middleware/rateLimiter.js'
import { asyncHandler, successResponse, AppError } from '../middleware/errorHandler.js'

const router = express.Router()

// Ensure upload directories exist
const ensureUploadDirs = () => {
  const dirs = [
    'uploads',
    'uploads/images',
    'uploads/images/products',
    'uploads/images/users',
    'uploads/documents'
  ]

  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
  })
}

// Initialize upload directories
ensureUploadDirs()

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = 'uploads/'
    
    if (file.fieldname === 'productImages') {
      uploadPath += 'images/products/'
    } else if (file.fieldname === 'avatar') {
      uploadPath += 'images/users/'
    } else {
      uploadPath += 'documents/'
    }
    
    // Ensure directory exists
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true })
    }
    
    cb(null, uploadPath)
  },
  filename: (req, file, cb) => {
    // Generate unique filename with original extension
    const uniqueName = randomUUID()
    const extension = path.extname(file.originalname)
    cb(null, `${uniqueName}${extension}`)
  }
})

// File filter function
const fileFilter = (req: express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Define allowed file types
  const allowedImageTypes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/webp',
    'image/gif'
  ]
  
  const allowedDocumentTypes = [
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]

  // Check file type based on fieldname
  if (file.fieldname === 'productImages' || file.fieldname === 'avatar') {
    if (allowedImageTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Only image files (JPEG, PNG, WebP, GIF) are allowed'))
    }
  } else if (file.fieldname === 'documents') {
    if (allowedDocumentTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Only document files (PDF, TXT, DOC, DOCX) are allowed'))
    }
  } else {
    cb(new Error('Invalid field name'))
  }
}

// Configure multer
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 10 // Max 10 files per request
  }
})

// Helper function to delete file
const deleteFile = (filePath: string) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }
  } catch (error) {
    console.error('Error deleting file:', error)
  }
}

// POST /api/upload/product-images - Upload product images (Admin only)
router.post('/product-images', 
  authenticate, 
  requireAdmin, 
  uploadRateLimit,
  upload.array('productImages', 5), // Max 5 images
  asyncHandler(async (req, res) => {
    const files = req.files as Express.Multer.File[]
    
    if (!files || files.length === 0) {
      throw new AppError('No files uploaded', 400)
    }

    // Process uploaded files
    const uploadedFiles = files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      url: `/uploads/images/products/${file.filename}`
    }))

    successResponse(res, {
      files: uploadedFiles,
      count: files.length
    }, 'Product images uploaded successfully', 201)
  })
)

// POST /api/upload/avatar - Upload user avatar
router.post('/avatar',
  authenticate,
  uploadRateLimit,
  upload.single('avatar'),
  asyncHandler(async (req, res) => {
    const file = req.file as Express.Multer.File
    
    if (!file) {
      throw new AppError('No file uploaded', 400)
    }

    const uploadedFile = {
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      url: `/uploads/images/users/${file.filename}`
    }

    successResponse(res, uploadedFile, 'Avatar uploaded successfully', 201)
  })
)

// POST /api/upload/documents - Upload documents (Admin only)
router.post('/documents',
  authenticate,
  requireAdmin,
  uploadRateLimit,
  upload.array('documents', 3), // Max 3 documents
  asyncHandler(async (req, res) => {
    const files = req.files as Express.Multer.File[]
    
    if (!files || files.length === 0) {
      throw new AppError('No files uploaded', 400)
    }

    const uploadedFiles = files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      url: `/uploads/documents/${file.filename}`
    }))

    successResponse(res, {
      files: uploadedFiles,
      count: files.length
    }, 'Documents uploaded successfully', 201)
  })
)

// DELETE /api/upload/:type/:filename - Delete uploaded file
router.delete('/:type/:filename',
  authenticate,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { type, filename } = req.params
    
    // Validate type
    const allowedTypes = ['products', 'users', 'documents']
    if (!allowedTypes.includes(type)) {
      throw new AppError('Invalid file type', 400)
    }

    // Validate filename (prevent path traversal)
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      throw new AppError('Invalid filename', 400)
    }

    // Construct file path
    let filePath: string
    if (type === 'products') {
      filePath = path.join('uploads/images/products', filename)
    } else if (type === 'users') {
      filePath = path.join('uploads/images/users', filename)
    } else {
      filePath = path.join('uploads/documents', filename)
    }

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new AppError('File not found', 404)
    }

    // Delete file
    deleteFile(filePath)

    successResponse(res, null, 'File deleted successfully')
  })
)

// GET /api/upload/info/:type/:filename - Get file info
router.get('/info/:type/:filename',
  asyncHandler(async (req, res) => {
    const { type, filename } = req.params
    
    // Validate type
    const allowedTypes = ['products', 'users', 'documents']
    if (!allowedTypes.includes(type)) {
      throw new AppError('Invalid file type', 400)
    }

    // Validate filename
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      throw new AppError('Invalid filename', 400)
    }

    // Construct file path
    let filePath: string
    if (type === 'products') {
      filePath = path.join('uploads/images/products', filename)
    } else if (type === 'users') {
      filePath = path.join('uploads/images/users', filename)
    } else {
      filePath = path.join('uploads/documents', filename)
    }

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new AppError('File not found', 404)
    }

    // Get file stats
    const stats = fs.statSync(filePath)
    const extension = path.extname(filename).toLowerCase()
    
    // Determine mime type based on extension
    const mimeTypes: { [key: string]: string } = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.pdf': 'application/pdf',
      '.txt': 'text/plain',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    }

    const fileInfo = {
      filename,
      size: stats.size,
      mimetype: mimeTypes[extension] || 'application/octet-stream',
      created: stats.birthtime,
      modified: stats.mtime,
      url: `/uploads/${type === 'products' ? 'images/products' : type === 'users' ? 'images/users' : 'documents'}/${filename}`
    }

    successResponse(res, fileInfo, 'File info retrieved successfully')
  })
)

// GET /api/upload/list/:type - List files by type (Admin only)
router.get('/list/:type',
  authenticate,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { type } = req.params
    const page = parseInt(req.query.page as string) || 1
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100)

    // Validate type
    const allowedTypes = ['products', 'users', 'documents']
    if (!allowedTypes.includes(type)) {
      throw new AppError('Invalid file type', 400)
    }

    // Determine directory path
    let dirPath: string
    if (type === 'products') {
      dirPath = 'uploads/images/products'
    } else if (type === 'users') {
      dirPath = 'uploads/images/users'
    } else {
      dirPath = 'uploads/documents'
    }

    // Read directory
    if (!fs.existsSync(dirPath)) {
      return successResponse(res, {
        files: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0
        }
      }, 'File list retrieved successfully')
    }

    const allFiles = fs.readdirSync(dirPath)
    
    // Get file stats and create file objects
    const filesWithStats = allFiles
      .map(filename => {
        const filePath = path.join(dirPath, filename)
        const stats = fs.statSync(filePath)
        return {
          filename,
          size: stats.size,
          created: stats.birthtime,
          modified: stats.mtime,
          url: `/uploads/${type === 'products' ? 'images/products' : type === 'users' ? 'images/users' : 'documents'}/${filename}`
        }
      })
      .sort((a, b) => b.created.getTime() - a.created.getTime())

    // Apply pagination
    const total = filesWithStats.length
    const totalPages = Math.ceil(total / limit)
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedFiles = filesWithStats.slice(startIndex, endIndex)

    successResponse(res, {
      files: paginatedFiles,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    }, 'File list retrieved successfully')
  })
)

// Error handler for multer
router.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 5MB.'
      })
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Maximum is 10 files per request.'
      })
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Unexpected field name.'
      })
    }
  }
  
  if (error.message) {
    return res.status(400).json({
      success: false,
      message: error.message
    })
  }
  
  next(error)
})

export default router