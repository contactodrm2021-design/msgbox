import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function uploadToCloudinary(fileBuffer, originalName) {
  return new Promise((resolve, reject) => {
    const timestamp = Date.now();
    const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const publicId = `msgbox/${timestamp}_${safeName}`;

    const stream = cloudinary.uploader.upload_stream(
      {
        public_id: publicId,
        resource_type: 'auto',
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result.secure_url);
      }
    );

    stream.end(fileBuffer);
  });
}
