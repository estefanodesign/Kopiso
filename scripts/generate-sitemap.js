#!/usr/bin/env node

/**
 * Sitemap Generation Script for Kopiso E-commerce Platform
 * Automatically generates sitemaps for all pages, products, and content
 */

const fs = require('fs')
const path = require('path')

// Sitemap configuration
const config = {
  baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'https://kopiso.com',
  outputDir: 'public',
  staticSitemapFile: 'sitemap-static.xml',
  productSitemapFile: 'sitemap-products.xml',
  categorySitemapFile: 'sitemap-categories.xml',
  sitemapIndexFile: 'sitemap.xml',
  maxUrlsPerSitemap: 50000,
  
  // Priority and change frequency settings
  priorities: {
    homepage: 1.0,
    categories: 0.9,
    products: 0.8,
    articles: 0.7,
    static: 0.6,
    auth: 0.3
  },
  
  changeFreq: {
    homepage: 'daily',
    categories: 'weekly',
    products: 'weekly',
    articles: 'monthly',
    static: 'monthly',
    auth: 'yearly'
  }
}

console.log('🗺️ Starting sitemap generation...')
console.log('Configuration:', config)

// =============================================================================
// SITEMAP ENTRY CLASS
// =============================================================================

class SitemapEntry {
  constructor(url, lastmod = null, changefreq = 'monthly', priority = 0.5) {
    this.url = url.startsWith('http') ? url : `${config.baseUrl}${url}`
    this.lastmod = lastmod || new Date().toISOString().split('T')[0]
    this.changefreq = changefreq
    this.priority = priority
  }

  toXML() {
    return `  <url>
    <loc>${this.url}</loc>
    <lastmod>${this.lastmod}</lastmod>
    <changefreq>${this.changefreq}</changefreq>
    <priority>${this.priority}</priority>
  </url>`
  }
}

// =============================================================================
// SITEMAP GENERATOR CLASS
// =============================================================================

class SitemapGenerator {
  constructor() {
    this.entries = []
  }

  addEntry(url, lastmod, changefreq, priority) {
    this.entries.push(new SitemapEntry(url, lastmod, changefreq, priority))
  }

  addEntries(entries) {
    entries.forEach(entry => {
      this.addEntry(entry.url, entry.lastmod, entry.changefreq, entry.priority)
    })
  }

  generateXML() {
    const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>'
    const urlsetOpen = '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
    const urlsetClose = '</urlset>'

    const urls = this.entries.map(entry => entry.toXML()).join('\n')

    return `${xmlHeader}\n${urlsetOpen}\n${urls}\n${urlsetClose}`
  }

  generateSitemapIndex(sitemapFiles) {
    const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>'
    const sitemapIndexOpen = '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
    const sitemapIndexClose = '</sitemapindex>'

    const sitemaps = sitemapFiles.map(file => {
      return `  <sitemap>
    <loc>${config.baseUrl}/${file}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
  </sitemap>`
    }).join('\n')

    return `${xmlHeader}\n${sitemapIndexOpen}\n${sitemaps}\n${sitemapIndexClose}`
  }

  clear() {
    this.entries = []
  }

  getEntryCount() {
    return this.entries.length
  }
}

// =============================================================================
// STATIC PAGES GENERATOR
// =============================================================================

function generateStaticSitemap() {
  console.log('📄 Generating static pages sitemap...')
  
  const staticGenerator = new SitemapGenerator()
  
  // Homepage
  staticGenerator.addEntry(
    '/',
    null,
    config.changeFreq.homepage,
    config.priorities.homepage
  )
  
  // Main navigation pages
  const mainPages = [
    { url: '/products', type: 'categories' },
    { url: '/categories', type: 'categories' },
    { url: '/search', type: 'static' },
    { url: '/wishlist', type: 'static' },
    { url: '/cart', type: 'static' },
    { url: '/checkout', type: 'static' }
  ]
  
  mainPages.forEach(page => {
    staticGenerator.addEntry(
      page.url,
      null,
      config.changeFreq[page.type],
      config.priorities[page.type]
    )
  })
  
  // User account pages
  const accountPages = [
    '/auth/login',
    '/auth/register',
    '/auth/forgot-password',
    '/profile',
    '/profile/orders',
    '/profile/addresses',
    '/profile/settings'
  ]
  
  accountPages.forEach(url => {
    staticGenerator.addEntry(
      url,
      null,
      config.changeFreq.auth,
      config.priorities.auth
    )
  })
  
  // Information pages
  const infoPages = [
    '/about',
    '/contact',
    '/help',
    '/support',
    '/shipping',
    '/returns',
    '/privacy',
    '/terms',
    '/security'
  ]
  
  infoPages.forEach(url => {
    staticGenerator.addEntry(
      url,
      null,
      config.changeFreq.static,
      config.priorities.static
    )
  })
  
  // Generate and save static sitemap
  const staticXML = staticGenerator.generateXML()
  const staticPath = path.join(config.outputDir, config.staticSitemapFile)
  fs.writeFileSync(staticPath, staticXML)
  
  console.log(`✅ Static sitemap generated: ${staticGenerator.getEntryCount()} pages`)
  return config.staticSitemapFile
}

// =============================================================================
// PRODUCT SITEMAP GENERATOR
// =============================================================================

function generateProductSitemap() {
  console.log('🛍️ Generating products sitemap...')
  
  const productGenerator = new SitemapGenerator()
  
  try {
    // In a real application, you would fetch products from your database
    // For this example, we'll generate sample product URLs
    const sampleProducts = generateSampleProducts(1000) // Generate 1000 sample products
    
    sampleProducts.forEach(product => {
      productGenerator.addEntry(
        `/products/${product.id}`,
        product.updatedAt,
        config.changeFreq.products,
        config.priorities.products
      )
    })
    
    // If there are too many products, split into multiple sitemaps
    const entries = productGenerator.entries
    const chunks = chunkArray(entries, config.maxUrlsPerSitemap)
    const sitemapFiles = []
    
    chunks.forEach((chunk, index) => {
      const chunkGenerator = new SitemapGenerator()
      chunkGenerator.entries = chunk
      
      const filename = chunks.length > 1 
        ? `sitemap-products-${index + 1}.xml`
        : config.productSitemapFile
      
      const xml = chunkGenerator.generateXML()
      const filePath = path.join(config.outputDir, filename)
      fs.writeFileSync(filePath, xml)
      
      sitemapFiles.push(filename)
    })
    
    console.log(`✅ Product sitemap(s) generated: ${entries.length} products in ${sitemapFiles.length} file(s)`)
    return sitemapFiles
    
  } catch (error) {
    console.warn('⚠️ Could not generate product sitemap:', error.message)
    console.log('Creating minimal product sitemap...')
    
    // Create a minimal product sitemap with main category pages
    productGenerator.addEntry('/products', null, 'daily', 0.9)
    productGenerator.addEntry('/products?category=electronics', null, 'weekly', 0.8)
    productGenerator.addEntry('/products?category=fashion', null, 'weekly', 0.8)
    productGenerator.addEntry('/products?category=home', null, 'weekly', 0.8)
    
    const xml = productGenerator.generateXML()
    const filePath = path.join(config.outputDir, config.productSitemapFile)
    fs.writeFileSync(filePath, xml)
    
    console.log(`✅ Minimal product sitemap generated: ${productGenerator.getEntryCount()} pages`)
    return [config.productSitemapFile]
  }
}

// =============================================================================
// CATEGORY SITEMAP GENERATOR
// =============================================================================

function generateCategorySitemap() {
  console.log('📂 Generating categories sitemap...')
  
  const categoryGenerator = new SitemapGenerator()
  
  // Main categories
  const categories = [
    'electronics',
    'fashion',
    'home',
    'sports',
    'books',
    'toys',
    'automotive',
    'health',
    'beauty',
    'garden'
  ]
  
  categories.forEach(category => {
    categoryGenerator.addEntry(
      `/products?category=${category}`,
      null,
      config.changeFreq.categories,
      config.priorities.categories
    )
    
    categoryGenerator.addEntry(
      `/categories/${category}`,
      null,
      config.changeFreq.categories,
      config.priorities.categories
    )
  })
  
  // Brand pages (if you have brand filtering)
  const brands = [
    'apple',
    'samsung',
    'nike',
    'adidas',
    'sony',
    'lg',
    'hp',
    'dell'
  ]
  
  brands.forEach(brand => {
    categoryGenerator.addEntry(
      `/products?brand=${brand}`,
      null,
      config.changeFreq.categories,
      config.priorities.categories
    )
  })
  
  // Generate and save category sitemap
  const categoryXML = categoryGenerator.generateXML()
  const categoryPath = path.join(config.outputDir, config.categorySitemapFile)
  fs.writeFileSync(categoryPath, categoryXML)
  
  console.log(`✅ Category sitemap generated: ${categoryGenerator.getEntryCount()} pages`)
  return config.categorySitemapFile
}

// =============================================================================
// SITEMAP INDEX GENERATOR
// =============================================================================

function generateSitemapIndex(sitemapFiles) {
  console.log('📑 Generating sitemap index...')
  
  const indexGenerator = new SitemapGenerator()
  const indexXML = indexGenerator.generateSitemapIndex(sitemapFiles)
  
  const indexPath = path.join(config.outputDir, config.sitemapIndexFile)
  fs.writeFileSync(indexPath, indexXML)
  
  console.log(`✅ Sitemap index generated with ${sitemapFiles.length} sitemaps`)
}

// =============================================================================
// ROBOTS.TXT GENERATOR
// =============================================================================

function generateRobotsTxt() {
  console.log('🤖 Generating robots.txt...')
  
  const robotsContent = `User-agent: *
Allow: /

# Disallow admin and API routes
Disallow: /admin/
Disallow: /api/
Disallow: /_next/
Disallow: /static/

# Disallow user-specific pages
Disallow: /profile/
Disallow: /checkout/
Disallow: /cart/

# Allow search engines to access product images
Allow: /images/
Allow: /uploads/

# Crawl-delay to be respectful
Crawl-delay: 1

# Sitemap location
Sitemap: ${config.baseUrl}/sitemap.xml

# Additional sitemaps
Sitemap: ${config.baseUrl}/${config.staticSitemapFile}
Sitemap: ${config.baseUrl}/${config.productSitemapFile}
Sitemap: ${config.baseUrl}/${config.categorySitemapFile}`

  const robotsPath = path.join(config.outputDir, 'robots.txt')
  fs.writeFileSync(robotsPath, robotsContent)
  
  console.log('✅ robots.txt generated')
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

function generateSampleProducts(count) {
  const products = []
  
  for (let i = 1; i <= count; i++) {
    products.push({
      id: `product-${i}`,
      updatedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    })
  }
  
  return products
}

function chunkArray(array, chunkSize) {
  const chunks = []
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize))
  }
  return chunks
}

function ensureOutputDirectory() {
  if (!fs.existsSync(config.outputDir)) {
    fs.mkdirSync(config.outputDir, { recursive: true })
  }
}

// =============================================================================
// SITEMAP VALIDATION
// =============================================================================

function validateSitemaps() {
  console.log('🔍 Validating generated sitemaps...')
  
  const sitemapFiles = [
    config.sitemapIndexFile,
    config.staticSitemapFile,
    config.productSitemapFile,
    config.categorySitemapFile
  ]
  
  let validationPassed = true
  
  sitemapFiles.forEach(file => {
    const filePath = path.join(config.outputDir, file)
    
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8')
      
      // Basic XML validation
      if (!content.includes('<?xml') || !content.includes('<urlset') && !content.includes('<sitemapindex')) {
        console.error(`❌ Invalid XML format in ${file}`)
        validationPassed = false
      } else {
        console.log(`✅ ${file} validation passed`)
      }
      
      // Check file size (should be under 50MB)
      const stats = fs.statSync(filePath)
      const fileSizeMB = stats.size / (1024 * 1024)
      
      if (fileSizeMB > 50) {
        console.warn(`⚠️ ${file} is large (${fileSizeMB.toFixed(2)}MB) - consider splitting`)
      }
      
    } else {
      console.error(`❌ ${file} not found`)
      validationPassed = false
    }
  })
  
  return validationPassed
}

// =============================================================================
// MAIN EXECUTION
// =============================================================================

async function generateAllSitemaps() {
  try {
    console.log('⏰ Sitemap generation started at:', new Date().toLocaleString())
    
    // Ensure output directory exists
    ensureOutputDirectory()
    
    // Generate individual sitemaps
    const staticSitemap = generateStaticSitemap()
    const productSitemaps = generateProductSitemap()
    const categorySitemap = generateCategorySitemap()
    
    // Collect all sitemap files
    const allSitemaps = [
      staticSitemap,
      ...productSitemaps,
      categorySitemap
    ].filter(Boolean)
    
    // Generate sitemap index
    generateSitemapIndex(allSitemaps)
    
    // Generate robots.txt
    generateRobotsTxt()
    
    // Validate generated sitemaps
    const isValid = validateSitemaps()
    
    if (isValid) {
      console.log('🎉 All sitemaps generated successfully!')
      console.log(`📊 Summary:`)
      console.log(`   - Static pages: 1 sitemap`)
      console.log(`   - Products: ${productSitemaps.length} sitemap(s)`)
      console.log(`   - Categories: 1 sitemap`)
      console.log(`   - Total files: ${allSitemaps.length + 1} (including index)`)
    } else {
      console.error('❌ Sitemap validation failed')
      process.exit(1)
    }
    
    console.log('⏰ Sitemap generation completed at:', new Date().toLocaleString())
    
  } catch (error) {
    console.error('💥 Sitemap generation failed:', error.message)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  generateAllSitemaps()
}

module.exports = {
  generateAllSitemaps,
  generateStaticSitemap,
  generateProductSitemap,
  generateCategorySitemap,
  generateSitemapIndex,
  generateRobotsTxt,
  config
}