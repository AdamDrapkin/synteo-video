import express from 'express';
import { z } from 'zod';
import { openAiWhisperApiToCaptions } from '@remotion/openai-whisper';
import { Upload } from '@aws-sdk/lib-storage';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';
import { CONFIG } from '../config.js';
import { s3Client } from './s3.js';

// Request validation schema
export const TranscribeRequestSchema = z.object({
  audioUrl: z.string(), // S3 URL or HTTP URL to audio file
  language: z.string().optional().default('en'),
  model: z.enum(['whisper-1', 'gpt-4o-transcribe']).optional().default('whisper-1'),
  openAiApiKey: z.string().optional(), // Optional: use own API key
  // For word-level timestamps (requires paid Whisper)
  wordTimestamps: z.boolean().optional().default(false),
});

// Response type
export interface TranscriptionResult {
  success: boolean;
  captions?: Array<{
    text: string;
    startMs: number;
    endMs: number;
    timestampMs: number | null;
    confidence: number | null;
  }>;
  srtContent?: string;
  outputKey?: string;
  outputUrl?: string;
  duration?: number;
  error?: string;
}

/**
 * POST /media/transcribe
 * Transcribe audio using OpenAI Whisper
 */
export async function handleTranscribe(req: express.Request, res: express.Response) {
  try {
    const body = TranscribeRequestSchema.parse(req.body);
    const { audioUrl, language, model, openAiApiKey, wordTimestamps } = body;

    // Get API key from env or request
    const apiKey = openAiApiKey || process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(400).json({
        error: 'OPENAI_API_KEY is required. Pass via env or request body.',
      });
    }

    console.log(`[Transcribe] Processing ${audioUrl} with model ${model}`);

    // Download audio file to temp location
    const tempDir = os.tmpdir();
    const ext = path.extname(new URL(audioUrl).pathname) || '.mp4';
    const tempPath = path.join(tempDir, `video-${Date.now()}${ext}`);
    const audioPath = path.join(tempDir, `audio-${Date.now()}.mp3`);

    console.log('[Transcribe] Downloading file...');
    await downloadFile(audioUrl, tempPath);
    console.log('[Transcribe] File downloaded');

    // Check file size - if > 25MB, compress with ffmpeg
    const fileStat = await fs.stat(tempPath);
    const fileSizeMB = fileStat.size / (1024 * 1024);
    console.log(`[Transcribe] File size: ${fileSizeMB.toFixed(2)} MB`);

    if (fileSizeMB > 25) {
      console.log('[Transcribe] File too large, compressing with ffmpeg...');
      const { exec } = await import('child_process');
      const util = await import('util');
      const execPromise = util.promisify(exec);

      // Extract audio and compress - reduce bitrate to meet 25MB limit
      const durationCmd = await execPromise(`ffmpeg -i "${tempPath}" 2>&1 | grep "Duration" | cut -d' ' -f4 | sed 's/,//'`);
      const duration = durationCmd.stdout.trim();

      // Calculate target bitrate to get ~20MB file: target_size_mb / duration_sec * 8
      // Target 20MB, assume max 30 min video = 1800s -> ~90kbit/s
      const targetBitrate = '96k';

      await execPromise(`ffmpeg -i "${tempPath}" -vn -acodec libmp3lame -b:a ${targetBitrate} -y "${audioPath}"`);
      console.log('[Transcribe] Compression complete');

      // Use compressed audio
      await fs.unlink(tempPath).catch(() => {}); // delete original
    } else {
      // Small file - use as-is (or convert to mp3 if needed)
      if (!ext.includes('mp3')) {
        console.log('[Transcribe] Converting to mp3...');
        const { exec } = await import('child_process');
        const util = await import('util');
        const execPromise = util.promisify(exec);
        await execPromise(`ffmpeg -i "${tempPath}" -vn -acodec libmp3lame -b:a 128k -y "${audioPath}"`);
        await fs.unlink(tempPath).catch(() => {});
      } else {
        // Already mp3, just rename
        await fs.rename(tempPath, audioPath);
      }
    }

    // Read compressed file into memory
    console.log('[Transcribe] Reading audio file...');
    const audioData = await fs.readFile(audioPath);
    console.log(`[Transcribe] Audio read, size: ${audioData.length} bytes`);

    // Cleanup temp files
    await fs.unlink(audioPath).catch(() => {});

    // Create FormData
    console.log('[Transcribe] Calling Whisper API...');
    const formData = new FormData();
    formData.append('file', new Blob([audioData]), `audio.mp3`);
    formData.append('model', model);
    formData.append('language', language);
    if (wordTimestamps) {
      formData.append('response_format', 'verbose_json');
    } else {
      formData.append('response_format', 'json');
    }

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body: formData as any,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Whisper API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json() as any;

    // Convert to caption format using Remotion's helper
    const captionResult = openAiWhisperApiToCaptions({ transcription: result });
    const captions = captionResult.captions;

    // Generate SRT content
    const srtContent = generateSRT(captions);

    // Upload SRT to S3
    const outputKey = `captions/${Date.now()}-captions.srt`;

    const upload = new Upload({
      client: s3Client,
      params: {
        Bucket: CONFIG.aws.bucketName,
        Key: outputKey,
        Body: srtContent,
        ContentType: 'text/srt',
      },
    });

    await upload.done();

    const outputUrl = `https://${CONFIG.aws.bucketName}.s3.${CONFIG.aws.region}.amazonaws.com/${outputKey}`;

    // Cleanup temp file
    await fs.unlink(tempPath).catch(() => {});

    // Calculate duration from last caption
    const duration = captions.length > 0
      ? captions[captions.length - 1].endMs / 1000
      : 0;

    res.json({
      success: true,
      captions,
      srtContent,
      outputKey,
      outputUrl,
      duration,
    });
  } catch (error) {
    console.error('Transcribe error:', error);
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
 * Generate SRT format from captions
 */
function generateSRT(captions: Array<{ text: string; startMs: number; endMs: number }>): string {
  return captions.map((caption, index) => {
    const start = formatSRTTime(caption.startMs);
    const end = formatSRTTime(caption.endMs);
    return `${index + 1}\n${start} --> ${end}\n${caption.text}\n`;
  }).join('\n');
}

/**
 * Format milliseconds to SRT time format
 */
function formatSRTTime(ms: number): string {
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const milliseconds = ms % 1000;

  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)},${pad(milliseconds, 3)}`;
}

function pad(num: number, size: number = 2): string {
  return num.toString().padStart(size, '0');
}
