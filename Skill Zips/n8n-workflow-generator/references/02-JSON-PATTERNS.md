# 02 — JSON Patterns

All N8N node schemas, coordinate system, connection format, and credential templates needed to generate valid importable JSON. Reference this file when writing any JSON output.

---

## Table of Contents

1. [Workflow Root Schema](#workflow-root-schema)
2. [Node Base Schema](#node-base-schema)
3. [Coordinate System](#coordinate-system)
4. [Connection Format](#connection-format)
5. [Common Node Schemas](#common-node-schemas)
6. [Error Handling Patterns](#error-handling-patterns)
7. [Credential Templates](#credential-templates)
8. [Retry Logic Pattern](#retry-logic-pattern)
9. [Loop Patterns](#loop-patterns)
10. [Human-in-the-Loop Patterns](#human-in-the-loop-patterns)

---

## Workflow Root Schema

```json
{
  "name": "Descriptive Workflow Name",
  "nodes": [],
  "connections": {},
  "active": false,
  "settings": {
    "executionOrder": "v1",
    "saveManualExecutions": true,
    "callerPolicy": "workflowsFromSameOwner",
    "errorWorkflow": ""
  },
  "meta": {
    "instanceId": ""
  },
  "tags": []
}
```

**Rules:**
- `active: false` always — user activates manually after testing
- `executionOrder: "v1"` always for N8N v1.0+
- `name` must be descriptive — not "My Workflow" or "Untitled"

---

## Node Base Schema

Every node shares this base structure:

```json
{
  "id": "uuid-v4-here",
  "name": "Descriptive Node Name",
  "type": "n8n-nodes-base.nodetype",
  "typeVersion": 1,
  "position": [x, y],
  "parameters": {},
  "credentials": {}
}
```

**ID generation:** UUID v4 format. Generate unique IDs — never reuse across nodes in the same workflow.

**Name convention:** `[Verb] [Object] [from/via/to Service]`
```
✓ "Fetch User Data from Airtable"
✓ "Send Error Alert to Slack"
✓ "Parse Claude Response to JSON"
✗ "HTTP Request"
✗ "Function 2"
✗ "Node"
```

---

## Coordinate System

N8N canvas uses pixel coordinates. Layout rules:

```
HORIZONTAL SPACING: 220px between sequential nodes
VERTICAL SPACING:   200px between parallel branches
ERROR PATH OFFSET:  +300y below main flow

STARTING POSITION:
  Trigger node:  [0, 0]
  First action:  [220, 0]
  Second action: [440, 0]
  ...and so on

BRANCH LAYOUT:
  Main path:     y = 0
  Branch A:      y = -200  (above)
  Branch B:      y = 200   (below)
  Error path:    y = 300   (below main)

EXAMPLE 4-node linear flow:
  Trigger:    [0, 0]
  Node 1:     [220, 0]
  Node 2:     [440, 0]
  Node 3:     [660, 0]
  Error path: [440, 300]
```

---

## Connection Format

Connections live at the workflow root level, keyed by **source node name**:

```json
"connections": {
  "Source Node Name": {
    "main": [
      [
        {
          "node": "Target Node Name",
          "type": "main",
          "index": 0
        }
      ]
    ]
  }
}
```

**For IF nodes (two outputs — true/false):**
```json
"connections": {
  "Check Condition": {
    "main": [
      [
        { "node": "Handle True Case", "type": "main", "index": 0 }
      ],
      [
        { "node": "Handle False Case", "type": "main", "index": 0 }
      ]
    ]
  }
}
```

**For Switch nodes (multiple outputs):**
```json
"connections": {
  "Route by Type": {
    "main": [
      [{ "node": "Handle Type A", "type": "main", "index": 0 }],
      [{ "node": "Handle Type B", "type": "main", "index": 0 }],
      [{ "node": "Handle Type C", "type": "main", "index": 0 }]
    ]
  }
}
```

---

## Common Node Schemas

### Webhook Trigger
```json
{
  "id": "uuid",
  "name": "Receive Webhook",
  "type": "n8n-nodes-base.webhook",
  "typeVersion": 2,
  "position": [0, 0],
  "parameters": {
    "httpMethod": "POST",
    "path": "your-path-here",
    "responseMode": "responseNode",
    "options": {}
  }
}
```

### Schedule Trigger
```json
{
  "id": "uuid",
  "name": "Run on Schedule",
  "type": "n8n-nodes-base.scheduleTrigger",
  "typeVersion": 1.2,
  "position": [0, 0],
  "parameters": {
    "rule": {
      "interval": [
        {
          "field": "hours",
          "hoursInterval": 4
        }
      ]
    }
  }
}
```

### Manual Trigger
```json
{
  "id": "uuid",
  "name": "Manual Start",
  "type": "n8n-nodes-base.manualTrigger",
  "typeVersion": 1,
  "position": [0, 0],
  "parameters": {}
}
```

### HTTP Request
```json
{
  "id": "uuid",
  "name": "Call External API",
  "type": "n8n-nodes-base.httpRequest",
  "typeVersion": 4.2,
  "position": [220, 0],
  "parameters": {
    "method": "POST",
    "url": "https://api.example.com/endpoint",
    "authentication": "genericCredentialType",
    "genericAuthType": "httpBearerAuth",
    "sendBody": true,
    "bodyParameters": {
      "parameters": [
        {
          "name": "field",
          "value": "={{ $json.value }}"
        }
      ]
    },
    "options": {
      "timeout": 30000,
      "retry": {
        "enabled": true,
        "maxTries": 3,
        "waitBetweenTries": 1000
      }
    }
  },
  "credentials": {
    "httpBearerAuth": {
      "id": "[REPLACE: credential ID]",
      "name": "[REPLACE: Service Name API Key]"
    }
  }
}
```

### Code Node (JavaScript)
```json
{
  "id": "uuid",
  "name": "Transform Data",
  "type": "n8n-nodes-base.code",
  "typeVersion": 2,
  "position": [440, 0],
  "parameters": {
    "jsCode": "// Transform incoming data\nconst items = $input.all();\n\nreturn items.map(item => {\n  // Add transformation logic here\n  return {\n    json: {\n      ...item.json,\n      processed: true\n    }\n  };\n});"
  }
}
```

### IF Node
```json
{
  "id": "uuid",
  "name": "Check Condition",
  "type": "n8n-nodes-base.if",
  "typeVersion": 2,
  "position": [440, 0],
  "parameters": {
    "conditions": {
      "options": {
        "caseSensitive": true,
        "leftValue": "",
        "typeValidation": "strict"
      },
      "conditions": [
        {
          "id": "uuid",
          "leftValue": "={{ $json.status }}",
          "rightValue": "active",
          "operator": {
            "type": "string",
            "operation": "equals"
          }
        }
      ],
      "combinator": "and"
    }
  }
}
```

### Set Node
```json
{
  "id": "uuid",
  "name": "Set Output Fields",
  "type": "n8n-nodes-base.set",
  "typeVersion": 3.4,
  "position": [660, 0],
  "parameters": {
    "mode": "manual",
    "duplicateItem": false,
    "assignments": {
      "assignments": [
        {
          "id": "uuid",
          "name": "fieldName",
          "value": "={{ $json.sourceField }}",
          "type": "string"
        }
      ]
    },
    "options": {}
  }
}
```

### Wait Node (webhook resume)
```json
{
  "id": "uuid",
  "name": "Wait for Webhook Resume",
  "type": "n8n-nodes-base.wait",
  "typeVersion": 1.1,
  "position": [880, 0],
  "parameters": {
    "resume": "webhook",
    "options": {
      "webhookSuffix": "resume"
    }
  }
}
```

### Wait Node (time delay)
```json
{
  "id": "uuid",
  "name": "Wait 5 Seconds",
  "type": "n8n-nodes-base.wait",
  "typeVersion": 1.1,
  "position": [880, 0],
  "parameters": {
    "resume": "timeInterval",
    "unit": "seconds",
    "value": 5
  }
}
```

### Loop Over Items
```json
{
  "id": "uuid",
  "name": "Loop Over Items",
  "type": "n8n-nodes-base.splitInBatches",
  "typeVersion": 3,
  "position": [440, 0],
  "parameters": {
    "batchSize": 1,
    "options": {}
  }
}
```

### Airtable
```json
{
  "id": "uuid",
  "name": "Create Airtable Record",
  "type": "n8n-nodes-base.airtable",
  "typeVersion": 2.1,
  "position": [880, 0],
  "parameters": {
    "operation": "create",
    "base": {
      "__rl": true,
      "value": "[REPLACE: Airtable Base ID]",
      "mode": "id"
    },
    "table": {
      "__rl": true,
      "value": "[REPLACE: Table ID]",
      "mode": "id"
    },
    "columns": {
      "mappingMode": "defineBelow",
      "value": {
        "Field Name": "={{ $json.value }}"
      }
    }
  },
  "credentials": {
    "airtableTokenApi": {
      "id": "[REPLACE: credential ID]",
      "name": "Airtable Personal Access Token"
    }
  }
}
```

### Slack
```json
{
  "id": "uuid",
  "name": "Send Slack Notification",
  "type": "n8n-nodes-base.slack",
  "typeVersion": 2.2,
  "position": [1100, 0],
  "parameters": {
    "operation": "message",
    "channel": {
      "__rl": true,
      "value": "[REPLACE: channel ID or #channel-name]",
      "mode": "id"
    },
    "text": "={{ $json.message }}",
    "otherOptions": {}
  },
  "credentials": {
    "slackApi": {
      "id": "[REPLACE: credential ID]",
      "name": "Slack Bot Token"
    }
  }
}
```

### Respond to Webhook
```json
{
  "id": "uuid",
  "name": "Respond to Webhook",
  "type": "n8n-nodes-base.respondToWebhook",
  "typeVersion": 1.1,
  "position": [1320, 0],
  "parameters": {
    "respondWith": "json",
    "responseBody": "={{ JSON.stringify({ success: true, data: $json }) }}",
    "options": {}
  }
}
```

---

## Error Handling Patterns

### Global Error Handler (attach to every production workflow)

```json
{
  "id": "uuid",
  "name": "On Workflow Error",
  "type": "n8n-nodes-base.errorTrigger",
  "typeVersion": 1,
  "position": [0, 300],
  "parameters": {}
}
```

Connect Error Trigger → Slack/Email alert node:

```json
{
  "id": "uuid",
  "name": "Alert on Failure",
  "type": "n8n-nodes-base.slack",
  "typeVersion": 2.2,
  "position": [220, 300],
  "parameters": {
    "operation": "message",
    "channel": {
      "__rl": true,
      "value": "[REPLACE: error alert channel]",
      "mode": "id"
    },
    "text": "❌ Workflow failed: {{ $json.workflow.name }}\nNode: {{ $json.execution.lastNodeExecuted }}\nError: {{ $json.execution.error.message }}\nExecution: {{ $json.execution.id }}",
    "otherOptions": {}
  }
}
```

---

## Credential Templates

Reference these when specifying credentials in node JSON:

```json
// HTTP Bearer (API key as Bearer token)
"credentials": {
  "httpBearerAuth": {
    "id": "[REPLACE: credential ID]",
    "name": "[REPLACE: API Service] Bearer Token"
  }
}

// HTTP Header Auth (API key in custom header)
"credentials": {
  "httpHeaderAuth": {
    "id": "[REPLACE: credential ID]",
    "name": "[REPLACE: API Service] API Key"
  }
}

// OAuth2
"credentials": {
  "oAuth2Api": {
    "id": "[REPLACE: credential ID]",
    "name": "[REPLACE: Service] OAuth2"
  }
}

// OpenAI
"credentials": {
  "openAiApi": {
    "id": "[REPLACE: credential ID]",
    "name": "OpenAI API Key"
  }
}

// Anthropic
"credentials": {
  "anthropicApi": {
    "id": "[REPLACE: credential ID]",
    "name": "Anthropic API Key"
  }
}
```

---

## Retry Logic Pattern

Apply to every HTTP Request node touching an external service:

```json
"options": {
  "timeout": 30000,
  "retry": {
    "enabled": true,
    "maxTries": 3,
    "waitBetweenTries": 1000
  }
}
```

For rate-limited APIs, increase wait between tries:
```json
"waitBetweenTries": 5000
```

---

## Loop Patterns

### Process list of items one at a time:
```
SplitInBatches (batchSize: 1)
  → [process each item]
  → back to SplitInBatches (loop connection)
  → [done branch exits when no more items]
```

Connection for loop back:
```json
"Process Each Item": {
  "main": [[
    { "node": "Loop Over Items", "type": "main", "index": 0 }
  ]]
}
```

Connection for exit:
```json
"Loop Over Items": {
  "main": [
    [{ "node": "Process Each Item", "type": "main", "index": 0 }],
    [{ "node": "After Loop Complete", "type": "main", "index": 0 }]
  ]
}
```

---

## Human-in-the-Loop Patterns

### Pattern: Pause and wait for human input via webhook resume

```
[Previous nodes]
  → Set Resume URL (Code node — extracts $execution.resumeUrl)
  → Send Notification (Slack/email with resume URL and options)
  → Wait Node (resume: webhook)
  → Parse Human Response (Code node)
  → [Continue workflow]
```

**Code node to extract resume URL:**
```javascript
const resumeUrl = $execution.resumeUrl;
return [{
  json: {
    resumeUrl,
    message: `Review required. Options: APPROVE / REJECT\nRespond at: ${resumeUrl}`
  }
}];
```

**Wait node resumes when someone POSTs to the resume URL with:**
```json
{ "response": "APPROVE" }
```

**Parse response Code node:**
```javascript
const response = $json.body?.response || $json.response;
return [{ json: { approved: response === 'APPROVE', rawResponse: response } }];
```
