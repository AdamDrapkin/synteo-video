# Content Rewards Clip Pipeline — 22-Node N8N Workflow Map

---

## Overview

**Input:** YouTube URL + campaign selection + Adam's notes  
**Output:** Finished vertical MP4 in S3 + Airtable record + Slack notification  
**Wall clock time:** ~3 minutes per clip (after human gates)  
**Human gates:** 3 (clip selection, caption selection, final review)

---

## PHASE 1 — Setup & Intelligence

### [1] Manual Trigger / Form Input
```
Inputs:
  → youtube_url
  → campaign_name         (dropdown: on_the_margin / samuel_lee_md / ddurz / tarteel)
  → account_to_post_from  (dropdown per campaign)
  → adam_notes            (freeform: "focus on X", "skip Y", "look around minute Z")
  → episode_title
  → episode_number
```

### [2] Campaign Config Lookup *(Code Node)*
```
Maps campaign_name → full config object:
  → platform
  → music_category
  → caption_style
  → required_hashtags
  → required_mentions
  → clip_length_min / clip_length_max
  → hook_style
  → tier1_requirement
  → caption_instructions
```

### [3] Fetch YouTube Transcript
```
HTTP Request → Supadata API (or equivalent transcript service)
Returns: full transcript with word-level timestamps
```

### [4] Build Prompt 1 Input *(Code Node)*
```
Assembles:
  → full transcript
  → campaign context (from node 2)
  → adam_notes (from node 1)
  → formatted as viral clip identifier prompt
```

### [5] Claude — Prompt 1: Viral Clip Identifier
```
API: Anthropic (Claude Sonnet)
Cost: ~$0.05–0.15 per transcript

Returns ranked JSON array of 5–10 clips:
  → hook_timestamp_start        ← 3-second pattern interrupt (from elsewhere in video)
  → hook_timestamp_end          ← always hook_start + 3 seconds
  → main_timestamp_start        ← where the actual clip begins
  → main_timestamp_end          ← where the actual clip ends
  → hook_score (1–10)
  → trigger_type (Controversy / Confession / Revelation / etc.)
  → opening_line
  → why_it_hits
  → retention_arc (hook / tension / payoff timestamps)
  → platform_fit
  → risk_flags

Note: hook clip and main clip are trimmed separately by ffmpeg,
uploaded separately, then stitched inside Remotion via <Sequence>.
```

### [6] Parse Clips + Format for Review *(Code Node)*
```
  → Extracts clip array from Claude response
  → Formats ranked list into readable Slack message
  → Attaches campaign name and episode info
```

### [7] ★ HUMAN REVIEW GATE — Clip Selection
```
Sends to Slack: ranked clip list with scores + opening lines
Adam replies: clip numbers to produce (e.g. "1, 3")
              + any per-clip additional notes
Workflow PAUSES here until Adam responds.
```

---

## PHASE 2 — Per-Clip Loop *(repeats for each selected clip)*

### [8] Split — Loop Over Selected Clips
```
Splits Adam's selection into individual clip items
Each runs through nodes 9–21 independently
```

### [9] Build Prompt 2 Input *(Code Node)*
```
Assembles per clip:
  → opening_line
  → trigger_type
  → platform
  → campaign_rules
  → adam_notes for this specific clip
```

### [10] Claude — Prompt 2: Caption Generator
```
API: Anthropic (Claude Haiku)
Cost: ~$0.003 per clip

Returns 3 caption variants:
  → Variant A: Curiosity Gap    (best for TikTok algorithm)
  → Variant B: Stakes/Emotional (best for Instagram saves)
  → Variant C: Direct Keyword   (best for YouTube Shorts search)

Each variant includes:
  → caption text (<150 chars)
  → hook_overlay_text (3–7 words for on-screen first 2 seconds)
  → hashtags (3–5 niche-specific)
  → campaign_tag (required @mention + #hashtag)
  → recommended_variant + recommendation_reason
```

### [11] ★ HUMAN CAPTION SELECTION — Caption Pick
```
Sends to Slack: 3 caption variants side by side
Adam picks variant (A / B / C) + can edit before confirming
Workflow PAUSES here until Adam responds.
Outputs: confirmed caption + hook_overlay_text locked in
```

---

## PHASE 3 — Media Processing

### [12] POST /media/download
```
Express endpoint → yt-dlp service
Downloads full source video from YouTube → temp S3
```

### [13] POST /media/trim
```
Express endpoint → ffmpeg service
Runs TWICE per clip:
  → Trim 1: hook_timestamp_start → hook_timestamp_end (3-second pattern interrupt)
  → Trim 2: main_timestamp_start → main_timestamp_end (the actual clip)
Output: hookClip.mp4 + mainClip.mp4 → temp S3
```

### [14] POST /media/transcribe
```
Express endpoint → OpenAI Whisper API
Runs on MAIN CLIP only (hook clip has no captions — it's a visual interrupt)
Output: Caption[] with word-level timestamps (fromMs / toMs per word)
Timestamps offset by 3000ms so they sync correctly after the hook
Note: clips must be under 25MB / ~13 min for Whisper API
```

### [15] POST /media/upload
```
Express endpoint → S3 service
Uploads both clips to synteo-renders bucket:
  → hookClipUrl  (3-second pattern interrupt)
  → mainClipUrl  (the actual clip)
```

---

## PHASE 4 — Render

### [16] Build SocialClipProps *(Code Node)*
```
Assembles full inputProps for Remotion composition:
  → hookClipUrl         (3-second pattern interrupt — from node 15)
  → mainClipUrl         (the actual clip — from node 15)
  → captionData         (Caption[] offset by 3000ms — from node 14)
  → hookOverlayText     (from node 11)
  → musicUrl            (selected from S3 by campaign music_category)
  → campaignRules       (from node 2)
  → platform            (from node 1)
  → captionColor        (#FFFFFF default)
  → captionHighlightColor (#FFD700 default)
  → durationInSeconds   (3s hook + main clip duration)

Remotion stitches them with:
  <Sequence from={0} durationInFrames={90}>    ← hook clip (3s)
    <OffthreadVideo src={hookClipUrl} />
  </Sequence>
  <Sequence from={90}>                          ← main clip
    <OffthreadVideo src={mainClipUrl} />
  </Sequence>
  (captions + waveform + tag run across both — separate layers)
```

### [17] POST /render
```
Express endpoint → renderMediaOnLambda()
Composition: "SocialClip" (1080×1920, 9:16, 30fps)
Returns: { renderId, bucketName }

Lambda config:
  → Memory: 3009MB
  → Timeout: 300s
  → Region: us-east-1 (ARM64 — 20% cheaper)
  → Max concurrent functions: 200
```

### [18] Wait Node — Lambda Webhook Resume
```
Workflow PAUSES here (automated — not a human gate)
Resumes when Lambda POSTs completion to Express /webhook
Express validates HMAC signature, fires N8N resume URL
Fallback: polling GET /progress/:renderId every 5s (max 60 polls)
Expected render time: 15–45 seconds for a 30–75 second clip
```

---

## PHASE 5 — Review & Record

### [19] ★ HUMAN FINAL REVIEW — Approve / Reject
```
Sends to Slack: rendered clip S3 URL + caption + hashtags + account
Adam watches clip, replies:
  → APPROVE → continues to node 20
  → REJECT  → loops back to node 12 with new notes
  → NOTES   → adjusts and re-renders
Workflow PAUSES here until Adam responds.
```

### [20] Airtable — Create Clip Record
```
Table: tblCLIPS
Fields written:
  → Campaign
  → Episode Title / Number
  → Rank (from Prompt 1)
  → Hook Score
  → Timestamp Start / End
  → Opening Line
  → Caption (selected variant)
  → Hook Overlay Text
  → Hashtags
  → Campaign Tag
  → Account to Post From
  → Render ID
  → Output URL (S3)
  → Status: READY_TO_POST
  → Created At
```

### [21] Slack — Clip Ready Notification
```
Channel: #content-rewards
Message includes:
  → Campaign name
  → "Post from: [account]"
  → Caption (copy-paste ready)
  → Hashtags
  → Direct S3 output link
```

### [22] Respond to Webhook
```
Returns success JSON to original caller
Closes the N8N execution
```

---

## Error Handler *(separate workflow — always running)*

### [E1] Error Trigger
```
Fires on any node failure in the main workflow
```

### [E2] Airtable — Log Error
```
Table: tblERRORS
Fields: workflow_id, failed_node, error_message, timestamp
```

### [E3] Slack — Alert
```
Channel: #clip-pipeline-errors
Message: which node failed, error message, execution ID
```

---

## Cost Per Clip (estimated)

| Component | Cost |
|-----------|------|
| Prompt 1 (Claude Sonnet) | $0.05–0.15 |
| Prompt 2 (Claude Haiku) | $0.003 |
| Remotion Lambda render (30s clip) | $0.005–0.012 |
| Whisper transcription | ~$0.003 |
| S3 storage + transfer | ~$0.001 |
| **Total per clip** | **~$0.07–0.17** |

---

## Build Sprint Order

| Sprint | What Gets Built | Depends On |
|--------|----------------|------------|
| 1 | Remotion SocialClip composition (local) | Nothing |
| 2 | Deploy Remotion to Lambda + test render | Sprint 1 |
| 3 | Express API — /render + /progress endpoints | Sprint 2 |
| 4 | Express API — /media/* endpoints (ffmpeg, Whisper, S3) | Sprint 3 |
| 5 | Express /webhook handler + N8N resume | Sprint 3 |
| 6 | N8N Workflow — all 22 nodes | Sprints 4 + 5 |
| 7 | Airtable schema + Slack integration | Sprint 6 |
