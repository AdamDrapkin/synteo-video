import { z } from 'zod';

export const AspectRatioSchema = z.enum(['9:16', '16:9', '1:1']);

export const CaptionSchema = z.object({
  text: z.string(),
  startMs: z.number(),
  endMs: z.number(),
  timestampMs: z.number().nullable(),
  confidence: z.number().nullable(),
});

export type Caption = z.infer<typeof CaptionSchema>;

export const SocialClipPropsSchema = z.object({
  hookClipUrl: z.string(),
  mainClipUrl: z.string(),
  captionData: z.array(CaptionSchema),
  campaignTag: z.string(),
  aspectRatio: AspectRatioSchema,
});

export type SocialClipProps = z.infer<typeof SocialClipPropsSchema>;

// Aspect ratio dimensions
export const ASPECT_RATIOS = {
  '9:16': { width: 1080, height: 1920 },
  '16:9': { width: 1920, height: 1080 },
  '1:1': { width: 1080, height: 1080 },
} as const;

export const DEFAULT_PROPS: SocialClipProps = {
  hookClipUrl: '',
  mainClipUrl: '',
  captionData: [],
  campaignTag: '@synteo #ContentRewards',
  aspectRatio: '9:16',
};
