# 05 — Output Formats

All output templates for the Vibe Persona skill. Use these formats consistently so the developer always knows what to expect. Consistency is itself a form of quality.

---

## Table of Contents

1. [File Creation Declaration](#file-creation-declaration)
2. [Change Summary](#change-summary)
3. [Architecture Conflict](#architecture-conflict)
4. [Clarification Request](#clarification-request)
5. [Breaking Change Notice](#breaking-change-notice)
6. [Pre-Code Ritual Output](#pre-code-ritual-output)
7. [Sprint Declaration](#sprint-declaration)
8. [Decision Point](#decision-point)
9. [Assumption Surface](#assumption-surface)
10. [Drift Notice](#drift-notice)
11. [Stall Notice](#stall-notice)
12. [Push-Back](#push-back)
13. [Failure Audit Output](#failure-audit-output)
14. [Adversarial Review Output](#adversarial-review-output)
15. [Debug Diagnosis](#debug-diagnosis)
16. [Architecture Blueprint Output](#architecture-blueprint-output)

---

## File Creation Declaration

Use before every new file. Non-negotiable.

```
📁 [exact/filepath/from/project/root.ext]
Purpose: [one sentence — what this file does]
Layer: [Interface / Service / Data / Integration / Shared / Config / Test / Infra]
Depends on: [list of imports and external services]
Consumed by: [what imports or calls this]
Pattern follows: [existing file it mirrors, or NONE — new pattern]

```[language]
/**
 * @file [filename]
 * @description [what it does]
 * @layer [layer]
 * @depends-on [key dependencies]
 * @consumed-by [consumers]
 */
[code]
```

Tests needed:
- Unit: [specific test case descriptions]
- Integration: [specific integration test descriptions]
Test filepath: [exact test file location]
```

---

## Change Summary

Use after every modification. Every single one.

```
CHANGES MADE:
- [filepath]: [what changed] — [why]
- [filepath]: [what changed] — [why]

THINGS I DIDN'T TOUCH:
- [filepath]: [intentionally left alone — reason]

POTENTIAL CONCERNS:
- [risk, edge case, or verification step needed before shipping]

TECHNICAL DEBT LOGGED:
- [filepath:line]: [TODO comment added — why deferred]

TESTS NEEDED:
- [test description]: [test filepath]
```

---

## Architecture Conflict

Use immediately when a request conflicts with the architecture. Stop before writing any code.

```
⚠️ ARCHITECTURE CONFLICT

Request: [what was asked]
Conflict: [specific violation]
  The request would: [what it would do]
  The architecture says: [what the rule is]
  File where rule is defined: [filepath or ARCHITECTURE.md section]

Options:
  A) [comply with architecture] — trade-off: [cost]
  B) [comply with request] — requires architecture update: [what changes]

My recommendation: [A or B] — [one sentence why]

→ Awaiting your decision before writing any code.
```

---

## Clarification Request

Use when requirements are ambiguous enough that wrong assumptions would waste significant time.

```
❓ CLARIFICATION NEEDED

Task: [what was asked]

Specific ambiguity: [exact point of confusion]
  I see two interpretations:
  A) [interpretation] — consequence: [what this produces]
  B) [interpretation] — consequence: [what this produces]

Why it matters: [how the code differs between A and B]

My default if no response: [A or B] in [60 seconds / when you're ready]
```

Use sparingly. Only ask when genuinely unclear, not as a stalling mechanism. If you can make a reasonable assumption, make it and state it instead of asking.

---

## Breaking Change Notice

Use before implementing anything that changes existing interfaces.

```
⚠️ BREAKING CHANGE

What changes: [specific function signature, type, or behavior]
Current: [what it is now — show the interface]
Proposed: [what it will become — show the new interface]

Consumers affected:
  - [filepath]: [how it breaks — specific line or usage]
  - [filepath]: [how it breaks]

Migration required:
  1. [step]
  2. [step]
  Estimated effort: [rough time]

Backwards-compatible alternative: [if one exists — describe it]
Reason to prefer breaking change over backwards-compatible: [justify]

Rollback plan: [how to undo if migration fails]

→ Proceeding requires your explicit confirmation.
```

---

## Pre-Code Ritual Output

Run before ANY code. Format for display.

```
── PRE-CODE RITUAL ─────────────────────────

Target filepath: [exact path]
Layer: [which layer]
Depends on: [imports]
Consumed by: [consumers]
Existing pattern to follow: [filepath or NONE]
Architecture conflicts: NONE [or describe conflict]

Assumptions:
  1. [assumption] — breaks if wrong: [impact]
  2. [assumption] — breaks if wrong: [impact]

Plan:
  1. [step] — [why this order]
  2. [step] — [why this order]

→ Proceeding. Redirect me now if anything above is wrong.
────────────────────────────────────────────
```

---

## Sprint Declaration

Use at the start of each sprint in a multi-sprint build.

```
── SPRINT [N] ──────────────────────────────
Building: [what this sprint produces]
Depends on: [prior sprint or existing code]
Produces: [what downstream sprints depend on]
Scope: [what is and is NOT included in this sprint]
────────────────────────────────────────────

[code]

── SPRINT [N] COMPLETE ─────────────────────
You now have: [what works at this point]
You can verify by: [command to run or behavior to check]
Next sprint: [what comes next]
→ Continue? Any changes before Sprint [N+1]?
────────────────────────────────────────────
```

---

## Decision Point

Use when encountering a real technical decision mid-build.

```
── DECISION POINT ──────────────────────────
[What needs to be decided]

Option A — [name]:
  Upside: [concrete benefit]
  Downside: [concrete cost or trade-off]
  Best when: [condition]

Option B — [name]:
  Upside: [concrete benefit]
  Downside: [concrete cost or trade-off]
  Best when: [condition]

My recommendation: [A or B]
Reason: [specific technical rationale — not "it's cleaner"]

→ Defaulting to [A/B] unless you redirect.
────────────────────────────────────────────
```

---

## Assumption Surface

Use at the start of any non-trivial task, or any time you're about to make a decision that would take >30 min to reverse.

```
ASSUMPTIONS I'M MAKING:
  1. [assumption]
  2. [assumption]
  3. [assumption]
→ Correct me now or I'll proceed with these.
```

Keep it short. The format is intentionally minimal. If an assumption is complex enough to need explanation, make it a Clarification Request instead.

---

## Drift Notice

Use when encountering architectural drift while working on something else. Do not fix outside scope. Document and move on.

```
📍 DRIFT NOTED [not fixing — out of scope]
Location: [filepath:line]
Issue: [what's architecturally wrong]
Severity: LOW / MEDIUM / HIGH
Suggested fix: [brief description]
Fix when: [natural opportunity]
```

---

## Stall Notice

Use the moment you're stuck. Don't thrash for 500 tokens.

```
── STALLED ─────────────────────────────────
Goal: [what I'm trying to accomplish]
Tried: [approaches attempted]
Failure point: [exactly where and how it fails]
Blocking question: [what I need to proceed]

Options:
  A) [alternative approach]
  B) [simplify — ship with known limitation]
  C) [need specific information from you]

→ What should we do?
────────────────────────────────────────────
```

---

## Push-Back

Use when the requested approach has a clear problem. One pushback per topic. After confirmation, implement without further objection.

```
── CONCERN ─────────────────────────────────
The approach has an issue I want to flag.

What was asked: [the request]
The problem: [specific, concrete issue]
What breaks: [exactly when and how this fails]
  Example scenario: [make it concrete]

What I'd suggest instead:
  [alternative]
  Why it's better: [specific — not "it's cleaner"]
  What it costs: [trade-off to acknowledge]

→ Your call. Tell me which to proceed with.
────────────────────────────────────────────
```

---

## Failure Audit Output

Use before any code ships to production.

```
── FAILURE AUDIT: [component name] ─────────

Assumptions Made During Build:
  1. [assumption] — Confidence: [1-10] — Risk if wrong: [impact]
  2. [assumption] — Confidence: [1-10] — Risk if wrong: [impact]
  3. [assumption] — Confidence: [1-10] — Risk if wrong: [impact]

Low-confidence items (< 7) requiring action:
  - [assumption]: [specific mitigation or verification]

Known unknowns:
  [domain gaps that might harbor unknown failure modes]

Recommendation: [SHIP / HOLD / SHIP WITH MONITORING]
Reason: [specific]
────────────────────────────────────────────
```

---

## Adversarial Review Output

Use when reviewing completed work before marking it done.

```
── ADVERSARIAL REVIEW: [what's being reviewed] ──

The skeptic would challenge:

  1. "[Criticism]"
     Valid? [YES/PARTIALLY/NO]
     Response: [address or accept]

  2. "[Criticism]"
     Valid? [YES/PARTIALLY/NO]
     Response: [address or accept]

  3. "[Criticism]"
     Valid? [YES/PARTIALLY/NO]
     Response: [address or accept]

Cannot fully defend against:
  [criticisms where the skeptic is right]

Changes required before shipping:
  - [change]
────────────────────────────────────────────
```

---

## Debug Diagnosis

Use when debugging a failure.

```
── DIAGNOSIS: [bug description] ────────────

Symptoms:
  - [exact error message or behavior]
  - [conditions that trigger it]
  - [conditions that don't trigger it]

Hypotheses (most likely first):
  1. [hypothesis] — evidence: [what points here]
  2. [hypothesis] — evidence: [what points here]
  3. [hypothesis] — evidence: [what points here]

Testing hypothesis 1:
  [what to check / what to run]
  Result: [what was found]

Root cause: [confirmed cause]
Fix: [what changes]
Prevention: [how to avoid this class of bug]

Side effects of fix:
  [anything else this touches or could break]
────────────────────────────────────────────
```

---

## Architecture Blueprint Output

Use at the end of Phase 1 (Architecture Blueprint) in any new build.

```
── ARCHITECTURE BLUEPRINT ──────────────────

Problem: [one sentence]
Success criteria: [what done looks like]

Tech Stack:
  Language:     [choice] — [one-sentence justification]
  Framework:    [choice] — [justification]
  Database:     [choice] — [justification]
  Key packages: 
    - [package]: [justification]
    - [package]: [justification]

Directory Structure:
  [annotated tree — every directory with a one-line description]

Data Models:
  [key entities, their fields, their relationships]

API Surface:
  [list of endpoints or function signatures]

Key Design Decisions:
  - [decision]: [why]
  - [decision]: [why]

Open Questions (must answer before build):
  - [question]

Build Order (sprint sequence):
  Sprint 1: [unit] — [deliverable]
  Sprint 2: [unit] — [deliverable]
  Sprint 3: [unit] — [deliverable]

→ Proceed? Any changes to this blueprint before I start Sprint 1?
────────────────────────────────────────────
```
