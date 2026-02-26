// Music library API handlers
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getActiveMusicTracks, getMusicLibraryForPrompt } from '../airtable.js';
import { CONFIG } from '../config.js';
import { z } from 'zod';

// S3 client for music bucket
const musicS3Client = new S3Client({ region: CONFIG.aws.region });

// Music bucket name (use same bucket or separate)
const MUSIC_BUCKET = process.env.MUSIC_S3_BUCKET || 'synteo-music-library';

// Request schemas
export const ListMusicRequestSchema = z.object({
  category: z.string().optional(),
  mood: z.string().optional(),
});

export const MixAudioRequestSchema = z.object({
  videoUrl: z.string().url(),
  musicFileName: z.string(),
  musicVolume: z.number().min(0).max(1).default(0.2),
  outputFormat: z.enum(['mp4', 'webm']).default('mp4'),
});

// ============================================
// GET /media/list-music
// ============================================

export async function handleListMusic(req: any, res: any) {
  try {
    const { category, mood } = ListMusicRequestSchema.parse(req.query);

    // Try to get from Airtable first
    let tracks = await getActiveMusicTracks();

    // If Airtable is empty or not configured, use default library
    if (tracks.length === 0) {
      tracks = getMusicLibraryForPrompt().map((t, i) => ({
        id: `default-${i}`,
        fields: {
          'File Name': t.fileName,
          Category: t.category as any,
          Mood: t.mood as any,
          Description: t.description,
        },
      }));
    }

    // Filter by category if provided
    if (category) {
      tracks = tracks.filter((t) => t.fields.Category === category);
    }

    // Filter by mood if provided
    if (mood) {
      tracks = tracks.filter((t) => t.fields.Mood === mood);
    }

    // Return simplified list
    const musicList = tracks.map((track) => ({
      fileName: track.fields['File Name'],
      category: track.fields.Category,
      mood: track.fields.Mood,
      description: track.fields.Description,
      bpm: track.fields.BPM,
      duration: track.fields.Duration,
    }));

    res.json({
      music: musicList,
      count: musicList.length,
    });
  } catch (error) {
    console.error('[Music] Failed to list music:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to list music',
    });
  }
}

// ============================================
// GET /media/music/:fileName
// ============================================

export async function handleGetMusicStream(req: any, res: any) {
  try {
    const { fileName } = req.params;

    if (!fileName || fileName.includes('..') || fileName.includes('/')) {
      return res.status(400).json({ error: 'Invalid file name' });
    }

    // Generate presigned URL for streaming
    const command = new GetObjectCommand({
      Bucket: MUSIC_BUCKET,
      Key: fileName,
    });

    const signedUrl = await getSignedUrl(musicS3Client, command, { expiresIn: 3600 });

    // Redirect to the signed URL
    res.redirect(signedUrl);
  } catch (error) {
    console.error('[Music] Failed to get music stream:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to get music',
    });
  }
}

// ============================================
// POST /media/mix-audio
// ============================================

export async function handleMixAudio(req: any, res: any) {
  try {
    const { videoUrl, musicFileName, musicVolume = 0.2, outputFormat = 'mp4' } =
      MixAudioRequestSchema.parse(req.body);

    console.log(`[Audio Mix] Mixing ${musicFileName} at ${musicVolume * 100}% volume`);

    // This is a placeholder for actual FFmpeg audio mixing
    // In production, this would:
    // 1. Download video from videoUrl
    // 2. Download music from S3 (musicFileName)
    // 3. Mix audio tracks with FFmpeg
    // 4. Upload mixed video to S3
    // 5. Return the mixed video URL

    // For now, return a placeholder response
    // The actual implementation would use fluent-ffmpeg

    res.json({
      status: 'not_implemented',
      message: 'Audio mixing endpoint requires FFmpeg implementation',
      input: {
        videoUrl,
        musicFileName,
        musicVolume,
        outputFormat,
      },
      note: 'This endpoint will be implemented in Sprint 9',
    });
  } catch (error) {
    console.error('[Audio Mix] Failed to mix audio:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to mix audio',
    });
  }
}

// ============================================
// GET /media/music-library
// ============================================

/**
 * Returns music library formatted for Claude prompt
 */
export async function handleGetMusicLibrary(req: any, res: any) {
  try {
    // Try Airtable first
    let tracks = await getActiveMusicTracks();

    // Fallback to default
    if (tracks.length === 0) {
      tracks = getMusicLibraryForPrompt().map((t, i) => ({
        id: `default-${i}`,
        fields: {
          'File Name': t.fileName,
          Category: t.category as any,
          Mood: t.mood as any,
          Description: t.description,
        },
      }));
    }

    // Format for Claude prompt
    const library = tracks.map((track) => ({
      fileName: track.fields['File Name'],
      category: track.fields.Category,
      mood: track.fields.Mood,
      description: track.fields.Description || getTrackDescription(track.fields.Category, track.fields.Mood),
    }));

    res.json({
      library,
      instructions: 'Select the best track based on: campaign niche, caption tone, trigger type',
    });
  } catch (error) {
    console.error('[Music] Failed to get music library:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to get music library',
    });
  }
}

function getTrackDescription(category?: string, mood?: string): string {
  const descriptions: Record<string, Record<string, string>> = {
    Energetic: { Hype: 'High energy, motivation, fast pace' },
    Calm: { Relaxed: 'Relaxed, background, unobtrusive' },
    Intense: { Dramatic: 'Dramatic, emotional weight, tension' },
    Uplifting: { Positive: 'Positive, hopeful, success stories' },
    Corporate: { Professional: 'Business, clean, authoritative' },
    Epic: { Hype: 'Hype, sports, competition' },
  };

  if (category && mood && descriptions[category]?.[mood]) {
    return descriptions[category][mood];
  }

  return 'General background track';
}
