import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

let configured = false;

function ensureConfigured() {
  if (!configured) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    configured = true;
  }
}

export const cloudinaryStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (_req, file) => {
    ensureConfigured();
    const isEpub = file.originalname.toLowerCase().endsWith('.epub');
    return {
      folder: 'subrayado_books',
      resource_type: isEpub ? 'raw' : 'image',
      ...(isEpub ? {} : { format: 'pdf' }),
      public_id: file.originalname.split('.')[0] + '-' + Date.now(),
    };
  },
});
