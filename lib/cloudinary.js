import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const UPLOAD_TIMEOUT_MS = 60000;

export async function uploadToCloudinary(fileBuffer, originalName) {
  return new Promise((resolve, reject) => {
    const timestamp = Date.now();
    // 去掉扩展名（Cloudinary 会自动附加格式后缀），过滤不安全字符
    const baseName = originalName.replace(/\.[^.]*$/, '');
    const safeName = baseName.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-40) || 'file';
    const publicId = `msgbox/${timestamp}_${safeName}`;

    const timer = setTimeout(() => {
      reject(new Error('上传超时（60 秒），请重试'));
    }, UPLOAD_TIMEOUT_MS);

    const stream = cloudinary.uploader.upload_stream(
      {
        public_id: publicId,
        resource_type: 'auto',
      },
      (error, result) => {
        clearTimeout(timer);
        if (error) reject(error);
        else resolve(result.secure_url);
      }
    );

    stream.end(fileBuffer);
  });
}
