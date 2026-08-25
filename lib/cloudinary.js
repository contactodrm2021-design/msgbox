// Cloudinary 上传封装 —— 直接调官方 REST API，避免 Node SDK 在 Vercel runtime 下的兼容性问题
// 文档: https://cloudinary.com/documentation/image_upload_api_reference

const TIMEOUT_MS = 60000;
const MAX_RETRIES = 2;

const SAFE_NAME_REGEX = /[^a-zA-Z0-9._-]/g;

function sanitizeName(originalName) {
  // 去掉扩展名 + 把连续点/非法字符转成 _ —— Cloudinary public_id 不接受某些字符
  const base = String(originalName || 'file').replace(/\.[^.]*$/, '');
  const clean = base.replace(SAFE_NAME_REGEX, '_').slice(0, 80);
  return clean || 'file';
}

function authHeader() {
  const key = process.env.CLOUDINARY_API_KEY;
  const secret = process.env.CLOUDINARY_API_SECRET;
  if (!key || !secret) {
    throw new Error('Cloudinary 凭据未配置(API_KEY/SECRET)');
  }
  return { key, secret };
}

function detectResourceType(fileName, declaredMime) {
  const lower = (fileName || '').toLowerCase();
  if (/\.(mp3|wav|ogg|m4a|aac|flac|opus|webm)$/.test(lower)) return 'video'; // Cloudinary 把音频归 video resource type
  if (/\.(mp4|webm|mov|avi|mkv)$/.test(lower)) return 'video';
  if (/\.(png|jpe?g|gif|webp|avif|svg|bmp|heic)$/.test(lower)) return 'image';
  if (declaredMime && declaredMime.startsWith('audio/')) return 'video';
  if (declaredMime && declaredMime.startsWith('video/')) return 'video';
  if (declaredMime && declaredMime.startsWith('image/')) return 'image';
  return 'auto';
}

/**
 * 上传文件到 Cloudinary（基础签名）。
 * 返回 { url, publicId, duration, bytes, format }
 */
export async function uploadToCloudinary(fileBuffer, originalName, opts = {}) {
  if (!fileBuffer || fileBuffer.length === 0) {
    throw new Error('空文件，无法上传');
  }
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  if (!cloudName) throw new Error('CLOUDINARY_CLOUD_NAME 未配置');
  const { key, secret } = authHeader();

  const resourceType = opts.resourceType || detectResourceType(originalName, opts.mime);
  const folder = 'msgbox';
  const publicId = `${folder}/${Date.now()}_${sanitizeName(originalName)}`;

  let attempt = 0;
  let lastErr;
  while (attempt <= MAX_RETRIES) {
    try {
      const url = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;
      const form = new FormData();
      const mime = opts.mime || 'application/octet-stream';
      form.append('file', new Blob([fileBuffer], { type: mime }), originalName || 'file');
      form.append('public_id', publicId);
      form.append('api_key', key);
      const timestamp = Math.floor(Date.now() / 1000);
      form.append('timestamp', String(timestamp));
      // 签名只对 public_id + timestamp，folder 已经包在 public_id 里了
      const toSign = `public_id=${publicId}&timestamp=${timestamp}${secret}`;
      const sigBuf = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(toSign));
      const signature = Array.from(new Uint8Array(sigBuf)).map((b) => b.toString(16).padStart(2, '0')).join('');
      form.append('signature', signature);

      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
      const resp = await fetch(url, { method: 'POST', body: form, signal: ctrl.signal });
      clearTimeout(timer);

      const text = await resp.text();
      let json;
      try { json = JSON.parse(text); } catch { json = { raw: text.slice(0, 800) }; }

      if (!resp.ok) {
        const err = new Error(`Cloudinary ${resp.status}: ${json.error?.message || text.slice(0, 200)}`);
        err.http_code = resp.status;
        err.body = text;
        throw err;
      }

      return {
        url: json.secure_url,
        publicId: json.public_id,
        bytes: json.bytes,
        format: json.format,
        resourceType: json.resource_type,
      };
    } catch (e) {
      lastErr = e;
      const retriable = !e.http_code || e.http_code >= 500 || e.name === 'AbortError';
      if (!retriable || attempt === MAX_RETRIES) throw e;
      await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
      attempt++;
    }
  }
  throw lastErr;
}
