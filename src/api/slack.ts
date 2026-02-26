import { WebClient } from '@slack/web-api';
import { CONFIG } from './config.js';

const slack = new WebClient(CONFIG.slack.botToken);

// Slack block types
type SlackBlock = {
  type: string;
  block_id?: string;
  text?: { type: string; text: string; };
  elements?: unknown[];
};

/**
 * Send a Slack notification
 */
export async function sendSlackNotification(options: {
  channel: string;
  text: string;
  blocks?: SlackBlock[];
}): Promise<void> {
  if (!CONFIG.slack.botToken || !CONFIG.slack.channelId) {
    console.log('[Slack] Notification skipped - not configured');
    return;
  }

  try {
    await slack.chat.postMessage({
      channel: options.channel,
      text: options.text,
      blocks: options.blocks,
    });
    console.log('[Slack] Notification sent:', options.text.substring(0, 50));
  } catch (error) {
    console.error('[Slack] Failed to send notification:', error);
  }
}

/**
 * Notify when a render completes
 */
export async function notifyRenderComplete(data: {
  renderId: string;
  outputFile: string;
  campaignId: string;
}): Promise<void> {
  await sendSlackNotification({
    channel: CONFIG.slack.channelId,
    text: `✅ Render Complete: ${data.campaignId}`,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*✅ Render Complete*\n\n*Campaign:* ${data.campaignId}\n*Render ID:* \`${data.renderId}\`\n*Output:* ${data.outputFile}`,
        },
      },
    ],
  });
}

/**
 * Notify when approval is needed
 * Note: For interactive buttons, we use URL actions that hit /slack/actions with payload
 * Value format: "clipId|campaignId"
 */
export async function notifyApprovalNeeded(data: {
  campaignId: string;
  clipId: string;
  videoUrl: string;
  approveUrl: string;
  rejectUrl: string;
}): Promise<void> {
  const actionValue = `${data.clipId}|${data.campaignId}`;

  await sendSlackNotification({
    channel: CONFIG.slack.channelId,
    text: `🎬 Approval Needed: ${data.campaignId}`,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*🎬 Video Ready for Review*\n\n*Campaign:* ${data.campaignId}`,
        },
      },
      {
        type: 'actions',
        block_id: `approval_${data.campaignId}`,
        elements: [
          {
            type: 'button',
            text: { type: 'plain_text', text: '✅ Approve' },
            style: 'primary',
            action_id: 'approve_video',
            value: actionValue,
            url: data.approveUrl,
          },
          {
            type: 'button',
            text: { type: 'plain_text', text: '❌ Reject' },
            style: 'danger',
            action_id: 'reject_video',
            value: actionValue,
            url: data.rejectUrl,
          },
          {
            type: 'button',
            text: { type: 'plain_text', text: '🎬 View Video' },
            url: data.videoUrl,
          },
        ],
      },
    ],
  });
}

/**
 * Notify on error
 */
export async function notifyError(data: {
  campaignId: string;
  error: string;
  stage: string;
}): Promise<void> {
  await sendSlackNotification({
    channel: CONFIG.slack.channelId,
    text: `❌ Error: ${data.campaignId}`,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*❌ Error in ${data.stage}*\n\n*Campaign:* ${data.campaignId}\n\n\`\`\`${data.error}\`\`\``,
        },
      },
    ],
  });
}
