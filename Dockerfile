# Multi-stage Docker build for Kopiso E-commerce Platform
# Optimized for production deployment with security and performance

# =============================================================================
# Build Stage - Dependencies and Build
# =============================================================================
FROM node:18-alpine AS deps

# Install system dependencies for security and performance
RUN apk add --no-cache libc6-compat curl

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies with clean cache
RUN npm ci --only=production && npm cache clean --force

# =============================================================================
# Build Stage - Application Build
# =============================================================================
FROM node:18-alpine AS builder

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build arguments for environment configuration
ARG NODE_ENV=production
ARG NEXT_PUBLIC_BASE_URL
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_APP_NAME

# Set environment variables
ENV NODE_ENV=$NODE_ENV
ENV NEXT_PUBLIC_BASE_URL=$NEXT_PUBLIC_BASE_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_APP_NAME=$NEXT_PUBLIC_APP_NAME
ENV NEXT_TELEMETRY_DISABLED=1

# Install all dependencies for build
RUN npm ci

# Type checking and linting
RUN npm run type-check
RUN npm run lint

# Run tests
RUN npm run test

# Build application
RUN npm run build

# =============================================================================
# Production Stage - Runtime
# =============================================================================
FROM node:18-alpine AS runner

# Install system packages for security
RUN apk add --no-cache \
    dumb-init \
    curl \
    && addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

WORKDIR /app

# Set environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy server files
COPY --from=builder --chown=nextjs:nodejs /app/server ./server

# Health check script
COPY --chown=nextjs:nodejs scripts/healthcheck.js ./scripts/

# Create necessary directories with proper permissions
RUN mkdir -p ./uploads ./logs ./tmp \
    && chown -R nextjs:nodejs ./uploads ./logs ./tmp \
    && chmod 755 ./uploads ./logs ./tmp

# Switch to non-root user
USER nextjs

# Expose ports
EXPOSE 3000 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node scripts/healthcheck.js || exit 1

# Start application with dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "start"]

# =============================================================================
# Development Stage - For local development
# =============================================================================
FROM node:18-alpine AS development

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache libc6-compat curl git

# Copy package files
COPY package.json package-lock.json* ./

# Install all dependencies (including dev)
RUN npm ci

# Copy source code
COPY . .

# Set development environment
ENV NODE_ENV=development
ENV NEXT_TELEMETRY_DISABLED=1

# Expose ports for development
EXPOSE 3000 3001

# Development command
CMD ["npm", "run", "dev"]