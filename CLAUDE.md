# CLAUDE.md — Synteo Video Pipeline

## What This Project Is

Automated short-form video generation system for Content Rewards campaigns.
Input: Long-form video + campaign config
Output: Captioned vertical clips with waveform, ready to post

## Stack

- Remotion v4.x — video composition and Lambda rendering
- Express.js — API wrapper between N8N and Remotion Lambda
- AWS Lambda + S3 — distributed rendering and storage
- N8N — workflow orchestration (separate repo)
- Whisper — transcription preprocessing
- Claude API — clip identification and caption generation (Prompt 1 + 2)

## File Structure

```
synteo-video/
  src/
    compositions/
      SocialClip.tsx       ← Sprint 1 target
      Audiogram.tsx        ← Sprint 3
    components/
      Waveform.tsx
      Captions.tsx
      MemeCard.tsx         ← black box container
    api/
      server.ts            ← Express wrapper
      render.ts
      progress.ts
  tasks/
    todo.md
    lessons.md
  remotion.config.ts
  package.json
```

## Sprint Sequence

1. SocialClip composition local (Remotion only) — YOU ARE HERE
2. Deploy to Lambda + test render
3. Express API /render + /progress
4. Express /media (FFmpeg, Whisper, S3)
5. Express /webhook + N8N resume handler
6. N8N 22-node workflow
7. Airtable + Slack integration

## Key References

- Report 5: /mnt/project/Remotion_Framework__Exhaustive_Capability_Analysis_for_Synteo_LLC.md
- Clip Prompts: clip-system-prompts.md
- 22-node map: 22-node-workflow-map.md

## Composition Spec — SocialClip (Sprint 1)

Format: 1080x1920, 30fps, H.264

Structure:

- [0-90 frames] Hook clip — 3-sec pattern interrupt from elsewhere in video
- [90-end] Main clip — the viral moment
- [15-end] Waveform overlay — 48 bars, bottom of frame
- [0-end] TikTok captions — word-level, white text black border, active word highlight
- [84-end] Campaign tag — required @mention + #hashtag

## Input Props (Zod schema)

- hookClipUrl: string
- mainClipUrl: string
- captionData: Caption[] (from @remotion/captions)
- campaignTag: string
- aspectRatio: '9:16' | '16:9' | '1:1'

## Workflow Orchestration

### 1. Plan Mode Default

- Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions)
- If something goes sideways, STOP and re-plan immediately — don't keep pushing
- Use plan mode for verification steps, not just building
- Write detailed specs upfront to reduce ambiguity

### 2. Subagent Strategy

- Use subagents liberally to keep main context window clean
- Offload research, exploration, and parallel analysis to subagents
- For complex problems, throw more compute at it via subagents
- One task per subagent for focused execution

### 3. Self-Improvement Loop

- After ANY correction from the user: update `tasks/lessons.md` with the pattern
- Write rules for yourself that prevent the same mistake
- Ruthlessly iterate on these lessons until mistake rate drops
- Review lessons at session start for relevant project

### 4. Verification Before Done

- Never mark a task complete without proving it works
- Diff your behavior between main and your changes when relevant
- Ask yourself: "Would a staff engineer approve this?"
- Run tests, check logs, demonstrate correctness

### 5. Demand Elegance (Balanced)

- For non-trivial changes: pause and ask "is there a more elegant way?"
- If a fix feels hacky: "Knowing everything I know now, implement the elegant solution"
- Skip this for simple, obvious fixes — don't over-engineer
- Challenge your own work before presenting it

### 6. Autonomous Bug Fixing

- When given a bug report: just fix it. Don't ask for hand-holding
- Point at logs, errors, failing tests — then resolve them
- Zero context switching required from the user
- Go fix failing CI tests without being told how

## Task Management

1. **Plan First**: Write plan to `tasks/todo.md` with checkable items
2. **Verify Plan**: Check in before starting implementation
3. **Track Progress**: Mark items complete as you go
4. **Explain Changes**: High-level summary at each step
5. **Document Results**: Add review section to `tasks/todo.md`
6. **Capture Lessons**: Update `tasks/lessons.md` after corrections

## Core Principles

- **Simplicity First**: Make every change as simple as possible. Impact minimal code.
- **No Laziness**: Find root causes. No temporary fixes. Senior developer standards.
- **Minimal Impact**: Changes should only touch what's necessary. Avoid introducing bugs.
