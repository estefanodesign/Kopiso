#!/usr/bin/env node

/**
 * Health Check Script for Kopiso E-commerce Platform
 * Monitors application health during deployment and runtime
 */

const http = require('http')
const https = require('https')
const { URL } = require('url')

// Health check configuration
const config = {
  // Application endpoints to check
  endpoints: [
    {
      name: 'Frontend',
      url: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
      path: '/api/health',
      timeout: 10000,
      critical: true
    },
    {
      name: 'API Server',
      url: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
      path: '/api/health',
      timeout: 10000,
      critical: true
    },
    {
      name: 'Database Connection',
      url: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
      path: '/api/health/database',
      timeout: 15000,
      critical: true
    },
    {
      name: 'Redis Cache',
      url: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
      path: '/api/health/redis',
      timeout: 5000,
      critical: false
    }
  ],
  
  // Retry configuration
  maxRetries: 3,
  retryDelay: 2000,
  
  // Output format
  format: process.env.HEALTH_CHECK_FORMAT || 'json', // 'json' or 'text'
  verbose: process.env.HEALTH_CHECK_VERBOSE === 'true'
}

// Health check results
const results = {
  timestamp: new Date().toISOString(),
  overall: 'unknown',
  checks: [],
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    warnings: 0
  }
}

// =============================================================================
// HTTP REQUEST UTILITY
// =============================================================================

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url)
    const client = urlObj.protocol === 'https:' ? https : http
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      timeout: options.timeout || 10000,
      headers: {
        'User-Agent': 'Kopiso-Health-Check/1.0',
        'Accept': 'application/json',
        ...options.headers
      }
    }
    
    const req = client.request(requestOptions, (res) => {
      let data = ''
      
      res.on('data', (chunk) => {
        data += chunk
      })
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data)
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: jsonData,
            rawData: data
          })
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: null,
            rawData: data
          })
        }
      })
    })
    
    req.on('error', (error) => {
      reject(error)
    })
    
    req.on('timeout', () => {
      req.destroy()
      reject(new Error('Request timeout'))
    })
    
    req.end()
  })
}

// =============================================================================
// HEALTH CHECK FUNCTIONS
// =============================================================================

async function checkEndpoint(endpoint, retryCount = 0) {
  const startTime = Date.now()
  const fullUrl = endpoint.url + endpoint.path
  
  try {
    if (config.verbose) {
      console.log(`Checking ${endpoint.name}: ${fullUrl}`)
    }
    
    const response = await makeRequest(fullUrl, {
      timeout: endpoint.timeout
    })
    
    const duration = Date.now() - startTime
    const isHealthy = response.statusCode >= 200 && response.statusCode < 300
    
    // Parse health check response
    let healthData = {}
    if (response.data && typeof response.data === 'object') {
      healthData = response.data
    }
    
    const result = {
      name: endpoint.name,
      url: fullUrl,
      status: isHealthy ? 'healthy' : 'unhealthy',
      statusCode: response.statusCode,
      duration: duration,
      critical: endpoint.critical,
      timestamp: new Date().toISOString(),
      details: healthData,
      retryCount: retryCount
    }
    
    if (!isHealthy && retryCount < config.maxRetries) {
      if (config.verbose) {
        console.log(`Retrying ${endpoint.name} (attempt ${retryCount + 1}/${config.maxRetries})`)
      }
      
      await new Promise(resolve => setTimeout(resolve, config.retryDelay))
      return checkEndpoint(endpoint, retryCount + 1)
    }
    
    return result
    
  } catch (error) {
    const duration = Date.now() - startTime
    
    const result = {
      name: endpoint.name,
      url: fullUrl,
      status: 'error',
      statusCode: 0,
      duration: duration,
      critical: endpoint.critical,
      timestamp: new Date().toISOString(),
      error: error.message,
      retryCount: retryCount
    }
    
    if (retryCount < config.maxRetries) {
      if (config.verbose) {
        console.log(`Retrying ${endpoint.name} due to error: ${error.message}`)
      }
      
      await new Promise(resolve => setTimeout(resolve, config.retryDelay))
      return checkEndpoint(endpoint, retryCount + 1)
    }
    
    return result
  }
}

async function performHealthChecks() {
  if (config.verbose) {
    console.log('Starting health checks...')
  }
  
  // Run all health checks in parallel
  const checkPromises = config.endpoints.map(endpoint => checkEndpoint(endpoint))
  const checkResults = await Promise.all(checkPromises)
  
  // Process results
  results.checks = checkResults
  results.summary.total = checkResults.length
  
  checkResults.forEach(result => {
    if (result.status === 'healthy') {
      results.summary.passed++
    } else if (result.critical) {
      results.summary.failed++
    } else {
      results.summary.warnings++
    }
  })
  
  // Determine overall status
  if (results.summary.failed > 0) {
    results.overall = 'unhealthy'
  } else if (results.summary.warnings > 0) {
    results.overall = 'degraded'
  } else {
    results.overall = 'healthy'
  }
  
  return results
}

// =============================================================================
// OUTPUT FORMATTING
// =============================================================================

function formatTextOutput(results) {
  let output = ''
  
  // Header
  output += `Health Check Report - ${results.timestamp}\n`
  output += `${'='.repeat(50)}\n\n`
  
  // Overall status
  const statusIcon = {
    healthy: '✅',
    degraded: '⚠️',
    unhealthy: '❌',
    unknown: '❓'
  }
  
  output += `Overall Status: ${statusIcon[results.overall]} ${results.overall.toUpperCase()}\n\n`
  
  // Summary
  output += `Summary:\n`
  output += `  Total Checks: ${results.summary.total}\n`
  output += `  Passed: ${results.summary.passed}\n`
  output += `  Failed: ${results.summary.failed}\n`
  output += `  Warnings: ${results.summary.warnings}\n\n`
  
  // Individual checks
  output += `Individual Checks:\n`
  output += `${'-'.repeat(50)}\n`
  
  results.checks.forEach(check => {
    const icon = check.status === 'healthy' ? '✅' : 
                 check.status === 'error' ? '❌' : '⚠️'
    
    output += `${icon} ${check.name}\n`
    output += `   URL: ${check.url}\n`
    output += `   Status: ${check.status} (${check.statusCode})\n`
    output += `   Duration: ${check.duration}ms\n`
    output += `   Critical: ${check.critical}\n`
    
    if (check.error) {
      output += `   Error: ${check.error}\n`
    }
    
    if (check.retryCount > 0) {
      output += `   Retries: ${check.retryCount}\n`
    }
    
    if (check.details && Object.keys(check.details).length > 0) {
      output += `   Details: ${JSON.stringify(check.details, null, 4).replace(/\n/g, '\n     ')}\n`
    }
    
    output += '\n'
  })
  
  return output
}

function formatJsonOutput(results) {
  return JSON.stringify(results, null, 2)
}

// =============================================================================
// MAIN EXECUTION
// =============================================================================

async function main() {
  try {
    const healthResults = await performHealthChecks()
    
    // Output results
    let output
    if (config.format === 'text') {
      output = formatTextOutput(healthResults)
    } else {
      output = formatJsonOutput(healthResults)
    }
    
    console.log(output)
    
    // Exit with appropriate code
    if (healthResults.overall === 'healthy') {
      process.exit(0)
    } else if (healthResults.overall === 'degraded') {
      process.exit(1) // Warning
    } else {
      process.exit(2) // Critical failure
    }
    
  } catch (error) {
    console.error('Health check script failed:', error.message)
    process.exit(3) // Script error
  }
}

// Handle command line arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
Kopiso Health Check Script

Usage: node healthcheck.js [OPTIONS]

Options:
  --format, -f    Output format (json|text) [default: json]
  --verbose, -v   Verbose output
  --help, -h      Show this help

Environment Variables:
  NEXT_PUBLIC_BASE_URL      Frontend URL
  NEXT_PUBLIC_API_URL       API URL
  HEALTH_CHECK_FORMAT       Output format
  HEALTH_CHECK_VERBOSE      Enable verbose output

Exit Codes:
  0 - All checks passed (healthy)
  1 - Some non-critical checks failed (degraded)
  2 - Critical checks failed (unhealthy)
  3 - Script error
  `)
  process.exit(0)
}

if (process.argv.includes('--format') || process.argv.includes('-f')) {
  const formatIndex = process.argv.findIndex(arg => arg === '--format' || arg === '-f')
  config.format = process.argv[formatIndex + 1] || 'json'
}

if (process.argv.includes('--verbose') || process.argv.includes('-v')) {
  config.verbose = true
}

// Run health checks
main()