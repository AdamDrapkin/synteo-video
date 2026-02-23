# 03 — Output Formats

All output templates for the N8N Workflow Generator. Use these consistently so every workflow generation produces the same predictable structure. Consistency is itself a quality standard.

---

## Table of Contents

1. [Operation Inventory](#operation-inventory)
2. [Complete JSON Output](#complete-json-output)
3. [Credential Setup List](#credential-setup-list)
4. [Test Data Recommendations](#test-data-recommendations)
5. [Import Guide](#import-guide)
6. [Deployment Checklist](#deployment-checklist)
7. [Troubleshooting Block](#troubleshooting-block)
8. [Documentation Package](#documentation-package)
9. [Clarification Request](#clarification-request)
10. [Complexity Assessment](#complexity-assessment)

---

## Operation Inventory

Output before every JSON generation. Shows the user what's being built before you build it.

```
── OPERATION INVENTORY ──────────────────────────────────
Workflow: [Name]
Complexity: [SIMPLE / STANDARD / COMPLEX / ENTERPRISE]
Phase count: [N]
Total nodes: [N]

TRIGGER
  [1] [Node Name] — [Node Type] — [what starts the workflow]

PHASE [N]: [Phase Name]
  [2] [Node Name] — [Node Type] — [what it does in one line]
  [3] [Node Name] — [Node Type] — [what it does in one line]
  [4] [Node Name] — [Node Type] — [what it does in one line]

PHASE [N]: [Phase Name]
  [5] [Node Name] — [Node Type] — [what it does in one line]
  ...

ERROR HANDLER (separate, always active)
  [E1] Error Trigger — fires on any node failure
  [E2] [Alert Node] — notifies on failure

HUMAN GATES: [N] ★ (nodes [X, Y, Z])
EXTERNAL SERVICES: [list]
CREDENTIALS REQUIRED: [N] ([list])

→ Proceeding to JSON. Redirect me now if the node list is wrong.
─────────────────────────────────────────────────────────
```

---

## Complete JSON Output

Format for the main JSON deliverable:

````
── IMPORTABLE WORKFLOW JSON ─────────────────────────────
Copy everything between the backticks and import into N8N.

```json
{
  [complete workflow JSON here — never truncated]
}
```
─────────────────────────────────────────────────────────
````

**Rules:**
- Never truncate — "...rest of JSON" is a failure
- Never add prose inside the code block
- Always wrap in a fenced code block with `json` language tag
- The JSON must be syntactically valid — test it mentally before outputting

---

## Credential Setup List

Output immediately after JSON:

```
── CREDENTIALS REQUIRED ─────────────────────────────────

[N] credentials needed. Set each up before testing.

1. [Service Name] — [credential type]
   → Where to get it: [URL or exact path in the service UI]
   → In N8N: Settings → Credentials → New → search "[type]"
   → Paste into: [field name]

2. [Service Name] — [credential type]
   → Where to get it: [URL or exact path]
   → In N8N: [same instructions]
   → Paste into: [field name]

After adding credentials:
In each node that shows [REPLACE: ...], click the credential
dropdown and select the credential you just created.
─────────────────────────────────────────────────────────
```

---

## Test Data Recommendations

Output after credentials:

```
── TEST DATA ────────────────────────────────────────────

Before activating, prepare test inputs that cover:

Happy path:
  [Specific test scenario with exact values to use]
  Example: POST to webhook with body: { "email": "test@example.com", "name": "Test User" }

Edge case 1:
  [Scenario that tests a boundary or conditional branch]

Edge case 2:
  [Scenario that tests the error path]

What "success" looks like:
  [Exact outcome — "Record appears in Airtable with status: active"]
  [Exact outcome — "Slack message appears in #notifications"]

⚠️ Do NOT use real production data for testing.
─────────────────────────────────────────────────────────
```

---

## Import Guide

Output after test data:

```
── IMPORT GUIDE ─────────────────────────────────────────

STEP 1: Import the workflow
  N8N menu (top right) → "Import from File/URL"
  Paste the JSON → click "Import"
  Rename if desired

STEP 2: Set up credentials
  Follow the credential setup section above
  Test each connection (green checkmark = success)

STEP 3: Test execution (do NOT activate yet)
  Click "Execute Workflow"
  [If webhook trigger:] Open a new tab → POST to the webhook URL
  [If schedule trigger:] Click "Execute Workflow" to run manually
  Watch each node turn green
  If any node turns red → click it → read the output panel → note the error

STEP 4: Verify output
  Check each destination tool:
  [List specific things to verify — "Check Airtable table X for new row"]

STEP 5: Activate
  Once test passes end-to-end:
  Toggle the "Active" switch (top right)
  The workflow is now live.
─────────────────────────────────────────────────────────
```

---

## Deployment Checklist

Output as the final summary:

```
── DEPLOYMENT CHECKLIST ─────────────────────────────────

Before activating, confirm:

SETUP
□ All [N] credentials created and tested
□ All [REPLACE: ...] placeholders replaced
□ Webhook URL saved (if applicable)

TESTING  
□ Test execution ran without red nodes
□ Happy path verified end-to-end
□ Output arrived at destination correctly

ACTIVATION
□ Active toggle ON
□ First live trigger observed and successful

MONITORING (first 48 hours)
□ Check N8N execution log daily
□ Verify error alerts are firing correctly
□ Confirm no unexpected costs from API calls
─────────────────────────────────────────────────────────
```

---

## Troubleshooting Block

Always include 3-5 specific errors for the workflow type generated:

```
── COMMON ERRORS & FIXES ────────────────────────────────

Error: "Authentication failed" on [Node Name]
Cause: API key not entered or entered incorrectly
Fix: Click node → credential dropdown → edit credential → verify key has no trailing spaces

Error: "Could not connect" on HTTP Request to [Service]
Cause: Timeout, wrong URL, or service is down
Fix: Check service status page → verify URL → increase timeout to 60000ms

Error: "Cannot read property X of undefined"  
Cause: Expected data field missing from previous node's output
Fix: Click the previous node → examine output → update field reference in expression

Error: Workflow runs but nothing arrives at destination
Cause: Credentials have correct format but wrong permissions
Fix: Verify API key scope includes write permissions for [service]

Error: "Execution limit reached"
Cause: [Specific to workflow type — e.g., "Too many Lambda functions spawned"]
Fix: [Specific resolution]
─────────────────────────────────────────────────────────
```

---

## Documentation Package

Generate when user requests it (after asking):

```markdown
# [Workflow Name]

**Last updated:** [date]  
**N8N version:** 1.0+  
**Status:** Active / Draft

---

## Purpose

[One clear paragraph — what this workflow automates, what problem it solves, who uses it]

---

## Tools Connected

| Tool | How it's used |
|------|--------------|
| [Tool] | [Role in workflow] |
| [Tool] | [Role in workflow] |

---

## Trigger

**Type:** [Webhook / Schedule / Manual / Event]  
**Condition:** [What starts the workflow — "POST request to /webhook/path" or "Every day at 9am"]

---

## Flow

1. **[Node Name]** — [What it does]
2. **[Node Name]** — [What it does]
3. **[Node Name]** — [What it does + if it's a human gate, note it]
...

---

## Setup Requirements

| Credential | Type | Where to get it |
|-----------|------|----------------|
| [Service] | [Type] | [URL] |

---

## Testing

**Before activating:**
- [ ] [Test scenario 1]
- [ ] [Test scenario 2]

**What success looks like:**
[Exact expected outcome]

---

## Troubleshooting

**[Error message]**  
Cause: [Why it happens]  
Fix: [How to resolve]

---

## Maintenance

[What to check periodically]  
[API key expiry reminders]  
[Known limitations]
```

---

## Clarification Request

Use only when missing information would produce a wrong workflow:

```
── CLARIFICATION NEEDED ─────────────────────────────────

I'm missing [N] detail(s) that would change the workflow structure:

1. [Question] — this affects: [which nodes]
   Options: [A] / [B] / [C]

2. [Question] — this affects: [which nodes]
   Options: [A] / [B]

My defaults if you don't respond:
  1 → [default assumption]
  2 → [default assumption]

→ Confirm or correct, then I'll generate the JSON.
─────────────────────────────────────────────────────────
```

Maximum 3 questions. Never more. If you can make a reasonable assumption, make it and state it — don't ask.

---

## Complexity Assessment

Use at the start of any ambiguous request to set expectations:

```
── COMPLEXITY ASSESSMENT ────────────────────────────────

Workflow: [Name]
Operations identified: [N]
Complexity tier: [SIMPLE / STANDARD / COMPLEX / ENTERPRISE]

Phase structure selected: [N phases]
Estimated nodes: [N–N range]
Estimated generation time: [quick / a few minutes / thorough session]

External integrations: [list]
Known challenges: [anything that adds complexity]

→ Proceeding with [N]-phase generation.
─────────────────────────────────────────────────────────
```
