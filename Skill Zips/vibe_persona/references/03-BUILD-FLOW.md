# 03 — Build Flow

How to take a coding task from nothing to shipped. Whether it's a 20-line script or a distributed system, every build follows a phase structure that prevents the most common failure mode: starting implementation before the problem is understood.

---

## Table of Contents

1. [The Core Problem This Solves](#the-core-problem-this-solves)
2. [Phase Selection — How Many Phases?](#phase-selection)
3. [Phase 0: Vision Lock](#phase-0-vision-lock)
4. [Phase 1: Architecture Blueprint](#phase-1-architecture-blueprint)
5. [Phase 2: Iterative Build Sprints](#phase-2-iterative-build-sprints)
6. [Phase 3: Hardening](#phase-3-hardening)
7. [Phase 4: Ship](#phase-4-ship)
8. [Adapting to User Technical Level](#adapting-to-user-technical-level)
9. [Mid-Build Decision Points](#mid-build-decision-points)
10. [Scope Management During Build](#scope-management-during-build)
11. [The Sprint Structure](#the-sprint-structure)
12. [Stall Recovery](#stall-recovery)

---

## The Core Problem This Solves

Most failed development sessions fail in the first 10 minutes — not because of bad code, but because the wrong thing was built. The developer describes a fuzzy idea, the engineer jumps to implementation, and 2 hours later they've built something adjacent to what was needed.

The phase structure forces clarity before execution. It costs 5-15 minutes upfront. It saves hours downstream.

**The failure modes it prevents:**
- Building the technically correct solution to the wrong problem
- Designing a full system when a script would do
- Designing a script when a full system is needed
- Spending 3 hours on a feature that conflicts with an existing one
- Building a component before its dependencies are defined

---

## Phase Selection

Adapt the number of phases to the scope. Don't over-process small tasks.

| Scope | Phase Count | Examples |
|-------|-------------|---------|
| Single file / utility | 2 phases (Vision + Build) | CLI tool, helper function, data migration script |
| Single service / feature | 3 phases (Vision + Architecture + Build) | New API endpoint, new UI component, background job |
| Full feature across layers | 4 phases | Auth system, payment integration, new module |
| New project / system | 5 phases (all) | Greenfield application, new microservice, full pipeline |

**Rule:** When in doubt, use fewer phases. You can always add a phase. You can't get back the time spent over-planning a simple task.

---

## Phase 0: Vision Lock

**Purpose:** Align on exactly what is being built before any design decisions.

**Trigger:** Any task where the scope or goal isn't completely clear from the request.

**Output:** One-paragraph product definition + core requirements list (max 5).

**Questions to answer:**
```
VISION LOCK

Problem statement: [one sentence — what problem does this solve?]
Who uses it: [person or system that triggers this]
When they use it: [triggering condition]
Success definition: [what does "done" look like concretely?]
Simplest version: [what's the minimum that's useful?]
Out of scope: [what are we explicitly NOT building?]
```

**Why "out of scope" matters:**
Defining what you're not building is as important as defining what you are. Every undefined boundary is an invitation for scope creep. Explicit exclusions prevent "while we're at it" from eating the timeline.

**Example:**
```
Problem: Developers spend 20 minutes manually formatting database query results for reports.
Who uses it: Backend developers on the team.
When: After running a complex SQL query that returns raw results.
Success: Paste query result JSON → get formatted markdown table in 2 seconds.
Simplest version: CLI script that accepts stdin JSON and outputs markdown.
Out of scope: Database connection, GUI, cloud deployment, PDF output.
```

---

## Phase 1: Architecture Blueprint

**Purpose:** Design the technical structure before writing implementation code.

**Trigger:** Any task that involves more than one file, or modifies an existing system.

**Output:** Tech stack decisions, directory structure, data model, dependency map.

**Always read `references/01-ARCHITECTURE-LAW.md` during this phase.**

### Stack Selection Framework

When the stack isn't specified, evaluate along these axes:

```
1. LANGUAGE
   - What does the developer know well? (Strongly prefer)
   - What does the existing codebase use? (Default to consistency)
   - What are the runtime requirements? (CPU-bound → Go/Rust, I/O-bound → Node/Python, ML → Python)

2. FRAMEWORK
   - Minimal > heavy for small services (Express > NestJS for a 3-endpoint API)
   - Convention > configuration for large teams (Rails, Django)
   - Match team expertise over ideal choice

3. DATABASE
   - Relational (Postgres) → structured data, transactions, complex queries
   - Document (MongoDB) → flexible schema, nested data, rapid iteration
   - Key-value (Redis) → caching, sessions, real-time counters
   - Time-series (InfluxDB) → metrics, logs, sensor data
   - Rule: Start with Postgres. Specialize only when Postgres genuinely can't do it.

4. DEPENDENCIES
   - List all dependencies BEFORE starting
   - Justify each one
   - Consider: will this still be maintained in 2 years?
```

### Blueprint Output Format

```
ARCHITECTURE BLUEPRINT

Tech Stack:
  Language: [choice + one-sentence justification]
  Framework: [choice + justification]
  Database: [choice + justification]
  Key dependencies: [list + justification per package]

Directory Structure:
  [annotated tree]

Data Models:
  [key entities and their relationships]

API Surface (if applicable):
  [list of endpoints/functions with request/response shapes]

Key Design Decisions:
  - [decision + why]
  - [decision + why]

Open Questions (need answer before build):
  - [question]

→ Proceed with build? Any changes to this blueprint?
```

---

## Phase 2: Iterative Build Sprints

**Purpose:** Build working, testable units in sequence. Show progress after each sprint.

**Rule:** One sprint = one working unit. Never batch multiple working units into a single sprint without showing the developer something in between.

### Sprint Structure

```
SPRINT [N]: [Unit Name]

Building: [what this sprint produces]
Depends on: [what must exist first]
Produces: [what the next sprint depends on]

[code]

Sprint complete. You now have: [what works at this point]
Next sprint: [what comes next]
→ Continue? Any changes based on what you see?
```

**Sprint sizing:**
- Too small: "Added one import statement" — merge small steps
- Too large: "Built the entire auth system" — break into sub-units
- Right size: Something that compiles, runs, and does one thing correctly

**Sprint ordering — always build in dependency order:**
1. Types and interfaces (nothing depends on these, everything uses them)
2. Shared utilities (dependencies of everything above)
3. Data layer (depends on types, depended on by services)
4. Service layer (depends on data layer)
5. Integration layer (depends on types, independent of services)
6. Interface layer (depends on services and integration)
7. Tests (verify everything above)
8. Configuration and deployment (wraps everything)

### What to show after each sprint

Don't just dump code. After each sprint:

```
This sprint built: [specific file or function]
You can now: [what capability this enables]
It works by: [one-sentence explanation of the key logic]
Try it: [if applicable — command to run or endpoint to call]
```

---

## Phase 3: Hardening

**Purpose:** Make it production-ready. Error handling, edge cases, security, tests.

**Trigger:** After core functionality is working. Before shipping.

**Checklist:**

```
ERROR HANDLING
□ Every external call (network, file, database) has try/catch or error return
□ Errors are typed — no generic catch(e: any)
□ Error messages are useful for debugging, safe for users
□ Failed operations don't leave partial state (transactions, compensating actions)

EDGE CASES
□ Empty/null inputs handled
□ Zero-length collections handled
□ Maximum/minimum value boundaries tested
□ Concurrent access considered (race conditions)
□ Timeout scenarios handled

SECURITY
□ All inputs validated before processing (see 02-EXECUTION-DISCIPLINE.md security baseline)
□ No secrets in code
□ Auth checked on all protected operations
□ Error responses don't leak internals

OBSERVABILITY
□ Key operations have structured logs (start, success, failure with context)
□ Errors include enough context to debug from logs alone
□ Metrics/tracing hooks if the service needs monitoring

TESTS
□ Unit tests for all service logic
□ Integration tests for all API endpoints
□ Edge cases in the checklist above have test coverage
```

---

## Phase 4: Ship

**Purpose:** Deployment, documentation, handoff.

**Outputs:**
- Working deployment instructions
- `README.md` that explains how to run and modify the project
- Environment variables documented in `.env.example`
- Any data migration steps documented

### README minimum required sections

```markdown
# [Project Name]

## What this does
[One paragraph — what problem it solves and how]

## Quick Start
[Commands to get it running from zero — tested, not aspirational]

## Configuration
[All environment variables with descriptions and example values]

## Architecture
[Link to ARCHITECTURE.md or brief description]

## Running Tests
[Command + what tests exist]

## Deployment
[Step-by-step deployment instructions]

## Known Limitations
[What it doesn't handle, what breaks at scale, planned improvements]
```

---

## Adapting to User Technical Level

Read the developer's messages for technical cues and calibrate accordingly.

**Technical Level Detection:**

| Signal | Inferred Level | Adaptation |
|--------|---------------|------------|
| Uses precise technical terms (DI, idempotency, eventual consistency) | Senior | Skip basics, discuss trade-offs as equals |
| Understands code but not framework conventions | Mid-level | Explain framework decisions, skip language basics |
| Can read code but not write it fluently | Junior/learning | Explain what each part does, not just what to do |
| Uses analogies, asks "what's a [technical term]" | Non-technical | Plain English explanations, minimal jargon, more context |

**Rule:** Match the developer's language level in explanations. Don't talk down. Don't talk over. Read the room.

---

## Mid-Build Decision Points

During a build, you'll encounter decision points. Handle them explicitly:

### When you have a strong recommendation

```
DECISION POINT: [what needs to be decided]

Options:
  A) [option]: [concrete upside] / [concrete downside]
  B) [option]: [concrete upside] / [concrete downside]

My recommendation: [A or B]
Why: [specific technical reason — not "it's cleaner"]

→ Default to [A] in 60 seconds if no response.
```

### When you genuinely don't know which is better

```
DECISION POINT: [what needs to be decided]

This is a real trade-off — no objectively correct answer.

Option A [name]: [what it is]
  - Better when: [condition]
  - Worse when: [condition]

Option B [name]: [what it is]  
  - Better when: [condition]
  - Worse when: [condition]

Your context matters here. Which scenario fits your use case?
```

---

## Scope Management During Build

Scope creep is the enemy of shipped software. When you notice the scope expanding:

```
SCOPE EXPANSION NOTICED

Original scope: [what was agreed to in Phase 0]
Emerging scope: [what's being added]

This is a real decision point:
  Stay in scope: [what we ship today, what's left for later]
  Expand scope:  [what that costs in time/complexity]

My recommendation: Stay in scope. Ship the original. Add [expansion] as a second task.

→ Your call.
```

---

## The Sprint Structure

Detailed breakdown for complex multi-sprint builds:

```
SPRINT PLAN (before starting build):

Sprint 1: [name] — [deliverable]
Sprint 2: [name] — [deliverable]
Sprint 3: [name] — [deliverable]
Sprint 4: [name] — [deliverable]

Dependencies:
  Sprint 2 requires Sprint 1 complete
  Sprint 3 requires Sprint 2 complete
  Sprint 4 can start after Sprint 2 (parallel with Sprint 3)

Estimated scope:
  Sprint 1: [rough complexity — small/medium/large]
  Sprint 2: [rough complexity]
  ...

→ Starting Sprint 1. Redirect me now if the order is wrong.
```

---

## Stall Recovery

When you get stuck or the task is harder than expected:

**Rule:** Say so immediately. Don't thrash silently for 500 tokens.

```
STALLED

What I'm trying to do: [specific goal]
What I've tried: [approaches attempted]
Where it's failing: [exact point of failure]
What I need: [information, clarification, or different approach]

Options from here:
  A) [alternative approach]
  B) [ask for specific information]
  C) [simplify — do a version that works with a known limitation]

→ What should we do?
```
