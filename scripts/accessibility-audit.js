#!/usr/bin/env node

/**
 * Accessibility Audit Script for Kopiso E-commerce Platform
 * Checks WCAG 2.1 compliance and generates accessibility reports
 */

const fs = require('fs')
const path = require('path')

// Accessibility audit configuration
const auditConfig = {
  checkWCAG: true,
  generateReport: true,
  outputDir: 'accessibility-reports'
}

console.log('♿ Starting accessibility audit...')

// Audit results storage
const auditResults = {
  timestamp: new Date().toISOString(),
  summary: { totalChecks: 0, passed: 0, warnings: 0, errors: 0 },
  details: { passed: [], warnings: [], errors: [] }
}

// =============================================================================
// MAIN AUDIT FUNCTIONS
// =============================================================================

function checkAccessibility() {
  console.log('📋 Checking accessibility compliance...')
  
  const sourceFiles = findFilesWithExtension('src', '.tsx', '.jsx')
  
  sourceFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf8')
    const fileName = path.basename(file)
    
    // Check images for alt text
    checkImageAltText(content, fileName)
    
    // Check form labels
    checkFormLabels(content, fileName)
    
    // Check heading hierarchy
    checkHeadingHierarchy(content, fileName)
    
    // Check ARIA attributes
    checkARIAAttributes(content, fileName)
    
    // Check keyboard accessibility
    checkKeyboardAccessibility(content, fileName)
  })
}

function checkImageAltText(content, fileName) {
  const imgMatches = content.match(/<img[^>]*>/gi) || []
  
  imgMatches.forEach((img, index) => {
    if (!img.includes('alt=')) {
      addResult('errors', {
        guideline: '1.1.1 Non-text Content',
        level: 'A',
        file: fileName,
        description: `Image ${index + 1} missing alt attribute`,
        recommendation: 'Add descriptive alt text for all images'
      })
    } else {
      const altMatch = img.match(/alt="([^"]*)"/)
      if (altMatch && altMatch[1].trim() === '') {
        addResult('warnings', {
          guideline: '1.1.1 Non-text Content',
          file: fileName,
          description: `Image ${index + 1} has empty alt text`,
          recommendation: 'Use descriptive alt text or alt="" for decorative images'
        })
      } else {
        addResult('passed', {
          guideline: '1.1.1 Non-text Content',
          file: fileName,
          description: `Image ${index + 1} has alt text`
        })
      }
    }
  })
}

function checkFormLabels(content, fileName) {
  const inputs = content.match(/<input[^>]*type="(text|email|password)"[^>]*>/gi) || []
  
  inputs.forEach((input, index) => {
    const idMatch = input.match(/id="([^"]*)"/)
    if (idMatch) {
      const inputId = idMatch[1]
      const labelPattern = new RegExp(`for="${inputId}"`, 'i')
      
      if (labelPattern.test(content)) {
        addResult('passed', {
          guideline: '1.3.1 Info and Relationships',
          file: fileName,
          description: `Input ${index + 1} has associated label`
        })
      } else {
        addResult('errors', {
          guideline: '1.3.1 Info and Relationships',
          level: 'A',
          file: fileName,
          description: `Input ${index + 1} missing label`,
          recommendation: 'Associate inputs with labels using for/id attributes'
        })
      }
    } else {
      addResult('warnings', {
        guideline: '1.3.1 Info and Relationships',
        file: fileName,
        description: `Input ${index + 1} missing id attribute`,
        recommendation: 'Add id attribute to associate with label'
      })
    }
  })
}

function checkHeadingHierarchy(content, fileName) {
  const headings = content.match(/<h[1-6][^>]*>/gi) || []
  
  if (headings.length > 0) {
    const levels = headings.map(h => parseInt(h.match(/<h(\d)/)[1]))
    let hasValidHierarchy = true
    
    for (let i = 1; i < levels.length; i++) {
      if (levels[i] > levels[i - 1] + 1) {
        hasValidHierarchy = false
        break
      }
    }
    
    if (hasValidHierarchy) {
      addResult('passed', {
        guideline: '1.3.2 Meaningful Sequence',
        file: fileName,
        description: 'Heading hierarchy is logical'
      })
    } else {
      addResult('warnings', {
        guideline: '1.3.2 Meaningful Sequence',
        level: 'A',
        file: fileName,
        description: 'Heading hierarchy has gaps',
        recommendation: 'Maintain logical heading sequence (h1->h2->h3...)'
      })
    }
  }
}

function checkARIAAttributes(content, fileName) {
  // Check for aria-labelledby references
  const labelledByMatches = content.match(/aria-labelledby="([^"]*)"/gi) || []
  
  labelledByMatches.forEach(match => {
    const id = match.match(/"([^"]*)"/)[1]
    if (!content.includes(`id="${id}"`)) {
      addResult('errors', {
        guideline: '4.1.2 Name, Role, Value',
        level: 'A',
        file: fileName,
        description: `aria-labelledby references non-existent id: ${id}`,
        recommendation: 'Ensure aria-labelledby references existing element IDs'
      })
    } else {
      addResult('passed', {
        guideline: '4.1.2 Name, Role, Value',
        file: fileName,
        description: 'Valid aria-labelledby reference'
      })
    }
  })
}

function checkKeyboardAccessibility(content, fileName) {
  // Check for click handlers without keyboard handlers
  const clickOnlyElements = content.match(/<div[^>]*onClick[^>]*>/gi) || []
  
  clickOnlyElements.forEach((element, index) => {
    if (!element.includes('onKeyDown') && !element.includes('tabIndex')) {
      addResult('warnings', {
        guideline: '2.1.1 Keyboard',
        level: 'A',
        file: fileName,
        description: `Interactive div ${index + 1} may not be keyboard accessible`,
        recommendation: 'Add keyboard event handlers or use button element'
      })
    }
  })
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

function addResult(type, result) {
  auditResults.details[type].push(result)
  auditResults.summary[type]++
  auditResults.summary.totalChecks++
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

function generateAccessibilityReport() {
  console.log('📊 Generating accessibility report...')
  
  if (!fs.existsSync(auditConfig.outputDir)) {
    fs.mkdirSync(auditConfig.outputDir, { recursive: true })
  }
  
  // Calculate compliance level
  const totalErrors = auditResults.summary.errors
  let wcagCompliance = totalErrors === 0 ? 'AA' : 'FAIL'
  auditResults.summary.wcagCompliance = wcagCompliance
  
  // Generate JSON report
  const jsonReport = JSON.stringify(auditResults, null, 2)
  fs.writeFileSync(path.join(auditConfig.outputDir, 'accessibility-audit.json'), jsonReport)
  
  // Console summary
  console.log('\n♿ Accessibility Audit Summary:')
  console.log(`   WCAG Compliance: ${wcagCompliance}`)
  console.log(`   Total Checks: ${auditResults.summary.totalChecks}`)
  console.log(`   ✅ Passed: ${auditResults.summary.passed}`)
  console.log(`   ⚠️ Warnings: ${auditResults.summary.warnings}`)
  console.log(`   ❌ Errors: ${auditResults.summary.errors}`)
  
  if (auditResults.summary.errors > 0) {
    console.log('\n❌ Critical Issues:')
    auditResults.details.errors.slice(0, 5).forEach(error => {
      console.log(`   • ${error.guideline}: ${error.description}`)
    })
  }
  
  console.log(`\n📁 Report saved to: ${auditConfig.outputDir}/accessibility-audit.json`)
  
  return totalErrors > 0 ? 1 : 0
}

// =============================================================================
// MAIN EXECUTION
// =============================================================================

async function runAccessibilityAudit() {
  try {
    console.log('⏰ Accessibility audit started at:', new Date().toLocaleString())
    
    checkAccessibility()
    const exitCode = generateAccessibilityReport()
    
    console.log('⏰ Accessibility audit completed at:', new Date().toLocaleString())
    process.exit(exitCode)
    
  } catch (error) {
    console.error('💥 Accessibility audit failed:', error.message)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  runAccessibilityAudit()
}

module.exports = {
  runAccessibilityAudit,
  auditConfig,
  auditResults
}