# N8N MCP Tool Usage SOP

## Overview
This document outlines what works and what doesn't when using the Synta MCP `n8n_update_partial_workflow` function.

---

## What FAILS ❌

### 1. Complex JSON with Special Characters
**Error:** `Invalid input - Expected array, received string`

**Cause:** When the operations array contains objects with:
- JavaScript code (backslashes `\n`, quotes)
- Nested JSON structures
- Complex parameter values with special characters

**Examples that fail:**
```javascript
// FAILS - contains \n and complex JS
{"nodeName": "X", "type": "updateNode", "updates": {"parameters": {"jsCode": "code with \n newlines"}}}

// FAILS - complex nested JSON
{"nodeName": "X", "type": "updateNode", "updates": {"parameters": {"body": {"complex": {"nested": "json"}}}}}
```

### 2. Updating Code Node Parameters
- Cannot update `jsCode` parameter via MCP
- Cannot update complex nested parameters

### 3. Adding HTTP Request Nodes with Body
- Adding nodes that require complex body configuration fails

---

## What WORKS ✅

### 1. Empty Operations Array
```javascript
[]
```
Returns success but does nothing useful.

### 2. Simple Name Updates
```javascript
[{"nodeName": "3. Parse Campaign Config", "type": "updateNode", "updates": {"name": "New Name"}}]
```

### 3. Simple Parameter Updates (String Values Only)
```javascript
[{"nodeName": "4. Get Transcript", "type": "updateNode", "updates": {"parameters": {"videoUrl": "={{ $json.source_url }}"}}}]
```

### 4. Adding New Nodes (Basic Parameters)
```javascript
[{
  "id": "new-node-id",
  "name": "New Node Name",
  "node": {
    "parameters": {"simpleParam": "value"},
    "position": [x, y],
    "type": "n8n-nodes-base.code",
    "typeVersion": 2
  },
  "type": "addNode"
}]
```

### 5. Adding Connections
```javascript
[
  {"source": "Node A", "sourceOutput": "main", "target": "Node B", "targetInput": "main", "type": "addConnection"}
]
```

### 6. Multiple Operations in Array
```javascript
[
  {"nodeName": "X", "type": "updateNode", "updates": {"name": "Y"}},
  {"source": "X", "sourceOutput": "main", "target": "Z", "targetInput": "main", "type": "addConnection"}
]
```

---

## MCP Usage Pattern - THE WORKFLOW

When you need to make complex changes:

1. **Add the node first** with simple/basic parameters
2. **Update the node name** to set it up
3. **Update simple parameters** one at a time (URLs, simple strings)
4. **Add connections** after nodes are created

### Example - Adding a Vision Mode Flow:

```javascript
// Step 1: Add IF node (simple)
[{
  "id": "if-004b",
  "name": "4b. Has Transcript?",
  "node": {
    "parameters": {"conditions": {}}, // empty for now
    "position": [784, 304],
    "type": "n8n-nodes-base.if",
    "typeVersion": 2
  },
  "type": "addNode"
}]

// Step 2: Add connection
[{"source": "4. Get Transcript", "sourceOutput": "main", "target": "4b. Has Transcript?", "targetInput": "main", "type": "addConnection"}]

// Step 3: Add vision code node (simple params)
[{
  "id": "code-vision",
  "name": "4c. Vision Mode",
  "node": {
    "parameters": {"jsCode": "simple code"}, // MCP will struggle with complex code
    "position": [896, 440],
    "type": "n8n-nodes-base.code",
    "typeVersion": 2
  },
  "type": "addNode"
}]

// Step 4: Add HTTP node (simple)
[{
  "id": "http-gemini",
  "name": "4d. Gemini API",
  "node": {
    "parameters": {"method": "POST", "url": "https://example.com"},
    "position": [1008, 440],
    "type": "n8n-nodes-base.httpRequest",
    "typeVersion": 4.2
  },
  "type": "addNode"
}]
```

---

## Workaround for Complex Changes

For complex parameter updates (like jsCode, complex JSON body):

1. **Add the node with MCP** using basic parameters
2. **Configure manually in N8N UI** - for complex configs, body parameters, etc.
3. **Use MCP only for:** adding nodes, connections, simple parameter updates

---

## Summary

| Operation | MCP Works? |
|-----------|------------|
| Add node (basic) | ✅ Yes |
| Add node (complex params) | ❌ No |
| Update simple param | ✅ Yes |
| Update jsCode | ❌ No |
| Add connection | ✅ Yes |
| Remove connection | ❌ Unknown |
| Complex nested JSON | ❌ No |

---

**Rule of thumb:** If it has quotes, backslashes, or nested braces - do it manually in N8N UI. MCP for structural changes only.
