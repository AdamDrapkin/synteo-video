import express from 'express';
import { CONFIG } from './config.js';
import { updateClipStatus, isAirtableConfigured } from './airtable.js';

// Slack interactive action types
interface SlackActionPayload {
  type: string;
  actions: Array<{
    type: string;
    action_id: string;
    value: string; // Format: "clipId|campaignId"
    block_id: string;
  }>;
  user: { id: string; name: string };
  channel?: { id: string; name: string };
  message?: { ts: string; channel?: { id: string } };
  response_url: string;
}

/**
 * POST /slack/actions
 * Handle interactive button clicks from Slack (Approve/Reject)
 */
export async function handleSlackActions(
  req: express.Request,
  res: express.Response
) {
  try {
    // Parse the payload (Slack sends it as form-encoded)
    const payloadStr = req.body.payload;
    if (!payloadStr) {
      return res.status(400).json({ error: 'Missing payload' });
    }

    const payload: SlackActionPayload = JSON.parse(payloadStr);
    const action = payload.actions[0];
    const actionId = action.action_id;
    // Value format: "clipId|campaignId"
    const [clipId, campaignId] = action.value.split('|');

    console.log(`[Slack] Action: ${actionId}, Clip: ${clipId}, Campaign: ${campaignId}, User: ${payload.user.name}`);

    // Handle based on action type
    if (actionId === 'approve_video') {
      console.log(`[Slack] Video approved for campaign: ${campaignId}`);

      // Update Airtable if configured
      if (clipId && isAirtableConfigured()) {
        await updateClipStatus(clipId, 'Approved')
          .catch((err) => console.error('[Airtable] Failed to approve clip:', err));
      }

      // Acknowledge immediately (Slack expects quick response)
      res.json({
        response_type: 'in_channel',
        text: `✅ Video approved for campaign *${campaignId}*`,
      });

      // TODO: Trigger next step in N8N workflow
      return;
    } else if (actionId === 'reject_video') {
      console.log(`[Slack] Video rejected for campaign: ${campaignId}`);

      // Update Airtable if configured
      if (clipId && isAirtableConfigured()) {
        await updateClipStatus(clipId, 'Rejected')
          .catch((err) => console.error('[Airtable] Failed to reject clip:', err));
      }

      // Acknowledge immediately
      res.json({
        response_type: 'in_channel',
        text: `❌ Video rejected for campaign *${campaignId}*`,
      });

      // TODO: Trigger retry or notification in N8N workflow
      return;
    }

    // Unknown action
    res.json({
      text: `Unknown action: ${actionId}`,
    });
  } catch (error) {
    console.error('[Slack] Action handler error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

// Export for server.ts
export const slackRouter = express.Router();
