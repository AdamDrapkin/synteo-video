FROM node:20-alpine

WORKDIR /app

# Install FFmpeg for video processing
RUN apk add --no-cache ffmpeg

COPY package*.json ./
RUN npm install

COPY tsconfig.json ./
COPY src/ ./src/

RUN npm run build:api

ENV NODE_ENV=production
ENV PORT=3000

# AWS Configuration
# AWS_REGION=us-east-1
# LAMBDA_FUNCTION=remotion-render-...
# SERVE_URL=https://...
# S3_BUCKET=...
ENV MUSIC_S3_BUCKET=synteo-music-library

# Webhook Configuration
# WEBHOOK_SECRET=...

# N8N Configuration
# N8N_BASE_URL=http://n8n:5678

# Slack Configuration
# SLACK_BOT_TOKEN=xoxb-...
# SLACK_CHANNEL_ID=C...
# SLACK_SIGNING_SECRET=...

# Airtable Configuration (set these at runtime or in docker-compose)
# AIRTABLE_API_KEY=pat...
# AIRTABLE_BASE_ID=apprfl6zJJVMW2FDi

EXPOSE 3000

CMD ["node", "dist/api/server.js"]
