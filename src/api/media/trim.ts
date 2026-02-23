import express from 'express';
import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';
import { z } from 'zod';
import { CONFIG } from '../config.js';

// Set ffmpeg path
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

// Request validation schema
export const TrimRequestSchema = z.object({
  inputUrl: z.string(), // S3 URL or local path
  startTime: z.number(), // in seconds
  endTime: z.number(), // in seconds
  outputFormat: z.enum(['mp4', 'webm', 'mov']).optional().default('mp4'),
});

// Response type
export interface TrimResult {
  success: boolean;
  outputKey?: string;
  outputUrl?: string;
  duration: number;
  error?: string;
}

/**
 * POST /media/trim
 * Trim a video clip using FFmpeg
 */
export async function handleTrim(req: express.Request, res: express.Response) {
  try {
    const body = TrimRequestSchema.parse(req.body);
    const { inputUrl, startTime, endTime, outputFormat } = body;

    // Validate URL format
    try {
      new URL(inputUrl);
    } catch {
      return res.status(400).json({
        error: 'Invalid inputUrl: must be a valid URL',
      });
    }

    // Validate time bounds
    if (startTime < 0) {
      return res.status(400).json({
        error: 'startTime must be non-negative',
      });
    }

    if (endTime <= startTime) {
      return res.status(400).json({
        error: 'endTime must be greater than startTime',
      });
    }

    // Reasonable limit: 1 hour max
    if (endTime - startTime > 3600) {
      return res.status(400).json({
        error: 'Clip duration cannot exceed 1 hour',
      });
    }

    const duration = endTime - startTime;

    // Create temp file paths
    const tempDir = os.tmpdir();
    const inputExt = path.extname(new URL(inputUrl).pathname) || '.mp4';
    let inputPath = path.join(tempDir, `input-${Date.now()}${inputExt}`);
    const outputPath = path.join(tempDir, `output-${Date.now()}.${outputFormat}`);

    console.log(`[Trim] Downloading ${inputUrl} to ${inputPath}`);

    // Download input file from S3
    // For S3 URLs, we need to fetch and save locally first
    if (inputUrl.startsWith('s3://') || inputUrl.includes('amazonaws.com')) {
      // Simple approach: assume inputUrl is accessible via HTTP
      // In production, you'd use S3 client to download
      await downloadFile(inputUrl, inputPath);
    } else if (inputUrl.startsWith('http://') || inputUrl.startsWith('https://')) {
      await downloadFile(inputUrl, inputPath);
    } else {
      // Local file
      inputPath = inputUrl;
    }

    console.log(`[Trim] Trimming ${inputPath} from ${startTime}s to ${endTime}s`);

    // Run FFmpeg trim with timeout
    const FFmpeg_TIMEOUT_MS = CONFIG.timeouts.trim;

    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`FFmpeg timed out after ${FFmpeg_TIMEOUT_MS}ms`));
      }, FFmpeg_TIMEOUT_MS);

      ffmpeg(inputPath)
        .setStartTime(startTime)
        .setDuration(duration)
        .output(outputPath)
        .on('end', () => {
          clearTimeout(timeout);
          resolve();
        })
        .on('error', (err) => {
          clearTimeout(timeout);
          reject(err);
        })
        .run();
    });

    console.log(`[Trim] Upload to S3: ${outputPath}`);

    // Upload result to S3
    const outputKey = `clips/${Date.now()}-trimmed.${outputFormat}`;
    const outputUrl = await uploadToS3(outputPath, outputKey, `video/${outputFormat}`);

    // Cleanup temp files (except if input was local)
    try {
      if (inputUrl.startsWith('http')) {
        await fs.unlink(inputPath);
      }
      await fs.unlink(outputPath);
    } catch {
      // Ignore cleanup errors
    }

    res.json({
      success: true,
      outputKey,
      outputUrl,
      duration,
    });
  } catch (error) {
    console.error('Trim error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Helper: Download file from URL to local path
 */
async function downloadFile(url: string, destPath: string): Promise<void> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download: ${response.status} ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  await fs.writeFile(destPath, Buffer.from(arrayBuffer));
}

/**
 * Helper: Upload local file to S3
 */
async function uploadToS3(localPath: string, key: string, contentType: string): Promise<string> {
  const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
  const { Upload } = await import('@aws-sdk/lib-storage');
  const fs = await import('fs');

  const s3Client = new S3Client({ region: CONFIG.aws.region });

  const fileBuffer = fs.readFileSync(localPath);

  const upload = new Upload({
    client: s3Client,
    params: {
      Bucket: CONFIG.aws.bucketName,
      Key: key,
      Body: fileBuffer,
      ContentType: contentType,
    },
  });

  await upload.done();

  return `https://${CONFIG.aws.bucketName}.s3.${CONFIG.aws.region}.amazonaws.com/${key}`;
}
