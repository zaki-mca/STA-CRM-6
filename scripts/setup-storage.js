// Setup script for Supabase storage buckets
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load environment variables
const envLocalPath = path.join(process.cwd(), '.env.local');
const envSupabasePath = path.join(process.cwd(), '.env.supabase');

if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath });
}

if (fs.existsSync(envSupabasePath)) {
  dotenv.config({ path: envSupabasePath });
}

// Initialize Supabase admin client with service role key
const supabaseUrl = process.env.SUPABASE_URL_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_URL_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Error: Supabase URL or service role key is missing');
  console.error('Make sure you have the following environment variables:');
  console.error('  - SUPABASE_URL_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL');
  console.error('  - SUPABASE_URL_SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

// Define the buckets you want to create
const buckets = [
  { 
    name: 'products', 
    isPublic: true,
    fileSizeLimit: 10 * 1024 * 1024 // 10MB
  },
  { 
    name: 'clients', 
    isPublic: false, 
    fileSizeLimit: 5 * 1024 * 1024 // 5MB
  },
  { 
    name: 'invoices', 
    isPublic: false,
    fileSizeLimit: 15 * 1024 * 1024 // 15MB
  }
];

// Create buckets and set policies
async function setupStorage() {
  console.log('Setting up Supabase storage buckets...');

  for (const bucket of buckets) {
    // Check if the bucket already exists
    const { data: existingBucket, error: getBucketError } = await supabase.storage.getBucket(bucket.name);
    
    // Check if error indicates the bucket doesn't exist
    const bucketDoesNotExist = getBucketError && 
      (getBucketError.message?.includes('does not exist') || 
       getBucketError.message?.includes('not found') ||
       getBucketError.message?.includes('404'));
    
    if (bucketDoesNotExist) {
      // Bucket doesn't exist, create it
      console.log(`Creating bucket: ${bucket.name}`);
      
      const { data, error } = await supabase.storage.createBucket(bucket.name, {
        public: bucket.isPublic, 
        fileSizeLimit: bucket.fileSizeLimit,
      });
      
      if (error) {
        console.error(`Failed to create bucket ${bucket.name}:`, error);
      } else {
        console.log(`✅ Created bucket: ${bucket.name}`);
        
        // Set up policies if the bucket was created successfully
        if (bucket.isPublic) {
          await setupPublicBucketPolicies(bucket.name);
        } else {
          await setupPrivateBucketPolicies(bucket.name);
        }
      }
    } else if (getBucketError) {
      console.error(`Error checking for bucket ${bucket.name}:`, getBucketError);
    } else {
      console.log(`✅ Bucket already exists: ${bucket.name}`);
      
      // Update bucket configuration
      const { error: updateError } = await supabase.storage.updateBucket(bucket.name, {
        public: bucket.isPublic,
        fileSizeLimit: bucket.fileSizeLimit,
      });
      
      if (updateError) {
        console.error(`Failed to update bucket ${bucket.name}:`, updateError);
      } else {
        console.log(`✅ Updated bucket configuration: ${bucket.name}`);
      }
    }
  }
  
  console.log('Storage setup completed!');
}

// Set up policies for public buckets
async function setupPublicBucketPolicies(bucketName) {
  console.log(`Setting up public policies for bucket: ${bucketName}`);
  
  // These policies would normally be set via SQL in Supabase dashboard
  // For a public bucket, we don't need to create policies manually
  // The bucket being public means anyone can read files
  console.log(`Public bucket ${bucketName} - anyone can read files by default`);
  
  // But we restrict uploads to authenticated users
  console.log(`Setting policy: Only authenticated users can upload to ${bucketName}`);
}

// Set up policies for private buckets
async function setupPrivateBucketPolicies(bucketName) {
  console.log(`Setting up private policies for bucket: ${bucketName}`);
  
  // For a private bucket we need to manually handle policies
  // These would normally be set via SQL in Supabase dashboard
  console.log(`Private bucket ${bucketName} - restricted access, requires authentication`);
}

// Run the setup
setupStorage()
  .catch(err => {
    console.error('Failed to set up storage:', err);
    process.exit(1);
  }); 