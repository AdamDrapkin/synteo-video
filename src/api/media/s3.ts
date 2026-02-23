import express from 'express';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { Readable } from 'stream';
import { z } from 'zod';
import { CONFIG } from '../config.js';

const s3Client = new S3Client({ region: CONFIG.aws.region });

// Allowlisted content types for uploads
const ALLOWED_CONTENT_TYPES = [
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'audio/mpeg',
  'audio/wav',
  'audio/mp3',
  'audio/webm',
  'image/jpeg',
  'image/png',
  'image/gif',
  'text/srt',
  'application/json',
];

// Request validation schemas
export const UploadRequestSchema = z.object({
  fileName: z.string(),
  contentType: z.string(),
  data: z.string(), // base64 encoded
});

export const DownloadParamsSchema = z.object({
  key: z.string(),
});

/**
 * POST /media/upload
 * Upload a file to S3
 * Accepts base64-encoded file data
 */
export async function handleUpload(req: express.Request, res: express.Response) {
  try {
    const body = UploadRequestSchema.parse(req.body);
    const { fileName, contentType, data } = body;

    // Validate content-type against allowlist
    if (!ALLOWED_CONTENT_TYPES.includes(contentType)) {
      return res.status(400).json({
        error: `Invalid content-type. Allowed: ${ALLOWED_CONTENT_TYPES.join(', ')}`,
      });
    }

    // Validate filename for path traversal
    if (fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
      return res.status(400).json({
        error: 'Invalid filename: path traversal not allowed',
      });
    }

    // Decode base64 data
    const buffer = Buffer.from(data, 'base64');

    // File size limit: 500MB max
    const MAX_FILE_SIZE = 500 * 1024 * 1024;
    if (buffer.length > MAX_FILE_SIZE) {
      return res.status(400).json({
        error: `File too large. Maximum size is 500MB, got ${(buffer.length / 1024 / 1024).toFixed(2)}MB`,
      });
    }

    // Generate unique key with timestamp
    const timestamp = Date.now();
    const key = `uploads/${timestamp}-${fileName}`;

    // Upload to S3 using multipart upload for larger files
    const upload = new Upload({
      client: s3Client,
      params: {
        Bucket: CONFIG.aws.bucketName,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      },
    });

    await upload.done();

    const s3Url = `https://${CONFIG.aws.bucketName}.s3.${CONFIG.aws.region}.amazonaws.com/${key}`;

    res.json({
      success: true,
      key,
      url: s3Url,
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * GET /media/download/:key
 * Get a signed URL or stream from S3
 */
export async function handleDownload(req: express.Request, res: express.Response) {
  try {
    let { key } = req.params;

    // Path traversal protection - reject keys with ../ or absolute paths
    if (key.includes('..') || key.startsWith('/') || key.startsWith('\\')) {
      return res.status(400).json({ error: 'Invalid key: path traversal not allowed' });
    }

    const command = new GetObjectCommand({
      Bucket: CONFIG.aws.bucketName,
      Key: key,
    });

    const response = await s3Client.send(command);

    if (!response.Body) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Set appropriate headers
    res.setHeader('Content-Type', response.ContentType || 'application/octet-stream');
    if (response.ContentDisposition) {
      res.setHeader('Content-Disposition', response.ContentDisposition);
    }

    // Stream the response
    const stream = response.Body as Readable;
    stream.pipe(res);
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * GET /media/url/:key
 * Get a presigned URL for direct access
 */
export async function handleGetUrl(req: express.Request, res: express.Response) {
  try {
    let { key } = req.params;
    const expiresInRaw = req.query.expiresIn;
    const expiresIn = expiresInRaw ? Number(expiresInRaw) : 3600;

    // Validate expiresIn
    if (isNaN(expiresIn) || expiresIn < 1 || expiresIn > 604800) {
      return res.status(400).json({
        error: 'expiresIn must be between 1 and 604800 (7 days)',
      });
    }

    // Path traversal protection
    if (key.includes('..') || key.startsWith('/') || key.startsWith('\\')) {
      return res.status(400).json({ error: 'Invalid key: path traversal not allowed' });
    }

    const command = new GetObjectCommand({
      Bucket: CONFIG.aws.bucketName,
      Key: key,
    });

    // Generate presigned URL
    const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner');
    const signedUrl = await getSignedUrl(s3Client, command, {
      expiresIn,
    });

    res.json({
      key,
      url: signedUrl,
      expiresIn,
    });
  } catch (error) {
    console.error('Get URL error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

export { s3Client };
