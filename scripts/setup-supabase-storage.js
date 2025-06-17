#!/usr/bin/env node

/**
 * Supabase Storage Setup Script
 * 
 * This script helps initialize Supabase storage buckets for the STA-CRM application
 * 
 * Usage:
 * SUPABASE_URL=your-url SUPABASE_SERVICE_ROLE_KEY=your-key node setup-supabase-storage.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuration
const REQUIRED_BUCKETS = [
  'avatars',
  'product-images',
  'attachments',
  'invoice-files',
  'order-attachments',
  'client-attachments'
];

// Get Supabase URL and key from environment variables
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables must be set');
  console.error('Usage: SUPABASE_URL=your-url SUPABASE_SERVICE_ROLE_KEY=your-key node setup-supabase-storage.js');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function setupStorage() {
  console.log('Setting up Supabase storage buckets...');
  
  for (const bucketName of REQUIRED_BUCKETS) {
    try {
      // Check if bucket exists
      const { data: existingBucket, error: getBucketError } = await supabase.storage.getBucket(bucketName);
      
      if (getBucketError) {
        if (getBucketError.statusCode === 404) {
          // Bucket doesn't exist, create it
          console.log(`Creating bucket: ${bucketName}`);
          
          const { data, error } = await supabase.storage.createBucket(bucketName, {
            public: false,
            fileSizeLimit: 52428800, // 50MB
            allowedMimeTypes: ['image/*', 'application/pdf', 'text/plain']
          });
          
          if (error) {
            throw error;
          }
          
          console.log(`✅ Bucket created: ${bucketName}`);
          
          // Set bucket policy
          if (['avatars', 'product-images'].includes(bucketName)) {
            // For buckets that should have public read access
            await setBucketPublicPolicy(bucketName);
          }
        } else {
          throw getBucketError;
        }
      } else {
        console.log(`✓ Bucket already exists: ${bucketName}`);
      }
    } catch (error) {
      console.error(`Error with bucket ${bucketName}:`, error.message);
    }
  }
  
  console.log('\nStorage setup complete!');
}

async function setBucketPublicPolicy(bucketName) {
  try {
    const { error } = await supabase.storage.updateBucket(bucketName, {
      public: true
    });
    
    if (error) {
      throw error;
    }
    
    console.log(`  Set public policy for: ${bucketName}`);
  } catch (error) {
    console.error(`  Error setting public policy for ${bucketName}:`, error.message);
  }
}

// Run the setup
setupStorage().catch(err => {
  console.error('Storage setup failed:', err);
  process.exit(1);
}); 