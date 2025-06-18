// This function serves as a bridge between Netlify Functions and the Express server
// It imports the API server and forwards requests to it

const path = require('path');
const serverless = require('serverless-http');

// Set up environment variables from Netlify's environment
// This ensures our server gets the correct environment configuration
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

// Import the server application from the server directory 
// Note: The server must export an express app
let api;
try {
  // We use require.resolve to ensure we can find the server index file
  const serverPath = require.resolve('../../server/src/index');
  api = require(serverPath);
} catch (err) {
  console.error('Error loading the server application:', err);
  // Return a fallback handler if the server can't be loaded
  exports.handler = async (event, context) => {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Server initialization failed',
        error: err.message 
      })
    };
  };
  return;
}

// Wrap the Express API with serverless handler
const handler = serverless(api);

// Export the handler for Netlify Functions
exports.handler = async (event, context) => {
  // Return the response from the Express app
  const result = await handler(event, context);
  return result;
}; 