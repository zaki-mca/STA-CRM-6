#!/usr/bin/env node
/**
 * Netlify Build Script
 * This script prepares both the Next.js application and the Express server for Netlify deployment.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const dotenv = require('dotenv');

// Load environment variables based on the deployment environment
function loadEnvironment() {
  const targetEnv = process.env.NEXT_PUBLIC_SITE_ENV || 'development';
  const envFile = `.env.${targetEnv}`;
  
  console.log(`Loading environment from ${envFile} for ${targetEnv} environment`);
  
  try {
    if (fs.existsSync(envFile)) {
      const envConfig = dotenv.parse(fs.readFileSync(envFile));
      
      // Set environment variables
      for (const key in envConfig) {
        process.env[key] = envConfig[key];
      }
      
      console.log(`Environment variables loaded from ${envFile}`);
    } else {
      console.warn(`Warning: Environment file ${envFile} not found. Using default environment variables.`);
    }
  } catch (error) {
    console.error(`Error loading environment: ${error.message}`);
  }
}

// Create Netlify functions directory if it doesn't exist
function createFunctionsDirectory() {
  const functionsDir = path.join(process.cwd(), '.netlify/functions');
  
  if (!fs.existsSync(functionsDir)) {
    console.log('Creating Netlify functions directory');
    fs.mkdirSync(functionsDir, { recursive: true });
  }
}

// Prepare server for Netlify Functions
function prepareServer() {
  console.log('Preparing server for Netlify Functions deployment');
  
  try {
    // Check if server directory exists
    const serverDir = path.join(process.cwd(), 'server');
    if (!fs.existsSync(serverDir)) {
      console.warn('Warning: Server directory not found. Skipping server preparation.');
      return;
    }
    
    // Skip TypeScript build if the flag is set
    if (process.env.SKIP_TYPESCRIPT_CHECK === 'true') {
      console.log('Skipping TypeScript checking for server code');
      // Copy server files to functions directory instead of building
      const serverSrcDir = path.join(serverDir, 'src');
      const functionsDir = path.join(process.cwd(), '.netlify/functions');
      
      // Create api.js in the functions directory that uses the JS files directly
      const apiJsContent = `
const serverless = require('serverless-http');
const { app } = require('../../server/src/index.js');

// Export the serverless handler
exports.handler = serverless(app);
      `;
      
      fs.writeFileSync(path.join(functionsDir, 'api.js'), apiJsContent);
      console.log('Created serverless handler for API without TypeScript build');
    } else {
      // Build the server TypeScript code
      console.log('Building server TypeScript code');
      execSync('npm run build', { stdio: 'inherit', cwd: serverDir });
    }
    
    console.log('Server preparation complete');
  } catch (error) {
    console.error(`Error preparing server: ${error.message}`);
    process.exit(1);
  }
}

// Build Next.js application
function buildNextApp() {
  console.log('Building Next.js application');
  
  try {
    execSync('next build', { stdio: 'inherit' });
    console.log('Next.js build complete');
  } catch (error) {
    console.error(`Error building Next.js application: ${error.message}`);
    process.exit(1);
  }
}

// Mark that this is a Netlify build
function setNetlifyBuildFlag() {
  process.env.NETLIFY = 'true';
  console.log('Set NETLIFY=true environment variable');
}

// Main build process
async function main() {
  console.log('Starting Netlify build process');
  
  // Set Netlify build flag
  setNetlifyBuildFlag();
  
  // Load appropriate environment variables
  loadEnvironment();
  
  // Create Netlify functions directory
  createFunctionsDirectory();
  
  // Prepare the server
  prepareServer();
  
  // Build Next.js application
  buildNextApp();
  
  console.log('Netlify build process completed successfully');
}

// Run the main function
main().catch(error => {
  console.error(`Build failed: ${error.message}`);
  process.exit(1);
}); 