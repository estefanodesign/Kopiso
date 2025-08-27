#!/usr/bin/env node

/**
 * Pre-Deployment Validation Script
 * Comprehensive checks before Vercel deployment
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 Running comprehensive pre-deployment validation...\n');

let passed = 0;
let failed = 0;
const issues = [];

function checkPassed(message) {
  console.log(`✅ ${message}`);
  passed++;
}

function checkFailed(message, issue) {
  console.log(`❌ ${message}`);
  failed++;
  if (issue) issues.push(issue);
}

function checkWarning(message) {
  console.log(`⚠️  ${message}`);
}

// 1. Project Structure Validation
console.log('📁 Checking project structure...');
const requiredFiles = [
  'package.json',
  'next.config.mjs',
  'vercel.json',
  '.env.production',
  '.env.vercel.template',
  'VERCEL_DEPLOYMENT.md',
  'src/app/page.tsx',
  'src/app/layout.tsx',
  'src/app/api/auth/login/route.ts',
  'src/app/api/products/route.ts',
  'src/app/api/categories/route.ts',
  'src/utils/dataAccess.ts',
  'data/users.json',
  'data/products.json',
  'data/categories.json'
];

requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    checkPassed(`Found: ${file}`);
  } else {
    checkFailed(`Missing: ${file}`, `Missing required file: ${file}`);
  }
});

// 2. Package.json validation
console.log('\\n📦 Checking package.json...');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  if (packageJson.name) checkPassed(`Project name: ${packageJson.name}`);
  else checkFailed('Missing project name in package.json', 'Add name field to package.json');
  
  if (packageJson.scripts?.build) checkPassed('Build script found');
  else checkFailed('Missing build script', 'Add build script to package.json');
  
  if (packageJson.scripts?.start) checkPassed('Start script found');
  else checkFailed('Missing start script', 'Add start script to package.json');
  
  // Check critical dependencies
  const requiredDeps = ['next', 'react', 'react-dom'];
  const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
  
  requiredDeps.forEach(dep => {
    if (deps[dep]) checkPassed(`Dependency: ${dep}@${deps[dep]}`);
    else checkFailed(`Missing dependency: ${dep}`, `Install ${dep}`);
  });
  
} catch (error) {
  checkFailed('Invalid package.json', 'Fix package.json syntax');
}

// 3. Vercel configuration validation
console.log('\\n⚡ Checking Vercel configuration...');
try {
  const vercelConfig = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
  
  if (vercelConfig.framework === 'nextjs') checkPassed('Framework: Next.js');
  else checkFailed('Invalid framework in vercel.json', 'Set framework to nextjs');
  
  if (vercelConfig.functions) checkPassed('Serverless functions configured');
  else checkWarning('No serverless functions configuration');
  
  if (vercelConfig.regions) checkPassed(`Regions: ${vercelConfig.regions.join(', ')}`);
  else checkWarning('No regions specified, will use default');
  
} catch (error) {
  checkFailed('Invalid vercel.json', 'Fix vercel.json syntax');
}

// 4. Environment variables validation
console.log('\\n🔐 Checking environment configuration...');
try {
  const envProd = fs.readFileSync('.env.production', 'utf8');
  const envLines = envProd.split('\\n').filter(line => 
    line.trim() && !line.startsWith('#') && line.includes('=')
  );
  
  const requiredEnvVars = [
    'NODE_ENV',
    'NEXT_PUBLIC_APP_NAME',
    'NEXT_PUBLIC_APP_URL',
    'JWT_SECRET',
    'ADMIN_EMAIL',
    'ADMIN_PASSWORD'
  ];
  
  const envVars = {};
  envLines.forEach(line => {
    const [key, value] = line.split('=');
    envVars[key] = value;
  });
  
  requiredEnvVars.forEach(varName => {
    if (envVars[varName]) {
      if (varName === 'JWT_SECRET' && envVars[varName].includes('change-this')) {
        checkWarning(`${varName} contains default value - should be changed for production`);
      } else {
        checkPassed(`Environment variable: ${varName}`);
      }
    } else {
      checkFailed(`Missing environment variable: ${varName}`, `Add ${varName} to .env.production`);
    }
  });
  
} catch (error) {
  checkFailed('Cannot read .env.production', 'Ensure .env.production exists and is readable');
}

// 5. Data files validation
console.log('\\n💾 Checking data files...');
const dataFiles = ['users.json', 'products.json', 'categories.json', 'orders.json'];

dataFiles.forEach(file => {
  const filePath = path.join('data', file);
  try {
    if (fs.existsSync(filePath)) {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      if (Array.isArray(data)) {
        checkPassed(`${file}: ${data.length} items`);
      } else {
        checkPassed(`${file}: Valid JSON object`);
      }
    } else {
      checkFailed(`Missing data file: ${file}`, `Create data/${file}`);
    }
  } catch (error) {
    checkFailed(`Invalid JSON in ${file}`, `Fix JSON syntax in data/${file}`);
  }
});

// 6. Git status validation
console.log('\\n📝 Checking Git status...');
try {
  const gitStatus = execSync('git status --porcelain', { encoding: 'utf8' });
  if (gitStatus.trim()) {
    checkWarning('Uncommitted changes detected');
    console.log('   Consider committing changes before deployment');
  } else {
    checkPassed('Working directory clean');
  }
  
  // Check if we're on a branch
  try {
    const branch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
    checkPassed(`Current branch: ${branch}`);
  } catch (error) {
    checkWarning('Could not determine current Git branch');
  }
  
} catch (error) {
  checkWarning('Git not available or not a Git repository');
}

// 7. Build test
console.log('\\n🏗️  Testing build process...');
try {
  console.log('   Running: npm run build');
  execSync('npm run build', { stdio: 'pipe' });
  checkPassed('Build completed successfully');
} catch (error) {
  checkFailed('Build failed', 'Fix build errors before deployment');
  console.log('   Build error output:');
  console.log('   ' + error.stdout?.toString().split('\\n').slice(-10).join('\\n   '));
}

// 8. TypeScript validation
console.log('\\n🔍 Running TypeScript validation...');
try {
  execSync('npm run type-check', { stdio: 'pipe' });
  checkPassed('TypeScript validation passed');
} catch (error) {
  checkFailed('TypeScript errors found', 'Fix TypeScript errors before deployment');
}

// Summary
console.log('\\n' + '='.repeat(60));
console.log('📊 VALIDATION SUMMARY');
console.log('='.repeat(60));
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`📝 Total Checks: ${passed + failed}`);

if (failed === 0) {
  console.log('\\n🎉 ALL CHECKS PASSED! Your project is ready for Vercel deployment.');
  console.log('\\n📋 Next steps:');
  console.log('1. Go to https://vercel.com and sign up/login');
  console.log('2. Click "New Project" and import your Git repository');
  console.log('3. Configure environment variables from .env.production');
  console.log('4. Deploy and test!');
} else {
  console.log('\\n⚠️  ISSUES FOUND - Please fix the following before deployment:');
  issues.forEach((issue, index) => {
    console.log(`${index + 1}. ${issue}`);
  });
}

console.log('\\n🔗 Resources:');
console.log('• Deployment Guide: ./VERCEL_DEPLOYMENT.md');
console.log('• Environment Template: ./.env.vercel.template');
console.log('• Vercel Documentation: https://vercel.com/docs');

process.exit(failed === 0 ? 0 : 1);