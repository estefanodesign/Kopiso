#!/usr/bin/env node

/**
 * Vercel Deployment Helper Script
 * This script helps prepare the project for Vercel deployment
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Starting Vercel deployment preparation...\n');

// Check if we're in the right directory
const packageJsonPath = path.join(process.cwd(), 'package.json');
if (!fs.existsSync(packageJsonPath)) {
  console.error('❌ Error: package.json not found. Please run this script from the project root.');
  process.exit(1);
}

// Step 1: Check Node.js version
console.log('1️⃣ Checking Node.js version...');
const nodeVersion = process.version;
console.log(`   Current Node.js version: ${nodeVersion}`);
if (parseInt(nodeVersion.slice(1)) < 18) {
  console.warn('   ⚠️  Warning: Node.js 18+ is recommended for Vercel deployment');
}

// Step 2: Install dependencies
console.log('\n2️⃣ Installing dependencies...');
try {
  execSync('npm ci', { stdio: 'inherit' });
  console.log('   ✅ Dependencies installed successfully');
} catch (error) {
  console.error('   ❌ Failed to install dependencies');
  process.exit(1);
}

// Step 3: Type checking
console.log('\n3️⃣ Running TypeScript type check...');
try {
  execSync('npm run type-check', { stdio: 'inherit' });
  console.log('   ✅ Type check passed');
} catch (error) {
  console.error('   ❌ Type check failed. Please fix TypeScript errors before deployment.');
  process.exit(1);
}

// Step 4: Linting
console.log('\n4️⃣ Running ESLint...');
try {
  execSync('npm run lint', { stdio: 'inherit' });
  console.log('   ✅ Linting passed');
} catch (error) {
  console.error('   ❌ Linting failed. Please fix linting errors before deployment.');
  process.exit(1);
}

// Step 5: Build test
console.log('\n5️⃣ Testing build process...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('   ✅ Build test successful');
} catch (error) {
  console.error('   ❌ Build failed. Please fix build errors before deployment.');
  process.exit(1);
}

// Step 6: Clean build directory for fresh deployment
console.log('\n6️⃣ Cleaning build directory...');
const nextDir = path.join(process.cwd(), '.next');
if (fs.existsSync(nextDir)) {
  fs.rmSync(nextDir, { recursive: true, force: true });
  console.log('   ✅ Build directory cleaned');
}

// Step 7: Check required files
console.log('\n7️⃣ Checking required files for Vercel...');
const requiredFiles = [
  'vercel.json',
  'next.config.mjs',
  '.env.vercel.template',
  '.env.production',
  'data/products.json',
  'data/categories.json',
  'data/users.json'
];

let allFilesExist = true;
requiredFiles.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    console.log(`   ✅ ${file}`);
  } else {
    console.log(`   ❌ ${file} - Missing!`);
    allFilesExist = false;
  }
});

if (!allFilesExist) {
  console.error('\n❌ Some required files are missing. Please ensure all files exist before deployment.');
  process.exit(1);
}

// Step 8: Git status check
console.log('\n8️⃣ Checking Git status...');
try {
  const gitStatus = execSync('git status --porcelain', { encoding: 'utf8' });
  if (gitStatus.trim()) {
    console.log('   ⚠️  You have uncommitted changes:');
    console.log(gitStatus);
    console.log('   Consider committing your changes before deployment.');
  } else {
    console.log('   ✅ Working directory clean');
  }
} catch (error) {
  console.log('   ⚠️  Git not available or not a Git repository');
}

// Step 9: Display deployment instructions
console.log('\n🎉 Project is ready for Vercel deployment!\n');
console.log('📋 Next steps:');
console.log('1. Sign up/login to Vercel: https://vercel.com');
console.log('2. Connect your Git repository to Vercel');
console.log('3. Import this project to Vercel');
console.log('4. Configure environment variables from .env.production');
console.log('5. Deploy!\n');

console.log('📝 Environment variables to add in Vercel:');
const envProductionPath = path.join(process.cwd(), '.env.production');
if (fs.existsSync(envProductionPath)) {
  const envContent = fs.readFileSync(envProductionPath, 'utf8');
  const envLines = envContent.split('\n').filter(line => 
    line.trim() && !line.startsWith('#') && line.includes('=')
  );
  
  envLines.forEach(line => {
    const [key] = line.split('=');
    console.log(`   • ${key}`);
  });
}

console.log('\n🔗 Useful links:');
console.log('• Vercel Dashboard: https://vercel.com/dashboard');
console.log('• Vercel CLI: https://vercel.com/cli');
console.log('• Deployment Guide: ./DEPLOYMENT_GUIDE.md');

console.log('\n✨ Happy deploying!');