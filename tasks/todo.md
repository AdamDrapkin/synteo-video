# Sprint 4: Express /media Endpoints

## Status: COMPLETED

### Completed
- [x] Install FFmpeg and S3 dependencies
- [x] Create POST /media/trim - FFmpeg video clipping
- [x] Create POST /media/transcribe - Whisper transcription
- [x] Create POST /media/upload - S3 file upload
- [x] Create GET /media/download/:key - S3 file retrieval
- [x] Create GET /media/url/:key - Presigned URL generation
- [x] Pass TypeScript type check

### Endpoints Created

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/media/trim` | POST | Trim video using FFmpeg (startTime, endTime) |
| `/media/transcribe` | POST | Transcribe audio using OpenAI Whisper |
| `/media/upload` | POST | Upload base64-encoded file to S3 |
| `/media/download/*` | GET | Stream file from S3 |
| `/media/url/*` | GET | Get presigned URL for S3 file |

---

# Sprint 5: Webhook + N8N Integration

## Status: COMPLETED

### Completed
- [x] Create POST /webhook - Remotion Lambda callback receiver
- [x] HMAC SHA-512 signature validation via validateWebhookSignature
- [x] Create POST /render-with-webhook - render + store N8N resume URL
- [x] In-memory renderId → n8nResumeUrl mapping
- [x] Auto-cleanup stale mappings (30min TTL)
- [x] Pass TypeScript type check

### Webhook Flow

```
N8N → POST /render-with-webhook
                    ↓
         renderMediaOnLambda(webhook: { url, secret })
                    ↓
         Stores renderId → n8nResumeUrl
                    ↓
         Lambda renders...
                    ↓
Remotion Lambda → POST /webhook (HMAC validated)
                    ↓
         Extracts outputFile from payload
                    ↓
         GET n8nResumeUrl?data={ status, outputFile }
```

### Environment Variables Required
- `WEBHOOK_SECRET` - HMAC secret for signature validation
- `N8N_BASE_URL` - N8N instance URL
- `API_BASE_URL` - Public URL for webhook callback

---

# Sprint 6: N8N 22-Node Workflow

## Status: COMPLETED (v2 - Production Ready)

### Created
- [x] n8n-workflow.json - Importable N8N workflow

### Improvements Made (v2)
- UUID v4 node IDs for valid import
- 220px coordinate spacing
- Credential placeholders marked with [REPLACE: ...]
- Retry logic on all HTTP Request nodes
- Error handler branch with Slack alert
- Wait nodes for human gates (30min/60min timeouts)
- Proper SplitInBatches loop exit connection

### Workflow Nodes (24 total)

| Phase | Nodes |
|-------|-------|
| Setup & Intelligence | 1-8: Trigger → Config → Transcript → Build P1 → Claude P1 → Parse → Slack → Wait |
| Per-Clip Loop | 9-14: Loop → Build P2 → Claude P2 → Parse → Slack → Wait → Parse |
| Media Processing | 15-17: Trim Hook+Main → Transcribe → Build Props |
| Render | 18-19: POST Render → Wait for Lambda |
| Review & Record | 20-24: Final Review → Wait → Parse → Airtable → Slack → Respond |
| Error Handler | Error Trigger → Slack Alert |

### Environment Variables Required (in N8N)
- `API_BASE_URL` - Express API URL
- `SUPADATA_API_URL` - Supadata API URL
- `SUPADATA_API_KEY` - Supadata API Key
- `AIRTABLE_APP_ID` - Airtable base ID

### Credentials Required (in N8N)
- Slack Bot Token
- Airtable Personal Access Token
- Anthropic API Key
- Supadata API Key

---

## Next Steps
- Sprint 7: Airtable + Slack integration
