import { S3Client, HeadObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || '';

/**
 * Generate a unique S3 key for an image based on course and content
 */
export function generateS3Key(courseId: string, moduleIndex: number, slideIndex: number | 'cover'): string {
  const timestamp = Date.now();
  if (slideIndex === 'cover') {
    return `courses/${courseId}/cover-${timestamp}.jpg`;
  }
  return `courses/${courseId}/module-${moduleIndex}-slide-${slideIndex}-${timestamp}.jpg`;
}

/**
 * Check if an object exists in S3
 */
export async function checkS3ObjectExists(key: string): Promise<boolean> {
  try {
    await s3Client.send(new HeadObjectCommand({
      Bucket: BUCKET_NAME,
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

    // Upload to S3
    const upload = new Upload({
      client: s3Client,
      params: {
        Bucket: BUCKET_NAME,
        Key: s3Key,
        Body: uint8Array,
        ContentType: 'image/jpeg',
        // Note: ACL removed as modern S3 buckets often don't support ACLs
        // Images will use bucket policy for access control instead
      },
    });

    await upload.done();

    // Return the public URL
    const publicUrl = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${s3Key}`;
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