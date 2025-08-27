# NPM Install Fix Script for Kopiso E-commerce Platform
# Run this script in PowerShell as Administrator

Write-Host "🔧 Starting NPM Install Fix Process..." -ForegroundColor Green

# Set execution policy if needed
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force

# Navigate to project directory
Set-Location "d:\Toko Online Souvia\Kopiso"

Write-Host "📂 Current directory: $(Get-Location)" -ForegroundColor Yellow

# Check Node.js and npm versions
Write-Host "🔍 Checking Node.js and npm versions..." -ForegroundColor Blue
try {
    $nodeVersion = node --version
    $npmVersion = npm --version
    Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
    Write-Host "✅ npm version: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js or npm not found. Please install Node.js v18+ from https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# Clean npm cache
Write-Host "🧹 Cleaning npm cache..." -ForegroundColor Blue
npm cache clean --force

# Remove existing node_modules and lock file
Write-Host "🗑️ Removing existing installations..." -ForegroundColor Blue
if (Test-Path "node_modules") {
    Remove-Item -Recurse -Force "node_modules" -ErrorAction SilentlyContinue
    Write-Host "✅ Removed node_modules" -ForegroundColor Green
}

if (Test-Path "package-lock.json") {
    Remove-Item "package-lock.json" -ErrorAction SilentlyContinue
    Write-Host "✅ Removed package-lock.json" -ForegroundColor Green
}

# Try different installation methods
Write-Host "📦 Attempting installation methods..." -ForegroundColor Blue

$installMethods = @(
    @{Name="Standard Install"; Command="npm install"},
    @{Name="Legacy Peer Deps"; Command="npm install --legacy-peer-deps"},
    @{Name="Force Install"; Command="npm install --force"},
    @{Name="No Optional"; Command="npm install --no-optional"}
)

foreach ($method in $installMethods) {
    Write-Host "🔄 Trying: $($method.Name)" -ForegroundColor Cyan
    try {
        Invoke-Expression $method.Command
        if (Test-Path "node_modules") {
            Write-Host "✅ Success with: $($method.Name)" -ForegroundColor Green
            break
        }
    } catch {
        Write-Host "❌ Failed: $($method.Name)" -ForegroundColor Red
        continue
    }
}

# Verify installation
if (Test-Path "node_modules") {
    Write-Host "🎉 Installation completed successfully!" -ForegroundColor Green
    
    # Check if key packages are installed
    $keyPackages = @("next", "react", "express", "typescript")
    foreach ($package in $keyPackages) {
        if (Test-Path "node_modules\$package") {
            Write-Host "✅ $package installed" -ForegroundColor Green
        } else {
            Write-Host "⚠️ $package missing" -ForegroundColor Yellow
        }
    }
    
    Write-Host "🚀 You can now run: npm run dev" -ForegroundColor Green
} else {
    Write-Host "❌ Installation failed. Please try manual steps:" -ForegroundColor Red
    Write-Host "1. Check Node.js version (requires v18+)" -ForegroundColor Yellow
    Write-Host "2. Run: npm config set registry https://registry.npmjs.org/" -ForegroundColor Yellow
    Write-Host "3. Try: yarn install (as alternative)" -ForegroundColor Yellow
}

Write-Host "🏁 Script completed!" -ForegroundColor Green