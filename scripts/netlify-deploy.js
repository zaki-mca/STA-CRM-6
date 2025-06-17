#!/usr/bin/env node

/**
 * Netlify Deployment Helper Script
 * 
 * This script helps with pre-deploy operations for Netlify
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Determine environment from branch
function determineEnvironment() {
  try {
    const branch = process.env.BRANCH || execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
    
    switch (branch) {
      case 'main':
        return 'production';
      case 'staging':
        return 'staging';
      case 'development':
        return 'development';
      default:
        return 'development';
    }
  } catch (error) {
    console.warn('Could not determine git branch, defaulting to development');
    return 'development';
  }
}

// Main function
async function main() {
  console.log('Running Netlify deploy script...');
  
  const environment = determineEnvironment();
  console.log(`Detected environment: ${environment}`);
  
  // Check if Supabase environment variables are set
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
  ];
  
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingVars.forEach(varName => console.error(`   - ${varName}`));
    console.error('Please add these variables in the Netlify environment settings.');
    process.exit(1);
  }
  
  console.log('✅ All required environment variables are set');
  
  // Add any other pre-deployment tasks here
  // ...
  
  console.log('✅ Deployment preparation complete!');
}

// Execute main function
main().catch(error => {
  console.error('Deployment preparation failed:', error);
  process.exit(1);
}); 