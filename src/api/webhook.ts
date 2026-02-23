import express from 'express';
import { validateWebhookSignature } from '@remotion/lambda-client';
import { z } from 'zod';
import { CONFIG } from './config.js';

// In-memory store for renderId -> n8nResumeUrl mapping
// TODO(tech-debt): Replace with Redis for production multi-instance
const pendingRenders = new Map<string, { resumeUrl: string; createdAt: number }>();

// Cleanup old entries every 5 minutes
const RENDER_TTL_MS = 30 * 60 * 1000; // 30 minutes
setInterval(() => {
  const now = Date.now();
  for (const [renderId, data] of pendingRenders) {
    if (now - data.createdAt > RENDER_TTL_MS) {
      pendingRenders.delete(renderId);
      console.log(`[Webhook] Cleaned up stale render: ${renderId}`);
    }
  }
}, 5 * 60 * 1000);

// Remotion webhook payload schema (from @remotion/lambda-client)
const WebhookPayloadSchema = z.object({
  renderId: z.string(),
  bucketName: z.string(),
  outputFile: z.string().optional(),
  error: z.string().optional(),
  done: z.boolean(),
  costs: z
    .object({
      accruedSoFar: z.number().optional(),
    })
    .optional(),
});

// Request validation schemas
const RenderWithResumeSchema = z.object({
  composition: z.string(),
  inputProps: z.record(z.string(), z.unknown()).optional(),
  codec: z.enum(['h264', 'h265', 'vp8', 'vp9', 'prores']).optional(),
  n8nResumeUrl: z.string().url().optional(), // N8N webhook resume URL
});

/**
 * POST /render-with-webhook
 * Same as /render but stores n8nResumeUrl for webhook callback
 */
export async function handleRenderWithWebhook(
  req: express.Request,
  res: express.Response
) {
  try {
    const body = RenderWithResumeSchema.parse(req.body);
    const { composition, inputProps = {}, codec = 'h264', n8nResumeUrl } = body;

    console.log(`[Render+Webhook] Starting render: ${composition}`);

    // Import dynamically to avoid issues with ESM
    const { renderMediaOnLambda } = await import('@remotion/lambda-client');

    // Configure webhook
    const webhookUrl = `${CONFIG.api.baseUrl}/webhook`;

    const renderInput = {
      region: CONFIG.aws.region,
      functionName: CONFIG.aws.lambdaFunctionName,
      serveUrl: CONFIG.aws.serveUrl,
      composition,
      inputProps,
      codec,
      framesPerLambda: 20,
      logLevel: 'info' as const,
      webhook: {
        url: webhookUrl,
        secret: CONFIG.webhook.secret,
      },
    };

    const result = await renderMediaOnLambda(renderInput);

    // Store resume URL if provided
    if (n8nResumeUrl) {
      pendingRenders.set(result.renderId, {
        resumeUrl: n8nResumeUrl,
        createdAt: Date.now(),
      });
      console.log(`[Render+Webhook] Stored resume URL for ${result.renderId}`);
    }

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
}

/**
 * POST /webhook
 * Receives Remotion Lambda completion callbacks
 * Validates HMAC signature and triggers N8N resume
 */
export async function handleWebhook(req: express.Request, res: express.Response) {
  try {
    const signatureHeader = req.headers['x-remotion-signature'] as string;

    if (!signatureHeader) {
      console.error('[Webhook] Missing signature header');
      return res.status(401).json({ error: 'Missing signature header' });
    }

    // Validate HMAC signature
    try {
      validateWebhookSignature({
        secret: CONFIG.webhook.secret,
        body: req.body,
        signatureHeader,
      });
    } catch (validationError) {
      console.error('[Webhook] Signature validation failed:', validationError);
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // Parse and validate payload
    const payload = WebhookPayloadSchema.parse(req.body);
    const { renderId, outputFile, error, done } = payload;

    console.log(`[Webhook] Received callback for render: ${renderId}, done: ${done}`);

    // Get stored resume URL
    const renderData = pendingRenders.get(renderId);

    if (!renderData) {
      console.warn(`[Webhook] No resume URL found for render: ${renderId}`);
      return res.status(200).json({
        status: 'ignored',
        reason: 'no_resume_url',
      });
    }

    // Determine status to send to N8N
    const n8nPayload = done
      ? {
          status: 'completed',
          renderId,
          outputFile: outputFile || null,
          error: null,
        }
      : {
          status: 'failed',
          renderId,
          outputFile: null,
          error: error || 'Render failed',
        };

    // Trigger N8N resume webhook
    try {
      const resumeUrl = renderData.resumeUrl;
      const resumeFinalUrl = `${resumeUrl}&data=${encodeURIComponent(
        JSON.stringify(n8nPayload)
      )}`;

      console.log(`[Webhook] Triggering N8N: ${resumeFinalUrl}`);

      const n8nResponse = await fetch(resumeFinalUrl, {
        method: 'GET',
        // Don't wait for N8N to respond - fire and forget
      });

      if (n8nResponse.ok) {
        console.log(`[Webhook] N8N resume triggered successfully`);
      } else {
        console.warn(
          `[Webhook] N8N resume failed: ${n8nResponse.status} ${n8nResponse.statusText}`
        );
      }
    } catch (n8nError) {
      console.error('[Webhook] Failed to trigger N8N:', n8nError);
      // Don't fail the webhook response - N8N can retry via its own mechanism
    }

    // Clean up
    pendingRenders.delete(renderId);

    res.json({
      status: 'processed',
      renderId,
      n8nTriggered: !!renderData,
    });
  } catch (error) {
    console.error('[Webhook] Processing error:', error);
    // Return 200 to prevent Retries on malformed requests
    res.status(200).json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

// Export for server.ts
export const webhookRouter = express.Router();
