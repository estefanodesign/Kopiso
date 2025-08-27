/**
 * SEO Optimization Utilities for Kopiso E-commerce Platform
 * Comprehensive SEO implementation with meta tags, structured data, and performance optimization
 */

import Head from 'next/head'
import { config } from '@/config/environment'

// =============================================================================
// SEO CONFIGURATION
// =============================================================================

export const seoConfig = {
  defaultTitle: config.seo.defaultTitle,
  defaultDescription: config.seo.defaultDescription,
  defaultKeywords: config.seo.defaultKeywords,
  siteUrl: config.baseUrl,
  siteName: config.appName,
  twitterHandle: '@kopiso',
  facebookAppId: '123456789',
  defaultImageUrl: `${config.baseUrl}/images/og-default.jpg`,
  defaultImageAlt: 'Kopiso E-commerce Platform',
  locale: 'en_US',
  type: 'website'
}

// =============================================================================
// SEO INTERFACES
// =============================================================================

export interface SEOProps {
  title?: string
  description?: string
  keywords?: string
  image?: string
  imageAlt?: string
  url?: string
  type?: 'website' | 'article' | 'product'
  publishedTime?: string
  modifiedTime?: string
  author?: string
  section?: string
  tags?: string[]
  price?: number
  currency?: string
  availability?: 'in_stock' | 'out_of_stock' | 'preorder'
  brand?: string
  category?: string
  rating?: number
  reviewCount?: number
  noIndex?: boolean
  noFollow?: boolean
  canonical?: string
}

export interface ProductSEOProps extends SEOProps {
  productId: string
  productName: string
  productDescription: string
  productImages: string[]
  productPrice: number
  productCurrency: string
  productAvailability: 'in_stock' | 'out_of_stock' | 'preorder'
  productBrand: string
  productCategory: string
  productRating?: number
  productReviewCount?: number
  productSKU?: string
  productCondition?: 'new' | 'used' | 'refurbished'
}

export interface ArticleSEOProps extends SEOProps {
  articleId: string
  articleTitle: string
  articleDescription: string
  articleAuthor: string
  articlePublishedTime: string
  articleModifiedTime?: string
  articleSection: string
  articleTags: string[]
}

// =============================================================================
// SEO COMPONENTS
// =============================================================================

// Base SEO component
export const SEOHead: React.FC<SEOProps> = ({
  title,
  description,
  keywords,
  image,
  imageAlt,
  url,
  type = 'website',
  publishedTime,
  modifiedTime,
  author,
  section,
  tags,
  noIndex = false,
  noFollow = false,
  canonical
}) => {
  const seoTitle = title ? `${title} | ${seoConfig.siteName}` : seoConfig.defaultTitle
  const seoDescription = description || seoConfig.defaultDescription
  const seoKeywords = keywords || seoConfig.defaultKeywords
  const seoImage = image || seoConfig.defaultImageUrl
  const seoImageAlt = imageAlt || seoConfig.defaultImageAlt
  const seoUrl = url || seoConfig.siteUrl
  const canonicalUrl = canonical || seoUrl

  return (
    <Head>
      {/* Basic Meta Tags */}
      <title>{seoTitle}</title>
      <meta name="description" content={seoDescription} />
      <meta name="keywords" content={seoKeywords} />
      <meta name="author" content={author || seoConfig.siteName} />
      
      {/* Robots Meta Tags */}
      <meta 
        name="robots" 
        content={`${noIndex ? 'noindex' : 'index'}, ${noFollow ? 'nofollow' : 'follow'}`} 
      />
      
      {/* Canonical URL */}
      <link rel="canonical" href={canonicalUrl} />
      
      {/* Open Graph Meta Tags */}
      <meta property="og:title" content={seoTitle} />
      <meta property="og:description" content={seoDescription} />
      <meta property="og:image" content={seoImage} />
      <meta property="og:image:alt" content={seoImageAlt} />
      <meta property="og:url" content={seoUrl} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={seoConfig.siteName} />
      <meta property="og:locale" content={seoConfig.locale} />
      
      {/* Article-specific Open Graph tags */}
      {type === 'article' && (
        <>
          {publishedTime && <meta property="article:published_time" content={publishedTime} />}
          {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}
          {author && <meta property="article:author" content={author} />}
          {section && <meta property="article:section" content={section} />}
          {tags && tags.map(tag => (
            <meta key={tag} property="article:tag" content={tag} />
          ))}
        </>
      )}
      
      {/* Twitter Card Meta Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content={seoConfig.twitterHandle} />
      <meta name="twitter:creator" content={seoConfig.twitterHandle} />
      <meta name="twitter:title" content={seoTitle} />
      <meta name="twitter:description" content={seoDescription} />
      <meta name="twitter:image" content={seoImage} />
      <meta name="twitter:image:alt" content={seoImageAlt} />
      
      {/* Facebook App ID */}
      <meta property="fb:app_id" content={seoConfig.facebookAppId} />
      
      {/* Additional Meta Tags */}
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta name="theme-color" content="#ff6b35" />
      <meta name="application-name" content={seoConfig.siteName} />
      
      {/* Preconnect for performance */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link rel="preconnect" href="https://www.google-analytics.com" />
      
      {/* Favicon and Icons */}
      <link rel="icon" href="/favicon.ico" />
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      <link rel="manifest" href="/manifest.json" />
    </Head>
  )
}

// Product SEO component
export const ProductSEO: React.FC<ProductSEOProps> = ({
  productId,
  productName,
  productDescription,
  productImages,
  productPrice,
  productCurrency,
  productAvailability,
  productBrand,
  productCategory,
  productRating,
  productReviewCount,
  productSKU,
  productCondition = 'new',
  ...seoProps
}) => {
  const productUrl = `${seoConfig.siteUrl}/products/${productId}`
  
  // Generate structured data for product
  const productStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: productName,
    description: productDescription,
    image: productImages,
    sku: productSKU,
    brand: {
      '@type': 'Brand',
      name: productBrand
    },
    category: productCategory,
    offers: {
      '@type': 'Offer',
      price: productPrice,
      priceCurrency: productCurrency,
      availability: `https://schema.org/${productAvailability === 'in_stock' ? 'InStock' : 'OutOfStock'}`,
      url: productUrl,
      seller: {
        '@type': 'Organization',
        name: seoConfig.siteName
      },
      itemCondition: `https://schema.org/${productCondition === 'new' ? 'NewCondition' : 'UsedCondition'}`
    },
    ...(productRating && productReviewCount && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: productRating,
        reviewCount: productReviewCount
      }
    })
  }

  return (
    <>
      <SEOHead
        title={productName}
        description={productDescription}
        image={productImages[0]}
        url={productUrl}
        type="product"
        {...seoProps}
      />
      
      {/* Product Structured Data */}
      <Head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(productStructuredData)
          }}
        />
        
        {/* Product-specific meta tags */}
        <meta property="product:price:amount" content={productPrice.toString()} />
        <meta property="product:price:currency" content={productCurrency} />
        <meta property="product:availability" content={productAvailability} />
        <meta property="product:condition" content={productCondition} />
        <meta property="product:brand" content={productBrand} />
        <meta property="product:category" content={productCategory} />
        
        {productRating && <meta property="product:rating" content={productRating.toString()} />}
        {productReviewCount && <meta property="product:review_count" content={productReviewCount.toString()} />}
      </Head>
    </>
  )
}

// Article SEO component
export const ArticleSEO: React.FC<ArticleSEOProps> = ({
  articleId,
  articleTitle,
  articleDescription,
  articleAuthor,
  articlePublishedTime,
  articleModifiedTime,
  articleSection,
  articleTags,
  ...seoProps
}) => {
  const articleUrl = `${seoConfig.siteUrl}/articles/${articleId}`
  
  // Generate structured data for article
  const articleStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: articleTitle,
    description: articleDescription,
    author: {
      '@type': 'Person',
      name: articleAuthor
    },
    publisher: {
      '@type': 'Organization',
      name: seoConfig.siteName,
      logo: {
        '@type': 'ImageObject',
        url: `${seoConfig.siteUrl}/logo.png`
      }
    },
    datePublished: articlePublishedTime,
    dateModified: articleModifiedTime || articlePublishedTime,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': articleUrl
    },
    articleSection: articleSection,
    keywords: articleTags.join(', ')
  }

  return (
    <>
      <SEOHead
        title={articleTitle}
        description={articleDescription}
        url={articleUrl}
        type="article"
        publishedTime={articlePublishedTime}
        modifiedTime={articleModifiedTime}
        author={articleAuthor}
        section={articleSection}
        tags={articleTags}
        {...seoProps}
      />
      
      {/* Article Structured Data */}
      <Head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(articleStructuredData)
          }}
        />
      </Head>
    </>
  )
}

// =============================================================================
// STRUCTURED DATA GENERATORS
// =============================================================================

export const generateOrganizationData = () => ({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: seoConfig.siteName,
  url: seoConfig.siteUrl,
  logo: `${seoConfig.siteUrl}/logo.png`,
  description: seoConfig.defaultDescription,
  contactPoint: {
    '@type': 'ContactPoint',
    telephone: '+1-555-KOPISO',
    contactType: 'customer service',
    availableLanguage: ['English']
  },
  sameAs: [
    'https://www.facebook.com/kopiso',
    'https://www.twitter.com/kopiso',
    'https://www.instagram.com/kopiso'
  ]
})

export const generateWebsiteData = () => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: seoConfig.siteName,
  url: seoConfig.siteUrl,
  description: seoConfig.defaultDescription,
  potentialAction: {
    '@type': 'SearchAction',
    target: `${seoConfig.siteUrl}/search?q={search_term_string}`,
    'query-input': 'required name=search_term_string'
  }
})

export const generateBreadcrumbData = (breadcrumbs: Array<{name: string, url: string}>) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: breadcrumbs.map((crumb, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: crumb.name,
    item: `${seoConfig.siteUrl}${crumb.url}`
  }))
})

export const generateFAQData = (faqs: Array<{question: string, answer: string}>) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map(faq => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: faq.answer
    }
  }))
})

// =============================================================================
// SEO UTILITIES
// =============================================================================

export class SEOUtils {
  // Generate meta description from content
  static generateMetaDescription(content: string, maxLength = 160): string {
    // Remove HTML tags and clean up
    const cleanContent = content
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim()
    
    if (cleanContent.length <= maxLength) {
      return cleanContent
    }
    
    // Truncate at word boundary
    const truncated = cleanContent.substring(0, maxLength)
    const lastSpaceIndex = truncated.lastIndexOf(' ')
    
    return lastSpaceIndex > 0 
      ? truncated.substring(0, lastSpaceIndex) + '...'
      : truncated + '...'
  }

  // Generate keywords from content
  static generateKeywords(content: string, maxKeywords = 10): string {
    // Remove HTML tags and common stop words
    const stopWords = [
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have',
      'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should'
    ]
    
    const words = content
      .toLowerCase()
      .replace(/<[^>]*>/g, '')
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.includes(word))
    
    // Count word frequency
    const wordCount: Record<string, number> = {}
    words.forEach(word => {
      wordCount[word] = (wordCount[word] || 0) + 1
    })
    
    // Sort by frequency and take top keywords
    const sortedWords = Object.entries(wordCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, maxKeywords)
      .map(([word]) => word)
    
    return sortedWords.join(', ')
  }

  // Generate URL slug
  static generateSlug(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  // Validate meta tag length
  static validateMetaLength(text: string, type: 'title' | 'description'): {
    isValid: boolean
    length: number
    maxLength: number
    recommendation?: string
  } {
    const maxLengths = {
      title: 60,
      description: 160
    }
    
    const maxLength = maxLengths[type]
    const length = text.length
    const isValid = length <= maxLength
    
    let recommendation: string | undefined
    if (!isValid) {
      recommendation = `${type} is too long. Consider shortening to ${maxLength} characters or less.`
    } else if (length < maxLength * 0.7) {
      recommendation = `${type} could be longer to utilize available space for better SEO.`
    }
    
    return {
      isValid,
      length,
      maxLength,
      recommendation
    }
  }

  // Extract image alt text
  static generateImageAlt(imageName: string, context?: string): string {
    // Clean up filename
    const cleanName = imageName
      .replace(/\.[^/.]+$/, '') // Remove extension
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase()) // Title case
    
    return context ? `${cleanName} - ${context}` : cleanName
  }

  // Generate social media preview
  static generateSocialPreview(data: SEOProps) {
    return {
      title: data.title || seoConfig.defaultTitle,
      description: data.description || seoConfig.defaultDescription,
      image: data.image || seoConfig.defaultImageUrl,
      url: data.url || seoConfig.siteUrl,
      domain: new URL(seoConfig.siteUrl).hostname
    }
  }
}

// =============================================================================
// SITEMAP GENERATION
// =============================================================================

export interface SitemapEntry {
  url: string
  lastmod?: string
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
  priority?: number
}

export class SitemapGenerator {
  private baseUrl: string
  private entries: SitemapEntry[] = []

  constructor(baseUrl: string = seoConfig.siteUrl) {
    this.baseUrl = baseUrl
  }

  // Add single entry
  addEntry(entry: SitemapEntry): void {
    this.entries.push({
      ...entry,
      url: entry.url.startsWith('http') ? entry.url : `${this.baseUrl}${entry.url}`
    })
  }

  // Add multiple entries
  addEntries(entries: SitemapEntry[]): void {
    entries.forEach(entry => this.addEntry(entry))
  }

  // Add static pages
  addStaticPages(): void {
    const staticPages = [
      { url: '/', changefreq: 'daily' as const, priority: 1.0 },
      { url: '/products', changefreq: 'hourly' as const, priority: 0.9 },
      { url: '/categories', changefreq: 'weekly' as const, priority: 0.8 },
      { url: '/about', changefreq: 'monthly' as const, priority: 0.6 },
      { url: '/contact', changefreq: 'monthly' as const, priority: 0.6 },
      { url: '/help', changefreq: 'weekly' as const, priority: 0.7 },
      { url: '/privacy', changefreq: 'yearly' as const, priority: 0.3 },
      { url: '/terms', changefreq: 'yearly' as const, priority: 0.3 }
    ]

    this.addEntries(staticPages.map(page => ({
      ...page,
      lastmod: new Date().toISOString()
    })))
  }

  // Generate XML sitemap
  generateXML(): string {
    const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>'
    const urlsetOpen = '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
    const urlsetClose = '</urlset>'

    const urls = this.entries.map(entry => {
      const url = `  <url>
    <loc>${entry.url}</loc>
    ${entry.lastmod ? `<lastmod>${entry.lastmod}</lastmod>` : ''}
    ${entry.changefreq ? `<changefreq>${entry.changefreq}</changefreq>` : ''}
    ${entry.priority ? `<priority>${entry.priority}</priority>` : ''}
  </url>`
      return url
    }).join('\n')

    return `${xmlHeader}\n${urlsetOpen}\n${urls}\n${urlsetClose}`
  }

  // Generate sitemap index
  generateSitemapIndex(sitemapUrls: string[]): string {
    const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>'
    const sitemapIndexOpen = '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
    const sitemapIndexClose = '</sitemapindex>'

    const sitemaps = sitemapUrls.map(url => {
      return `  <sitemap>
    <loc>${url}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </sitemap>`
    }).join('\n')

    return `${xmlHeader}\n${sitemapIndexOpen}\n${sitemaps}\n${sitemapIndexClose}`
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export default {
  SEOHead,
  ProductSEO,
  ArticleSEO,
  SEOUtils,
  SitemapGenerator,
  generateOrganizationData,
  generateWebsiteData,
  generateBreadcrumbData,
  generateFAQData,
  seoConfig
}