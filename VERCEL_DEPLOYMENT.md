# 🚀 Vercel Deployment Guide for Kopiso E-Commerce

## Quick Deployment Steps

### 1. Prerequisites
- Git repository (GitHub, GitLab, or Bitbucket)
- Vercel account (sign up at [vercel.com](https://vercel.com))
- Node.js 18+ installed locally

### 2. Prepare Your Project
```bash
# Run the deployment preparation script
npm run vercel:prepare
```

This script will:
- ✅ Check Node.js version
- ✅ Install dependencies
- ✅ Run type checking
- ✅ Run linting
- ✅ Test build process
- ✅ Verify required files

### 3. Deploy to Vercel

#### Option A: Via Vercel Dashboard (Recommended)
1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your Git repository
4. Vercel will auto-detect Next.js configuration
5. Configure environment variables (see below)
6. Click "Deploy"

#### Option B: Via Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
npm run vercel:deploy
```

### 4. Environment Variables

Add these variables in Vercel Dashboard → Project Settings → Environment Variables:

```env
NODE_ENV=production
NEXT_PUBLIC_APP_NAME=Kopiso E-Commerce
NEXT_PUBLIC_APP_VERSION=1.0.0
NEXT_PUBLIC_APP_URL=https://your-app-name.vercel.app
NEXT_PUBLIC_API_URL=https://your-app-name.vercel.app/api
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
ADMIN_EMAIL=admin@kopiso.com
ADMIN_PASSWORD=admin123
DEMO_USER_EMAIL=user@kopiso.com
DEMO_USER_PASSWORD=user123
LOG_LEVEL=info
ENABLE_ERROR_MONITORING=true
NEXT_PUBLIC_IS_PRODUCTION=true
```

⚠️ **Important**: Change the `JWT_SECRET` and passwords in production!

### 5. Configure Custom Domain (Optional)
1. Go to Project Settings → Domains
2. Add your custom domain
3. Configure DNS records as instructed by Vercel
4. SSL certificate is automatically provisioned

### 6. Verify Deployment

After deployment, test these URLs:
- `https://your-app.vercel.app/` - Homepage
- `https://your-app.vercel.app/products` - Products page
- `https://your-app.vercel.app/admin` - Admin dashboard
- `https://your-app.vercel.app/api/products` - API endpoint

### 7. Monitor Your Application

#### Vercel Analytics
- Go to Project → Analytics tab
- Monitor Core Web Vitals
- Track user engagement

#### Function Logs
- Go to Project → Functions tab
- View real-time API logs
- Debug serverless function issues

## Troubleshooting

### Common Issues

#### 1. Build Failures
```bash
# Check build locally
npm run build

# Fix TypeScript errors
npm run type-check

# Fix linting errors
npm run lint:fix
```

#### 2. API Route Errors
- Check function logs in Vercel dashboard
- Verify environment variables are set
- Ensure data files exist in `/data` folder

#### 3. Image Loading Issues
- Verify image domains in `next.config.mjs`
- Check image paths and file permissions

#### 4. Environment Variable Issues
- Ensure client-side vars use `NEXT_PUBLIC_` prefix
- Redeploy after adding new variables
- Check variable values in Vercel dashboard

### Performance Optimization

#### 1. Core Web Vitals
- Monitor LCP (Largest Contentful Paint) < 2.5s
- Monitor FID (First Input Delay) < 100ms
- Monitor CLS (Cumulative Layout Shift) < 0.1

#### 2. Bundle Size
```bash
# Analyze bundle size
npm run build:analyze
```

#### 3. Caching Strategy
- Static assets: 1 year cache
- API responses: No cache (dynamic)
- Images: 30 days cache

## Security Checklist

- ✅ HTTPS enforced (automatic with Vercel)
- ✅ Security headers configured
- ✅ Environment variables secured
- ✅ API rate limiting enabled
- ⚠️ Change default passwords
- ⚠️ Generate strong JWT secret

## Support Resources

- **Vercel Documentation**: [vercel.com/docs](https://vercel.com/docs)
- **Next.js Documentation**: [nextjs.org/docs](https://nextjs.org/docs)
- **Vercel Community**: [github.com/vercel/vercel/discussions](https://github.com/vercel/vercel/discussions)
- **Project Issues**: [GitHub Issues](https://github.com/your-repo/issues)

## Continuous Deployment

Once deployed, any push to your main branch will trigger automatic deployment:

1. Code changes → Git push
2. Vercel detects changes
3. Automatic build and deploy
4. Live in ~60 seconds

---

🎉 **Congratulations!** Your Kopiso e-commerce platform is now live on Vercel!