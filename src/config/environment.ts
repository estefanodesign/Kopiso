/**
 * Environment Configuration Validation Module
 * Validates and manages environment variables for Kopiso E-commerce Platform
 */

import joi from 'joi'

// Environment validation schema
const envSchema = joi.object({
  // Application Settings
  NODE_ENV: joi.string().valid('development', 'production', 'test').default('development'),
  PORT: joi.number().port().default(3000),
  
  // URLs and Endpoints
  NEXT_PUBLIC_BASE_URL: joi.string().uri().required(),
  NEXT_PUBLIC_API_URL: joi.string().uri().required(),
  NEXT_PUBLIC_APP_NAME: joi.string().default('Kopiso'),
  
  // Database Configuration
  DATABASE_URL: joi.string().required(),
  DATABASE_POOL_MIN: joi.number().min(1).default(2),
  DATABASE_POOL_MAX: joi.number().min(1).default(10),
  DATABASE_TIMEOUT: joi.number().min(1000).default(30000),
  
  // Authentication & Security
  JWT_SECRET: joi.string().min(32).required(),
  JWT_REFRESH_SECRET: joi.string().min(32).required(),
  JWT_EXPIRES_IN: joi.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: joi.string().default('7d'),
  
  SESSION_SECRET: joi.string().min(32).required(),
  COOKIE_SECURE: joi.boolean().default(false),
  COOKIE_HTTP_ONLY: joi.boolean().default(true),
  COOKIE_SAME_SITE: joi.string().valid('strict', 'lax', 'none').default('lax'),
  
  BCRYPT_ROUNDS: joi.number().min(4).max(15).default(10),
  
  // CORS Settings
  CORS_ORIGIN: joi.string().required(),
  CORS_CREDENTIALS: joi.boolean().default(true),
  
  // External Services
  EMAIL_PROVIDER: joi.string().valid('sendgrid', 'ses', 'mock').default('mock'),
  EMAIL_API_KEY: joi.string().when('EMAIL_PROVIDER', {
    is: joi.string().valid('sendgrid', 'ses'),
    then: joi.string().required(),
    otherwise: joi.string().optional()
  }),
  EMAIL_FROM: joi.string().email().required(),
  EMAIL_FROM_NAME: joi.string().default('Kopiso'),
  
  // File Storage
  STORAGE_PROVIDER: joi.string().valid('local', 's3', 'cloudinary').default('local'),
  AWS_ACCESS_KEY_ID: joi.string().when('STORAGE_PROVIDER', {
    is: 's3',
    then: joi.string().required(),
    otherwise: joi.string().optional()
  }),
  AWS_SECRET_ACCESS_KEY: joi.string().when('STORAGE_PROVIDER', {
    is: 's3',
    then: joi.string().required(),
    otherwise: joi.string().optional()
  }),
  AWS_REGION: joi.string().when('STORAGE_PROVIDER', {
    is: 's3',
    then: joi.string().required(),
    otherwise: joi.string().optional()
  }),
  AWS_S3_BUCKET: joi.string().when('STORAGE_PROVIDER', {
    is: 's3',
    then: joi.string().required(),
    otherwise: joi.string().optional()
  }),
  
  // Payment Gateways
  STRIPE_SECRET_KEY: joi.string().optional(),
  STRIPE_PUBLISHABLE_KEY: joi.string().optional(),
  STRIPE_WEBHOOK_SECRET: joi.string().optional(),
  
  PAYPAL_CLIENT_ID: joi.string().optional(),
  PAYPAL_CLIENT_SECRET: joi.string().optional(),
  PAYPAL_MODE: joi.string().valid('sandbox', 'live').default('sandbox'),
  
  // Monitoring & Logging
  SENTRY_DSN: joi.string().uri().optional(),
  SENTRY_ENVIRONMENT: joi.string().optional(),
  SENTRY_RELEASE: joi.string().optional(),
  
  GOOGLE_ANALYTICS_ID: joi.string().optional(),
  FACEBOOK_PIXEL_ID: joi.string().optional(),
  
  LOG_LEVEL: joi.string().valid('error', 'warn', 'info', 'debug').default('info'),
  LOG_FORMAT: joi.string().valid('json', 'pretty').default('json'),
  
  // Caching & Performance
  REDIS_URL: joi.string().uri().optional(),
  REDIS_PASSWORD: joi.string().optional(),
  REDIS_DB: joi.number().min(0).default(0),
  
  CDN_URL: joi.string().uri().optional(),
  STATIC_ASSETS_URL: joi.string().uri().optional(),
  
  CACHE_TTL: joi.number().min(0).default(3600),
  STATIC_CACHE_TTL: joi.number().min(0).default(86400),
  
  // Server Configuration
  SERVER_TIMEOUT: joi.number().min(1000).default(30000),
  BODY_LIMIT: joi.string().default('10mb'),
  UPLOAD_LIMIT: joi.string().default('50mb'),
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: joi.number().min(1000).default(900000),
  RATE_LIMIT_MAX_REQUESTS: joi.number().min(1).default(100),
  
  // Feature Flags
  FEATURE_WISHLIST: joi.boolean().default(true),
  FEATURE_REVIEWS: joi.boolean().default(true),
  FEATURE_RECOMMENDATIONS: joi.boolean().default(true),
  FEATURE_LIVE_CHAT: joi.boolean().default(false),
  FEATURE_ADMIN_ANALYTICS: joi.boolean().default(true),
  
  ENABLE_GOOGLE_LOGIN: joi.boolean().default(false),
  ENABLE_FACEBOOK_LOGIN: joi.boolean().default(false),
  ENABLE_APPLE_LOGIN: joi.boolean().default(false),
  
  // SEO Configuration
  SEO_DEFAULT_TITLE: joi.string().default('Kopiso - E-commerce Platform'),
  SEO_DEFAULT_DESCRIPTION: joi.string().default('Modern e-commerce platform'),
  SEO_DEFAULT_KEYWORDS: joi.string().default('ecommerce,shopping,online store'),
  
  // Security Headers
  CSP_ENABLED: joi.boolean().default(true),
  CSP_REPORT_URI: joi.string().default('/api/csp-report'),
  HSTS_MAX_AGE: joi.number().min(0).default(31536000),
  FRAME_OPTIONS: joi.string().valid('DENY', 'SAMEORIGIN', 'ALLOW-FROM').default('DENY'),
  CONTENT_TYPE_OPTIONS: joi.string().valid('nosniff').default('nosniff'),
  
  // API Limits
  API_RATE_LIMIT_WINDOW: joi.number().min(1000).default(900000),
  API_RATE_LIMIT_MAX: joi.number().min(1).default(1000),
  MAX_FILE_SIZE: joi.number().min(1024).default(10485760),
  MAX_FILES_PER_REQUEST: joi.number().min(1).default(10),
  ALLOWED_FILE_TYPES: joi.string().default('image/jpeg,image/png,image/webp'),
  
  // Business Settings
  DEFAULT_CURRENCY: joi.string().length(3).default('USD'),
  SUPPORTED_CURRENCIES: joi.string().default('USD,EUR,GBP'),
  DEFAULT_LOCALE: joi.string().default('en-US'),
  SUPPORTED_LOCALES: joi.string().default('en-US'),
  
  TAX_CALCULATION_ENABLED: joi.boolean().default(false),
  DEFAULT_TAX_RATE: joi.number().min(0).max(1).default(0),
  FREE_SHIPPING_THRESHOLD: joi.number().min(0).default(50),
  DEFAULT_SHIPPING_RATE: joi.number().min(0).default(9.99),
  
  // Admin Settings
  ADMIN_SESSION_TIMEOUT: joi.number().min(300000).default(3600000),
  ADMIN_PASSWORD_POLICY: joi.string().valid('relaxed', 'strict').default('strict'),
  ADMIN_2FA_REQUIRED: joi.boolean().default(false),
  
  // Debug Settings
  DEBUG_MODE: joi.boolean().default(false),
  ENABLE_QUERY_LOGGING: joi.boolean().default(false),
  ENABLE_PERFORMANCE_MONITORING: joi.boolean().default(true),
  
  // Maintenance
  MAINTENANCE_MODE: joi.boolean().default(false),
  MAINTENANCE_MESSAGE: joi.string().default('System maintenance in progress'),
}).unknown()

// Configuration interface
export interface AppConfig {
  // Application
  nodeEnv: string
  port: number
  baseUrl: string
  apiUrl: string
  appName: string
  
  // Database
  database: {
    url: string
    pool: {
      min: number
      max: number
    }
    timeout: number
  }
  
  // Authentication
  auth: {
    jwt: {
      secret: string
      refreshSecret: string
      expiresIn: string
      refreshExpiresIn: string
    }
    session: {
      secret: string
      secure: boolean
      httpOnly: boolean
      sameSite: string
    }
    bcrypt: {
      rounds: number
    }
  }
  
  // CORS
  cors: {
    origin: string
    credentials: boolean
  }
  
  // External Services
  email: {
    provider: string
    apiKey?: string
    from: string
    fromName: string
  }
  
  storage: {
    provider: string
    aws?: {
      accessKeyId: string
      secretAccessKey: string
      region: string
      bucket: string
    }
  }
  
  payment: {
    stripe?: {
      secretKey: string
      publishableKey: string
      webhookSecret: string
    }
    paypal?: {
      clientId: string
      clientSecret: string
      mode: string
    }
  }
  
  // Monitoring
  monitoring: {
    sentry?: {
      dsn: string
      environment: string
      release: string
    }
    analytics?: {
      googleAnalyticsId: string
      facebookPixelId: string
    }
    logging: {
      level: string
      format: string
    }
  }
  
  // Caching
  caching: {
    redis?: {
      url: string
      password?: string
      db: number
    }
    ttl: {
      default: number
      static: number
    }
  }
  
  // Server
  server: {
    timeout: number
    bodyLimit: string
    uploadLimit: string
  }
  
  // Rate Limiting
  rateLimit: {
    windowMs: number
    maxRequests: number
  }
  
  // Features
  features: {
    wishlist: boolean
    reviews: boolean
    recommendations: boolean
    liveChat: boolean
    adminAnalytics: boolean
    googleLogin: boolean
    facebookLogin: boolean
    appleLogin: boolean
  }
  
  // SEO
  seo: {
    defaultTitle: string
    defaultDescription: string
    defaultKeywords: string
  }
  
  // Security
  security: {
    csp: {
      enabled: boolean
      reportUri: string
    }
    headers: {
      hstsMaxAge: number
      frameOptions: string
      contentTypeOptions: string
    }
  }
  
  // Business
  business: {
    currency: {
      default: string
      supported: string[]
    }
    locale: {
      default: string
      supported: string[]
    }
    tax: {
      enabled: boolean
      defaultRate: number
    }
    shipping: {
      freeThreshold: number
      defaultRate: number
    }
  }
  
  // Admin
  admin: {
    sessionTimeout: number
    passwordPolicy: string
    require2FA: boolean
  }
  
  // Debug
  debug: {
    enabled: boolean
    queryLogging: boolean
    performanceMonitoring: boolean
  }
  
  // Maintenance
  maintenance: {
    enabled: boolean
    message: string
  }
}

// Validate and parse environment variables
export function validateConfig(): AppConfig {
  const { error, value } = envSchema.validate(process.env, {
    abortEarly: false,
    stripUnknown: true
  })
  
  if (error) {
    const errorMessages = error.details.map(detail => detail.message).join(', ')
    throw new Error(`Environment validation failed: ${errorMessages}`)
  }
  
  return {
    nodeEnv: value.NODE_ENV,
    port: value.PORT,
    baseUrl: value.NEXT_PUBLIC_BASE_URL,
    apiUrl: value.NEXT_PUBLIC_API_URL,
    appName: value.NEXT_PUBLIC_APP_NAME,
    
    database: {
      url: value.DATABASE_URL,
      pool: {
        min: value.DATABASE_POOL_MIN,
        max: value.DATABASE_POOL_MAX
      },
      timeout: value.DATABASE_TIMEOUT
    },
    
    auth: {
      jwt: {
        secret: value.JWT_SECRET,
        refreshSecret: value.JWT_REFRESH_SECRET,
        expiresIn: value.JWT_EXPIRES_IN,
        refreshExpiresIn: value.JWT_REFRESH_EXPIRES_IN
      },
      session: {
        secret: value.SESSION_SECRET,
        secure: value.COOKIE_SECURE,
        httpOnly: value.COOKIE_HTTP_ONLY,
        sameSite: value.COOKIE_SAME_SITE
      },
      bcrypt: {
        rounds: value.BCRYPT_ROUNDS
      }
    },
    
    cors: {
      origin: value.CORS_ORIGIN,
      credentials: value.CORS_CREDENTIALS
    },
    
    email: {
      provider: value.EMAIL_PROVIDER,
      apiKey: value.EMAIL_API_KEY,
      from: value.EMAIL_FROM,
      fromName: value.EMAIL_FROM_NAME
    },
    
    storage: {
      provider: value.STORAGE_PROVIDER,
      ...(value.STORAGE_PROVIDER === 's3' && {
        aws: {
          accessKeyId: value.AWS_ACCESS_KEY_ID,
          secretAccessKey: value.AWS_SECRET_ACCESS_KEY,
          region: value.AWS_REGION,
          bucket: value.AWS_S3_BUCKET
        }
      })
    },
    
    payment: {
      ...(value.STRIPE_SECRET_KEY && {
        stripe: {
          secretKey: value.STRIPE_SECRET_KEY,
          publishableKey: value.STRIPE_PUBLISHABLE_KEY,
          webhookSecret: value.STRIPE_WEBHOOK_SECRET
        }
      }),
      ...(value.PAYPAL_CLIENT_ID && {
        paypal: {
          clientId: value.PAYPAL_CLIENT_ID,
          clientSecret: value.PAYPAL_CLIENT_SECRET,
          mode: value.PAYPAL_MODE
        }
      })
    },
    
    monitoring: {
      ...(value.SENTRY_DSN && {
        sentry: {
          dsn: value.SENTRY_DSN,
          environment: value.SENTRY_ENVIRONMENT,
          release: value.SENTRY_RELEASE
        }
      }),
      ...(value.GOOGLE_ANALYTICS_ID && {
        analytics: {
          googleAnalyticsId: value.GOOGLE_ANALYTICS_ID,
          facebookPixelId: value.FACEBOOK_PIXEL_ID
        }
      }),
      logging: {
        level: value.LOG_LEVEL,
        format: value.LOG_FORMAT
      }
    },
    
    caching: {
      ...(value.REDIS_URL && {
        redis: {
          url: value.REDIS_URL,
          password: value.REDIS_PASSWORD,
          db: value.REDIS_DB
        }
      }),
      ttl: {
        default: value.CACHE_TTL,
        static: value.STATIC_CACHE_TTL
      }
    },
    
    server: {
      timeout: value.SERVER_TIMEOUT,
      bodyLimit: value.BODY_LIMIT,
      uploadLimit: value.UPLOAD_LIMIT
    },
    
    rateLimit: {
      windowMs: value.RATE_LIMIT_WINDOW_MS,
      maxRequests: value.RATE_LIMIT_MAX_REQUESTS
    },
    
    features: {
      wishlist: value.FEATURE_WISHLIST,
      reviews: value.FEATURE_REVIEWS,
      recommendations: value.FEATURE_RECOMMENDATIONS,
      liveChat: value.FEATURE_LIVE_CHAT,
      adminAnalytics: value.FEATURE_ADMIN_ANALYTICS,
      googleLogin: value.ENABLE_GOOGLE_LOGIN,
      facebookLogin: value.ENABLE_FACEBOOK_LOGIN,
      appleLogin: value.ENABLE_APPLE_LOGIN
    },
    
    seo: {
      defaultTitle: value.SEO_DEFAULT_TITLE,
      defaultDescription: value.SEO_DEFAULT_DESCRIPTION,
      defaultKeywords: value.SEO_DEFAULT_KEYWORDS
    },
    
    security: {
      csp: {
        enabled: value.CSP_ENABLED,
        reportUri: value.CSP_REPORT_URI
      },
      headers: {
        hstsMaxAge: value.HSTS_MAX_AGE,
        frameOptions: value.FRAME_OPTIONS,
        contentTypeOptions: value.CONTENT_TYPE_OPTIONS
      }
    },
    
    business: {
      currency: {
        default: value.DEFAULT_CURRENCY,
        supported: value.SUPPORTED_CURRENCIES.split(',')
      },
      locale: {
        default: value.DEFAULT_LOCALE,
        supported: value.SUPPORTED_LOCALES.split(',')
      },
      tax: {
        enabled: value.TAX_CALCULATION_ENABLED,
        defaultRate: value.DEFAULT_TAX_RATE
      },
      shipping: {
        freeThreshold: value.FREE_SHIPPING_THRESHOLD,
        defaultRate: value.DEFAULT_SHIPPING_RATE
      }
    },
    
    admin: {
      sessionTimeout: value.ADMIN_SESSION_TIMEOUT,
      passwordPolicy: value.ADMIN_PASSWORD_POLICY,
      require2FA: value.ADMIN_2FA_REQUIRED
    },
    
    debug: {
      enabled: value.DEBUG_MODE,
      queryLogging: value.ENABLE_QUERY_LOGGING,
      performanceMonitoring: value.ENABLE_PERFORMANCE_MONITORING
    },
    
    maintenance: {
      enabled: value.MAINTENANCE_MODE,
      message: value.MAINTENANCE_MESSAGE
    }
  }
}

// Export singleton config instance
export const config = validateConfig()

// Config validation on startup
export function validateStartupConfig() {
  try {
    const appConfig = validateConfig()
    console.log('✅ Environment configuration validated successfully')
    
    // Log critical configuration (excluding sensitive data)
    console.log('🔧 Application Configuration:')
    console.log(`   Environment: ${appConfig.nodeEnv}`)
    console.log(`   Port: ${appConfig.port}`)
    console.log(`   Base URL: ${appConfig.baseUrl}`)
    console.log(`   Storage Provider: ${appConfig.storage.provider}`)
    console.log(`   Email Provider: ${appConfig.email.provider}`)
    console.log(`   Debug Mode: ${appConfig.debug.enabled}`)
    console.log(`   Maintenance Mode: ${appConfig.maintenance.enabled}`)
    
    return appConfig
  } catch (error) {
    console.error('❌ Environment configuration validation failed:')
    console.error(error.message)
    process.exit(1)
  }
}

export default { config, validateConfig, validateStartupConfig }