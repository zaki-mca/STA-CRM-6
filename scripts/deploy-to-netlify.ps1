# STA-CRM Netlify Deployment Script for Windows
# This script automates the deployment process to Netlify

# Color codes for better readability
$Red = 'Red'
$Green = 'Green'
$Yellow = 'Yellow'
$Blue = 'Cyan'

# Print section header
function Print-Header {
    param($Text)
    Write-Host "`n==========================================" -ForegroundColor $Blue
    Write-Host "  $Text" -ForegroundColor $Blue
    Write-Host "==========================================`n" -ForegroundColor $Blue
}

# Check if Netlify CLI is installed
if (-not (Get-Command netlify -ErrorAction SilentlyContinue)) {
    Print-Header "Installing Netlify CLI"
    npm install -g netlify-cli
}

# Check login status
Print-Header "Checking Netlify login status"
try {
    netlify status
}
catch {
    netlify login
}

# Determine current branch
$currentBranch = git rev-parse --abbrev-ref HEAD
Write-Host "Current branch: $currentBranch" -ForegroundColor $Green

# Select environment
Print-Header "Select deployment environment"
Write-Host "1) Production (main branch)" -ForegroundColor $Green
Write-Host "2) Staging (staging branch)" -ForegroundColor $Yellow
Write-Host "3) Development (development branch)" -ForegroundColor $Blue
Write-Host "4) Preview (current branch: $currentBranch)" -ForegroundColor $Blue

$envSelection = Read-Host "Select environment (1-4)"

switch ($envSelection) {
    1 {
        # Production deployment
        $deployEnv = "production"
        $branch = "main"
        $prodFlag = "--prod"
    }
    2 {
        # Staging deployment
        $deployEnv = "staging"
        $branch = "staging"
        $prodFlag = ""
    }
    3 {
        # Development deployment
        $deployEnv = "development"
        $branch = "development"
        $prodFlag = ""
    }
    4 {
        # Preview deployment
        $deployEnv = "preview"
        $branch = $currentBranch
        $prodFlag = ""
    }
    default {
        Write-Host "Invalid selection. Exiting." -ForegroundColor $Red
        exit 1
    }
}

# Confirmation
Write-Host "`nYou selected: $deployEnv environment (branch: $branch)" -ForegroundColor $Yellow
$confirm = Read-Host "Continue with deployment? (y/N)"
if ($confirm -ne "y" -and $confirm -ne "Y") {
    Write-Host "Deployment cancelled." -ForegroundColor $Red
    exit 0
}

# Check for uncommitted changes
$gitStatus = git status --porcelain
if ($gitStatus) {
    Write-Host "⚠️  You have uncommitted changes." -ForegroundColor $Yellow
    $commitChanges = Read-Host "Commit changes before deployment? (Y/n)"
    
    if ($commitChanges -ne "n" -and $commitChanges -ne "N") {
        $commitMsg = Read-Host "Enter commit message"
        git add .
        git commit -m "$commitMsg"
    }
    else {
        Write-Host "Proceeding without committing changes..." -ForegroundColor $Yellow
    }
}

# Check out correct branch if needed
if ($branch -ne $currentBranch) {
    Print-Header "Switching to $branch branch"
    git checkout $branch
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to switch branch. Exiting." -ForegroundColor $Red
        exit 1
    }
}

# Build
Print-Header "Building project for $deployEnv"
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed. Exiting." -ForegroundColor $Red
    exit 1
}

# Deploy
Print-Header "Deploying to Netlify ($deployEnv)"
if ($prodFlag -eq "--prod") {
    netlify deploy --prod
}
else {
    netlify deploy
}

# Return to original branch if needed
if ($branch -ne $currentBranch) {
    Print-Header "Switching back to $currentBranch branch"
    git checkout $currentBranch
}

Print-Header "Deployment process completed"
Write-Host "Thank you for using the STA-CRM deployment script!" -ForegroundColor $Green 