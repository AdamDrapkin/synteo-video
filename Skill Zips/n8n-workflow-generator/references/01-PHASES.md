# 01 — Phases

The complete phase playbook for N8N workflow generation. Every workflow passes through a subset of these phases determined by complexity. Read this before generating anything.

---

## Phase 0: Context Foundation
**Activate when:** Complexity warrants it, or user hasn't provided any context yet.

```
"Before we design your automation, let's establish context.

You can provide:
1. Business context (what you do, tools you use, recurring tasks)
2. A brief description of the automation you want

Or just describe the automation and we'll extract context as we go.
Which works better?"
```

**If user provides a context document:**
- Parse all tools mentioned
- Identify existing integrations
- Note pain points and time sinks
- Extract technical proficiency from language used

**If user prefers direct description:** Skip to Phase 1 immediately.

**Output:** Context map OR immediate proceed to Phase 1.

---

## Phase 1: Requirement Discovery

Guide the user to clarity using Socratic questioning — never assume, never fill gaps silently.

```
"Describe what you want to automate. As you do, consider:

Where do you spend time but create no value?
What task do you repeat yet resent every time?
What would break if you stopped doing it manually?

Tell me:
1. What you want automated (the process)
2. What starts it (trigger: form, payment, schedule, webhook, etc.)
3. What data moves (from where to where)
4. What the end result looks like (email sent, record created, notification fired)

Don't worry about technical details — just describe the flow naturally."
```

**Examine for:**
- Core automation objective
- Required operations and transformations
- Integration endpoints
- Decision points and branching conditions
- Expected data flow
- User technical comfort level (adjust all language accordingly)

**Output:** Clear automation blueprint in the user's own words.

---

## Phase 2: Operation Identification & Workflow Structure

Break the description into discrete N8N operations.

**For each operation, identify:**
- Node type (HTTP Request, Code, IF, Switch, Set, Wait, Loop, Webhook, Schedule, etc.)
- Input data required
- Output data produced
- Dependencies (what must run before this)
- Whether it's on the happy path or an error path

**Ask clarifying questions only where logic is genuinely ambiguous:**
```
"When you say 'notify the team' — do you mean:
  A) Individual emails to each person?
  B) One email with everyone CC'd?
  C) A Slack message to a shared channel?

Small detail, big difference in the workflow."
```

**Output:** Complete operation inventory with node types, sequence, and dependency map.

---

## Phase 3: Pre-Flight Setup Validation

Critical checkpoint before building. Prevents import errors later.

```
"Before we generate your workflow, let's confirm the foundation.

Do you have:
- Accounts created for all tools mentioned?
- API keys or credentials accessible?
- APIs enabled where required?
- Test data ready? (dummy record, sample form submission, test webhook payload)
- N8N instance ready (cloud, self-hosted, or desktop)?

If not — that's fine. I'll generate the workflow anyway and include
detailed setup instructions inside it.

Status: ready with credentials, or should I include full setup guidance?"
```

**Based on response:**
- Ready → proceed with clean JSON generation
- Not ready → embed detailed credential acquisition steps in output
- Always include test data recommendations regardless

**Output:** Setup readiness assessment + adjusted generation approach.

---

## Phase 4: Logic Mapping & Data Flow Design

Design the complete logical structure before writing a single node.

**Map:**
- Source and destination for every data field
- Branching conditions (IF nodes, Switch nodes)
- Error handling paths (what happens when each node fails)
- Data transformations required (Code nodes, Set nodes)
- Execution order optimization
- Retry logic placement
- Loops and iteration (split-in-batches, loop-over-items)

**Pattern questions:**
```
"Does this workflow need:
- Error notifications if something fails?
- Retry logic for API timeouts?
- Data validation before processing?
- Execution logging for debugging?

Adding these now prevents hours of debugging later."
```

**Output:** Logic flow diagram (text-based) + connection matrix + error handling plan.

---

## Phase 5: Node Configuration Design

For every node in the operation inventory:

- Define exact node settings and parameters
- Configure API endpoints, methods, headers, body
- Set up data transformations with exact field references
- Apply authentication type and credential placeholder
- Add inline comments in Code nodes
- Set execution order number
- Use descriptive node names (not "HTTP Request 3" — "Fetch User Profile from Stripe")
- Include test values for immediate validation

**Naming convention:**
```
[Verb] [Object] [from/to Service]
Examples:
  "Fetch Episode Transcript from Supadata"
  "Parse Claude Response to JSON"
  "Create Record in Airtable"
  "Send Error Alert to Slack"
  "Wait for Lambda Webhook"
```

**Output:** Detailed node configuration spec for every node, ready to translate to JSON.

---

## Phase 6: JSON Structure Assembly

Build the importable workflow JSON.

**Structure requirements:**
```json
{
  "name": "Descriptive Workflow Name",
  "nodes": [...],
  "connections": {...},
  "active": false,
  "settings": {
    "executionOrder": "v1"
  },
  "meta": {
    "instanceId": ""
  }
}
```

**Layout philosophy:**
- Left-to-right flow — trigger at x:0, completion at rightmost x
- Each node ~220px apart horizontally
- Vertical branching for parallel paths (+200y per branch)
- Error paths positioned below main flow (+300y)
- No overlapping nodes
- Grouped logically by phase where possible

**Node ID format:** UUID v4 — generate unique IDs for every node.

**Output:** Initial JSON structure with all nodes positioned and connected.

---

## Phase 7: Pattern Matching & Best Practices

Compare the generated workflow against known production patterns.

**Automatically apply:**
- Retry logic on every HTTP Request node (maxTries: 3, waitBetweenTries: 1000ms)
- Error notification on every workflow (at minimum: Slack or email alert on failure)
- Data validation nodes before any destructive operations
- Rate limiting awareness (add wait nodes before APIs with strict limits)
- Idempotency checks where the workflow could run twice on the same data

**Review for common failure points:**
- Missing error branches
- Assuming API response shape without validation
- No timeout handling on Wait nodes
- Credentials referenced before being defined
- Loop nodes without exit conditions

**Output:** Enhanced workflow with patterns applied + list of reliability improvements added.

---

## Phase 8: Final JSON Generation & Validation

Complete workflow package — the deliverable.

**Internal validation checklist before outputting:**
```
□ Schema compliance — valid N8N v1.0+ format
□ All nodes have unique IDs
□ All connections reference valid node IDs
□ All credential fields marked [REPLACE: description]
□ Retry logic present on external API calls
□ Error handler branch exists
□ Execution order set on all nodes
□ Layout has no overlapping nodes
□ No hardcoded secrets or tokens
□ Test mode safe (active: false)
```

**Output:** Complete importable N8N workflow JSON in a fenced code block. No truncation. No "...rest of JSON here." The entire thing.

---

## Phase 9: Implementation & Deployment Guide

Step-by-step from JSON to running workflow.

**Import steps:**
```
1. Open N8N → click the menu (top right) → "Import from File/URL"
2. Paste the JSON provided above
3. Click "Import"
4. Rename the workflow if desired
```

**Credential setup (per node requiring auth):**
```
For each [REPLACE: X] placeholder:
1. Click the node
2. Click "Create New Credential"
3. Select the credential type
4. Enter API key / OAuth details
5. Test connection (green checkmark = success)
```

**Required credentials for this workflow:**
[List specific credential types + where to get them]

**Test data:**
```
Before activating, prepare:
- [Specific test scenario 1 — exact data to use]
- [Specific test scenario 2 — edge case]
```

**Testing procedure:**
```
1. Click "Execute Workflow" (do NOT toggle Active yet)
2. Trigger the test event manually
3. Watch each node — green = passed, red = failed
4. If red → click node → read the error output → note exact message
5. Verify data arrived at destination tools correctly
```

**Activation:**
```
Once test execution succeeds end-to-end:
Toggle the "Active" switch (top right of workflow editor)
The workflow now runs automatically on trigger.
```

**Common errors for this workflow type:**
[3-5 specific errors + exact fixes]

**Output:** Complete deployment guide with troubleshooting built in.

---

## Phase 10: Documentation Package (Optional)

Offer after deployment guide:

```
"Would you like workflow documentation for your team or future reference?

I can generate:
- Markdown summary
- Notion-ready format

Includes: purpose, tools connected, trigger, step-by-step node logic,
troubleshooting notes, maintenance tips.

Say 'yes' or 'skip'."
```

**If yes, generate:**
```markdown
# [Workflow Name]

## Purpose
[Clear one-paragraph description]

## Tools Used
- [Tool] — [what it does in this workflow]

## Trigger
[What starts this workflow and under what conditions]

## Flow Steps
1. [Node name] — [what it does]
2. [Node name] — [what it does]
...

## Setup Requirements
- [Credential 1] — [where to get it]
- [Credential 2] — [where to get it]

## Testing Checklist
- [ ] [Test scenario 1]
- [ ] [Test scenario 2]

## Troubleshooting
**Error:** [Common error message]
**Cause:** [Why it happens]
**Fix:** [Exact steps to resolve]

## Maintenance Notes
[What to check periodically, expected failure modes, renewal reminders]
```

**Output:** Formatted documentation ready to copy into any tool.
