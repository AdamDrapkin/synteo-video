import { useState } from "react";

const campaigns = [
  {
    id: "otm",
    name: "On The Margin",
    episodes: "Episodes 1 & 2",
    rpm: "$5",
    budget: "$8,100",
    creators: "957 / 236",
    niche: "Finance Podcast",
    platform: "TikTok + Instagram",
    priority: "HIGHEST",
    priorityColor: "#00FF88",
    difficulty: "Medium",
    accountType: "Finance / Business",
    why: "Highest RPM on the entire platform. Finance content naturally retains Tier 1 audiences. Your podcast production background means you know exactly which moments hit. Budget is barely spent.",
    contentFormat: "Podcast clip — find the 30-60 second moment where the guest says something that contradicts common financial wisdom or reveals something shocking.",
    hookTip: "Start mid-sentence on the most controversial claim. Never start at the beginning of a thought. Pattern interrupt: pull a 3-second reaction clip from elsewhere in the episode and play it first.",
    tags: ["#finance", "#investing", "#money"],
    url: "https://whop.com",
  },
  {
    id: "samuel",
    name: "Samuel B. Lee MD",
    episodes: "General Campaign",
    rpm: "$2",
    budget: "$10,000",
    creators: "8",
    niche: "Medical / Health",
    platform: "Instagram",
    priority: "HIGH",
    priorityColor: "#FFD700",
    difficulty: "Easy",
    accountType: "Health / Medical",
    why: "Only 8 creators in a $10K campaign. Budget essentially untouched. Medical content from a credentialed MD gets Tier 1 views naturally — health niche skews heavily US/UK.",
    contentFormat: "Medical revelation clips — moments where the doctor says something that contradicts what your doctor told you, or reveals a risk most people don't know about.",
    hookTip: "Best medical hooks start mid-warning. 'By the time you feel this...' or 'Most doctors won't tell you...' Pattern interrupt: cut to the doctor's surprised facial expression first.",
    tags: ["#health", "#doctor", "#medical"],
    url: "https://whop.com",
  },
  {
    id: "ddurz",
    name: "DDURZ Clip Team",
    episodes: "Gaming Streamer",
    rpm: "$4",
    budget: "$10,000",
    creators: "1,000+",
    niche: "Gaming",
    platform: "TikTok + YouTube",
    priority: "MEDIUM",
    priorityColor: "#FF6B35",
    difficulty: "Hard",
    accountType: "Gaming",
    why: "Second highest RPM at $4/1K. But 1,000+ creators already in it. Only worth pursuing if you can produce volume fast via automation. The pipeline gives you an edge here — most creators are editing manually.",
    contentFormat: "Reaction clips and highlight moments — insane plays, rage moments, funny interactions. Fast pacing required.",
    hookTip: "Gaming hooks need to start at peak intensity. Drop in right before the reaction, not after. Pattern interrupt: start with the aftermath, then cut back to the cause.",
    tags: ["#gaming", "#streamer", "#clips"],
    url: "https://whop.com",
  },
  {
    id: "tarteel",
    name: "Tarteel Slideshows",
    episodes: "AI App Campaign",
    rpm: "$1",
    budget: "$5,000",
    creators: "150",
    niche: "AI / Utility App",
    platform: "TikTok + Instagram",
    priority: "PIPELINE PROOF",
    priorityColor: "#A78BFA",
    difficulty: "Easy (Automatable)",
    accountType: "Tech / AI / Education",
    why: "Lowest RPM but highest automation potential. Slideshow format = Remotion. This proves the full render pipeline end-to-end before you scale to higher-RPM campaigns. Build this first technically.",
    contentFormat: "Slideshow-style content about the app's features. Text-on-screen, background music, clean visuals. No face cam. Pure Remotion output.",
    hookTip: "Slideshow hooks need a bold first-frame text statement. 'This AI just replaced 3 hours of my day' as frame 1. No pattern interrupt needed — the first slide IS the hook.",
    tags: ["#AI", "#productivity", "#tech"],
    url: "https://whop.com",
  },
];

const steps = [
  {
    phase: "SETUP",
    color: "#00FF88",
    items: [
      {
        title: "Find ALL Active Campaigns on Whop",
        detail: "All Content Rewards campaigns live on Whop communities — not a standalone platform. The 4 campaigns above are a starting point. Before picking your accounts, do a full sweep.\n\nHow to find them:\n- Go to whop.com/discover\n- Filter by 'Content Rewards' or search 'clip campaign'\n- Look for pinned posts describing RPM, budget, creator requirements\n- Target: find 10-20 active campaigns before choosing your niches\n\nWhat to document for each campaign:\n- RPM rate\n- Total budget and how much is spent\n- Number of creators already in\n- Platform requirement (TikTok / IG / YouTube Shorts)\n- Tier 1 audience requirement (%) \n- Specific posting rules (required hashtags, @ mentions, minimum clip length)\n\nThis research determines which accounts to create. Do not skip this.",
      },
      {
        title: "Account Strategy — What Accounts Do You Need?",
        detail: "One account per niche. Do not cross-contaminate.\n\nOn The Margin (Finance): Finance/business/money content account. Create dedicated if needed.\n\nSamuel MD (Health): Health/wellness account. Needs to read as a health page to campaign reviewers.\n\nDDURZ (Gaming): Gaming-niche page only. Non-negotiable per their rules.\n\nTarteel (AI/Tech): Tech/AI/productivity account. Easiest to build quickly.\n\nRule: Use existing accounts ONLY if they already match the niche. When in doubt, create new.\n\nTarget setup: 2-3 accounts across your strongest campaign niches. Start 2, add 3rd after first revenue.",
      },
      {
        title: "Join Each Campaign and Read the Brief",
        detail: "Every campaign on Whop has:\n- A pinned community post with full campaign requirements\n- Specific hashtag and @ mention requirements (mandatory for payment)\n- Minimum view thresholds before submission\n- Tier 1 audience percentage requirement (usually 40%+)\n\nProcess:\n- Join the Whop community for each campaign\n- Read the full pinned brief before producing a single clip\n- Screenshot the requirements and save them — these feed directly into your N8N campaign config node\n\nMissing required tags = clip not reviewed = $0. Non-negotiable.",
      },
      {
        title: "Verify Tier 1 Audience Before Submitting",
        detail: "Every campaign requires 40%+ views from Tier 1 countries (US, UK, Canada, Australia). Check analytics BEFORE submitting.\n\nIf your audience skews outside Tier 1:\n- Post content that references US/UK topics\n- Post during EST peak hours: 7-9 AM, 12-2 PM, 7-10 PM EST\n- Use platform language settings set to English\n- Monitor after first 10 posts — if Tier 1 is consistently low, the account needs more history\n\nYou do NOT submit a clip that fails Tier 1. Wait until the analytics confirm or move to a different account.",
      },
    ],
  },
  {
    phase: "CONTENT PRODUCTION (MANUAL — PRE-AUTOMATION)",
    color: "#FFD700",
    items: [
      {
        title: "Step 1 — Get the Source + Transcript",
        detail: "For On The Margin and Samuel MD (YouTube videos):\n- Go to YouTube → three dots below video → 'Show transcript'\n- Copy full transcript with timestamps\n- This feeds directly into Prompt 1\n\nFor DDURZ (Twitch/stream):\n- No auto-transcript — watch VOD manually and find the moment\n- Note start/end timestamps for trimming\n\nFor Tarteel (App campaign):\n- No source video needed\n- Skip to Prompt 2 equivalent — generate slideshow scripts from app feature list\n\nIn the automated pipeline: N8N calls Supadata API with YouTube URL → returns transcript JSON automatically. Right now: copy manually.",
      },
      {
        title: "Step 2 — Run Prompt 1: Viral Clip Identifier",
        detail: "Paste the transcript + campaign context into Prompt 1 (Claude Sonnet recommended). It returns a ranked JSON array of clip candidates.\n\nEach clip object in the output contains:\n- timestamp_start / timestamp_end\n- hook_score (0-10)\n- trigger_type (curiosity / controversy / revelation / emotion)\n- opening_line (the exact line the clip should begin with)\n- hook_clip_timestamp (separate 3-second pattern interrupt from elsewhere in the video)\n- retention_arc\n- platform_fit\n\nReview the ranked list. You pick which clips to pursue — this is the first human gate.\n\nPro tip: The hook_clip_timestamp is as important as the main clip. That 3-second pattern interrupt is what stops the scroll.",
      },
      {
        title: "Step 3 — Run Prompt 2: Caption Generator",
        detail: "Take each clip object from Prompt 1. Feed opening_line, trigger_type, platform, and campaign rules into Prompt 2.\n\nPrompt 2 outputs 3 caption variants per clip:\n- Variant A: Curiosity Gap (TikTok algorithm)\n- Variant B: Stakes / Emotional (Instagram saves)\n- Variant C: Direct Keyword (YouTube Shorts search)\n\nEach variant includes:\n- Full caption text\n- Hook overlay text (on-screen text, first 2 seconds — this appears over the pattern interrupt)\n- Hashtags\n- Campaign required tags\n\nPick the recommended variant or A/B test two. This is the second human gate.",
      },
      {
        title: "Step 4 — Edit (CapCut for Now, Remotion After Sprint 7)",
        detail: "MANUAL PROCESS (now):\n- Jump to hook_clip_timestamp from Prompt 1 JSON\n- Trim 3-second pattern interrupt clip\n- Jump to timestamp_start → trim main clip to timestamp_end\n- Stitch: [3-sec hook clip] → [main clip]\n- Enable auto-captions\n- Add hook_overlay text from Prompt 2 as bold on-screen text in first 2 seconds\n- Export 1080p vertical (9:16)\n\nAUTOMATED PROCESS (after Sprint 7):\n- yt-dlp downloads source\n- FFmpeg trims hook clip and main clip separately\n- Whisper transcribes main clip only (offset +3000ms for accuracy)\n- Remotion renders final composition:\n  · [0-90 frames]: hook clip plays (pattern interrupt)\n  · [90+ frames]: main clip plays\n  · Captions layer runs across both\n  · Campaign tag appears at 84 frames\n  · Waveform visualization runs 15-end\n\nCapCut now. Remotion after validation. Same output, different path.",
      },
      {
        title: "Step 5 — Post with Caption",
        detail: "Use the caption from Prompt 2 output verbatim. Do not paraphrase.\n\nRequired elements (check against campaign brief):\n- Campaign-required hashtag\n- Campaign-required @ mention\n- Your selected caption variant\n- Any other brief-specific requirements\n\nPost timing for Tier 1 audience:\n- 7-9 AM EST (morning commute)\n- 12-2 PM EST (lunch)\n- 7-10 PM EST (prime time)\n\nSpacing: minimum 2-4 hours between posts. Platform author diversity penalty hits if you spam.\n\nLog every post: clip URL, campaign, timestamp posted, initial view velocity. View velocity in first 2 hours predicts whether a clip will clear the threshold.",
      },
    ],
  },
  {
    phase: "TRACKING & PAYMENT",
    color: "#A78BFA",
    items: [
      {
        title: "Minimum View Thresholds",
        detail: "Most campaigns: 4,000 views minimum before the clip is eligible for submission.\n\nClips that don't hit the minimum = $0. Post volume is your hedge — more clips means more chances.\n\nTrack in Airtable (same one the N8N pipeline uses later). Fields: clip URL, campaign, views, submitted date, tier 1 %, status, payout, account.\n\nVolume math: if 30% of your clips clear 4K views, 6 clips/day = 1.8 clips clearing daily. At $5/1K (OTM) and 10K avg views = $50/clip → $90/day → $2,700/month at moderate performance.",
      },
      {
        title: "Submission Process",
        detail: "After a clip clears minimum views:\n1. Go to the Whop campaign community\n2. Submit the clip URL per the campaign's submission instructions\n3. Campaign team reviews within 24-72 hours\n4. They WILL ask for analytics — screenshot showing 40%+ Tier 1\n5. Approved → payout added to balance\n\nKeep analytics screenshots for every clip you plan to submit. Campaigns are strict — missing proof = rejection even if the clip performed.",
      },
      {
        title: "Revenue Math by Campaign",
        detail: "On The Margin at $5/1K:\n- 10 clips × 10K avg views = $500\n- 20 clips × 10K avg views = $1,000\n- 1 viral clip × 100K views = $500 on its own\n\nSamuel MD at $2/1K:\n- 20 clips × 10K avg = $400\n\nDDURZ at $4/1K:\n- 20 clips × 10K avg = $800\n\nTarteel at $1/1K:\n- Not about revenue — it's about proving the Remotion render pipeline works end-to-end\n\nOne viral clip changes everything. At 12-18 clips/day across 2-3 accounts, the law of averages works in your favor. The goal at this stage: $700-2,500/month while validating the system. Not retirement money. Proof money.",
      },
    ],
  },
];

const pipelineNodes = [
  { step: "01", phase: "INPUT", manual: "Copy YouTube transcript manually", auto: "HTTP Request → Supadata API with YouTube URL", color: "#00FF88" },
  { step: "02", phase: "BRAIN", manual: "Run Prompt 1 manually, pick clips from output", auto: "Claude Sonnet: Prompt 1 (Viral Clip Identifier) → ranked JSON", color: "#00FF88" },
  { step: "03", phase: "⭐ HUMAN GATE 1", manual: "You review AI output, pick which clips to pursue", auto: "Wait Node: Adam selects clips from ranked list", color: "#FFD700" },
  { step: "04", phase: "CAPTIONS", manual: "Run Prompt 2 manually per clip", auto: "Loop → Claude Haiku: Prompt 2 per clip (3 caption variants)", color: "#00FF88" },
  { step: "05", phase: "⭐ HUMAN GATE 2", manual: "You pick caption variant per clip", auto: "Wait Node: Adam picks caption variant", color: "#FFD700" },
  { step: "06", phase: "DOWNLOAD", manual: "Download video from YouTube manually", auto: "yt-dlp: download source video", color: "#00FF88" },
  { step: "07", phase: "TRIM", manual: "Find timestamps in CapCut, trim hook + main", auto: "FFmpeg: trim hook clip AND main clip separately", color: "#00FF88" },
  { step: "08", phase: "TRANSCRIBE", manual: "Auto-captions in CapCut", auto: "Whisper: transcribe MAIN clip only (+3000ms offset)", color: "#00FF88" },
  { step: "09", phase: "STORE", manual: "Save to local drive", auto: "S3: upload both clips", color: "#00FF88" },
  { step: "10", phase: "RENDER", manual: "Stitch + export in CapCut", auto: "Remotion Lambda: render SocialClip composition → wait webhook", color: "#00FF88" },
  { step: "11", phase: "⭐ HUMAN GATE 3", manual: "Watch final clip before posting", auto: "Wait Node: Adam approves final render", color: "#FFD700" },
  { step: "12", phase: "RECORD", manual: "Log in spreadsheet manually", auto: "Airtable: create record (14 fields) + Slack notification", color: "#00FF88" },
];

const sprints = [
  { num: "1", title: "Remotion SocialClip Composition", detail: "Build the React/Remotion composition locally. Hook clip + main clip + captions + waveform + campaign tag. No AWS, no Express, no N8N. Just render a test MP4 from hardcoded props.", deps: "Nothing", status: "NEXT" },
  { num: "2", title: "Deploy Remotion to Lambda", detail: "Deploy composition to AWS Lambda. Test render via Remotion CLI. Confirm ARM64 us-east-1 (20% cheaper). Set Lambda timeout to 300s (default 120 fails).", deps: "Sprint 1", status: "QUEUED" },
  { num: "3", title: "Express API — /render + /progress", detail: "Node.js wrapper around Remotion Lambda. Two endpoints: POST /render (accepts SocialClipProps, returns renderId) and GET /progress/:id (polls render status).", deps: "Sprint 2", status: "QUEUED" },
  { num: "4", title: "Express API — /media/* (FFmpeg, Whisper, S3)", detail: "Media processing endpoints: POST /media/trim (hook clip + main clip separately), POST /media/transcribe (Whisper on main clip only, +3000ms offset), POST /media/upload (S3).", deps: "Sprint 3", status: "QUEUED" },
  { num: "5", title: "Express /webhook + N8N Resume Handler", detail: "Webhook endpoint that receives Remotion Lambda completion event and resumes N8N Wait Node. The bridge between the render pipeline and the workflow.", deps: "Sprint 3", status: "QUEUED" },
  { num: "6", title: "N8N 22-Node Workflow", detail: "Import the full workflow JSON. Wire up all nodes: Input → Prompt 1 → Human Gate → Prompt 2 → Human Gate → Download → Trim → Transcribe → S3 → Render → Human Gate → Airtable → Slack.", deps: "Sprint 4+5", status: "QUEUED" },
  { num: "7", title: "Airtable + Slack Integration", detail: "14-field Airtable record for each clip. Slack notification with clip URL, campaign, and approval button. Error handler: separate always-on workflow → Airtable log + Slack alert.", deps: "Sprint 6", status: "QUEUED" },
];

export default function Playbook() {
  const [activeTab, setActiveTab] = useState("campaigns");
  const [expandedStep, setExpandedStep] = useState(null);
  const [expandedCampaign, setExpandedCampaign] = useState(null);
  const [expandedSprint, setExpandedSprint] = useState(null);

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0a0a0a",
      color: "#e8e8e0",
      fontFamily: "'Courier New', Courier, monospace",
    }}>
      {/* Header */}
      <div style={{ borderBottom: "1px solid #1a1a1a", padding: "32px 40px 24px" }}>
        <div style={{ fontSize: "11px", color: "#333", letterSpacing: "0.2em", marginBottom: "8px" }}>
          SYNTEO LLC — INTERNAL · UPDATED POST-SESSION · DO NOT SHARE REMOTION ARCHITECTURE
        </div>
        <h1 style={{
          fontSize: "clamp(22px, 4vw, 40px)", fontWeight: "900", margin: "0 0 8px",
          letterSpacing: "-0.02em", lineHeight: 1, color: "#fff",
        }}>
          CONTENT REWARDS<br /><span style={{ color: "#00FF88" }}>CLIPPING PLAYBOOK</span>
        </h1>
        <p style={{ color: "#444", fontSize: "12px", margin: 0, letterSpacing: "0.08em" }}>
          4 CAMPAIGNS · 2 AI PROMPTS · 22-NODE PIPELINE · 7 SPRINTS TO AUTOMATION · WHOP PLATFORM
        </p>
      </div>

      {/* Strategy Banner */}
      <div style={{
        background: "#0d0d0d", borderBottom: "1px solid #141414",
        padding: "16px 40px", display: "flex", gap: "40px", flexWrap: "wrap",
      }}>
        {[
          ["PURPOSE", "Validate the Synteo pipeline in production before client outreach"],
          ["PLATFORM", "Whop — all campaigns live in Whop communities"],
          ["ACCOUNTS", "2-3 dedicated accounts across different niches"],
          ["OUTPUT", "12-18 clips/day · $700-2,500/month moderate · proof of system"],
        ].map(([l, v]) => (
          <div key={l}>
            <div style={{ fontSize: "9px", color: "#333", letterSpacing: "0.15em", marginBottom: "3px" }}>{l}</div>
            <div style={{ fontSize: "11px", color: "#888" }}>{v}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid #141414", padding: "0 40px", background: "#0d0d0d", overflowX: "auto" }}>
        {[
          { id: "campaigns", label: "CAMPAIGNS" },
          { id: "steps", label: "EXECUTION" },
          { id: "prompts", label: "AI PROMPTS" },
          { id: "pipeline", label: "22-NODE PIPELINE" },
          { id: "sprints", label: "BUILD SPRINTS" },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            background: "none", border: "none",
            borderBottom: activeTab === tab.id ? "2px solid #00FF88" : "2px solid transparent",
            color: activeTab === tab.id ? "#00FF88" : "#444",
            padding: "16px 20px 14px", cursor: "pointer",
            fontSize: "10px", letterSpacing: "0.15em",
            fontFamily: "inherit", fontWeight: activeTab === tab.id ? "700" : "400",
            whiteSpace: "nowrap",
          }}>{tab.label}</button>
        ))}
      </div>

      <div style={{ padding: "32px 40px", maxWidth: "960px" }}>

        {/* ────────── CAMPAIGNS ────────── */}
        {activeTab === "campaigns" && (
          <div>
            <div style={{
              border: "1px solid #FF6B3533", borderRadius: "3px", padding: "14px 18px",
              background: "#0d0d0d", marginBottom: "20px",
            }}>
              <span style={{ fontSize: "9px", color: "#FF6B35", letterSpacing: "0.15em", fontWeight: "700" }}>⚠ RESEARCH GAP</span>
              <p style={{ fontSize: "12px", color: "#777", margin: "6px 0 0", lineHeight: 1.7 }}>
                These 4 campaigns are a starting point. Before finalizing your accounts, do a full sweep of whop.com to find 10-20 active campaigns. Budget distribution, creator count, and RPM rates shift weekly. Campaign research determines your entire niche strategy.
              </p>
            </div>

            {campaigns.map((c) => (
              <div key={c.id} style={{
                border: `1px solid ${expandedCampaign === c.id ? c.priorityColor + "33" : "#1a1a1a"}`,
                borderRadius: "3px", marginBottom: "10px", overflow: "hidden",
              }}>
                <div onClick={() => setExpandedCampaign(expandedCampaign === c.id ? null : c.id)} style={{
                  padding: "18px 24px", cursor: "pointer",
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  background: expandedCampaign === c.id ? "#111" : "#0d0d0d",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
                    <span style={{
                      fontSize: "9px", fontWeight: "700", letterSpacing: "0.15em",
                      color: c.priorityColor, border: `1px solid ${c.priorityColor}33`,
                      padding: "3px 7px", borderRadius: "2px",
                    }}>{c.priority}</span>
                    <span style={{ fontSize: "15px", fontWeight: "700", color: "#fff" }}>{c.name}</span>
                    <span style={{ fontSize: "12px", color: "#444" }}>{c.niche}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                    <div style={{ fontSize: "22px", fontWeight: "900", color: c.priorityColor }}>
                      {c.rpm}<span style={{ fontSize: "10px", color: "#333" }}>/1K</span>
                    </div>
                    <span style={{ color: "#333" }}>{expandedCampaign === c.id ? "−" : "+"}</span>
                  </div>
                </div>
                {expandedCampaign === c.id && (
                  <div style={{ padding: "24px", background: "#080808", borderTop: "1px solid #141414" }}>
                    <div style={{ display: "flex", gap: "28px", marginBottom: "20px", flexWrap: "wrap" }}>
                      {[["BUDGET", c.budget], ["CREATORS IN", c.creators], ["PLATFORM", c.platform], ["DIFFICULTY", c.difficulty]].map(([l, v]) => (
                        <div key={l}>
                          <div style={{ fontSize: "9px", color: "#333", letterSpacing: "0.15em", marginBottom: "4px" }}>{l}</div>
                          <div style={{ fontSize: "13px", color: "#ccc", fontWeight: "600" }}>{v}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px", marginBottom: "18px" }}>
                      <div>
                        <div style={{ fontSize: "9px", color: "#333", letterSpacing: "0.12em", marginBottom: "6px" }}>WHY THIS CAMPAIGN</div>
                        <p style={{ fontSize: "12px", color: "#888", lineHeight: 1.7, margin: 0 }}>{c.why}</p>
                      </div>
                      <div>
                        <div style={{ fontSize: "9px", color: "#333", letterSpacing: "0.12em", marginBottom: "6px" }}>CONTENT FORMAT</div>
                        <p style={{ fontSize: "12px", color: "#888", lineHeight: 1.7, margin: 0 }}>{c.contentFormat}</p>
                      </div>
                    </div>
                    <div style={{
                      background: "#111", borderLeft: `3px solid ${c.priorityColor}`,
                      padding: "12px 16px", marginBottom: "14px", borderRadius: "2px",
                    }}>
                      <div style={{ fontSize: "9px", color: "#333", letterSpacing: "0.12em", marginBottom: "5px" }}>HOOK TIP (WITH PATTERN INTERRUPT)</div>
                      <p style={{ fontSize: "12px", color: c.priorityColor, margin: 0, lineHeight: 1.6 }}>{c.hookTip}</p>
                    </div>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                      {c.tags.map(tag => (
                        <span key={tag} style={{ fontSize: "10px", color: "#444", border: "1px solid #1e1e1e", padding: "2px 8px", borderRadius: "2px" }}>{tag}</span>
                      ))}
                      <a href={c.url} target="_blank" rel="noreferrer" style={{
                        marginLeft: "auto", fontSize: "10px", color: c.priorityColor, textDecoration: "none",
                        letterSpacing: "0.1em", border: `1px solid ${c.priorityColor}33`, padding: "4px 12px", borderRadius: "2px",
                      }}>FIND ON WHOP →</a>
                    </div>
                  </div>
                )}
              </div>
            ))}

            <div style={{ marginTop: "28px", border: "1px solid #1a1a1a", borderRadius: "3px", padding: "22px", background: "#0d0d0d" }}>
              <div style={{ fontSize: "10px", color: "#00FF88", letterSpacing: "0.15em", marginBottom: "14px" }}>ACCOUNT STRATEGY</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                {[
                  ["Do I need new accounts?", "Only if existing accounts don't match the niche. Campaigns check that your page is relevant."],
                  ["How many accounts?", "Start with 2: Finance/Business (OTM + Samuel MD) and Tech/AI (Tarteel). Add Gaming (DDURZ) as 3rd only after first revenue."],
                  ["Can I combine campaigns?", "Only if niches are compatible. Finance and Medical can coexist on one page. Gaming and Finance cannot."],
                  ["Tier 1 audience?", "Post in English, US/UK topics, EST peak hours. Verify analytics after first 10 posts — don't submit without checking."],
                ].map(([q, a]) => (
                  <div key={q} style={{ borderLeft: "2px solid #1e1e1e", paddingLeft: "14px" }}>
                    <div style={{ fontSize: "11px", color: "#ddd", fontWeight: "700", marginBottom: "5px" }}>{q}</div>
                    <div style={{ fontSize: "11px", color: "#555", lineHeight: 1.7 }}>{a}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ────────── EXECUTION ────────── */}
        {activeTab === "steps" && (
          <div>
            <div style={{ fontSize: "11px", color: "#444", marginBottom: "24px", lineHeight: 1.8 }}>
              Manual process you run now. Each step maps to a node in the 22-node pipeline you build in Sprint 6. The manual process IS the spec.
            </div>
            {steps.map((phase, pi) => (
              <div key={pi} style={{ marginBottom: "36px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
                  <div style={{ width: "3px", height: "18px", background: phase.color, borderRadius: "2px" }} />
                  <div style={{ fontSize: "10px", fontWeight: "700", letterSpacing: "0.2em", color: phase.color }}>
                    PHASE {pi + 1} — {phase.phase}
                  </div>
                </div>
                {phase.items.map((item, ii) => {
                  const key = `${pi}-${ii}`;
                  const isOpen = expandedStep === key;
                  return (
                    <div key={ii} style={{
                      border: `1px solid ${isOpen ? phase.color + "22" : "#141414"}`,
                      borderRadius: "3px", marginBottom: "7px", overflow: "hidden",
                    }}>
                      <div onClick={() => setExpandedStep(isOpen ? null : key)} style={{
                        padding: "14px 18px", cursor: "pointer",
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                        background: isOpen ? "#0f0f0f" : "transparent",
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <span style={{
                            fontSize: "10px", color: phase.color,
                            border: `1px solid ${phase.color}22`, padding: "2px 7px", borderRadius: "2px",
                          }}>{ii + 1}</span>
                          <span style={{ fontSize: "13px", color: "#ccc", fontWeight: "600" }}>{item.title}</span>
                        </div>
                        <span style={{ color: "#333" }}>{isOpen ? "−" : "+"}</span>
                      </div>
                      {isOpen && (
                        <div style={{ padding: "18px", background: "#080808", borderTop: "1px solid #111" }}>
                          {item.detail.split("\n").map((line, li) =>
                            line.trim() === "" ? <br key={li} /> :
                            line.startsWith("- ") || line.startsWith("· ") ? (
                              <div key={li} style={{ display: "flex", gap: "8px", marginBottom: "5px" }}>
                                <span style={{ color: phase.color, flexShrink: 0, fontSize: "12px" }}>→</span>
                                <span style={{ fontSize: "12px", color: "#777", lineHeight: 1.7 }}>{line.replace(/^[-·]\s*/, "")}</span>
                              </div>
                            ) : (
                              <p key={li} style={{ fontSize: "12px", color: "#777", lineHeight: 1.7, margin: "0 0 6px" }}>{line}</p>
                            )
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}

        {/* ────────── AI PROMPTS ────────── */}
        {activeTab === "prompts" && (
          <div>
            <p style={{ color: "#444", fontSize: "12px", lineHeight: 1.8, marginBottom: "28px" }}>
              Two prompts. Run in sequence for every clip. Prompt 1 finds the moments and the pattern interrupt. Prompt 2 writes the words that stop the scroll.
            </p>
            {[
              {
                num: "01",
                title: "Viral Clip Identifier",
                model: "Claude Sonnet (quality matters here)",
                color: "#00FF88",
                input: "Full YouTube transcript with timestamps + campaign context (niche, RPM, required mentions)",
                output: "Ranked JSON array: timestamp_start, timestamp_end, hook_clip_timestamp (3-sec pattern interrupt), hook_score, trigger_type, opening_line, retention_arc, platform_fit",
                when: "Run once per source video. Produces 5-10 ranked clip candidates.",
                gate: "You review the ranked list and pick which clips to pursue. First human gate.",
                node: "N8N: AI Agent Node (Claude Sonnet, system prompt = Prompt 1)",
                cost: "~$0.05-0.15 per run (Sonnet pricing)",
              },
              {
                num: "02",
                title: "Caption Generator",
                model: "Claude Haiku (speed + cost at scale)",
                color: "#FFD700",
                input: "Single clip object: opening_line, trigger_type, platform, campaign rules, required tags",
                output: "3 caption variants: A = Curiosity Gap (TikTok), B = Stakes/Emotional (Instagram saves), C = Direct Keyword (YouTube Shorts). Each includes: caption text, hook overlay text (on-screen text, first 2 seconds, over pattern interrupt), hashtags, required campaign tags.",
                when: "Run once per clip from Prompt 1 output. Fed individually per clip in a loop.",
                gate: "You pick caption variant per clip. Second human gate.",
                node: "N8N: Loop Node → AI Agent Node (Claude Haiku, system prompt = Prompt 2)",
                cost: "~$0.003 per clip (Haiku pricing)",
              },
            ].map(p => (
              <div key={p.num} style={{
                border: `1px solid ${p.color}22`, borderRadius: "3px",
                marginBottom: "16px", overflow: "hidden",
              }}>
                <div style={{
                  padding: "20px 24px", background: "#0d0d0d",
                  borderBottom: "1px solid #141414",
                  display: "flex", alignItems: "center", gap: "14px",
                }}>
                  <span style={{
                    fontSize: "22px", fontWeight: "900", color: p.color,
                    border: `1px solid ${p.color}22`, padding: "4px 12px", borderRadius: "2px",
                  }}>PROMPT {p.num}</span>
                  <div>
                    <div style={{ fontSize: "16px", fontWeight: "700", color: "#fff" }}>{p.title}</div>
                    <div style={{ fontSize: "10px", color: "#444", marginTop: "3px" }}>MODEL: {p.model}</div>
                  </div>
                </div>
                <div style={{ padding: "20px 24px", background: "#080808" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                    {[["INPUT", p.input], ["OUTPUT", p.output], ["WHEN TO RUN", p.when], ["N8N NODE", p.node], ["HUMAN GATE", p.gate], ["COST", p.cost]].map(([l, v]) => (
                      <div key={l}>
                        <div style={{ fontSize: "9px", color: "#333", letterSpacing: "0.15em", marginBottom: "5px" }}>{l}</div>
                        <div style={{ fontSize: "12px", color: "#888", lineHeight: 1.6 }}>{v}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}

            <div style={{ border: "1px solid #1a1a1a", borderRadius: "3px", padding: "20px", background: "#0d0d0d" }}>
              <div style={{ fontSize: "10px", color: "#A78BFA", letterSpacing: "0.15em", marginBottom: "12px" }}>COST PER CLIP — FULL STACK</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "12px" }}>
                {[
                  ["Prompt 1\n(Sonnet)", "$0.05-0.15"],
                  ["Prompt 2\n(Haiku)", "$0.003"],
                  ["Remotion\nLambda", "$0.005-0.012"],
                  ["Whisper\nTranscription", "~$0.003"],
                  ["S3\nStorage", "~$0.001"],
                ].map(([l, v]) => (
                  <div key={l} style={{ textAlign: "center", border: "1px solid #141414", padding: "12px 8px", borderRadius: "2px" }}>
                    <div style={{ fontSize: "9px", color: "#444", marginBottom: "8px", lineHeight: 1.5, whiteSpace: "pre-line" }}>{l}</div>
                    <div style={{ fontSize: "14px", fontWeight: "900", color: "#A78BFA" }}>{v}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: "14px", padding: "10px 14px", background: "#111", borderRadius: "2px" }}>
                <span style={{ fontSize: "12px", color: "#888" }}>Total per clip: </span>
                <span style={{ fontSize: "14px", fontWeight: "700", color: "#00FF88" }}>$0.07 – $0.17</span>
                <span style={{ fontSize: "11px", color: "#444" }}> · At OTM $5/1K: break-even at ~34 views per clip</span>
              </div>
            </div>
          </div>
        )}

        {/* ────────── 22-NODE PIPELINE ────────── */}
        {activeTab === "pipeline" && (
          <div>
            <p style={{ color: "#444", fontSize: "12px", lineHeight: 1.8, marginBottom: "20px" }}>
              The full automated system. 22 nodes, 3 human gates. Yellow = you stay in the loop. Green = fully automated. This is what Sprints 1-7 build.
            </p>

            {/* Pattern Interrupt Architecture */}
            <div style={{
              border: "1px solid #00FF8822", borderRadius: "3px", padding: "20px",
              background: "#080808", marginBottom: "24px",
            }}>
              <div style={{ fontSize: "10px", color: "#00FF88", letterSpacing: "0.15em", marginBottom: "14px" }}>
                ⭐ PATTERN INTERRUPT HOOK — THE SECRET WEAPON
              </div>
              <p style={{ fontSize: "12px", color: "#888", lineHeight: 1.7, margin: "0 0 14px" }}>
                Every clip has TWO video segments rendered in sequence. The hook clip (3 seconds from elsewhere in the video) stops the scroll. The main clip delivers the value. Captions, waveform, and campaign tag run across both as independent layers.
              </p>
              <div style={{ background: "#0f0f0f", padding: "14px", borderRadius: "2px", fontFamily: "monospace" }}>
                <div style={{ fontSize: "11px", color: "#444", marginBottom: "8px" }}>Remotion composition structure:</div>
                {[
                  { frames: "[0 → 90 frames]", label: "Hook clip", color: "#FF6B35", note: "3-sec pattern interrupt · stops scroll" },
                  { frames: "[90 → end]", label: "Main clip", color: "#00FF88", note: "The actual viral moment · delivers value" },
                  { frames: "[15 → end]", label: "Waveform overlay", color: "#A78BFA", note: "Independent layer · 48 bars" },
                  { frames: "[0 → end]", label: "TikTok captions", color: "#FFD700", note: "Word-level highlights · gold active word · main clip only" },
                  { frames: "[84 → end]", label: "Campaign tag", color: "#888", note: "Required @mention + #hashtag" },
                ].map(row => (
                  <div key={row.label} style={{ display: "flex", gap: "14px", marginBottom: "6px", alignItems: "center" }}>
                    <span style={{ fontSize: "10px", color: "#333", width: "120px", flexShrink: 0 }}>{row.frames}</span>
                    <span style={{ fontSize: "11px", color: row.color, width: "120px", flexShrink: 0 }}>{row.label}</span>
                    <span style={{ fontSize: "11px", color: "#555" }}>{row.note}</span>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: "11px", color: "#444", margin: "12px 0 0", fontStyle: "italic" }}>
                Do not share this architecture externally. Remotion is your competitive edge.
              </p>
            </div>

            {/* Node Map */}
            <div style={{ marginBottom: "24px" }}>
              <div style={{ fontSize: "10px", color: "#FFD700", letterSpacing: "0.15em", marginBottom: "14px" }}>NODE MAP (22 NODES SHOWN AS 12 PHASES)</div>
              {pipelineNodes.map((row) => (
                <div key={row.step} style={{
                  display: "grid", gridTemplateColumns: "28px 110px 1fr 1fr",
                  gap: "12px", alignItems: "center",
                  padding: "10px 0", borderBottom: "1px solid #0f0f0f",
                }}>
                  <div style={{ fontSize: "10px", color: "#222", fontWeight: "700" }}>{row.step}</div>
                  <div>
                    <span style={{
                      fontSize: "9px", fontWeight: "700", letterSpacing: "0.1em",
                      color: row.color, border: `1px solid ${row.color}22`,
                      padding: "2px 6px", borderRadius: "2px",
                    }}>{row.phase}</span>
                  </div>
                  <div>
                    <div style={{ fontSize: "9px", color: "#333", letterSpacing: "0.08em", marginBottom: "3px" }}>NOW (MANUAL)</div>
                    <div style={{ fontSize: "11px", color: "#555" }}>{row.manual}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: "9px", color: "#00FF88", letterSpacing: "0.08em", marginBottom: "3px" }}>AUTOMATED</div>
                    <div style={{ fontSize: "11px", color: "#999" }}>{row.auto}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Autonomous Agent Layer */}
            <div style={{ border: "1px solid #A78BFA22", borderRadius: "3px", padding: "20px", background: "#0d0d0d" }}>
              <div style={{ fontSize: "10px", color: "#A78BFA", letterSpacing: "0.15em", marginBottom: "12px" }}>
                AUTONOMOUS AGENT LAYER — POST SPRINT 7
              </div>
              <p style={{ fontSize: "12px", color: "#888", lineHeight: 1.7, margin: "0 0 12px" }}>
                After the 22-node pipeline is running and validated in production, the autonomous layer wraps around it. Agent monitors Whop for new campaigns, reads requirements from pinned posts, selects source videos, runs the full pipeline, routes clips to the right account. You only see exceptions.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                {[
                  ["Infrastructure", "x402 payment protocol (Coinbase-built, 50M+ transactions processed). Conway Cloud runs on top of x402 — you can access x402 directly without Conway's monetized wrapper."],
                  ["Build Order", "Sprints 1-7 first. Validate pipeline works manually. Then pull yourself out of human gates one at a time as confidence builds. Full autonomy is the destination, not the starting point."],
                  ["Whop Integration", "Whop has structured pages and API access — unlike WhatsApp (no official API). Reading campaign requirements programmatically is achievable. This is why Whop matters."],
                  ["Honest Timeline", "Sprint 1-7: 2-4 weeks execution. Production validation: 4-6 more weeks. Full autonomy: 2-3 months from now. Not magical. Sequential."],
                ].map(([t, b]) => (
                  <div key={t} style={{ borderLeft: "2px solid #A78BFA22", paddingLeft: "12px" }}>
                    <div style={{ fontSize: "11px", color: "#A78BFA", fontWeight: "700", marginBottom: "5px" }}>{t}</div>
                    <div style={{ fontSize: "11px", color: "#555", lineHeight: 1.7 }}>{b}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ────────── BUILD SPRINTS ────────── */}
        {activeTab === "sprints" && (
          <div>
            <div style={{ fontSize: "11px", color: "#444", marginBottom: "24px", lineHeight: 1.8 }}>
              7 sprints. Do them in order. Sprint 1 has zero dependencies — it starts the moment midterms are done.
            </div>

            {/* Setup Checklist */}
            <div style={{ border: "1px solid #00FF8822", borderRadius: "3px", padding: "18px", background: "#0d0d0d", marginBottom: "24px" }}>
              <div style={{ fontSize: "10px", color: "#00FF88", letterSpacing: "0.15em", marginBottom: "12px" }}>BEFORE SPRINT 1 — SETUP CHECKLIST</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                {[
                  ["✅", "Vibe-persona skill built (2,352 lines)", "#00FF88"],
                  ["✅", "N8N workflow generator skill built (1,449 lines)", "#00FF88"],
                  ["✅", "22-node workflow architecture mapped", "#00FF88"],
                  ["✅", "Technical stack 100% validated (Report 5)", "#00FF88"],
                  ["✅", "Whop confirmed as campaign platform", "#00FF88"],
                  ["✅", "Cost model validated ($0.07-0.17/clip)", "#00FF88"],
                  ["✅", "Pattern interrupt hook added to workflow", "#00FF88"],
                  ["✅", "Autonomous agent thesis validated (x402)", "#00FF88"],
                  ["⬜", "Campaign research — find 10-20 active Whop campaigns", "#FF6B35"],
                  ["⬜", "Claude Code installed (curl -fsSL https://claude.ai/install.sh | bash)", "#FF6B35"],
                  ["⬜", "claude-mem installed (/plugin marketplace add thedotmack/claude-mem)", "#FF6B35"],
                  ["⬜", "Skills moved to .claude/skills/ directory", "#FF6B35"],
                  ["⬜", "Midterms complete", "#FF6B35"],
                ].map(([icon, text, color]) => (
                  <div key={text} style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                    <span style={{ fontSize: "11px", color, flexShrink: 0 }}>{icon}</span>
                    <span style={{ fontSize: "11px", color: color === "#00FF88" ? "#666" : "#999", lineHeight: 1.5 }}>{text}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: "14px", padding: "10px 14px", background: "#111", borderRadius: "2px" }}>
                <span style={{ fontSize: "11px", color: "#FFD700" }}>Sprint 1 trigger phrase: </span>
                <span style={{ fontSize: "11px", color: "#888" }}>"Sprint 1, load vibe-persona, reference Report 5"</span>
              </div>
            </div>

            {/* Sprint Cards */}
            {sprints.map((sprint) => (
              <div key={sprint.num} style={{
                border: `1px solid ${expandedSprint === sprint.num ? (sprint.status === "NEXT" ? "#00FF8833" : "#1e1e1e") : "#141414"}`,
                borderRadius: "3px", marginBottom: "8px", overflow: "hidden",
              }}>
                <div onClick={() => setExpandedSprint(expandedSprint === sprint.num ? null : sprint.num)} style={{
                  padding: "16px 20px", cursor: "pointer",
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  background: expandedSprint === sprint.num ? "#0f0f0f" : "transparent",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{
                      fontSize: "18px", fontWeight: "900",
                      color: sprint.status === "NEXT" ? "#00FF88" : "#222",
                      border: `1px solid ${sprint.status === "NEXT" ? "#00FF8833" : "#1a1a1a"}`,
                      padding: "4px 10px", borderRadius: "2px",
                    }}>{sprint.num}</span>
                    <div>
                      <div style={{ fontSize: "13px", color: "#ccc", fontWeight: "600" }}>{sprint.title}</div>
                      <div style={{ fontSize: "10px", color: "#333", marginTop: "2px" }}>DEPS: {sprint.deps}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{
                      fontSize: "9px", fontWeight: "700", letterSpacing: "0.12em",
                      color: sprint.status === "NEXT" ? "#00FF88" : "#333",
                      border: `1px solid ${sprint.status === "NEXT" ? "#00FF8822" : "#1a1a1a"}`,
                      padding: "2px 8px", borderRadius: "2px",
                    }}>{sprint.status}</span>
                    <span style={{ color: "#333" }}>{expandedSprint === sprint.num ? "−" : "+"}</span>
                  </div>
                </div>
                {expandedSprint === sprint.num && (
                  <div style={{ padding: "16px 20px", background: "#080808", borderTop: "1px solid #111" }}>
                    <p style={{ fontSize: "12px", color: "#777", lineHeight: 1.7, margin: 0 }}>{sprint.detail}</p>
                  </div>
                )}
              </div>
            ))}

            {/* Tools Reference */}
            <div style={{ marginTop: "20px", border: "1px solid #1a1a1a", borderRadius: "3px", padding: "18px", background: "#0d0d0d" }}>
              <div style={{ fontSize: "10px", color: "#FFD700", letterSpacing: "0.15em", marginBottom: "12px" }}>CLAUDE CODE STACK</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                {[
                  ["Claude Code", "Terminal agent. Lives in your project folder. Runs commands, edits files, debugs errors. No copy-paste loop."],
                  ["claude-mem", "Persistent memory across Claude Code sessions. Captures everything, compresses, injects back next session. 18K stars."],
                  ["Vibe-Persona", "Universal engineering framework. Drop into .claude/skills/vibe-persona/. Auto-activates on any coding task."],
                  ["N8N Workflow Gen", "Robert Yosen's workflow generator converted to skill. .claude/skills/n8n-workflow-generator/. Auto-activates for N8N."],
                  ["Cursor", "Code review and file browsing alongside Claude Code in terminal. Use both simultaneously."],
                  ["Report 5", "Remotion exhaustive capability analysis. Primary technical reference for Sprint 1-4. Read before every session."],
                ].map(([t, b]) => (
                  <div key={t} style={{ borderLeft: "2px solid #FFD70022", paddingLeft: "12px" }}>
                    <div style={{ fontSize: "11px", color: "#FFD700", fontWeight: "700", marginBottom: "4px" }}>{t}</div>
                    <div style={{ fontSize: "11px", color: "#555", lineHeight: 1.6 }}>{b}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* The Bigger Picture */}
            <div style={{
              marginTop: "16px", border: "1px solid #00FF8818",
              borderLeft: "3px solid #00FF88", borderRadius: "2px",
              padding: "18px", background: "#080808",
            }}>
              <div style={{ fontSize: "10px", color: "#00FF88", letterSpacing: "0.15em", marginBottom: "12px" }}>THE BIGGER PICTURE</div>
              {[
                ["Content Rewards", "→ validates the engine + generates proof revenue"],
                ["Podcast Agency SaaS", "→ monetizes the engine at enterprise scale ($297-497/month per client)"],
                ["Autonomous agent layer", "→ removes you from the loop entirely (x402 + Whop API)"],
                ["License to other clippers", "→ future: sell system access at $50-100/month when proven"],
              ].map(([t, b]) => (
                <div key={t} style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                  <span style={{ fontSize: "12px", color: "#00FF88", flexShrink: 0, fontWeight: "700" }}>{t}</span>
                  <span style={{ fontSize: "12px", color: "#555", lineHeight: 1.6 }}>{b}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
