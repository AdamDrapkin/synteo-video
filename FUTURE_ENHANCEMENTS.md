# Synteo Video Pipeline - Future Enhancements

## Part 2: Uniqueness Engine

### Purpose
Before finalizing any clip, check the transcript segment + caption + overlay combination against a history log (stored in Airtable or a dedicated table) for that campaign. If the combination already exists, regenerate the caption or overlay until a novel combination is produced. Ensures no two clippers ever post identical content from the same campaign, preventing platform suppression of duplicate posts.

### Airtable Tables Required

#### COMBINATION_HISTORY
Tracks all unique combos per campaign.

| Field | Type | Description |
|-------|------|-------------|
| Campaign | Link to CAMPAIGN | Campaign this combo belongs to |
| Transcript Segment ID | Number | Which segment of the transcript |
| Hook Type | Select | Type of hook used |
| Caption Variant | Text | The caption text (for comparison) |
| Overlay Type | Select | Type of overlay |
| Combination Number | Number | Unique ID for this combination |
| First Used Date | Date | When first used |
| Use Count | Number | How many times used |

#### PERFORMANCE_LOG
7/14/30-day metrics per clip.

| Field | Type | Description |
|-------|------|-------------|
| Clip ID | Link to CLIPS | The clip record |
| Campaign | Link to CAMPAIGN | Campaign this clip belongs to |
| Combination Number | Number | Link to combination |
| Views (7d) | Number | Views in last 7 days |
| Views (14d) | Number | Views in last 14 days |
| Views (30d) | Number | Views in last 30 days |
| Likes (7d) | Number | Likes in last 7 days |
| Likes (14d) | Number | Likes in last 14 days |
| Likes (30d) | Number | Likes in last 30 days |
| Shares (7d) | Number | Shares in last 7 days |
| Shares (14d) | Number | Shares in last 14 days |
| Shares (30d) | Number | Shares in last 30 days |
| Completion Rate | Number | Video completion percentage |

### Uniqueness Rules

**Duplicate Definition:**
- Same transcript segment + Same caption = DUPLICATE (must regenerate)
- Same transcript segment + Same hook + Same overlay = OK (different caption is unique)
- Different transcript segment = OK (different content)
- Same hook = OK
- Same overlay = OK

**Implementation Logic:**
```
1. Extract: transcript_segment_id, caption_text, hook_type, overlay_type
2. Lookup: Find existing combos with same transcript_segment_id + caption_text
3. If found → REGENERATE caption (keep hook + overlay)
4. If not found → APPROVE (unique)
```

---

## Part 3: Performance-Based Optimization Logic

### Purpose
When generating new clips, analyze historical performance data to prioritize high-performing combinations and avoid low-performing ones. Adapts based on account age.

### Performance Lookup Algorithm

**Before generating new combinations:**
```
LOOKUP #1: Top Performers (This Campaign - Last 30d)
- Filter: Campaign = current_campaign AND Views(30d) > 0
- Sort: Views(30d) DESC
- Limit: 5 records

LOOKUP #2: Bottom Performers (This Campaign - Last 30d)
- Filter: Campaign = current_campaign AND Views(30d) > 0
- Sort: Views(30d) ASC
- Limit: 5 records

LOOKUP #3: Top Performers (All Campaigns - Last 30d)
- Filter: Views(30d) > 0
- Sort: Views(30d) DESC
- Limit: 5 records

LOOKUP #4: Bottom Performers (All Campaigns - Last 30d)
- Filter: Views(30d) > 0
- Sort: Views(30d) ASC
- Limit: 5 records
```

### Account Age Factor

| Clips Generated | Strategy |
|-----------------|----------|
| 0-50 (new account) | Mix of 70% safe/proven + 30% experimental |
| 51-100 | Mix of 50% safe + 50% experimental |
| 100+ | Weight toward top performers, reduce experimentation |

### Generation Rules

**For each new clip to generate:**
```
1. IF (clip_number <= 50 AND account_age_days < 30):
   - 70% chance: Use top-performing combo patterns
   - 30% chance: Try new/experimental combo

2. IF (clip_number > 50):
   - Prefer top 5 performers from THIS campaign
   - Avoid bottom 5 performers from THIS campaign
   - Can reuse top performers from ALL campaigns

3. IF (duplicate detected):
   - If high-performer → regenerate with different caption
   - If low-performer → OK to reuse (learn from failure)
   - If mid-range → OK to use
```

### Performance Metrics Priority

| Metric | Weight | Description |
|--------|--------|-------------|
| Views | 40% | Total reach |
| Shares | 30% | Virality potential |
| Likes | 20% | Engagement |
| Completion Rate | 10% | Content quality |

---

## Implementation Timeline

| Phase | Task | Complexity | Notes |
|-------|------|------------|-------|
| 1 (Now) | Resume Logic - skip processed | Medium | Immediate need |
| 2 (Future) | Uniqueness Engine - check duplicates | High | Prevents duplicate content |
| 3 (Future) | Performance Analytics - 7/14/30d tracking | High | Data collection |
| 4 (Future) | AI Optimization - use performance to guide generation | Very High | Smart generation |

---

## Notes

- Each clip MUST be unique (different caption)
- Hook and overlay CAN be reused
- Same transcript segment IS allowed (just need different caption)
- Performance data improves over time as more clips are generated
- Account age affects experimentation vs. safe ratio
