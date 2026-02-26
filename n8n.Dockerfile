# Custom n8n image with Python support
FROM n8nio/n8n:latest

# Install Python for Code nodes
USER root
RUN apk add --no-cache python3 py3-pip

# Switch back to node user
USER node

# Install n8n-nodes-ffmpeg for video frame extraction
RUN npm install -g n8n-nodes-ffmpeg

USER root
