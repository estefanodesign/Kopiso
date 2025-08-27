#!/usr/bin/env node

/**
 * SEO Validation Script for Kopiso E-commerce Platform
 * Validates SEO implementation, meta tags, structured data, and best practices
 */

const fs = require('fs')
const path = require('path')

// SEO validation configuration
const seoConfig = {
  checkMetaTags: true,
  checkStructuredData: true,
  checkImages: true,
  checkLinks: true,
  checkPerformance: true,
  checkAccessibility: true,
  outputReport: true,
  reportFile: 'seo-report.json'
}

console.log('🔍 Starting SEO validation...')

// SEO validation results
const validationResults = {
  timestamp: new Date().toISOString(),
  passed: [],
  warnings: [],
  errors: [],
  recommendations: [],
  summary: {}
}

// =============================================================================
// META TAG VALIDATION
// =============================================================================

function validateMetaTags() {
  console.log('🏷️ Validating meta tags...')
  
  const htmlFiles = findHTMLFiles('src')
  const requiredMetaTags = [
    'title',
    'description',
    'keywords',
    'og:title',
    'og:description',
    'og:image',
    'twitter:card',
    'twitter:title',
    'twitter:description'
  ]
  
  htmlFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf8')
    
    // Check for required meta tags
    requiredMetaTags.forEach(tag => {
      const metaPattern = tag.includes(':') 
        ? new RegExp(`property="${tag}"`, 'i')
        : new RegExp(`name="${tag}"`, 'i')
      
      if (!metaPattern.test(content)) {
        validationResults.warnings.push({
          category: 'Meta Tags',
          file: file,
          description: `Missing ${tag} meta tag`,
          recommendation: `Add ${tag} meta tag for better SEO`
        })
      }
    })
    
    // Check title length
    const titleMatch = content.match(/<title[^>]*>([^<]+)<\/title>/i)
    if (titleMatch) {
      const titleLength = titleMatch[1].length
      if (titleLength > 60) {
        validationResults.warnings.push({
          category: 'Meta Tags',
          file: file,
          description: `Title too long (${titleLength} characters)`,
          recommendation: 'Keep title under 60 characters for optimal display'
        })
      } else if (titleLength < 30) {
        validationResults.recommendations.push({
          category: 'Meta Tags',
          file: file,
          description: `Title could be longer (${titleLength} characters)`,
          recommendation: 'Consider expanding title to 30-60 characters'
        })
      } else {
        validationResults.passed.push({
          category: 'Meta Tags',
          description: `Title length optimal in ${path.basename(file)}`
        })
      }
    }
    
    // Check description length
    const descMatch = content.match(/name="description"\s+content="([^"]+)"/i)
    if (descMatch) {
      const descLength = descMatch[1].length
      if (descLength > 160) {
        validationResults.warnings.push({
          category: 'Meta Tags',
          file: file,
          description: `Description too long (${descLength} characters)`,
          recommendation: 'Keep description under 160 characters'
        })
      } else if (descLength < 120) {
        validationResults.recommendations.push({
          category: 'Meta Tags',
          file: file,
          description: `Description could be longer (${descLength} characters)`,
          recommendation: 'Consider expanding description to 120-160 characters'
        })
      } else {
        validationResults.passed.push({
          category: 'Meta Tags',
          description: `Description length optimal in ${path.basename(file)}`
        })
      }
    }
  })
}

// =============================================================================
// STRUCTURED DATA VALIDATION
// =============================================================================

function validateStructuredData() {
  console.log('📊 Validating structured data...')
  
  const structuredDataFiles = findFilesWithPattern('src', /application\/ld\+json/i)
  
  structuredDataFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf8')
    const jsonLdMatches = content.match(/<script[^>]*type="application\/ld\+json"[^>]*>(.*?)<\/script>/gis)
    
    if (jsonLdMatches) {
      jsonLdMatches.forEach((match, index) => {
        try {
          const jsonContent = match.replace(/<script[^>]*>|<\/script>/gi, '').trim()
          const parsed = JSON.parse(jsonContent)
          
          // Validate required properties
          if (parsed['@context'] && parsed['@type']) {
            validationResults.passed.push({
              category: 'Structured Data',
              description: `Valid ${parsed['@type']} schema in ${path.basename(file)}`
            })
            
            // Type-specific validation
            if (parsed['@type'] === 'Product') {
              validateProductSchema(parsed, file, index)
            } else if (parsed['@type'] === 'Organization') {
              validateOrganizationSchema(parsed, file, index)
            } else if (parsed['@type'] === 'WebSite') {
              validateWebsiteSchema(parsed, file, index)
            }
          } else {
            validationResults.errors.push({
              category: 'Structured Data',
              file: file,
              description: `Missing @context or @type in JSON-LD ${index + 1}`,
              recommendation: 'Add required @context and @type properties'
            })
          }
        } catch (error) {
          validationResults.errors.push({
            category: 'Structured Data',
            file: file,
            description: `Invalid JSON-LD syntax: ${error.message}`,
            recommendation: 'Fix JSON syntax errors in structured data'
          })
        }
      })
    } else {
      // Check if this should have structured data
      if (file.includes('product') || file.includes('category')) {
        validationResults.warnings.push({
          category: 'Structured Data',
          file: file,
          description: 'Missing structured data for e-commerce page',
          recommendation: 'Add Product or ItemList schema markup'
        })
      }
    }
  })
}

function validateProductSchema(schema, file, index) {
  const requiredFields = ['name', 'description', 'image', 'offers']
  const missingFields = requiredFields.filter(field => !schema[field])
  
  if (missingFields.length > 0) {
    validationResults.warnings.push({
      category: 'Structured Data',
      file: file,
      description: `Product schema missing: ${missingFields.join(', ')}`,
      recommendation: 'Add missing required fields to Product schema'
    })
  }
  
  // Validate offers
  if (schema.offers && !schema.offers.price) {
    validationResults.warnings.push({
      category: 'Structured Data',
      file: file,
      description: 'Product offer missing price',
      recommendation: 'Add price to product offers'
    })
  }
}

function validateOrganizationSchema(schema, file, index) {
  const requiredFields = ['name', 'url']
  const recommendedFields = ['logo', 'contactPoint', 'sameAs']
  
  const missingRequired = requiredFields.filter(field => !schema[field])
  const missingRecommended = recommendedFields.filter(field => !schema[field])
  
  if (missingRequired.length > 0) {
    validationResults.errors.push({
      category: 'Structured Data',
      file: file,
      description: `Organization schema missing required: ${missingRequired.join(', ')}`,
      recommendation: 'Add missing required fields to Organization schema'
    })
  }
  
  if (missingRecommended.length > 0) {
    validationResults.recommendations.push({
      category: 'Structured Data',
      file: file,
      description: `Organization schema could include: ${missingRecommended.join(', ')}`,
      recommendation: 'Add recommended fields for better schema markup'
    })
  }
}

function validateWebsiteSchema(schema, file, index) {
  if (!schema.potentialAction || !schema.potentialAction.target) {
    validationResults.recommendations.push({
      category: 'Structured Data',
      file: file,
      description: 'Website schema missing search action',
      recommendation: 'Add SearchAction to enable rich search results'
    })
  }
}

// =============================================================================
// IMAGE OPTIMIZATION VALIDATION
// =============================================================================

function validateImageOptimization() {
  console.log('🖼️ Validating image optimization...')
  
  const imageFiles = findImageFiles('public')
  const htmlFiles = findHTMLFiles('src')
  
  // Check for missing alt attributes
  htmlFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf8')
    const imgTags = content.match(/<img[^>]*>/gi) || []
    
    imgTags.forEach((tag, index) => {
      if (!tag.includes('alt=')) {
        validationResults.warnings.push({
          category: 'Image Optimization',
          file: file,
          description: `Image ${index + 1} missing alt attribute`,
          recommendation: 'Add descriptive alt text for accessibility and SEO'
        })
      } else {
        // Check for empty or generic alt text
        const altMatch = tag.match(/alt="([^"]*)"/i)
        if (altMatch && (altMatch[1] === '' || altMatch[1].toLowerCase().includes('image'))) {
          validationResults.warnings.push({
            category: 'Image Optimization',
            file: file,
            description: `Image ${index + 1} has generic or empty alt text`,
            recommendation: 'Use descriptive, specific alt text'
          })
        }
      }
    })
  })
  
  // Check image file sizes
  imageFiles.forEach(file => {
    const stats = fs.statSync(file)
    const fileSizeMB = stats.size / (1024 * 1024)
    
    if (fileSizeMB > 2) {
      validationResults.warnings.push({
        category: 'Image Optimization',
        file: file,
        description: `Large image file (${fileSizeMB.toFixed(2)}MB)`,
        recommendation: 'Optimize image size for better page load speed'
      })
    }
    
    // Check for modern formats
    if (file.endsWith('.jpg') || file.endsWith('.png')) {
      validationResults.recommendations.push({
        category: 'Image Optimization',
        file: file,
        description: 'Consider using WebP format',
        recommendation: 'Convert to WebP for better compression and performance'
      })
    }
  })
}

// =============================================================================
// LINK VALIDATION
// =============================================================================

function validateLinks() {
  console.log('🔗 Validating internal links...')
  
  const htmlFiles = findHTMLFiles('src')
  
  htmlFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf8')
    
    // Check for external links without rel attributes
    const externalLinks = content.match(/<a[^>]*href="https?:\/\/[^"]*"[^>]*>/gi) || []
    
    externalLinks.forEach((link, index) => {
      if (!link.includes('rel=')) {
        validationResults.warnings.push({
          category: 'Link Optimization',
          file: file,
          description: `External link ${index + 1} missing rel attribute`,
          recommendation: 'Add rel="noopener noreferrer" to external links'
        })
      }
    })
    
    // Check for broken anchor links
    const anchorLinks = content.match(/<a[^>]*href="#[^"]*"[^>]*>/gi) || []
    
    anchorLinks.forEach((link, index) => {
      const hrefMatch = link.match(/href="#([^"]*)"/)
      if (hrefMatch) {
        const anchorId = hrefMatch[1]
        const idPattern = new RegExp(`id="${anchorId}"`, 'i')
        
        if (!idPattern.test(content)) {
          validationResults.warnings.push({
            category: 'Link Optimization',
            file: file,
            description: `Broken anchor link to #${anchorId}`,
            recommendation: 'Ensure target element exists or fix anchor link'
          })
        }
      }
    })
  })
}

// =============================================================================
// PERFORMANCE VALIDATION
// =============================================================================

function validatePerformance() {
  console.log('⚡ Validating performance factors...')
  
  // Check for performance-impacting patterns
  const jsFiles = findFilesWithExtension('src', '.js', '.ts', '.jsx', '.tsx')
  
  jsFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf8')
    
    // Check for blocking operations
    if (content.includes('document.write')) {
      validationResults.warnings.push({
        category: 'Performance',
        file: file,
        description: 'Use of document.write detected',
        recommendation: 'Replace document.write with modern DOM methods'
      })
    }
    
    // Check for large inline styles
    const styleMatches = content.match(/style="[^"]{100,}"/g)
    if (styleMatches) {
      validationResults.recommendations.push({
        category: 'Performance',
        file: file,
        description: 'Large inline styles detected',
        recommendation: 'Move large styles to CSS files for better caching'
      })
    }
    
    // Check for missing lazy loading
    if (content.includes('<img') && !content.includes('loading=')) {
      validationResults.recommendations.push({
        category: 'Performance',
        file: file,
        description: 'Images without lazy loading',
        recommendation: 'Add loading="lazy" to non-critical images'
      })
    }
  })
  
  // Check Next.js configuration
  const nextConfigPath = 'next.config.mjs'
  if (fs.existsSync(nextConfigPath)) {
    const configContent = fs.readFileSync(nextConfigPath, 'utf8')
    
    if (!configContent.includes('swcMinify')) {
      validationResults.recommendations.push({
        category: 'Performance',
        file: nextConfigPath,
        description: 'SWC minification not enabled',
        recommendation: 'Enable swcMinify for better build performance'
      })
    }
    
    if (!configContent.includes('compress')) {
      validationResults.recommendations.push({
        category: 'Performance',
        file: nextConfigPath,
        description: 'Compression not enabled',
        recommendation: 'Enable compression for better performance'
      })
    }
  }
}

// =============================================================================
// ACCESSIBILITY VALIDATION
// =============================================================================

function validateAccessibility() {
  console.log('♿ Validating accessibility...')
  
  const htmlFiles = findHTMLFiles('src')
  
  htmlFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf8')
    
    // Check for missing lang attribute
    if (content.includes('<html') && !content.includes('lang=')) {
      validationResults.warnings.push({
        category: 'Accessibility',
        file: file,
        description: 'Missing lang attribute on html element',
        recommendation: 'Add lang="en" or appropriate language code'
      })
    }
    
    // Check for missing form labels
    const inputTags = content.match(/<input[^>]*>/gi) || []
    inputTags.forEach((tag, index) => {
      if (tag.includes('type="text"') || tag.includes('type="email"')) {
        const idMatch = tag.match(/id="([^"]*)"/)
        if (idMatch) {
          const inputId = idMatch[1]
          const labelPattern = new RegExp(`for="${inputId}"`, 'i')
          
          if (!labelPattern.test(content)) {
            validationResults.warnings.push({
              category: 'Accessibility',
              file: file,
              description: `Input #${inputId} missing associated label`,
              recommendation: 'Add label element with for attribute'
            })
          }
        }
      }
    })
    
    // Check for missing heading hierarchy
    const headings = content.match(/<h[1-6][^>]*>/gi) || []
    if (headings.length > 0) {
      const levels = headings.map(h => parseInt(h.match(/<h(\d)/)[1]))
      let expectedLevel = 1
      
      levels.forEach((level, index) => {
        if (level > expectedLevel + 1) {
          validationResults.warnings.push({
            category: 'Accessibility',
            file: file,
            description: `Heading hierarchy skip from h${expectedLevel} to h${level}`,
            recommendation: 'Maintain proper heading hierarchy (h1->h2->h3...)'
          })
        }
        expectedLevel = level
      })
    }
  })
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

function findHTMLFiles(dir) {
  return findFilesWithExtension(dir, '.html', '.jsx', '.tsx')
}

function findImageFiles(dir) {
  return findFilesWithExtension(dir, '.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp')
}

function findFilesWithExtension(dir, ...extensions) {
  const files = []
  
  function searchDirectory(directory) {
    if (!fs.existsSync(directory)) return
    
    const items = fs.readdirSync(directory)
    
    items.forEach(item => {
      if (item.startsWith('.') || item === 'node_modules') return
      
      const itemPath = path.join(directory, item)
      const stat = fs.statSync(itemPath)
      
      if (stat.isDirectory()) {
        searchDirectory(itemPath)
      } else if (extensions.some(ext => item.toLowerCase().endsWith(ext))) {
        files.push(itemPath)
      }
    })
  }
  
  searchDirectory(dir)
  return files
}

function findFilesWithPattern(dir, pattern) {
  const files = []
  
  function searchDirectory(directory) {
    if (!fs.existsSync(directory)) return
    
    const items = fs.readdirSync(directory)
    
    items.forEach(item => {
      if (item.startsWith('.') || item === 'node_modules') return
      
      const itemPath = path.join(directory, item)
      const stat = fs.statSync(itemPath)
      
      if (stat.isDirectory()) {
        searchDirectory(itemPath)
      } else {
        const content = fs.readFileSync(itemPath, 'utf8')
        if (pattern.test(content)) {
          files.push(itemPath)
        }
      }
    })
  }
  
  searchDirectory(dir)
  return files
}

// =============================================================================
// REPORT GENERATION
// =============================================================================

function generateSEOReport() {
  console.log('📊 Generating SEO report...')
  
  // Calculate summary
  validationResults.summary = {
    totalChecks: validationResults.passed.length + validationResults.warnings.length + validationResults.errors.length,
    passed: validationResults.passed.length,
    warnings: validationResults.warnings.length,
    errors: validationResults.errors.length,
    recommendations: validationResults.recommendations.length,
    categories: {
      'Meta Tags': 0,
      'Structured Data': 0,
      'Image Optimization': 0,
      'Link Optimization': 0,
      'Performance': 0,
      'Accessibility': 0
    }
  }
  
  // Count by category
  const allIssues = [...validationResults.warnings, ...validationResults.errors]
  allIssues.forEach(issue => {
    if (validationResults.summary.categories[issue.category] !== undefined) {
      validationResults.summary.categories[issue.category]++
    }
  })
  
  // Save JSON report
  if (seoConfig.outputReport) {
    fs.writeFileSync(seoConfig.reportFile, JSON.stringify(validationResults, null, 2))
  }
  
  // Console summary
  console.log('\n🔍 SEO Validation Summary:')
  console.log(`   ✅ Passed: ${validationResults.summary.passed}`)
  console.log(`   ⚠️ Warnings: ${validationResults.summary.warnings}`)
  console.log(`   ❌ Errors: ${validationResults.summary.errors}`)
  console.log(`   💡 Recommendations: ${validationResults.summary.recommendations}`)
  
  if (validationResults.summary.errors > 0) {
    console.log('\n❌ Critical SEO Issues:')
    validationResults.errors.forEach(error => {
      console.log(`   • ${error.description} (${path.basename(error.file || 'Unknown')})`)
    })
  }
  
  if (validationResults.summary.warnings > 0) {
    console.log('\n⚠️ SEO Warnings:')
    validationResults.warnings.slice(0, 5).forEach(warning => {
      console.log(`   • ${warning.description} (${path.basename(warning.file || 'Unknown')})`)
    })
    
    if (validationResults.warnings.length > 5) {
      console.log(`   ... and ${validationResults.warnings.length - 5} more`)
    }
  }
  
  console.log(`\n📁 Full report saved to: ${seoConfig.reportFile}`)
  
  // Return exit code based on errors
  return validationResults.summary.errors > 0 ? 1 : 0
}

// =============================================================================
// MAIN EXECUTION
// =============================================================================

async function runSEOValidation() {
  try {
    console.log('⏰ SEO validation started at:', new Date().toLocaleString())
    
    if (seoConfig.checkMetaTags) {
      validateMetaTags()
    }
    
    if (seoConfig.checkStructuredData) {
      validateStructuredData()
    }
    
    if (seoConfig.checkImages) {
      validateImageOptimization()
    }
    
    if (seoConfig.checkLinks) {
      validateLinks()
    }
    
    if (seoConfig.checkPerformance) {
      validatePerformance()
    }
    
    if (seoConfig.checkAccessibility) {
      validateAccessibility()
    }
    
    const exitCode = generateSEOReport()
    
    console.log('⏰ SEO validation completed at:', new Date().toLocaleString())
    process.exit(exitCode)
    
  } catch (error) {
    console.error('💥 SEO validation failed:', error.message)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  runSEOValidation()
}

module.exports = {
  runSEOValidation,
  seoConfig,
  validationResults
}