#!/bin/bash

# STA-CRM Netlify Deployment Script
# This script automates the deployment process to Netlify

# Color codes for better readability
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print section header
print_header() {
  echo -e "\n${BLUE}=========================================${NC}"
  echo -e "${BLUE}  $1 ${NC}"
  echo -e "${BLUE}=========================================${NC}\n"
}

# Check if Netlify CLI is installed
if ! command -v netlify &> /dev/null; then
  print_header "Installing Netlify CLI"
  npm install -g netlify-cli
fi

# Check login status
print_header "Checking Netlify login status"
netlify status || netlify login

# Determine current branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo -e "${GREEN}Current branch:${NC} $CURRENT_BRANCH"

# Select environment
print_header "Select deployment environment"
echo -e "1) ${GREEN}Production${NC} (main branch)"
echo -e "2) ${YELLOW}Staging${NC} (staging branch)"
echo -e "3) ${BLUE}Development${NC} (development branch)"
echo -e "4) ${BLUE}Preview${NC} (current branch: $CURRENT_BRANCH)"

read -p "Select environment (1-4): " ENV_SELECTION

case $ENV_SELECTION in
  1)
    # Production deployment
    DEPLOY_ENV="production"
    BRANCH="main"
    PROD_FLAG="--prod"
    ;;
  2)
    # Staging deployment
    DEPLOY_ENV="staging"
    BRANCH="staging"
    PROD_FLAG=""
    ;;
  3)
    # Development deployment
    DEPLOY_ENV="development"
    BRANCH="development"
    PROD_FLAG=""
    ;;
  4)
    # Preview deployment
    DEPLOY_ENV="preview"
    BRANCH=$CURRENT_BRANCH
    PROD_FLAG=""
    ;;
  *)
    echo -e "${RED}Invalid selection. Exiting.${NC}"
    exit 1
    ;;
esac

# Confirmation
echo -e "\n${YELLOW}You selected:${NC} $DEPLOY_ENV environment (branch: $BRANCH)"
read -p "Continue with deployment? (y/N): " CONFIRM
if [[ $CONFIRM != "y" && $CONFIRM != "Y" ]]; then
  echo -e "${RED}Deployment cancelled.${NC}"
  exit 0
fi

# Check for uncommitted changes
if [[ -n $(git status --porcelain) ]]; then
  echo -e "${YELLOW}⚠️  You have uncommitted changes.${NC}"
  read -p "Commit changes before deployment? (Y/n): " COMMIT_CHANGES
  
  if [[ $COMMIT_CHANGES != "n" && $COMMIT_CHANGES != "N" ]]; then
    read -p "Enter commit message: " COMMIT_MSG
    git add .
    git commit -m "$COMMIT_MSG"
  else
    echo -e "${YELLOW}Proceeding without committing changes...${NC}"
  fi
fi

# Check out correct branch if needed
if [[ "$BRANCH" != "$CURRENT_BRANCH" ]]; then
  print_header "Switching to $BRANCH branch"
  git checkout $BRANCH || { echo -e "${RED}Failed to switch branch. Exiting.${NC}"; exit 1; }
fi

# Build
print_header "Building project for $DEPLOY_ENV"
npm run build || { echo -e "${RED}Build failed. Exiting.${NC}"; exit 1; }

# Deploy
print_header "Deploying to Netlify ($DEPLOY_ENV)"
if [[ "$PROD_FLAG" == "--prod" ]]; then
  netlify deploy --prod
else
  netlify deploy
fi

# Return to original branch if needed
if [[ "$BRANCH" != "$CURRENT_BRANCH" ]]; then
  print_header "Switching back to $CURRENT_BRANCH branch"
  git checkout $CURRENT_BRANCH
fi

print_header "Deployment process completed"
echo -e "${GREEN}Thank you for using the STA-CRM deployment script!${NC}" 