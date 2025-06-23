// Centralized environment configuration
// This ensures we always get the correct environment variables

import { config } from 'dotenv';
import path from 'path';

console.log('\n🔐 ===========================================');
console.log('🔐 LOADING ENVIRONMENT CONFIGURATION');
console.log('🔐 ===========================================');

// Force load from .env.local
const result = config({ 
  path: path.join(process.cwd(), '.env.local'),
  override: true // This will override any existing env vars
});

if (result.error) {
  console.error('❌ Failed to load .env.local:', result.error);
} else {
  console.log('✅ Successfully loaded .env.local');
}

// Export validated environment variables
export const envConfig = {
  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    region: process.env.AWS_REGION || 'us-east-1',
  },
  s3: {
    bucketName: process.env.S3_BUCKET_NAME || '',
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
  },
  app: {
    skipImageGeneration: process.env.SKIP_IMAGE_GENERATION === 'true',
  }
};

// Log which credentials are loaded (for debugging)
console.log('\n📍 Environment Variables Loaded:');
console.log('   AWS Access Key ID:', envConfig.aws.accessKeyId);
console.log('   AWS Region:', envConfig.aws.region);
console.log('   S3 Bucket:', envConfig.s3.bucketName);
console.log('   OpenAI API Key:', envConfig.openai.apiKey ? '***' + envConfig.openai.apiKey.slice(-4) : 'NOT SET');

// Verify correct credentials
if (envConfig.aws.accessKeyId === 'AKIAZIFSNMIU6CGT6GCQ') {
  console.log('\n✅ CORRECT AWS CREDENTIALS LOADED!');
} else if (envConfig.aws.accessKeyId === 'AKIAXZ2C4CSS3S3XKLU2') {
  console.log('\n❌ ERROR: OLD AWS CREDENTIALS DETECTED!');
} else {
  console.log('\n⚠️  Unknown AWS credentials:', envConfig.aws.accessKeyId);
}

console.log('🔐 ===========================================\n'); 