import { S3Client, HeadObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { envConfig } from './env-config';

/**
 * Create a new S3 client with current environment variables
 * This ensures we always use the latest credentials from .env.local
 */
function createS3Client(): S3Client {
  console.log('🔄 Creating S3 client with environment config');
  console.log('📍 AWS_ACCESS_KEY_ID:', envConfig.aws.accessKeyId);
  console.log('📍 AWS_REGION:', envConfig.aws.region);
  console.log('📍 S3_BUCKET_NAME:', envConfig.s3.bucketName);
  
  return new S3Client({
    region: envConfig.aws.region,
    credentials: {
      accessKeyId: envConfig.aws.accessKeyId,
      secretAccessKey: envConfig.aws.secretAccessKey,
    },
  });
}

/**
 * Get the bucket name from environment configuration
 */
function getBucketName(): string {
  return envConfig.s3.bucketName;
}

/**
 * Generate a unique S3 key for an image based on course and content
 */
export function generateS3Key(courseId: string, moduleIndex: number, slideIndex: number | 'cover'): string {
  // Don't add another timestamp - courseId already contains one
  if (slideIndex === 'cover') {
    return `courses/${courseId}/cover.jpg`;
  }
  return `courses/${courseId}/module-${moduleIndex}-slide-${slideIndex}.jpg`;
}

/**
 * Check if an object exists in S3
 */
export async function checkS3ObjectExists(key: string): Promise<boolean> {
  try {
    const s3Client = createS3Client();
    await s3Client.send(new HeadObjectCommand({
      Bucket: getBucketName(),
      Key: key,
    }));
    return true;
  } catch {
    return false;
  }
}

/**
 * Upload an image to S3 from a URL
 */
export async function uploadImageToS3(imageUrl: string, s3Key: string): Promise<string> {
  try {
    // Fetch the image from the URL
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    const buffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(buffer);

    // Create a fresh S3 client for this upload
    const s3Client = createS3Client();
    const bucketName = getBucketName();

    // Upload to S3
    const upload = new Upload({
      client: s3Client,
      params: {
        Bucket: bucketName,
        Key: s3Key,
        Body: uint8Array,
        ContentType: 'image/jpeg',
        // Note: ACL removed as modern S3 buckets often don't support ACLs
        // Images will use bucket policy for access control instead
      },
    });

    await upload.done();

    // Return the public URL
    const publicUrl = `https://${bucketName}.s3.${envConfig.aws.region}.amazonaws.com/${s3Key}`;
    console.log(`✅ Uploaded image to S3: ${publicUrl}`);
    
    return publicUrl;
  } catch (error) {
    console.error('❌ Failed to upload image to S3:', error);
    throw error;
  }
}

/**
 * Batch upload multiple images to S3
 */
export async function batchUploadImagesToS3(
  images: Array<{ url: string; key: string }>
): Promise<Array<{ key: string; s3Url: string }>> {
  const results = await Promise.all(
    images.map(async ({ url, key }) => {
      try {
        const s3Url = await uploadImageToS3(url, key);
        return { key, s3Url };
      } catch (error) {
        console.error(`Failed to upload image with key ${key}:`, error);
        return { key, s3Url: url }; // Fallback to original URL if upload fails
      }
    })
  );
  
  return results;
} 