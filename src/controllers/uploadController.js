import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import {
  getCloudinaryClient,
  testCloudinaryConnection,
  deleteFromCloudinary
} from '../config/cloudinary.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to copy local upload to frontend public folder for immediate hot-rendering in dev
const syncToFrontendPublic = (filePath, filename) => {
  try {
    const frontendDir = path.resolve(__dirname, '../../../frontend/public/uploads');
    if (!fs.existsSync(frontendDir)) {
      fs.mkdirSync(frontendDir, { recursive: true });
    }
    fs.copyFileSync(filePath, path.resolve(frontendDir, filename));
  } catch (e) {
    // Non-fatal if frontend public folder is unavailable
  }
};

export const uploadSingle = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded.' });
  }

  // Validate image file type
  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif', 'image/svg+xml'];
  if (!allowedMimes.includes(req.file.mimetype)) {
    try { fs.unlinkSync(req.file.path); } catch (e) {}
    return res.status(400).json({
      success: false,
      message: `Unsupported file type: ${req.file.mimetype}. Allowed: JPG, PNG, WEBP, GIF, AVIF.`
    });
  }

  // Sync to frontend public uploads as fallback
  syncToFrontendPublic(req.file.path, req.file.filename);

  let finalUrl = `/uploads/${req.file.filename}`;
  let publicId = null;
  let cloudError = null;

  const { cloudinary, isConfigured } = getCloudinaryClient();

  if (isConfigured) {
    try {
      const cloudResult = await cloudinary.uploader.upload(req.file.path, {
        folder: 'the_ethnic_edit/products',
        resource_type: 'image',
        use_filename: true,
        unique_filename: true
      });

      if (cloudResult && cloudResult.secure_url) {
        finalUrl = cloudResult.secure_url;
        publicId = cloudResult.public_id;
        console.log(`☁️ [Cloudinary] Uploaded successfully: ${finalUrl} (public_id: ${publicId})`);
      }
    } catch (err) {
      const errorMsg = err?.error?.message || err.message || 'Cloudinary upload rejected';
      cloudError = errorMsg;
      console.warn('⚠️ [Cloudinary Upload Error]:', errorMsg);
    }
  }

  return res.json({
    success: true,
    message: finalUrl.startsWith('http')
      ? 'File uploaded to Cloudinary CDN successfully.'
      : cloudError
        ? `Saved locally. Cloudinary notice: ${cloudError}`
        : 'File uploaded to local storage successfully.',
    url: finalUrl,
    public_id: publicId,
    storage: finalUrl.startsWith('http') ? 'cloudinary' : 'local',
    cloudinary_error: cloudError,
    filename: req.file.filename,
    original_name: req.file.originalname,
    size: req.file.size
  });
};

export const uploadMultiple = async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ success: false, message: 'No files uploaded.' });
  }

  const { cloudinary, isConfigured } = getCloudinaryClient();

  const files = await Promise.all(
    req.files.map(async (file) => {
      syncToFrontendPublic(file.path, file.filename);

      let fileUrl = `/uploads/${file.filename}`;
      let publicId = null;
      let cloudError = null;

      if (isConfigured) {
        try {
          const cloudResult = await cloudinary.uploader.upload(file.path, {
            folder: 'the_ethnic_edit/products',
            resource_type: 'image',
            use_filename: true,
            unique_filename: true
          });

          if (cloudResult && cloudResult.secure_url) {
            fileUrl = cloudResult.secure_url;
            publicId = cloudResult.public_id;
            console.log(`☁️ [Cloudinary] Uploaded successfully: ${fileUrl} (${publicId})`);
          }
        } catch (err) {
          cloudError = err?.error?.message || err.message;
          console.warn('⚠️ [Cloudinary Upload Error]:', cloudError);
        }
      }

      return {
        url: fileUrl,
        public_id: publicId,
        storage: fileUrl.startsWith('http') ? 'cloudinary' : 'local',
        cloudinary_error: cloudError,
        filename: file.filename,
        original_name: file.originalname,
        size: file.size
      };
    })
  );

  const anyCloudinary = files.some((f) => f.storage === 'cloudinary');
  return res.json({
    success: true,
    message: anyCloudinary
      ? `Uploaded ${files.length} file(s) to Cloudinary CDN.`
      : `Uploaded ${files.length} file(s) to storage.`,
    files
  });
};

export const testCloudinaryEndpoint = async (req, res) => {
  try {
    const { cloud_name, api_key, api_secret } = req.body || {};
    const result = await testCloudinaryConnection({ cloud_name, api_key, api_secret });
    if (result.success) {
      return res.json(result);
    }
    return res.status(400).json(result);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteImageEndpoint = async (req, res) => {
  try {
    const { public_id } = req.body;
    if (!public_id) {
      return res.status(400).json({ success: false, message: 'public_id is required.' });
    }

    const result = await deleteFromCloudinary(public_id);
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
