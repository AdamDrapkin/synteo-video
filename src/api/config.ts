// Centralized configuration for Synteo Video API
// All environment-specific values should be set via env vars

// AWS region type for strict typing
type AwsRegion = 'us-east-1' | 'af-south-1' | 'ap-east-1' | 'ap-northeast-1' | 'ap-northeast-2' | 'ap-northeast-3' | 'ap-south-1' | 'ap-southeast-1' | 'ap-southeast-2' | 'ap-southeast-4' | 'ca-central-1' | 'eu-central-1' | 'eu-central-2' | 'eu-north-1' | 'eu-south-1' | 'eu-west-1' | 'eu-west-2' | 'eu-west-3' | 'me-south-1' | 'sa-east-1';

const DEFAULT_REGION: AwsRegion = 'us-east-1';

export const CONFIG = {
  // AWS
  aws: {
    region: (process.env.AWS_REGION || DEFAULT_REGION) as AwsRegion,
    lambdaFunctionName: process.env.LAMBDA_FUNCTION || 'remotion-render-4-0-427-mem2048mb-disk2048mb-120sec',
    serveUrl: process.env.SERVE_URL || 'https://remotionLambda-useast1-7nig21l89j.s3.us-east-1.amazonaws.com/sites/mkw9luttk2',
    bucketName: process.env.S3_BUCKET || 'remotionlambda-useast1-7nig21l89j',
    musicBucketName: process.env.MUSIC_S3_BUCKET || 'synteo-music-library',
  },

  // API
  api: {
    baseUrl: process.env.API_BASE_URL || 'http://localhost:3000',
    port: parseInt(process.env.PORT || '3000', 10),
    maxUploadSize: process.env.MAX_UPLOAD_SIZE || '50mb',
  },

  // Webhook
  webhook: {
    secret: process.env.WEBHOOK_SECRET || 'change-me-in-production',
  },

  // N8N
  n8n: {
    baseUrl: process.env.N8N_BASE_URL || 'http://localhost:5678',
  },

  // Slack
  slack: {
    botToken: process.env.SLACK_BOT_TOKEN || '',
    channelId: process.env.SLACK_CHANNEL_ID || '',
    signingSecret: process.env.SLACK_SIGNING_SECRET || '',
  },

  // Airtable
  airtable: {
    apiKey: process.env.AIRTABLE_API_KEY || '',
    baseId: process.env.AIRTABLE_BASE_ID || 'apprfl6zJJVMW2FDi',
  },

  // Timeouts (ms)
  timeouts: {
    default: 30000,
    upload: 120000,
    trim: 300000, // 5 min for video processing
    transcribe: 180000, // 3 min for transcription
  },
} as const;

export type Config = typeof CONFIG;
