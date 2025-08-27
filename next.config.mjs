/** @type {import('next').NextConfig} */
const nextConfig = {
  // Performance optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // Enable compression for better performance
  compress: true,
  
  // Optimize images for Vercel
  images: {
    // Vercel-optimized domains
    domains: process.env.NODE_ENV === 'production' 
      ? ['vercel.app', 'kopiso-ecommerce.vercel.app'] 
      : ['localhost', '127.0.0.1'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.vercel.app',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'kopiso-ecommerce.vercel.app',
        pathname: '/uploads/**',
      },
      ...(process.env.NODE_ENV !== 'production' ? [{
        protocol: 'http',
        hostname: 'localhost',
        port: '3001',
        pathname: '/uploads/**',
      }] : []),
    ],
    // Image optimization settings
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
  },
  
  // Progressive Web App settings
  poweredByHeader: false,
  
  // Asset optimization
  swcMinify: true,
  
  // Enable experimental features for better performance
  experimental: {
    serverComponentsExternalPackages: ['multer'],
    optimizeCss: true,
    webVitalsAttribution: ['CLS', 'LCP'],
    scrollRestoration: true,
    // Vercel-specific optimizations
    serverActions: true,
    typedRoutes: true,
  },
  
  // Bundle analyzer
  ...(process.env.ANALYZE === 'true' && {
    webpack: (config, { isServer }) => {
      if (!isServer) {
        const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
        config.plugins.push(
          new BundleAnalyzerPlugin({
            analyzerMode: 'static',
            reportFilename: '../bundle-analyzer-report.html',
            openAnalyzer: false,
          })
        );
      }
      
      // Optimize for Vercel serverless functions
      if (isServer) {
        config.externals = [...(config.externals || []), 'canvas', 'jsdom'];
      }
      
      return config;
    },
  }),
  
  // Headers for security and performance
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
      {
        source: '/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
    ];
  },
  
  // Vercel-specific output configuration
  output: process.env.NODE_ENV === 'production' ? undefined : 'standalone',
  
  // Environment variables for Vercel
  env: {
    VERCEL_ENV: process.env.VERCEL_ENV,
    VERCEL_URL: process.env.VERCEL_URL,
  },
};

export default nextConfig;