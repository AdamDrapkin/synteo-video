import express from 'express';
import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';
import { z } from 'zod';
import { exec } from 'child_process';
import { promisify } from 'util';
import crypto from 'crypto';

const execAsync = promisify(exec);

// Set ffmpeg path
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

// Audio cache directory
const AUDIO_CACHE_DIR = path.join(os.tmpdir(), 'synteo-audio-cache');

// Ensure cache directory exists
await fs.mkdir(AUDIO_CACHE_DIR, { recursive: true });

/**
 * Generate a cache key (hash) from video URL
 */
function getAudioCacheKey(videoUrl: string): string {
  return crypto.createHash('md5').update(videoUrl).digest('hex');
}

/**
 * Extract audio from video URL
 */
async function extractAudioFromUrl(videoUrl: string): Promise<string> {
  const cacheKey = getAudioCacheKey(videoUrl);
  const audioPath = path.join(AUDIO_CACHE_DIR, `${cacheKey}.mp3`);

  // Check if already extracted
  try {
    await fs.access(audioPath);
    console.log(`[ExtractAudio] Using cached audio: ${audioPath}`);
    return audioPath;
  } catch {
    // Not cached, extract it
  }

  console.log(`[ExtractAudio] Extracting audio from: ${videoUrl}`);

  // Use ffmpeg to extract audio
  const command = `ffmpeg -i "${videoUrl}" -vn -acodec mp3 -ab 192k -y "${audioPath}"`;

  await execAsync(command);

  console.log(`[ExtractAudio] Audio extracted to: ${audioPath}`);
  return audioPath;
}

/**
 * Get audio duration using ffprobe
 */
async function getAudioDuration(audioPath: string): Promise<number> {
  const { stdout } = await execAsync(
    `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${audioPath}"`
  );
  return parseFloat(stdout.trim());
}

export const ExtractAudioRequestSchema = z.object({
  videoUrl: z.string().url(),
  startSecond: z.number().optional(),
  duration: z.number().optional(),
});

type ExtractAudioRequest = z.infer<typeof ExtractAudioRequestSchema>;

/**
 * Handle extract-audio request
 */
export async function handleExtractAudio(req: express.Request, res: express.Response) {
  try {
    const body = req.body as ExtractAudioRequest;

    // Validate request
    const parsed = ExtractAudioRequestSchema.safeParse(body);
    if (!parsed.success) {
      res.status(400).json({
        error: 'Invalid request',
        details: parsed.error.issues
      });
      return;
    }

    const { videoUrl, startSecond, duration } = parsed.data;

    // Generate cache key including segment params
    const cacheKey = getAudioCacheKey(videoUrl + (startSecond ? `_${startSecond}_${duration}` : ''));
    const audioPath = path.join(AUDIO_CACHE_DIR, `${cacheKey}.mp3`);

    // Check if already extracted
    let audioFilePath: string;
    try {
      await fs.access(audioPath);
      audioFilePath = audioPath;
      console.log(`[ExtractAudio] Using cached audio: ${audioPath}`);
    } catch {
      // Extract full audio first if no segment params
      if (startSecond === undefined || duration === undefined) {
        audioFilePath = await extractAudioFromUrl(videoUrl);
      } else {
        // Extract specific segment
        console.log(`[ExtractAudio] Extracting segment: ${startSecond}s for ${duration}s`);
        const command = `ffmpeg -i "${videoUrl}" -vn -acodec mp3 -ab 192k -ss ${startSecond} -t ${duration} -y "${audioPath}"`;
        await execAsync(command);
        audioFilePath = audioPath;
      }
    }

    // Get duration
    const audioDuration = await getAudioDuration(audioFilePath);

    // Read audio file and return as base64 or stream URL
    const audioBuffer = await fs.readFile(audioFilePath);
    const audioBase64 = audioBuffer.toString('base64');
    const audioDataUrl = `data:audio/mp3;base64,${audioBase64}`;

    res.json({
      success: true,
      audioUrl: audioDataUrl,
      audioPath: audioFilePath,
      duration: audioDuration,
      cacheKey,
    });

  } catch (error) {
    console.error('[ExtractAudio] Error:', error);
    res.status(500).json({
      error: 'Failed to extract audio',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}
