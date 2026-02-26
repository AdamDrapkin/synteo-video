import express from 'express';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { Readable } from 'stream';
import { z } from 'zod';
import { CONFIG } from '../config.js';

const s3Client = new S3Client({ region: CONFIG.aws.region });

// Allowlisted content types for uploads
const ALLOWED_CONTENT_TYPES = [
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'audio/mpeg',
  'audio/wav',
  'audio/mp3',
  'audio/webm',
  'image/jpeg',
  'image/png',
  'image/gif',
  'text/srt',
  'application/json',
];

// Request validation schemas
export const UploadRequestSchema = z.object({
  fileName: z.string(),
  contentType: z.string(),
  data: z.string(), // base64 encoded
});

export const DownloadParamsSchema = z.object({
  key: z.string(),
});

/**
 * POST /media/upload
 * Upload a file to S3
 * Accepts base64-encoded file data
 */
export async function handleUpload(req: express.Request, res: express.Response) {
  try {
    const body = UploadRequestSchema.parse(req.body);
    const { fileName, contentType, data } = body;

    // Validate content-type against allowlist
    if (!ALLOWED_CONTENT_TYPES.includes(contentType)) {
      return res.status(400).json({
        error: `Invalid content-type. Allowed: ${ALLOWED_CONTENT_TYPES.join(', ')}`,
      });
    }

    // Validate filename for path traversal
    if (fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
      return res.status(400).json({
        error: 'Invalid filename: path traversal not allowed',
      });
    }

    // Decode base64 data
    const buffer = Buffer.from(data, 'base64');

    // File size limit: 500MB max
    const MAX_FILE_SIZE = 500 * 1024 * 1024;
    if (buffer.length > MAX_FILE_SIZE) {
      return res.status(400).json({
        error: `File too large. Maximum size is 500MB, got ${(buffer.length / 1024 / 1024).toFixed(2)}MB`,
      });
    }

    // Generate unique key with timestamp
    const timestamp = Date.now();
    const key = `uploads/${timestamp}-${fileName}`;

    // Upload to S3 using multipart upload for larger files
    const upload = new Upload({
      client: s3Client,
      params: {
        Bucket: CONFIG.aws.bucketName,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      },
    });

    await upload.done();

    const s3Url = `https://${CONFIG.aws.bucketName}.s3.${CONFIG.aws.region}.amazonaws.com/${key}`;

    res.json({
      success: true,
      key,
      url: s3Url,
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * GET /media/download/:key
 * Get a signed URL or stream from S3
 */
export async function handleDownload(req: express.Request, res: express.Response) {
  try {
    let { key } = req.params;

    // Path traversal protection - reject keys with ../ or absolute paths
    if (key.includes('..') || key.startsWith('/') || key.startsWith('\\')) {
      return res.status(400).json({ error: 'Invalid key: path traversal not allowed' });
    }

    const command = new GetObjectCommand({
      Bucket: CONFIG.aws.bucketName,
      Key: key,
    });

    const response = await s3Client.send(command);

    if (!response.Body) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Set appropriate headers
    res.setHeader('Content-Type', response.ContentType || 'application/octet-stream');
    if (response.ContentDisposition) {
      res.setHeader('Content-Disposition', response.ContentDisposition);
    }

    // Stream the response
    const stream = response.Body as Readable;
    stream.pipe(res);
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * GET /media/url/:key
 * Get a presigned URL for direct access
 */
export async function handleGetUrl(req: express.Request, res: express.Response) {
  try {
    let { key } = req.params;
    const expiresInRaw = req.query.expiresIn;
    const expiresIn = expiresInRaw ? Number(expiresInRaw) : 3600;

    // Validate expiresIn
    if (isNaN(expiresIn) || expiresIn < 1 || expiresIn > 604800) {
      return res.status(400).json({
        error: 'expiresIn must be between 1 and 604800 (7 days)',
      });
    }

    // Path traversal protection
    if (key.includes('..') || key.startsWith('/') || key.startsWith('\\')) {
      return res.status(400).json({ error: 'Invalid key: path traversal not allowed' });
    }

    const command = new GetObjectCommand({
      Bucket: CONFIG.aws.bucketName,
      Key: key,
    });

    // Generate presigned URL
    const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner');
    const signedUrl = await getSignedUrl(s3Client, command, {
      expiresIn,
    });

    res.json({
      key,
      url: signedUrl,
      expiresIn,
    });
  } catch (error) {
    console.error('Get URL error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * POST /media/download-url
 * Download a file from any URL and upload to S3
 * Accepts: { url: string, fileName?: string }
 * Returns: { key: string, url: string }
 */
export async function handleDownloadUrl(req: express.Request, res: express.Response) {
  try {
    let { url, fileName } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'url is required' });
    }

    console.log(`Downloading from URL: ${url}`);

    // Convert Google Drive URL to direct download format
    if (url.includes('drive.google.com')) {
      // Extract file ID from various Google Drive URL formats
      const fileIdMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)\//);
      if (fileIdMatch && fileIdMatch[1]) {
        const fileId = fileIdMatch[1];
        url = `https://drive.google.com/uc?export=download&id=${fileId}`;
        console.log(`Converted Google Drive URL to: ${url}`);
      }
    }

    // Download the file from the source URL
    // Note: redirect: 'follow' is needed for Google Drive URLs
    let response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      redirect: 'follow',
    });

    // Handle Google Drive interstitial page (HTML response means we need confirmation)
    let contentType = response.headers.get('content-type') || '';
    console.log(`Initial response: status=${response.status}, content-type=${contentType}, url=${response.url}`);

    if (contentType.includes('text/html')) {
      const html = await response.text();
      console.log(`Google Drive HTML response (first 1000 chars): ${html.substring(0, 1000)}`);

      // Try multiple patterns to extract download URL from Google Drive HTML

      // Pattern 1: confirm= token in URL (most common)
      let confirmMatch = html.match(/confirm=([^&"]+)/);
      if (confirmMatch && confirmMatch[1]) {
        const confirmToken = confirmMatch[1];
        // Try both with &confirm= and &confirm=t
        const downloadUrl = `${url}&confirm=${confirmToken}`;
        console.log(`Google Drive: following confirmation redirect with token: ${confirmToken}`);

        response = await fetch(downloadUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': '*/*',
            'Referer': 'https://drive.google.com/',
          },
          redirect: 'follow',
        });

        contentType = response.headers.get('content-type') || '';
        console.log(`After confirm redirect: status=${response.status}, content-type=${contentType}, url=${response.url}`);

        // If still HTML, try harder - check for additional patterns
        if (contentType.includes('text/html')) {
          // We already consumed response.text() above - need to re-fetch
          console.log(`Still HTML after confirm redirect, need to re-fetch to parse`);
          response = await fetch(downloadUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Accept': '*/*',
              'Referer': 'https://drive.google.com/',
            },
            redirect: 'follow',
          });
          const retryHtml = await response.text();
          console.log(`Still HTML after confirm, checking for additional patterns (first 500 chars): ${retryHtml.substring(0, 500)}`);

          // Pattern 1b: look for downloadUrl in a JS variable
          const downloadUrlMatch = retryHtml.match(/downloadUrl\s*=\s*["']([^"']+)["']/);
          if (downloadUrlMatch && downloadUrlMatch[1]) {
            console.log(`Found downloadUrl in JS: ${downloadUrlMatch[1]}`);
            response = await fetch(downloadUrlMatch[1], {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Referer': 'https://drive.google.com/',
              },
              redirect: 'follow',
            });
            contentType = response.headers.get('content-type') || '';
          } else {
            // Try looking for URl in jsdata variable
            const jsdataMatch = retryHtml.match(/["']https:\\\/\\\/[^"']*uc[^\s"']*["']/);
            if (jsdataMatch) {
              const cleanedUrl = jsdataMatch[0].replace(/\\/g, '');
              console.log(`Found URL in jsdata: ${cleanedUrl}`);
              response = await fetch(cleanedUrl, {
                headers: {
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                  'Referer': 'https://drive.google.com/',
                },
                redirect: 'follow',
              });
              contentType = response.headers.get('content-type') || '';
            }
          }
        }
      } else {
        // Pattern 2: look for form action URL
        const formActionMatch = html.match(/action="([^"]+)"/);
        const formTokenMatch = html.match(/name="confirm" value="([^"]+)"/);

        if (formActionMatch && formActionMatch[1]) {
          // Extract file ID from the response URL (after redirect) or original URL
          let fileId = '';
          const fileIdMatch = url.match(/id=([^&]+)/);
          if (fileIdMatch && fileIdMatch[1]) {
            fileId = fileIdMatch[1];
          } else {
            // Try extracting from response URL
            const responseFileIdMatch = response.url.match(/id=([^&]+)/);
            if (responseFileIdMatch && responseFileIdMatch[1]) {
              fileId = responseFileIdMatch[1];
            }
          }

          const formToken = formTokenMatch ? formTokenMatch[1] : 't';

          console.log(`DEBUG: extracted fileId='${fileId}' from url='${url}', response.url='${response.url}'`);
          console.log(`DEBUG: formActionMatch[1]='${formActionMatch[1]}'`);

          if (!fileId) {
            console.log('ERROR: Could not extract file ID from URL');
            return res.status(400).json({
              error: 'Could not extract file ID from Google Drive URL',
            });
          }

          // Build proper download URL with id parameter
          // Check if form action already has query params
          const hasQueryParams = formActionMatch[1].includes('?');
          const downloadUrl = hasQueryParams
            ? `${formActionMatch[1]}&id=${fileId}&confirm=${formToken}`
            : `${formActionMatch[1]}?id=${fileId}&confirm=${formToken}`;
          console.log(`Google Drive: using form action URL: ${downloadUrl}`);

          response = await fetch(downloadUrl, {
            method: 'GET',
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
            redirect: 'follow',
          });

          contentType = response.headers.get('content-type') || '';
        } else {
          // Pattern 3: Try multiple fallback approaches
          console.log('Pattern 1 and 2 failed, trying fallback patterns');

          // Try to find any URL that looks like a download link
          const urlMatch = html.match(/https:\/\/[^"'\s]*googleapis\.com[^"'\s]*/);
          if (urlMatch) {
            console.log(`Found potential download URL: ${urlMatch[0]}`);
            response = await fetch(urlMatch[0], {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              },
              redirect: 'follow',
            });
            contentType = response.headers.get('content-type') || '';
          } else {
            console.log('All patterns failed. HTML length:', html.length);
            console.log('Full HTML for debugging:', html.substring(0, 2000));
            return res.status(400).json({
              error: 'Could not extract download URL from Google Drive response. Check server logs for details.',
            });
          }
        }
      }
    }

    // If still HTML after all attempts, log and fail with useful message
    if (contentType.includes('text/html')) {
      // Check for specific Google Drive error pages
      const htmlCheck = await response.text();

      if (htmlCheck.includes('Quota exceeded') || htmlCheck.includes('quota')) {
        console.log('Google Drive quota exceeded - this is a rate limiting issue from Google');
        return res.status(429).json({
          error: 'Google Drive download quota exceeded. This usually means the server IP has been rate-limited by Google. Try again later, or use a different file hosting service.',
        });
      }

      if (htmlCheck.includes('Virus scan warning') || htmlCheck.includes('virus')) {
        console.log('Google Drive virus scan warning - trying alternative approach');
        // Try with different confirmation approach
        const confirmMatch = htmlCheck.match(/confirm=([a-zA-Z0-9_-]+)/);
        if (confirmMatch) {
          const newUrl = `${response.url}&confirm=${confirmMatch[1]}`;
          console.log(`Retrying with confirm token: ${newUrl}`);
          response = await fetch(newUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Referer': 'https://drive.google.com/',
            },
            redirect: 'follow',
          });
          contentType = response.headers.get('content-type') || '';
          if (!contentType.includes('text/html')) {
            console.log(`Success on retry! content-type: ${contentType}`);
          }
        }
      }

      if (contentType.includes('text/html')) {
        console.log(`WARNING: Still HTML after all redirect getting attempts. Final URL: ${response.url}`);
        console.log(`Final HTML (first 500 chars): ${htmlCheck.substring(0, 500)}`);
      }
    }

    if (!response.ok) {
      return res.status(400).json({
        error: `Failed to download: ${response.status} ${response.statusText}`
      });
    }

    // Validate content type
    if (!ALLOWED_CONTENT_TYPES.includes(contentType)) {
      return res.status(400).json({
        error: `Invalid content-type: ${contentType}. Allowed: ${ALLOWED_CONTENT_TYPES.join(', ')}`,
      });
    }

    // Determine filename
    const name = fileName || `download-${Date.now()}`;
    const ext = contentType.split('/')[1] || 'mp4';
    const finalFileName = name.endsWith(`.${ext}`) ? name : `${name}.${ext}`;

    // Generate unique key
    const timestamp = Date.now();
    const key = `uploads/${timestamp}-${finalFileName}`;

    console.log(`Streaming file to S3: ${key}`);

    // Stream upload to S3 (supports large files)
    // Use PassThrough to stream the response body directly to S3
    const { PassThrough } = await import('stream');
    const passThrough = new PassThrough();

    // Start the S3 upload in parallel with downloading
    const uploadPromise = (async () => {
      const upload = new Upload({
        client: s3Client,
        params: {
          Bucket: CONFIG.aws.bucketName,
          Key: key,
          Body: passThrough,
          ContentType: contentType,
        },
      });
      await upload.done();
    })();

    // Pipe the response to the passThrough stream
    const reader = response.body?.getReader();
    if (!reader) {
      return res.status(500).json({ error: 'Could not read response body' });
    }

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          passThrough.end();
          break;
        }
        passThrough.write(Buffer.from(value));
      }
    } catch (error) {
      passThrough.destroy();
      throw error;
    }

    // Wait for upload to complete
    await uploadPromise;

    // Get public URL
    const publicUrl = `https://${CONFIG.aws.bucketName}.s3.${CONFIG.aws.region}.amazonaws.com/${key}`;

    console.log(`Uploaded to S3: ${key}`);

    res.json({
      key,
      url: publicUrl,
      contentType,
    });
  } catch (error) {
    console.error('Download URL error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

export { s3Client };
