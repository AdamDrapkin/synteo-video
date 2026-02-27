import express from 'express';
import { renderMediaOnLambda, getRenderProgress, type RenderMediaOnLambdaInput, type GetRenderProgressInput } from '@remotion/lambda-client';
import { z } from 'zod';
import {
  handleUpload,
  handleDownload,
  handleGetUrl,
  handleDownloadUrl,
  handleTrim,
  handleExtractFrames,
  handleTranscribe,
  handleListMusic,
  handleGetMusicStream,
  handleMixAudio,
  handleGetMusicLibrary,
} from './media/index.js';
import { handleWebhook, handleRenderWithWebhook } from './webhook.js';
import { handleSlackActions } from './slack-actions.js';
import { CONFIG } from './config.js';
import { isAirtableConfigured } from './airtable.js';

const app = express();
app.use(express.json({ limit: '50mb' }));
// Parse URL-encoded bodies for Slack interactive endpoints
app.use(express.urlencoded({ extended: true }));

// ============================================
// Health Check
// ============================================

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      slack: !!CONFIG.slack.botToken,
      airtable: isAirtableConfigured(),
    },
  });
});

// AWS Configuration
const AWS_CONFIG = {
  region: 'us-east-1' as const,
  lambdaFunctionName: 'remotion-render-4-0-427-mem2048mb-disk2048mb-120sec',
  serveUrl: 'https://remotionLambda-useast1-7nig21l89j.s3.us-east-1.amazonaws.com/sites/mkw9luttk2',
  bucketName: 'remotionLambda-useast1-7nig21l89j',
};

// Request validation schemas
const RenderRequestSchema = z.object({
  composition: z.string(),
  inputProps: z.record(z.string(), z.unknown()).optional(),
  codec: z.enum(['h264', 'h265', 'vp8', 'vp9', 'prores']).optional(),
});

const ProgressParamsSchema = z.object({
  renderId: z.string(),
});

// POST /render
app.post('/render', async (req, res) => {
  try {
    const body = RenderRequestSchema.parse(req.body);

    const { composition, inputProps = {}, codec = 'h264' } = body;

    console.log(`Starting render: ${composition}`);

    const renderInput: RenderMediaOnLambdaInput = {
      region: CONFIG.aws.region,
      functionName: CONFIG.aws.lambdaFunctionName,
      serveUrl: CONFIG.aws.serveUrl,
      composition,
      inputProps,
      codec,
      framesPerLambda: 20,
      logLevel: 'info',
    };

    const result = await renderMediaOnLambda(renderInput);

    res.json({
      renderId: result.renderId,
      bucketName: result.bucketName,
      status: 'started',
    });
  } catch (error) {
    console.error('Render error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// GET /progress/:renderId
app.get('/progress/:renderId', async (req, res) => {
  try {
    const params = ProgressParamsSchema.parse({ renderId: req.params.renderId });

    const progressInput: GetRenderProgressInput = {
      region: CONFIG.aws.region,
      functionName: CONFIG.aws.lambdaFunctionName,
      renderId: params.renderId,
      bucketName: CONFIG.aws.bucketName,
      skipLambdaInvocation: true,
    };

    const progress = await getRenderProgress(progressInput);

    res.json(progress);
  } catch (error) {
    console.error('Progress error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ============================================
// Media Endpoints (Sprint 4)
// ============================================

// POST /media/trim - Trim video using FFmpeg
app.post('/media/trim', handleTrim);

// POST /media/extract-frames - Extract frames from video at intervals (for Gemini Vision)
app.post('/media/extract-frames', handleExtractFrames);

// POST /media/transcribe - Transcribe audio using Whisper
app.post('/media/transcribe', handleTranscribe);

// POST /media/upload - Upload file to S3
app.post('/media/upload', handleUpload);

// GET /media/download/:key - Download file from S3
app.get('/media/download/*', handleDownload);

// GET /media/url/:key - Get presigned URL for S3 file
app.get('/media/url/*', handleGetUrl);
app.post('/media/download-url', handleDownloadUrl);

// ============================================
// Music Endpoints (Sprint 8 Phase 1)
// ============================================

// IMPORTANT: Specific routes must come BEFORE parameterized routes

// GET /media/list-music - List available music tracks
app.get('/media/list-music', handleListMusic);

// GET /media/music-library - Get library formatted for Claude prompt
app.get('/media/music-library', handleGetMusicLibrary);

// POST /media/mix-audio - Mix video with background music
app.post('/media/mix-audio', handleMixAudio);

// GET /media/music/:fileName - Stream music file from S3 (must be AFTER specific routes)
app.get('/media/music/:fileName', handleGetMusicStream);

// ============================================
// Webhook Endpoints (Sprint 5)
// ============================================

// POST /render-with-webhook - Render with N8N resume callback
app.post('/render-with-webhook', handleRenderWithWebhook);

// POST /webhook - Remotion Lambda callback endpoint
app.post('/webhook', handleWebhook);

// ============================================
// Slack Endpoints (Sprint 7)
// ============================================

// POST /slack/actions - Interactive button handlers
app.post('/slack/actions', handleSlackActions);

const PORT = CONFIG.api.port;

app.listen(PORT, () => {
  console.log(`🚀 Synteo Video API running on port ${PORT}`);
  console.log(`   Lambda: ${CONFIG.aws.lambdaFunctionName}`);
  console.log(`   Site: ${CONFIG.aws.serveUrl}`);
});
