# The Synteo Video Pipeline: A Complete System Report

## Executive Summary

This report documents the complete end-to-end automated video clipping system built from Phase I through Phase VIII. The system transforms long-form podcast and video content into algorithm-optimized short-form vertical clips ready for posting to TikTok, Instagram Reels, and YouTube Shorts.

**Core Innovation**: A parallel sub-agent architecture that uses AI to identify viral moments, generate optimized captions, select matching music, render video compositions, and perform automated QA — all while maintaining human oversight at critical decision points.

---

## Phase I: Foundation & AI Clip Identification

### What Was Built

The system begins with **Prompt 1: The Viral Clip Identifier** — a sophisticated AI prompt that analyzes long-form video transcripts to find the most promising 15-90 second clips for short-form distribution.

### The Science of the "6-Second Gate"

Central to the entire system is a data-driven insight: **retention past second 6 is the single variable that determines viral success**. Analysis of 14,000+ clips revealed:

- Clips with 70%+ retention past second 6 averaged **120,000 views**
- Clips with under 40% retention averaged **1,800 views**

The algorithm distribution works like this: platforms test each clip with 200-500 initial viewers and measure early retention. High retention pushes the clip to larger audiences; low retention kills distribution immediately. The entire game is won or lost before viewers even know what the video is about.

### The Three Elements That Win the Gate

1. **Pattern Interrupt**: Something visually or aurally unexpected in the first moment — motion, contrast, confusion, a claim that contradicts expectation
2. **Open Loop**: A statement in the first 6 seconds that creates psychological tension requiring resolution — the brain cannot scroll past an unresolved question
3. **Specific Detail**: Numbers, names, or concrete claims — "$14,999 in one week" locks the brain 10x harder than "a lot of money"

### Trigger Types That Stop the Scroll

The AI is trained to identify these high-performing trigger types:

- **Controversy**: Claims that contradict common belief
- **Confession**: "I was wrong", "nobody told me this"
- **Revelation**: Information the viewer didn't know but now can't un-know
- **Conflict**: Tension between two ideas, people, or outcomes
- **Extreme Claim**: Numbers or statements that sound impossible
- **Mid-Sentence Entry**: Drops the viewer into the middle of a thought
- **Stakes Moment**: Something important is on the line
- **Punchline**: A payoff that lands hard after a setup

### The Hook Clip Strategy

A key innovation: the system identifies a **separate 3-second "hook clip"** from elsewhere in the video that serves as a visual pattern interrupt. This plays before the main clip begins, giving an additional 3 seconds to win the 6-second gate.

---

## Phase II: Caption Generation & Music Selection

### What Was Built

**Prompt 2: The Caption Generator** — generates 3 caption variants plus 5 hook overlay variations for each identified clip, along with intelligent music selection.

### Three Caption Variants

Each clip gets three strategically different captions:

1. **Variant A — Curiosity Gap**: Builds maximum open loop. The viewer MUST watch to close the question raised. Best for TikTok's algorithm.

2. **Variant B — Stakes/Emotional**: Makes the viewer feel like they're losing something by not watching. Uses loss aversion psychology. Best for Instagram saves and shares.

3. **Variant C — Direct Keyword**: Less creative, more searchable. Targets viewers actively searching for content in the niche. Best for YouTube Shorts search discovery.

### Platform-Specific Optimization

- **TikTok**: Algorithm reads captions for topic classification. Caption appears before press — must create urgency.
- **Instagram**: First 125 characters appear before "more" cutoff. 3-5 targeted hashtags outperform 20 generic ones.
- **YouTube Shorts**: Captions function as titles. Should be search-optimized and promise a payoff.

### The Hook Overlay System

Equally critical: the text displayed on screen during the first 2-6 seconds. Five variations generated:

1. **Text Claim**: Bold statement or specific number
2. **Proof Signal**: References visible evidence comingContradiction**:
3. ** Directly contradicts a common belief
4. **Emotion Trigger**: Leads with feeling before logic
5. **Social Proof**: Leads with someone else's result

### Music Selection Intelligence

The system includes a **45-track music library** organized by:

**Categories:**
- Gaming — high-energy, competitive, intense
- Personal Brand — creator-focused, professional, motivational
- Technology — AI, startups, innovation, future-focused
- Finance — business, markets, wealth-building
- Narrative — storytelling, personal journey, testimonial

**Moods:**
- Dark — intense, serious, dramatic
- Positive — uplifting, celebratory, hopeful
- Epic — cinematic, grand, motivational

**Energy Levels:**
- High — for clips 60+ seconds (builds to climax)
- Medium — for clips 30-60 seconds
- Low — for clips under 30 seconds

The AI selects music based on: campaign niche → caption tone → trigger type → clip duration.

---

## Phase III: Parallel Sub-Agent Architecture

### The Innovation

Rather than a monolithic workflow, the system uses a **parallel sub-agent architecture** — multiple independent workflow branches that execute simultaneously, dramatically reducing wall-clock time.

### Four Independent Workflows

1. **Main Orchestrator** (`qGdcGbOnLikzE3Jl`)
   - Entry point: Form trigger or Airtable status change
   - Coordinates the overall pipeline
   - Manages human decision gates

2. **Clip Sub-Workflow** (`UD2mtYrRGArv3m5T`)
   - Runs Prompt 2 (Caption Generation) for each selected clip
   - Fetches music library
   - Generates all caption variants and hook overlays
   - Creates combinations (15 combinations per clip: 3 captions × 5 overlays)

3. **Render Sub-Workflow** (`WZdpcH7TjKgwq87N`)
   - Trims hook clip and main clip from source video
   - Mixes audio with selected music
   - Triggers video composition rendering
   - Runs Prompt 3 (QA validation)
   - Handles retry logic (max 3 retries)

4. **Posting Manager** (`JA7Lb2UweyFLf2rC`)
   - Scheduled daily at 8 AM
   - Fetches approved clips from Airtable
   - Ranks by Hook Score
   - Groups by campaign
   - Sends daily posting schedule to Slack

### Parallel Execution Pattern

The architecture enables clips to be processed in parallel:

```
Main Orchestrator
       ↓
Split Out Clips → [Clip Sub-Workflow 1] → [Render Sub-Workflow 1]
                → [Clip Sub-Workflow 2] → [Render Sub-Workflow 2]
                → [Clip Sub-Workflow 3] → [Render Sub-Workflow 3]
```

This reduces total pipeline time from sequential processing (3 clips × 3 min = 9 min) to parallel execution (~3 min total).

---

## Phase IV: Media Processing & API Endpoints

### Express API Infrastructure

The system exposes multiple endpoints for media processing:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/media/download` | POST | Download video from YouTube to S3 |
| `/media/trim` | POST | Trim video to specific timestamps |
| `/media/transcribe` | POST | Transcribe clip using Whisper |
| `/media/upload` | POST | Upload clips to S3 storage |
| `/media/list-music` | GET | List available music tracks |
| `/media/music-library` | GET | Get library formatted for AI |
| `/media/music/:fileName` | GET | Stream music from S3 |
| `/media/mix-audio` | POST | Mix video with music (placeholder) |
| `/render` | POST | Trigger video composition |
| `/progress/:renderId` | GET | Check render status |
| `/webhook/render-complete` | POST | Receive render completion |

---

## Phase V: QA Validation & Retry Logic

### What Was Built

**Prompt 3: The QA Validator** — an automated quality assurance system that validates rendered clips before human review.

### Validation Checklist

1. **Timestamp Verification**: Does clip start/end at specified times?
2. **Caption Rendering**: Are captions correct, positioned right, readable?
3. **Music Verification**: Is correct track present? Volume appropriate? 3-second intro?
4. **Hook Overlay**: Does selected overlay appear in first 6 seconds? Readable?
5. **Campaign Tags**: Are required hashtags and @mentions visible?
6. **Technical Quality**: Resolution correct? Audio clear? Waveform displays?

### Retry Logic

- Maximum 3 retry attempts per clip
- On failure: returns to trim stage with failed check details
- After 3 failures: marks clip as failed, alerts via Slack

---

## Phase VI: Human Decision Gates

### Three Critical Human Touchpoints

The system maintains human oversight at the most important decisions:

1. **Clip Selection** (after Prompt 1)
   - AI presents top 5-10 ranked clips with hook scores
   - Human selects which clips to proceed
   - Can add per-clip notes

2. **Caption Selection** (after Prompt 2)
   - AI presents 3 caption variants side-by-side
   - Human picks variant (A, B, or C)
   - Can edit before confirming

3. **Final Approval** (after rendering)
   - Human watches completed clip
   - Approve → moves to posting queue
   - Reject → returns to media processing with notes
   - Notes → adjusts and re-renders

### Slack Integration

All human decisions happen via Slack:

- Bot sends clip/caption options with interactive response URLs
- Human replies with selection
- Workflow pauses until response received

---

## Phase VII: Data Infrastructure (Airtable)

### Five Core Tables

**1. CAMPAIGNS** (`tbluyT0gdxmABh8TZ`)

| Field | Type | Description |
|-------|------|-------------|
| Client Name | Text | Campaign/brand name |
| Status | Select | Active, Paused, Completed, Ready |
| Platform | Select | TikTok, YouTube Shorts, Instagram, X |
| Budget | Number | Campaign budget |
| Rate ($/1000 views) | Number | RPM rate |
| Required Hashtags | Array | Campaign-specific hashtags |
| Required Mentions | Array | Campaign-specific mentions |
| Caption Style | Select | Member POV, Search-Optimized, UGC |
| Clip Length Min/Max | Number | Target clip duration range |
| Content Type | Select | Clipping or UGC |
| Social Accounts | Array | Accounts approved for this campaign |

**2. CLIPS** (`tblxKBbvkP3wUz0Wr`)

| Field | Type | Description |
|-------|------|-------------|
| Campaign | Link | Linked campaign |
| Account | Link | Social account to post from |
| Source Video URL | URL | Original YouTube link |
| Status | Select | Draft, Rendering, Ready for Review, Approved, Rejected |
| Video URL | URL | Rendered clip in S3 |
| Render ID | Text | Lambda render identifier |
| Duration | Number | Clip length in seconds |
| Hook Score | Number | AI-generated score (1-10) |
| Trigger Type | Text | Identified trigger category |
| Caption Selected | Text | Human-chosen caption |
| Caption Variants | Text | All AI-generated variants |
| Hook Overlay | Text | Selected overlay text |
| QA Failed Checks | Text | Any QA failures |
| Retry Count | Number | Attempts made |
| Posted At | DateTime | When clip was posted |

**3. SOCIAL ACCOUNTS** (`tblS1z0yZ6qVbZt13`)

| Field | Type | Description |
|-------|------|-------------|
| Platform | Select | TikTok, YouTube Shorts, Instagram, X |
| Account Type | Select | Mothership, Client Fan Page, Theme Page |
| Account Handle | Text | @username |
| Account Name | Text | Display name |
| Niche | Select | Sports, Music, Finance, Comedy, Business |
| Affiliate Link | URL | Tracking link |
| Owner | Text | Account owner |
| Followers | Number | Current follower count |
| Status | Select | Active, Paused, Suspended |

**4. PERFORMANCE** (`tblMv9tGjpwurzwWs`)

| Field | Type | Description |
|-------|------|-------------|
| Clip | Link | Linked clip record |
| Account | Link | Social account |
| Platform Views | Number | Total views |
| English Views 50%+ | Number | Qualified views for monetization |
| 7-Day Views | Number | Views at 7 days |
| 14-Day Views | Number | Views at 14 days |
| 30-Day Views | Number | Views at 30 days |
| Payout Rate | Number | $/1000 views |
| Payout Amount | Number | Total earned |
| Paid | Checkbox | Has been paid? |
| Paid At | DateTime | Payment date |

**5. MUSIC** (`tblyRH7innZkrZhKO`)

| Field | Type | Description |
|-------|------|-------------|
| Track Name | Text | Human-readable name |
| File Name | Text | S3 file name |
| Category | Select | Gaming, Personal Brand, Technology, Finance, Narrative |
| Mood | Select | Dark, Positive, Epic |
| Description | Text | Track description |
| BPM | Number | Beats per minute |
| Duration | Number | Track length in seconds |
| S3 Key | Text | Storage location |
| Status | Select | Active, Inactive |

---

## Phase VIII: Complete System Integration

### End-to-End Flow

```
1. TRIGGER
   ├── Form submit (YouTube URL + Campaign + Notes)
   └── Airtable status change (Campaign → Ready)

2. INTELLIGENCE
   ├── Fetch transcript (Supadata API)
   ├── Run Prompt 1: Viral Clip Identifier
   └── Human selects clips

3. GENERATION (Parallel per clip)
   ├── Get music library
   ├── Run Prompt 2: Caption Generator
   │   ├── 3 caption variants
   │   ├── 5 hook overlays
   │   └── Music selection
   └── Human selects caption + overlay

4. PROCESSING
   ├── Trim hook clip (3 sec pattern interrupt)
   ├── Trim main clip (viral moment)
   ├── Transcribe (Whisper)
   └── Mix with music

5. RENDER
   ├── Trigger composition render
   ├── Wait for completion
   └── Run Prompt 3: QA Validation
       └── Retry if needed (max 3x)

6. REVIEW
   ├── Human final approval
   ├── Create Airtable record
   └── Slack notification

7. POSTING (Daily schedule)
   ├── Fetch approved clips
   ├── Rank by Hook Score
   └── Send to Slack
```

### Estimated Costs Per Clip

| Component | Cost |
|-----------|------|
| Prompt 1 (Claude Sonnet) | $0.05–0.15 |
| Prompt 2 (Claude Haiku) | $0.003 |
| Prompt 3 (Claude Haiku) | $0.003 |
| Video rendering | $0.005–0.012 |
| Whisper transcription | ~$0.003 |
| S3 storage + transfer | ~$0.001 |
| **Total per clip** | **~$0.07–0.17** |

---

## Key Innovations Summary

### 1. The 6-Second Gate Theory
Data-driven approach to viral video: retention past second 6 is the only metric that matters. Everything in the system is optimized to win this gate.

### 2. Parallel Sub-Agent Architecture
Multiple independent workflows executing in parallel reduce processing time by ~66% while maintaining quality through isolated execution contexts.

### 3. Three-Tier Caption Strategy
Rather than guessing which caption works, generate three strategically different variants optimized for different platforms and psychological triggers.

### 4. Hook Overlay System
Recognized that on-screen text in the first 6 seconds is equally important as the caption below — both must work together to win the algorithm gate.

### 5. Intelligent Music Matching
45-track library organized by category, mood, and energy — selected by AI based on clip content, caption tone, and trigger type.

### 6. Automated QA Pipeline
AI-powered validation before human review catches technical issues early, reducing wasted human time on malformed clips.

### 7. Human-in-the-Loop Architecture
Maintains human decision-making at the three points that most impact quality: clip selection, caption selection, and final approval.

---

## System Status

- ✅ Main Orchestrator: Built
- ✅ Clip Sub-Workflow: Built
- ✅ Render Sub-Workflow: Built
- ✅ Posting Manager: Built
- ✅ Airtable Tables: Configured
- ✅ Express API: Core endpoints ready
- ⏳ Music Mixing: Placeholder (FFmpeg implementation pending)
- ⏳ Social Posting: Not yet implemented
- ⏳ Performance Tracking: Schema ready

---

*Report generated: February 2026*
*System version: Content Rewards Pipeline v6*
