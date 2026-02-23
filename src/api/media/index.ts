// Media API handlers - barrel export
export { handleUpload, handleDownload, handleGetUrl, s3Client } from './s3.js';
export { handleTrim, TrimRequestSchema } from './trim.js';
export { handleTranscribe, TranscribeRequestSchema } from './transcribe.js';
