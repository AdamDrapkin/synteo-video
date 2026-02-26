import Airtable from 'airtable';
import { CONFIG } from './config.js';

// Lazy initialization - only create base if API key is provided
function getBase() {
  if (!CONFIG.airtable.apiKey) {
    throw new Error('AIRTABLE_API_KEY is not configured');
  }
  return new Airtable({ apiKey: CONFIG.airtable.apiKey }).base(CONFIG.airtable.baseId);
}

// Retry configuration
const MAX_RETRY_COUNT = 3;

// Table IDs
const TABLES = {
  campaigns: 'tbluyT0gdxmABh8TZ',
  socialAccounts: 'tblS1z0yZ6qVbZt13',
  clips: 'tblxKBbvkP3wUz0Wr',
  performance: 'tblMv9tGjpwurzwWs',
  music: 'tblyRH7innZkrZhKO',
} as const;

// Types
export interface Campaign {
  id: string;
  fields: {
    'Client Name'?: string;
    Status?: 'Active' | 'Paused' | 'Completed';
    Platform?: 'TikTok' | 'YouTube Shorts' | 'Instagram' | 'X';
    Budget?: number;
    'Rate ($/1000 views)'?: number;
    'Required Hashtags'?: string[];
    'Required Mentions'?: string[];
    'Caption Style'?: 'Member POV' | 'Search-Optimized' | 'UGC';
    'Clip Length Min'?: number;
    'Clip Length Max'?: number;
    'Content Type'?: 'Clipping' | 'UGC';
  };
}

export interface SocialAccount {
  id: string;
  fields: {
    Platform?: 'TikTok' | 'YouTube Shorts' | 'Instagram' | 'X';
    'Account Type'?: 'Mothership' | 'Client Fan Page' | 'Theme Page';
    'Account Handle'?: string;
    'Account Name'?: string;
    Niche?: 'Sports' | 'Music' | 'Finance' | 'Comedy' | 'Business';
    'Affiliate Link'?: string;
    Owner?: string;
    Followers?: number;
    Status?: 'Active' | 'Paused' | 'Suspended';
  };
}

export interface Clip {
  id: string;
  fields: {
    Campaign?: string[];
    Account?: string[];
    'Source Video URL'?: string;
    Status?: 'Draft' | 'Rendering' | 'Ready for Review' | 'In Review' | 'Approved' | 'Rejected';
    'Video URL'?: string;
    'Render ID'?: string;
    Duration?: number;
    'Hook Score'?: number;
    'Trigger Type'?: string;
    'Caption Selected'?: string;
    'Caption Variants'?: string;
    'Hook Overlay'?: string;
    'QA Failed Checks'?: string;
    'Retry Count'?: number;
    'Posted At'?: string;
    // Vision analysis fields (added for QA pipeline)
    'Vision Visual Analysis'?: string;
    'Vision Source Analysis'?: string;
    'Vision Failed'?: 'true' | 'false';
  };
}

export interface Performance {
  id: string;
  fields: {
    Clip?: string[];
    Account?: string[];
    'Platform Views'?: number;
    'English Views 50%+'?: number;
    '30-Day Views'?: number;
    'Payout Rate'?: number;
    'Payout Amount'?: number;
    Paid?: boolean;
    'Paid At'?: string;
    '7-Day Views'?: number;
    '14-Day Views'?: number;
  };
}

export interface MusicTrack {
  id: string;
  fields: {
    'Track Name'?: string;
    'File Name'?: string;
    Category?: 'Energetic' | 'Calm' | 'Intense' | 'Uplifting' | 'Corporate' | 'Epic' | 'Gaming' | 'Personal Brand' | 'Technology' | 'Finance' | 'Narrative';
    Mood?: 'Hype' | 'Relaxed' | 'Dramatic' | 'Positive' | 'Professional' | 'Dark' | 'Epic';
    Description?: string;
    BPM?: number;
    Duration?: number;
    'S3 Key'?: string;
    Status?: 'Active' | 'Inactive';
  };
}

// Helper to map record to our types
function mapRecord<T>(record: any): T {
  return {
    id: record.id,
    fields: record.fields,
  } as T;
}

// ============================================
// Campaign Operations
// ============================================

/**
 * Get campaign by ID
 */
export async function getCampaign(campaignId: string): Promise<Campaign | null> {
  try {
    const record = await getBase()(TABLES.campaigns).find(campaignId);
    return mapRecord<Campaign>(record);
  } catch (error) {
    console.error('[Airtable] Failed to get campaign:', error);
    return null;
  }
}

/**
 * Get all active campaigns
 */
export async function getActiveCampaigns(): Promise<Campaign[]> {
  try {
    const records = await getBase()(TABLES.campaigns)
      .select({
        filterByFormula: "{Status} = 'Active'",
      })
      .all();
    return records.map((r) => mapRecord<Campaign>(r));
  } catch (error) {
    console.error('[Airtable] Failed to get active campaigns:', error);
    return [];
  }
}

/**
 * Create a new campaign
 */
export async function createCampaign(fields: Partial<Campaign['fields']>): Promise<Campaign | null> {
  try {
    const record = await getBase()(TABLES.campaigns).create(fields);
    return mapRecord<Campaign>(record);
  } catch (error) {
    console.error('[Airtable] Failed to create campaign:', error);
    return null;
  }
}

/**
 * Update campaign status
 */
export async function updateCampaignStatus(
  campaignId: string,
  status: Campaign['fields']['Status']
): Promise<boolean> {
  try {
    await getBase()(TABLES.campaigns).update(campaignId, { Status: status });
    return true;
  } catch (error) {
    console.error('[Airtable] Failed to update campaign status:', error);
    return false;
  }
}

// ============================================
// Social Account Operations
// ============================================

/**
 * Get social account by ID
 */
export async function getSocialAccount(accountId: string): Promise<SocialAccount | null> {
  try {
    const record = await getBase()(TABLES.socialAccounts).find(accountId);
    return mapRecord<SocialAccount>(record);
  } catch (error) {
    console.error('[Airtable] Failed to get social account:', error);
    return null;
  }
}

/**
 * Get accounts by platform
 */
export async function getAccountsByPlatform(platform: string): Promise<SocialAccount[]> {
  try {
    const records = await getBase()(TABLES.socialAccounts)
      .select({
        filterByFormula: `{Platform} = '${platform}'`,
      })
      .all();
    return records.map((r) => mapRecord<SocialAccount>(r));
  } catch (error) {
    console.error('[Airtable] Failed to get accounts by platform:', error);
    return [];
  }
}

/**
 * Create a new social account
 */
export async function createSocialAccount(
  fields: Partial<SocialAccount['fields']>
): Promise<SocialAccount | null> {
  try {
    const record = await getBase()(TABLES.socialAccounts).create(fields);
    return mapRecord<SocialAccount>(record);
  } catch (error) {
    console.error('[Airtable] Failed to create social account:', error);
    return null;
  }
}

// ============================================
// Clip Operations
// ============================================

/**
 * Create a new clip record
 */
export async function createClip(fields: Partial<Clip['fields']>): Promise<Clip | null> {
  try {
    const record = await getBase()(TABLES.clips).create(fields);
    return mapRecord<Clip>(record);
  } catch (error) {
    console.error('[Airtable] Failed to create clip:', error);
    return null;
  }
}

/**
 * Update clip status
 */
export async function updateClipStatus(
  clipId: string,
  status: Clip['fields']['Status']
): Promise<boolean> {
  try {
    await getBase()(TABLES.clips).update(clipId, { Status: status });
    return true;
  } catch (error) {
    console.error('[Airtable] Failed to update clip status:', error);
    return false;
  }
}

/**
 * Update clip with render output
 */
export async function updateClipRenderOutput(
  clipId: string,
  data: {
    videoUrl: string;
    renderId: string;
    duration?: number;
    hookScore?: number;
    captionSelected?: string;
    captionVariants?: string;
    hookOverlay?: string;
  }
): Promise<boolean> {
  try {
    await getBase()(TABLES.clips).update(clipId, {
      'Video URL': data.videoUrl,
      'Render ID': data.renderId,
      Duration: data.duration,
      'Hook Score': data.hookScore,
      'Caption Selected': data.captionSelected,
      'Caption Variants': data.captionVariants,
      'Hook Overlay': data.hookOverlay,
    });
    return true;
  } catch (error) {
    console.error('[Airtable] Failed to update clip render output:', error);
    return false;
  }
}

/**
 * Update clip with vision analysis results
 */
export async function updateClipVisionAnalysis(
  clipId: string,
  data: {
    visionVisualAnalysis?: string;
    visionSourceAnalysis?: string;
    visionFailed?: 'true' | 'false';
  }
): Promise<boolean> {
  try {
    await getBase()(TABLES.clips).update(clipId, {
      'Vision Visual Analysis': data.visionVisualAnalysis,
      'Vision Source Analysis': data.visionSourceAnalysis,
      'Vision Failed': data.visionFailed,
    });
    return true;
  } catch (error) {
    console.error('[Airtable] Failed to update clip vision analysis:', error);
    return false;
  }
}

/**
 * Check if a clip can still be retried
 */
export function canRetry(retryCount: number): boolean {
  return retryCount < MAX_RETRY_COUNT;
}

/**
 * Get remaining retry attempts
 */
export function getRemainingRetries(retryCount: number): number {
  return Math.max(0, MAX_RETRY_COUNT - retryCount);
}

/**
 * Record QA failure and increment retry count
 * Returns: { success: boolean, retryAgain: boolean, retriesExhausted: boolean }
 */
export async function recordQAFailure(
  clipId: string,
  failedChecks: string,
  retryCount: number
): Promise<{ success: boolean; retryAgain: boolean; retriesExhausted: boolean }> {
  const newRetryCount = retryCount + 1;
  const retriesExhausted = newRetryCount >= MAX_RETRY_COUNT;

  try {
    await getBase()(TABLES.clips).update(clipId, {
      'QA Failed Checks': failedChecks,
      'Retry Count': newRetryCount,
    });

    console.log(`[Airtable] QA failure recorded for clip ${clipId}, retry ${newRetryCount}/${MAX_RETRY_COUNT}`);

    return {
      success: true,
      retryAgain: !retriesExhausted,
      retriesExhausted,
    };
  } catch (error) {
    console.error('[Airtable] Failed to record QA failure:', error);
    return {
      success: false,
      retryAgain: false,
      retriesExhausted: true,
    };
  }
}

/**
 * Get clip by render ID
 */
export async function getClipByRenderId(renderId: string): Promise<Clip | null> {
  try {
    const records = await getBase()(TABLES.clips)
      .select({
        filterByFormula: `{Render ID} = '${renderId}'`,
        maxRecords: 1,
      })
      .firstPage();

    if (records.length === 0) return null;
    return mapRecord<Clip>(records[0]);
  } catch (error) {
    console.error('[Airtable] Failed to get clip by render ID:', error);
    return null;
  }
}

// ============================================
// Performance Operations
// ============================================

/**
 * Create performance record
 */
export async function createPerformanceRecord(
  fields: Partial<Performance['fields']>
): Promise<Performance | null> {
  try {
    const record = await getBase()(TABLES.performance).create(fields);
    return mapRecord<Performance>(record);
  } catch (error) {
    console.error('[Airtable] Failed to create performance record:', error);
    return null;
  }
}

/**
 * Update view counts
 */
export async function updatePerformanceViews(
  performanceId: string,
  views: {
    platformViews?: number;
    englishViews?: number;
    views7Day?: number;
    views14Day?: number;
    views30Day?: number;
  }
): Promise<boolean> {
  try {
    await getBase()(TABLES.performance).update(performanceId, {
      'Platform Views': views.platformViews,
      'English Views 50%+': views.englishViews,
      '7-Day Views': views.views7Day,
      '14-Day Views': views.views14Day,
      '30-Day Views': views.views30Day,
    });
    return true;
  } catch (error) {
    console.error('[Airtable] Failed to update performance views:', error);
    return false;
  }
}

/**
 * Record payout
 */
export async function recordPayout(
  performanceId: string,
  payoutAmount: number
): Promise<boolean> {
  try {
    await getBase()(TABLES.performance).update(performanceId, {
      'Payout Amount': payoutAmount,
      Paid: true,
      'Paid At': new Date().toISOString(),
    });
    return true;
  } catch (error) {
    console.error('[Airtable] Failed to record payout:', error);
    return false;
  }
}

// ============================================
// Music Library Operations
// ============================================

/**
 * Get all active music tracks
 */
export async function getActiveMusicTracks(): Promise<MusicTrack[]> {
  try {
    const records = await getBase()(TABLES.music)
      .select({
        filterByFormula: "{Status} = 'Active'",
      })
      .all();
    return records.map((r) => mapRecord<MusicTrack>(r));
  } catch (error) {
    console.error('[Airtable] Failed to get active music tracks:', error);
    return [];
  }
}

/**
 * Get music track by file name
 */
export async function getMusicTrackByFileName(fileName: string): Promise<MusicTrack | null> {
  try {
    const records = await getBase()(TABLES.music)
      .select({
        filterByFormula: `AND({Status} = 'Active', {File Name} = '${fileName}')`,
        maxRecords: 1,
      })
      .firstPage();

    if (records.length === 0) return null;
    return mapRecord<MusicTrack>(records[0]);
  } catch (error) {
    console.error('[Airtable] Failed to get music track by file name:', error);
    return null;
  }
}

/**
 * Get music tracks by category
 */
export async function getMusicTracksByCategory(category: string): Promise<MusicTrack[]> {
  try {
    const records = await getBase()(TABLES.music)
      .select({
        filterByFormula: `AND({Status} = 'Active', {Category} = '${category}')`,
      })
      .all();
    return records.map((r) => mapRecord<MusicTrack>(r));
  } catch (error) {
    console.error('[Airtable] Failed to get music tracks by category:', error);
    return [];
  }
}

/**
 * Get music tracks by mood
 */
export async function getMusicTracksByMood(mood: string): Promise<MusicTrack[]> {
  try {
    const records = await getBase()(TABLES.music)
      .select({
        filterByFormula: `AND({Status} = 'Active', {Mood} = '${mood}')`,
      })
      .all();
    return records.map((r) => mapRecord<MusicTrack>(r));
  } catch (error) {
    console.error('[Airtable] Failed to get music tracks by mood:', error);
    return [];
  }
}

/**
 * Get all available music tracks (for S3 listing)
 * Returns simplified list for music selection
 * 45 tracks: 3 energy levels × 3 moods × 5 use cases
 */
export function getMusicLibraryForPrompt(): Array<{ fileName: string; category: string; mood: string; energy: string; description: string }> {
  // This is a fallback if Airtable is not configured
  // Returns the default library that Claude can select from

  // ============================================
  // GAMING / ENTERTAINMENT (9 tracks)
  // ============================================
  const gaming = [
    { fileName: 'gaming-high-dark.wav', category: 'Gaming', mood: 'Dark', energy: 'High', description: 'High energy dark gaming - intense, competitive' },
    { fileName: 'gaming-high-positive.wav', category: 'Gaming', mood: 'Positive', energy: 'High', description: 'High energy positive gaming - fun, victories' },
    { fileName: 'gaming-high-epic.wav', category: 'Gaming', mood: 'Epic', energy: 'High', description: 'High energy epic gaming - boss battles, championships' },
    { fileName: 'gaming-medium-dark.wav', category: 'Gaming', mood: 'Dark', energy: 'Medium', description: 'Medium energy dark gaming - strategy, commentary' },
    { fileName: 'gaming-medium-positive.wav', category: 'Gaming', mood: 'Positive', energy: 'Medium', description: 'Medium energy positive gaming - casual, fun' },
    { fileName: 'gaming-medium-epic.wav', category: 'Gaming', mood: 'Epic', energy: 'Medium', description: 'Medium energy epic gaming - trailers, highlights' },
    { fileName: 'gaming-low-dark.wav', category: 'Gaming', mood: 'Dark', energy: 'Low', description: 'Low energy dark gaming - ambient, late-night' },
    { fileName: 'gaming-low-positive.wav', category: 'Gaming', mood: 'Positive', energy: 'Low', description: 'Low energy positive gaming - chill, relaxed' },
    { fileName: 'gaming-low-epic.wav', category: 'Gaming', mood: 'Epic', energy: 'Low', description: 'Low energy epic gaming - story, endings' },
  ];

  // ============================================
  // PERSONAL BRAND / CREATORS (9 tracks)
  // ============================================
  const creator = [
    { fileName: 'creator-high-dark.wav', category: 'Personal Brand', mood: 'Dark', energy: 'High', description: 'High energy dark creator - hustle, grind' },
    { fileName: 'creator-high-positive.wav', category: 'Personal Brand', mood: 'Positive', energy: 'High', description: 'High energy positive creator - success, motivation' },
    { fileName: 'creator-high-epic.wav', category: 'Personal Brand', mood: 'Epic', energy: 'High', description: 'High energy epic creator - announcements, milestones' },
    { fileName: 'creator-medium-dark.wav', category: 'Personal Brand', mood: 'Dark', energy: 'Medium', description: 'Medium energy dark creator - authentic, real talk' },
    { fileName: 'creator-medium-positive.wav', category: 'Personal Brand', mood: 'Positive', energy: 'Medium', description: 'Medium energy positive creator - everyday, storytelling' },
    { fileName: 'creator-medium-epic.wav', category: 'Personal Brand', mood: 'Epic', energy: 'Medium', description: 'Medium energy epic creator - professional, polished' },
    { fileName: 'creator-low-dark.wav', category: 'Personal Brand', mood: 'Dark', energy: 'Low', description: 'Low energy dark creator - reflective, vulnerable' },
    { fileName: 'creator-low-positive.wav', category: 'Personal Brand', mood: 'Positive', energy: 'Low', description: 'Low energy positive creator - authentic, morning' },
    { fileName: 'creator-low-epic.wav', category: 'Personal Brand', mood: 'Epic', energy: 'Low', description: 'Low energy epic creator - impact, emotional' },
  ];

  // ============================================
  // TECHNOLOGY / AI (9 tracks)
  // ============================================
  const tech = [
    { fileName: 'tech-high-dark.wav', category: 'Technology', mood: 'Dark', energy: 'High', description: 'High energy dark tech - breaking news, AI reveals' },
    { fileName: 'tech-high-positive.wav', category: 'Technology', mood: 'Positive', energy: 'High', description: 'High energy positive tech - launches, breakthroughs' },
    { fileName: 'tech-high-epic.wav', category: 'Technology', mood: 'Epic', energy: 'High', description: 'High energy epic tech - major announcements, future' },
    { fileName: 'tech-medium-dark.wav', category: 'Technology', mood: 'Dark', energy: 'Medium', description: 'Medium energy dark tech - analysis, tutorials' },
    { fileName: 'tech-medium-positive.wav', category: 'Technology', mood: 'Positive', energy: 'Medium', description: 'Medium energy positive tech - startups, features' },
    { fileName: 'tech-medium-epic.wav', category: 'Technology', mood: 'Epic', energy: 'Medium', description: 'Medium energy epic tech - conferences, demos' },
    { fileName: 'tech-low-dark.wav', category: 'Technology', mood: 'Dark', energy: 'Low', description: 'Low energy dark tech - coding, research' },
    { fileName: 'tech-low-positive.wav', category: 'Technology', mood: 'Positive', energy: 'Low', description: 'Low energy positive tech - lifestyle, culture' },
    { fileName: 'tech-low-epic.wav', category: 'Technology', mood: 'Epic', energy: 'Low', description: 'Low energy epic tech - ethics, predictions' },
  ];

  // ============================================
  // FINANCE / BUSINESS (9 tracks)
  // ============================================
  const finance = [
    { fileName: 'finance-high-dark.wav', category: 'Finance', mood: 'Dark', energy: 'High', description: 'High energy dark finance - trading, market drama' },
    { fileName: 'finance-high-positive.wav', category: 'Finance', mood: 'Positive', energy: 'High', description: 'High energy positive finance - wins, success' },
    { fileName: 'finance-high-epic.wav', category: 'Finance', mood: 'Epic', energy: 'High', description: 'High energy epic finance - deals, IPOs' },
    { fileName: 'finance-medium-dark.wav', category: 'Finance', mood: 'Dark', energy: 'Medium', description: 'Medium energy dark finance - analysis, education' },
    { fileName: 'finance-medium-positive.wav', category: 'Finance', mood: 'Positive', energy: 'Medium', description: 'Medium energy positive finance - entrepreneurship, wealth' },
    { fileName: 'finance-medium-epic.wav', category: 'Finance', mood: 'Epic', energy: 'Medium', description: 'Medium energy epic finance - news, updates' },
    { fileName: 'finance-low-dark.wav', category: 'Finance', mood: 'Dark', energy: 'Low', description: 'Low energy dark finance - late-night, research' },
    { fileName: 'finance-low-positive.wav', category: 'Finance', mood: 'Positive', energy: 'Low', description: 'Low energy positive finance - morning reviews, education' },
    { fileName: 'finance-low-epic.wav', category: 'Finance', mood: 'Epic', energy: 'Low', description: 'Low energy epic finance - planning, wealth building' },
  ];

  // ============================================
  // NARRATIVE / PERSONAL STORY (9 tracks)
  // ============================================
  const story = [
    { fileName: 'narrative-high-dark.wav', category: 'Narrative', mood: 'Dark', energy: 'High', description: 'High energy dark narrative - confession, revelation' },
    { fileName: 'narrative-high-positive.wav', category: 'Narrative', mood: 'Positive', energy: 'High', description: 'High energy positive narrative - transformation, success' },
    { fileName: 'narrative-high-epic.wav', category: 'Narrative', mood: 'Epic', energy: 'High', description: 'High energy epic narrative - testimony, milestone' },
    { fileName: 'narrative-medium-dark.wav', category: 'Narrative', mood: 'Dark', energy: 'Medium', description: 'Medium energy dark narrative - reflection, serious' },
    { fileName: 'narrative-medium-positive.wav', category: 'Narrative', mood: 'Positive', energy: 'Medium', description: 'Medium energy positive narrative - journey, growth' },
    { fileName: 'narrative-medium-epic.wav', category: 'Narrative', mood: 'Epic', energy: 'Medium', description: 'Medium energy epic narrative - storytelling, impact' },
    { fileName: 'narrative-low-dark.wav', category: 'Narrative', mood: 'Dark', energy: 'Low', description: 'Low energy dark narrative - vulnerable, intimate' },
    { fileName: 'narrative-low-positive.wav', category: 'Narrative', mood: 'Positive', energy: 'Low', description: 'Low energy positive narrative - resolution, peace' },
    { fileName: 'narrative-low-epic.wav', category: 'Narrative', mood: 'Epic', energy: 'Low', description: 'Low energy epic narrative - impact, lasting change' },
  ];

  return [...gaming, ...creator, ...tech, ...finance, ...story];
}

// ============================================
// Utility
// ============================================

/**
 * Check if Airtable is configured
 */
export function isAirtableConfigured(): boolean {
  return !!(CONFIG.airtable.apiKey && CONFIG.airtable.baseId);
}
