import { createClient } from '@supabase/supabase-js';

// Initialize the Supabase client
const supabaseUrl = process.env.SUPABASE_URL_NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_URL_NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceRoleKey = process.env.SUPABASE_URL_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase URL or anon key. Supabase client will not function properly.');
}

// Create supabase client with anonymous key (for public operations)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Create admin client with service role key (for admin operations - use with caution and only server-side)
export const supabaseAdmin = supabaseServiceRoleKey 
  ? createClient(supabaseUrl, supabaseServiceRoleKey) 
  : null;

// Create a bucket if it doesn't exist (use in server-side operations)
export async function createBucketIfNotExists(bucketName: string) {
  if (!supabaseAdmin) {
    throw new Error('Admin client not initialized. Service role key missing.');
  }

  const { data, error } = await supabaseAdmin.storage.getBucket(bucketName);
  
  if (error && error.statusCode === 404) {
    // Bucket doesn't exist, create it
    return supabaseAdmin.storage.createBucket(bucketName, {
      public: false, // Set to true if you want public access by default
      fileSizeLimit: 1024 * 1024 * 10, // 10MB
    });
  }
  
  return { data, error };
}

// Utility function to get a public URL for a file
export function getPublicUrl(bucket: string, filePath: string) {
  const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
  return data.publicUrl;
}

// Upload file helper
export async function uploadFile(
  bucket: string, 
  filePath: string, 
  file: File | Blob | ArrayBuffer | Buffer
) {
  const { data, error } = await supabase.storage.from(bucket).upload(filePath, file, {
    cacheControl: '3600',
    upsert: true,
  });
  
  if (error) throw error;
  return data;
}

export default supabase; 