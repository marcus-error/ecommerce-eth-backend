import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { getCloudinaryClient } from '../config/cloudinary.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const uploadSingle = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded.' });
  }

  // Also sync to frontend/public/uploads so dev server can render it immediately
  try {
    const frontendDir = path.resolve(__dirname, '../../../frontend/public/uploads');
    if (fs.existsSync(frontendDir)) {
      fs.copyFileSync(req.file.path, path.resolve(frontendDir, req.file.filename));
    }
  } catch (e) {
    console.warn('Frontend upload sync notice:', e.message);
  }

  let finalUrl = `/uploads/${req.file.filename}`;
  const { cloudinary, isConfigured } = getCloudinaryClient();

  // If Cloudinary credentials are provided, upload to Cloudinary CDN
  if (isConfigured) {
    try {
      const cloudResult = await cloudinary.uploader.upload(req.file.path, {
        folder: 'the_ethnic_edit/products',
        resource_type: 'auto'
      });
      if (cloudResult && cloudResult.secure_url) {
        finalUrl = cloudResult.secure_url;
        console.log(`☁️ [Cloudinary] Uploaded successfully: ${finalUrl}`);
      }
    } catch (cloudErr) {
      console.warn('⚠️ [Cloudinary Upload Warning]:', cloudErr.message, '— using local upload URL fallback.');
    }
  }

  return res.json({
    success: true,
    message: 'File uploaded successfully.',
    url: finalUrl,
    filename: req.file.filename,
    original_name: req.file.originalname,
    size: req.file.size
  });
};

export const uploadMultiple = async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ success: false, message: 'No files uploaded.' });
  }

  const frontendDir = path.resolve(__dirname, '../../../frontend/public/uploads');
  const { cloudinary, isConfigured } = getCloudinaryClient();

  const files = await Promise.all(
    req.files.map(async (file) => {
      try {
        if (fs.existsSync(frontendDir)) {
          fs.copyFileSync(file.path, path.resolve(frontendDir, file.filename));
        }
      } catch (e) {
        console.warn('Frontend upload sync notice:', e.message);
      }

      let fileUrl = `/uploads/${file.filename}`;

      if (isConfigured) {
        try {
          const cloudResult = await cloudinary.uploader.upload(file.path, {
            folder: 'the_ethnic_edit/products',
            resource_type: 'auto'
          });
          if (cloudResult && cloudResult.secure_url) {
            fileUrl = cloudResult.secure_url;
            console.log(`☁️ [Cloudinary] Uploaded successfully: ${fileUrl}`);
          }
        } catch (cloudErr) {
          console.warn('⚠️ [Cloudinary Upload Warning]:', cloudErr.message);
        }
      }

      return {
        url: fileUrl,
        filename: file.filename,
        original_name: file.originalname,
        size: file.size
      };
    })
  );

  return res.json({
    success: true,
    message: `${files.length} files uploaded successfully.`,
    files
  });
};

export const deleteUpload = (req, res) => {
  const { filename } = req.params;
  const filePath = path.resolve(__dirname, '../../uploads', filename);

  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    return res.json({ success: true, message: 'File deleted.' });
  }

  return res.status(404).json({ success: false, message: 'File not found.' });
};

