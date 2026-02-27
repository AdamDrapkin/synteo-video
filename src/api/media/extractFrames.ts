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
export const ExtractFramesRequestSchema = z.object({
  videoUrl: z.string(), // S3 URL or local path
  // If not provided, interval is calculated automatically based on duration:
  // 0-10 min: 1s intervals
  // 10-20 min: 2s intervals
  // 20-60 min: 3s intervals
  intervalSeconds: z.number().min(1).max(30).optional(),
  maxFrames: z.number().min(1).max(300).optional().default(300), // Allow up to 300 frames (increased for 1s intervals)
  outputFormat: z.enum(['jpg', 'png']).optional().default('jpg'),
});

// Max video duration for vision processing (60 minutes)
const MAX_VISION_DURATION_SECONDS = 60 * 60; // 3600 seconds

/**
 * Calculate optimal interval based on video duration
 * 0-10 min: 1s intervals
 * 10-20 min: 2s intervals
 * 20-60 min: 3s intervals
 */
function calculateOptimalInterval(durationSeconds: number): number {
  if (durationSeconds <= 600) { // 0-10 min
    return 1;
  } else if (durationSeconds <= 1200) { // 10-20 min
    return 2;
  } else { // 20-60 min
    return 3;
  }
}

// Response type
export interface ExtractFramesResult {
  success: boolean;
  frames: string[]; // Array of S3 URLs for each frame
  frameCount: number;
  intervalSeconds: number;
  error?: string;
}

/**
 * POST /media/extract-frames
 * Extract frames from video at specified intervals using FFmpeg
 * Used for Gemini Vision analysis - extracts multiple frames for video understanding
 */
export async function handleExtractFrames(req: express.Request, res: express.Response) {
  try {
    const body = ExtractFramesRequestSchema.parse(req.body);
    const { videoUrl, intervalSeconds: userInterval, maxFrames, outputFormat } = body;

    console.log(`[ExtractFrames] Starting extraction from ${videoUrl}`);
    console.log(`[ExtractFrames] Max frames: ${maxFrames}`);

    // Validate URL format
    try {
      new URL(videoUrl);
    } catch {
      return res.status(400).json({
        error: 'Invalid videoUrl: must be a valid URL',
      });
    }

    // Create temp directory
    const tempDir = path.join(os.tmpdir(), `frames-${Date.now()}`);
    await fs.mkdir(tempDir, { recursive: true });

    const inputExt = path.extname(new URL(videoUrl).pathname) || '.mp4';
    const inputPath = path.join(tempDir, `input${inputExt}`);

    console.log(`[ExtractFrames] Downloading ${videoUrl} to ${inputPath}`);

    // Download input file from S3/HTTP
    await downloadFile(videoUrl, inputPath);

    // Get video duration first
    const duration = await getVideoDuration(inputPath);
    console.log(`[ExtractFrames] Video duration: ${duration}s`);

    // Validate video duration
    if (duration > MAX_VISION_DURATION_SECONDS) {
      return res.status(400).json({
        error: `Video too long for vision processing. Maximum duration is ${MAX_VISION_DURATION_SECONDS / 60} minutes, got ${(duration / 60).toFixed(1)} minutes`,
      });
    }

    // Calculate optimal interval if not provided
    const intervalSeconds = userInterval || calculateOptimalInterval(duration);
    console.log(`[ExtractFrames] Using interval: ${intervalSeconds}s (auto-calculated based on duration)`);

    // Calculate actual number of frames to extract
    const actualFrameCount = Math.min(Math.floor(duration / intervalSeconds), maxFrames);
    console.log(`[ExtractFrames] Will extract ${actualFrameCount} frames`);

    // Extract frames using FFmpeg
    const framePattern = path.join(tempDir, `frame_%04d.${outputFormat}`);
    const framesDir = path.join(tempDir, 'frames');
    await fs.mkdir(framesDir, { recursive: true });

    // Extract one frame every N seconds
    await new Promise<void>((resolve, reject) => {
      const timeout = 600000; // 10 minute timeout for 20min video processing

      const cmd = ffmpeg(inputPath)
        .outputOptions([
          `-vf`, `fps=1/${intervalSeconds}`,
          `-frames:v`, `${actualFrameCount}`,
          `-q:v`, '2', // High quality JPEG
        ])
        .output(framePattern)
        .on('progress', (progress) => {
          if (progress.percent) {
            console.log(`[ExtractFrames] Progress: ${progress.percent.toFixed(1)}%`);
          }
        })
        .on('end', () => {
          console.log('[ExtractFrames] Frame extraction complete');
          resolve();
        })
        .on('error', (err) => {
          console.error('[ExtractFrames] FFmpeg error:', err.message);
          reject(err);
        });

      // Set timeout
      setTimeout(() => {
        cmd.kill('SIGTERM');
        reject(new Error('Frame extraction timed out'));
      }, timeout);

      cmd.run();
    });

    // Find all extracted frames
    const files = await fs.readdir(tempDir);
    const frameFiles = files
      .filter(f => f.startsWith('frame_') && f.endsWith(`.${outputFormat}`))
      .sort(); // Sort to ensure correct order

    console.log(`[ExtractFrames] Found ${frameFiles.length} frame files`);

    // Upload frames to S3
    const frameUrls: string[] = [];
    for (const frameFile of frameFiles) {
      const framePath = path.join(tempDir, frameFile);
      const frameKey = `frames/${Date.now()}-${frameFile}`;
      const frameUrl = await uploadToS3(framePath, frameKey, `image/${outputFormat}`);
      frameUrls.push(frameUrl);
      console.log(`[ExtractFrames] Uploaded: ${frameUrl}`);
    }

    // Cleanup temp files
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }

    console.log(`[ExtractFrames] Complete! Extracted ${frameUrls.length} frames`);

    res.json({
      success: true,
      frames: frameUrls,
      frameCount: frameUrls.length,
      intervalSeconds,
      duration,
    });
  } catch (error) {
    console.error('ExtractFrames error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Helper: Get video duration using FFprobe
 */
async function getVideoDuration(inputPath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(inputPath, (err, metadata) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(metadata.format.duration || 0);
    });
  });
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
