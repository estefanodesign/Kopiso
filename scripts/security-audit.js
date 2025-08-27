#!/usr/bin/env node

/**
 * Security Audit Script for Kopiso E-commerce Platform
 * Performs comprehensive security checks and vulnerability assessments
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

// Security audit configuration
const auditConfig = {
  checkDependencies: true,
  checkEnvironment: true,
  checkFilePermissions: true,
  checkSecurityHeaders: true,
  checkCodeVulnerabilities: true,
  generateReport: true,
  outputDir: 'security-reports'
}

console.log('🔒 Starting Security Audit...')
console.log('Configuration:', auditConfig)

// Ensure output directory exists
if (!fs.existsSync(auditConfig.outputDir)) {
  fs.mkdirSync(auditConfig.outputDir, { recursive: true })
}

// Security audit results
const auditResults = {
  timestamp: new Date().toISOString(),
  vulnerabilities: [],
  warnings: [],
  passed: [],
  summary: {}
}

// Dependency vulnerability check
function checkDependencyVulnerabilities() {
  console.log('📦 Checking dependency vulnerabilities...')
  
  try {
    const auditOutput = execSync('npm audit --json', { encoding: 'utf8' })
    const auditData = JSON.parse(auditOutput)
    
    if (auditData.vulnerabilities) {
      const vulnerabilityCount = Object.keys(auditData.vulnerabilities).length
      
      if (vulnerabilityCount > 0) {
        auditResults.vulnerabilities.push({
          category: 'Dependencies',
          severity: 'HIGH',
          description: `Found ${vulnerabilityCount} dependency vulnerabilities`,
          details: auditData.vulnerabilities,
          recommendation: 'Run npm audit fix to resolve vulnerabilities'
        })
      } else {
        auditResults.passed.push({
          category: 'Dependencies',
          description: 'No dependency vulnerabilities found'
        })
      }
    }
  } catch (error) {
    auditResults.warnings.push({
      category: 'Dependencies',
      description: 'Unable to perform dependency audit',
      error: error.message
    })
  }
}

// Environment configuration security check
function checkEnvironmentSecurity() {
  console.log('🔧 Checking environment configuration...')
  
  const envFiles = [
    '.env.local',
    '.env.production',
    '.env.development',
    '.env'
  ]
  
  envFiles.forEach(envFile => {
    if (fs.existsSync(envFile)) {
      const envContent = fs.readFileSync(envFile, 'utf8')
      
      // Check for weak secrets
      const weakSecrets = [
        'secret', 'password', 'admin', 'test', '123456',
        'dev-secret', 'changeme', 'default'
      ]
      
      weakSecrets.forEach(weak => {
        if (envContent.toLowerCase().includes(weak.toLowerCase())) {
          auditResults.vulnerabilities.push({
            category: 'Environment',
            severity: 'CRITICAL',
            description: `Weak secret detected in ${envFile}`,
            details: `Found potentially weak secret: ${weak}`,
            recommendation: 'Use strong, randomly generated secrets'
          })
        }
      })
      
      // Check for production secrets in development files
      if (envFile.includes('development') || envFile.includes('local')) {
        const productionPatterns = [
          /sk_live_/,
          /pk_live_/,
          /prod/i,
          /production/i
        ]
        
        productionPatterns.forEach(pattern => {
          if (pattern.test(envContent)) {
            auditResults.vulnerabilities.push({
              category: 'Environment',
              severity: 'HIGH',
              description: `Production credentials in development file ${envFile}`,
              recommendation: 'Remove production credentials from development environment'
            })
          }
        })
      }
      
      // Check for missing critical environment variables
      const criticalVars = [
        'JWT_SECRET',
        'SESSION_SECRET',
        'DATABASE_URL'
      ]
      
      criticalVars.forEach(varName => {
        if (!envContent.includes(varName)) {
          auditResults.warnings.push({
            category: 'Environment',
            description: `Missing critical environment variable: ${varName}`,
            recommendation: `Add ${varName} to ${envFile}`
          })
        }
      })
    }
  })
  
  // Check if .env files are in .gitignore
  if (fs.existsSync('.gitignore')) {
    const gitignoreContent = fs.readFileSync('.gitignore', 'utf8')
    
    if (!gitignoreContent.includes('.env')) {
      auditResults.vulnerabilities.push({
        category: 'Environment',
        severity: 'CRITICAL',
        description: 'Environment files not excluded from version control',
        recommendation: 'Add .env* to .gitignore'
      })
    } else {
      auditResults.passed.push({
        category: 'Environment',
        description: 'Environment files properly excluded from version control'
      })
    }
  }
}

// File permissions security check
function checkFilePermissions() {
  console.log('📁 Checking file permissions...')
  
  const sensitiveFiles = [
    'package.json',
    'next.config.mjs',
    'server/index.ts'
  ]
  
  sensitiveFiles.forEach(file => {
    if (fs.existsSync(file)) {
      try {
        const stats = fs.statSync(file)
        const mode = stats.mode & parseInt('777', 8)
        
        // Check if file is world-writable
        if (mode & parseInt('002', 8)) {
          auditResults.vulnerabilities.push({
            category: 'File Permissions',
            severity: 'MEDIUM',
            description: `File ${file} is world-writable`,
            recommendation: 'Remove world-write permissions'
          })
        }
      } catch (error) {
        auditResults.warnings.push({
          category: 'File Permissions',
          description: `Unable to check permissions for ${file}`,
          error: error.message
        })
      }
    }
  })
}

// Code vulnerability scanning
function scanCodeVulnerabilities() {
  console.log('🔍 Scanning for code vulnerabilities...')
  
  const vulnerabilityPatterns = [
    {
      pattern: /eval\s*\(/g,
      description: 'Use of eval() function',
      severity: 'HIGH',
      recommendation: 'Avoid using eval() as it can execute arbitrary code'
    },
    {
      pattern: /innerHTML\s*=/g,
      description: 'Use of innerHTML assignment',
      severity: 'MEDIUM',
      recommendation: 'Use textContent or sanitize HTML to prevent XSS'
    },
    {
      pattern: /document\.write/g,
      description: 'Use of document.write',
      severity: 'MEDIUM',
      recommendation: 'Use safer DOM manipulation methods'
    },
    {
      pattern: /password.*console\.log/gi,
      description: 'Password logging detected',
      severity: 'CRITICAL',
      recommendation: 'Never log passwords or sensitive information'
    },
    {
      pattern: /localStorage\.setItem.*password/gi,
      description: 'Password stored in localStorage',
      severity: 'HIGH',
      recommendation: 'Never store passwords in localStorage'
    }
  ]
  
  function scanDirectory(dir) {
    const files = fs.readdirSync(dir)
    
    files.forEach(file => {
      const filePath = path.join(dir, file)
      const stat = fs.statSync(filePath)
      
      if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
        scanDirectory(filePath)
      } else if (file.endsWith('.ts') || file.endsWith('.js') || file.endsWith('.tsx') || file.endsWith('.jsx')) {
        const content = fs.readFileSync(filePath, 'utf8')
        
        vulnerabilityPatterns.forEach(({ pattern, description, severity, recommendation }) => {
          const matches = content.match(pattern)
          if (matches) {
            auditResults.vulnerabilities.push({
              category: 'Code Vulnerability',
              severity,
              description: `${description} in ${filePath}`,
              details: `Found ${matches.length} occurrence(s)`,
              recommendation
            })
          }
        })
      }
    })
  }
  
  // Scan src directory
  if (fs.existsSync('src')) {
    scanDirectory('src')
  }
  
  // Scan server directory
  if (fs.existsSync('server')) {
    scanDirectory('server')
  }
}

// Check security configuration
function checkSecurityConfiguration() {
  console.log('⚙️ Checking security configuration...')
  
  // Check Next.js configuration
  if (fs.existsSync('next.config.mjs')) {
    const configContent = fs.readFileSync('next.config.mjs', 'utf8')
    
    // Check for security headers
    if (configContent.includes('headers()')) {
      auditResults.passed.push({
        category: 'Security Headers',
        description: 'Security headers configuration found'
      })
    } else {
      auditResults.warnings.push({
        category: 'Security Headers',
        description: 'No security headers configuration found',
        recommendation: 'Add security headers to Next.js configuration'
      })
    }
    
    // Check for HTTPS redirect
    if (configContent.includes('redirect') && configContent.includes('https')) {
      auditResults.passed.push({
        category: 'HTTPS',
        description: 'HTTPS redirect configuration found'
      })
    }
  }
  
  // Check for security middleware
  const securityMiddlewarePath = 'src/middleware/security.ts'
  if (fs.existsSync(securityMiddlewarePath)) {
    auditResults.passed.push({
      category: 'Security Middleware',
      description: 'Security middleware implementation found'
    })
  } else {
    auditResults.warnings.push({
      category: 'Security Middleware',
      description: 'No security middleware found',
      recommendation: 'Implement security middleware for request validation and protection'
    })
  }
}

// Check for common security files
function checkSecurityFiles() {
  console.log('📋 Checking for security files...')
  
  const securityFiles = [
    { file: 'SECURITY.md', description: 'Security policy documentation' },
    { file: '.github/SECURITY.md', description: 'GitHub security policy' },
    { file: 'security.txt', description: 'Security contact information' },
    { file: '.well-known/security.txt', description: 'Security contact (well-known)' }
  ]
  
  securityFiles.forEach(({ file, description }) => {
    if (fs.existsSync(file)) {
      auditResults.passed.push({
        category: 'Security Documentation',
        description: `${description} found: ${file}`
      })
    } else {
      auditResults.warnings.push({
        category: 'Security Documentation',
        description: `Missing ${description}`,
        recommendation: `Create ${file} with security contact information`
      })
    }
  })
}

// Generate security report
function generateSecurityReport() {
  console.log('📊 Generating security report...')
  
  // Calculate summary
  auditResults.summary = {
    totalChecks: auditResults.vulnerabilities.length + auditResults.warnings.length + auditResults.passed.length,
    vulnerabilities: auditResults.vulnerabilities.length,
    warnings: auditResults.warnings.length,
    passed: auditResults.passed.length,
    criticalVulnerabilities: auditResults.vulnerabilities.filter(v => v.severity === 'CRITICAL').length,
    highVulnerabilities: auditResults.vulnerabilities.filter(v => v.severity === 'HIGH').length,
    mediumVulnerabilities: auditResults.vulnerabilities.filter(v => v.severity === 'MEDIUM').length,
    lowVulnerabilities: auditResults.vulnerabilities.filter(v => v.severity === 'LOW').length
  }
  
  // Generate JSON report
  const jsonReport = JSON.stringify(auditResults, null, 2)
  fs.writeFileSync(path.join(auditConfig.outputDir, 'security-audit.json'), jsonReport)
  
  // Generate HTML report
  const htmlReport = generateHTMLReport()
  fs.writeFileSync(path.join(auditConfig.outputDir, 'security-audit.html'), htmlReport)
  
  // Generate summary
  console.log('\n🔒 Security Audit Summary:')
  console.log(`   Total Checks: ${auditResults.summary.totalChecks}`)
  console.log(`   ✅ Passed: ${auditResults.summary.passed}`)
  console.log(`   ⚠️ Warnings: ${auditResults.summary.warnings}`)
  console.log(`   ❌ Vulnerabilities: ${auditResults.summary.vulnerabilities}`)
  
  if (auditResults.summary.criticalVulnerabilities > 0) {
    console.log(`   🚨 Critical: ${auditResults.summary.criticalVulnerabilities}`)
  }
  if (auditResults.summary.highVulnerabilities > 0) {
    console.log(`   🔴 High: ${auditResults.summary.highVulnerabilities}`)
  }
  if (auditResults.summary.mediumVulnerabilities > 0) {
    console.log(`   🟡 Medium: ${auditResults.summary.mediumVulnerabilities}`)
  }
  
  console.log(`\n📁 Reports saved to: ${auditConfig.outputDir}/`)
  
  // Return exit code based on vulnerabilities
  return auditResults.summary.criticalVulnerabilities > 0 ? 1 : 0
}

// Generate HTML report
function generateHTMLReport() {
  return `<!DOCTYPE html>
<html>
<head>
    <title>Security Audit Report - Kopiso</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f8f9fa; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
        .summary { display: flex; gap: 20px; margin-bottom: 20px; }
        .summary-card { background: white; border: 1px solid #ddd; padding: 15px; border-radius: 5px; flex: 1; }
        .critical { color: #dc3545; }
        .high { color: #fd7e14; }
        .medium { color: #ffc107; }
        .low { color: #28a745; }
        .passed { color: #28a745; }
        .warning { color: #ffc107; }
        .vulnerability { background: #f8d7da; border: 1px solid #f5c6cb; padding: 10px; margin: 10px 0; border-radius: 5px; }
        .warning-item { background: #fff3cd; border: 1px solid #ffeaa7; padding: 10px; margin: 10px 0; border-radius: 5px; }
        .passed-item { background: #d4edda; border: 1px solid #c3e6cb; padding: 10px; margin: 10px 0; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🔒 Security Audit Report</h1>
        <p>Generated: ${auditResults.timestamp}</p>
        <p>Project: Kopiso E-commerce Platform</p>
    </div>
    
    <div class="summary">
        <div class="summary-card">
            <h3>Total Checks</h3>
            <h2>${auditResults.summary.totalChecks}</h2>
        </div>
        <div class="summary-card">
            <h3 class="passed">Passed</h3>
            <h2>${auditResults.summary.passed}</h2>
        </div>
        <div class="summary-card">
            <h3 class="warning">Warnings</h3>
            <h2>${auditResults.summary.warnings}</h2>
        </div>
        <div class="summary-card">
            <h3 class="critical">Vulnerabilities</h3>
            <h2>${auditResults.summary.vulnerabilities}</h2>
        </div>
    </div>
    
    ${auditResults.vulnerabilities.length > 0 ? `
    <h2>🚨 Vulnerabilities</h2>
    ${auditResults.vulnerabilities.map(v => `
        <div class="vulnerability">
            <h4 class="${v.severity.toLowerCase()}">${v.severity}: ${v.description}</h4>
            <p><strong>Category:</strong> ${v.category}</p>
            ${v.details ? `<p><strong>Details:</strong> ${v.details}</p>` : ''}
            ${v.recommendation ? `<p><strong>Recommendation:</strong> ${v.recommendation}</p>` : ''}
        </div>
    `).join('')}
    ` : ''}
    
    ${auditResults.warnings.length > 0 ? `
    <h2>⚠️ Warnings</h2>
    ${auditResults.warnings.map(w => `
        <div class="warning-item">
            <h4>${w.description}</h4>
            <p><strong>Category:</strong> ${w.category}</p>
            ${w.recommendation ? `<p><strong>Recommendation:</strong> ${w.recommendation}</p>` : ''}
        </div>
    `).join('')}
    ` : ''}
    
    ${auditResults.passed.length > 0 ? `
    <h2>✅ Passed Checks</h2>
    ${auditResults.passed.map(p => `
        <div class="passed-item">
            <h4>${p.description}</h4>
            <p><strong>Category:</strong> ${p.category}</p>
        </div>
    `).join('')}
    ` : ''}
</body>
</html>`
}

// Main audit process
async function runSecurityAudit() {
  try {
    if (auditConfig.checkDependencies) {
      checkDependencyVulnerabilities()
    }
    
    if (auditConfig.checkEnvironment) {
      checkEnvironmentSecurity()
    }
    
    if (auditConfig.checkFilePermissions) {
      checkFilePermissions()
    }
    
    if (auditConfig.checkCodeVulnerabilities) {
      scanCodeVulnerabilities()
    }
    
    checkSecurityConfiguration()
    checkSecurityFiles()
    
    if (auditConfig.generateReport) {
      const exitCode = generateSecurityReport()
      process.exit(exitCode)
    }
    
  } catch (error) {
    console.error('💥 Security audit failed:', error.message)
    process.exit(1)
  }
}

// Run audit if called directly
if (require.main === module) {
  runSecurityAudit()
}

module.exports = {
  runSecurityAudit,
  auditConfig,
  auditResults
}