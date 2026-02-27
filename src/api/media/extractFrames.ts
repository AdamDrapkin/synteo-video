import express from 'express';
import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';
import { z } from 'zod';
import { exec } from 'child_process';
import { promisify } from 'util';
import { CONFIG } from '../config.js';

const execAsync = promisify(exec);

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
  // For parallel extraction - extract a specific time range
  startSecond: z.number().min(0).optional().default(0),
  duration: z.number().min(1).max(600).optional(), // Max 10 min per chunk
});

// Max video duration for vision processing (60 minutes)
const MAX_VISION_DURATION_SECONDS = 60 * 60; // 3600 seconds

/**
 * Detect if URL is a YouTube video
 */
function isYouTubeUrl(url: string): boolean {
  const youtubePatterns = [
    /youtube\.com\/watch/,
    /youtu\.be\//,
    /youtube\.com\/shorts\//,
    /youtube\.com\/v\//,
    /youtube\.com\/embed\//,
  ];
  return youtubePatterns.some(pattern => pattern.test(url));
}

/**
 * Get direct video URL from YouTube using yt-dlp
 */
async function getYouTubeDirectUrl(youtubeUrl: string): Promise<string> {
  console.log(`[ExtractFrames] Detected YouTube URL, fetching direct video URL with yt-dlp...`);

  try {
    // Get direct video URL (best quality video + audio merged)
    const { stdout } = await execAsync(
      `yt-dlp -f "best[ext=mp4]" --get-url "${youtubeUrl}"`,
      { maxBuffer: 50 * 1024 * 1024 } // 50MB buffer
    );

    const directUrl = stdout.trim();
    if (!directUrl) {
      throw new Error('yt-dlp returned empty URL');
    }

    console.log(`[ExtractFrames] Got direct URL: ${directUrl.substring(0, 100)}...`);
    return directUrl;
  } catch (error) {
    console.error('[ExtractFrames] yt-dlp error:', error);
    throw new Error(`Failed to extract YouTube video: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Calculate optimal interval based on video duration
 * 0-10 min: 1s intervals (more detail for short videos)
 * 10-30 min: 2s intervals (balanced)
 * 30+ min: 3s intervals (fewer frames for long videos)
 */
function calculateOptimalInterval(durationSeconds: number): number {
  if (durationSeconds <= 600) { // 0-10 min
    return 1;
  } else if (durationSeconds <= 1800) { // 10-30 min
    return 2;
  } else { // 30+ min
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
    const { videoUrl, intervalSeconds: userInterval, maxFrames, outputFormat, startSecond, duration: chunkDuration } = body;

    console.log(`[ExtractFrames] Starting extraction from ${videoUrl}`);
    console.log(`[ExtractFrames] Max frames: ${maxFrames}, startSecond: ${startSecond}, chunkDuration: ${chunkDuration || 'full'}`);

    // Validate URL format
    try {
      new URL(videoUrl);
    } catch {
      return res.status(400).json({
        error: 'Invalid videoUrl: must be a valid URL',
      });
    }

    // Check if YouTube URL and get direct video URL
    let processedVideoUrl = videoUrl;
    const sourceType = isYouTubeUrl(videoUrl) ? 'youtube' : 'direct';
    if (isYouTubeUrl(videoUrl)) {
      processedVideoUrl = await getYouTubeDirectUrl(videoUrl);
    }

    // Create temp directory
    const tempDir = path.join(os.tmpdir(), `frames-${Date.now()}`);
    await fs.mkdir(tempDir, { recursive: true });

    const inputExt = path.extname(new URL(processedVideoUrl).pathname) || '.mp4';
    const inputPath = path.join(tempDir, `input${inputExt}`);

    console.log(`[ExtractFrames] Downloading ${processedVideoUrl} to ${inputPath}`);

    // Download input file from S3/HTTP (or YouTube direct URL)
    await downloadFile(processedVideoUrl, inputPath);

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

    // Determine extraction window
    const effectiveDuration = chunkDuration
      ? Math.min(chunkDuration, duration - startSecond)
      : duration - startSecond;
    console.log(`[ExtractFrames] Extracting from ${startSecond}s for ${effectiveDuration}s`);

    // Calculate actual number of frames to extract
    const actualFrameCount = Math.min(Math.floor(effectiveDuration / intervalSeconds), maxFrames);
    console.log(`[ExtractFrames] Will extract ${actualFrameCount} frames`);

    // Extract frames using FFmpeg
    const framePattern = path.join(tempDir, `frame_%04d.${outputFormat}`);
    const framesDir = path.join(tempDir, 'frames');
    await fs.mkdir(framesDir, { recursive: true });

    // Extract one frame every N seconds
    await new Promise<void>((resolve, reject) => {
      const timeout = 600000; // 10 minute timeout for 20min video processing

      const cmd = ffmpeg(inputPath)
        .setStartTime(startSecond)
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

    // Upload frames to S3 with offset for parallel extraction
    const frameUrls: string[] = [];
    const frameOffset = Math.floor(startSecond / intervalSeconds); // Frame number offset
    for (let i = 0; i < frameFiles.length; i++) {
      const frameFile = frameFiles[i];
      const framePath = path.join(tempDir, frameFile);
      const frameNumber = i + 1 + frameOffset; // Offset for chunk numbering
      const frameKey = `frames/${Date.now()}-frame_${String(frameNumber).padStart(4, '0')}.${outputFormat}`;
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
      duration: effectiveDuration,
      startSecond,
      sourceType,
      originalUrl: sourceType === 'youtube' ? videoUrl : undefined,
      chunkInfo: {
        startSecond,
        duration: effectiveDuration,
        frameOffset: Math.floor(startSecond / intervalSeconds),
      },
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
