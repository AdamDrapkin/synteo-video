// Media API handlers - barrel export
export { handleUpload, handleDownload, handleGetUrl, handleDownloadUrl, s3Client } from './s3.js';
export { handleTrim, TrimRequestSchema } from './trim.js';
export { handleExtractFrames, handlePrepareVideo, ExtractFramesRequestSchema } from './extractFrames.js';
export { handleExtractAudio, ExtractAudioRequestSchema } from './extractAudio.js';
export { handleTranscribe, TranscribeRequestSchema } from './transcribe.js';
export {
  handleListMusic,
  handleGetMusicStream,
  handleMixAudio,
  handleGetMusicLibrary,
  ListMusicRequestSchema,
  MixAudioRequestSchema,
} from './music.js';
