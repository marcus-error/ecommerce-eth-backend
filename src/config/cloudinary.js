import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from backend/.env or root .env
const envPaths = [
  path.resolve(__dirname, '../../.env'),
  path.resolve(__dirname, '../../../.env'),
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), 'backend/.env')
];

for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }
}

// Runtime config cache (can be updated via Admin Settings)
let runtimeConfig = {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
  api_key: process.env.CLOUDINARY_API_KEY || '',
  api_secret: process.env.CLOUDINARY_API_SECRET || ''
};

export function updateCloudinaryConfig({ cloud_name, api_key, api_secret }) {
  if (cloud_name !== undefined) runtimeConfig.cloud_name = cloud_name;
  if (api_key !== undefined) runtimeConfig.api_key = api_key;
  if (api_secret !== undefined) runtimeConfig.api_secret = api_secret;

  if (runtimeConfig.cloud_name && runtimeConfig.api_key && runtimeConfig.api_secret) {
    cloudinary.config({
      cloud_name: runtimeConfig.cloud_name,
      api_key: runtimeConfig.api_key,
      api_secret: runtimeConfig.api_secret,
      secure: true
    });
    console.log(`☁️ [Cloudinary] Runtime config updated with cloud: ${runtimeConfig.cloud_name}`);
  }
}

export function getCloudinaryClient(overrideCredentials = null) {
  const cloudName = overrideCredentials?.cloud_name || runtimeConfig.cloud_name || process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = overrideCredentials?.api_key || runtimeConfig.api_key || process.env.CLOUDINARY_API_KEY;
  const apiSecret = overrideCredentials?.api_secret || runtimeConfig.api_secret || process.env.CLOUDINARY_API_SECRET;

  if (cloudName && apiKey && apiSecret) {
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true
    });
    return {
      cloudinary,
      isConfigured: true,
      cloudName,
      apiKey: apiKey ? `${apiKey.slice(0, 4)}...${apiKey.slice(-3)}` : ''
    };
  }

  return { cloudinary, isConfigured: false, cloudName: null, apiKey: null };
}

export async function testCloudinaryConnection(creds = {}) {
  const cloudName = creds.cloud_name || runtimeConfig.cloud_name || process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = creds.api_key || runtimeConfig.api_key || process.env.CLOUDINARY_API_KEY;
  const apiSecret = creds.api_secret || runtimeConfig.api_secret || process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    return {
      success: false,
      message: 'Cloudinary credentials missing. Please provide Cloud Name, API Key, and API Secret.',
      details: { cloudName: !!cloudName, apiKey: !!apiKey, apiSecret: !!apiSecret }
    };
  }

  try {
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true
    });

    const pingResult = await cloudinary.api.ping();
    return {
      success: true,
      message: `Successfully connected to Cloudinary! Status: ${pingResult.status || 'OK'}.`,
      cloud_name: cloudName,
      ping: pingResult
    };
  } catch (err) {
    const errorObj = err?.error || err;
    const msg = errorObj.message || err.message || 'Unknown error connecting to Cloudinary';
    const httpCode = errorObj.http_code || err.http_code;

    let actionableAdvice = msg;
    if (msg.toLowerCase().includes('cloud_name mismatch') || httpCode === 401) {
      actionableAdvice = `Cloud Name Mismatch: The Cloud Name "${cloudName}" does not belong to API Key "${apiKey}". Please open your Cloudinary Console (https://cloudinary.com/console) and copy the exact "Cloud Name" under "Account Details" (it is often a short unique ID).`;
    } else if (msg.toLowerCase().includes('invalid api_key') || httpCode === 401) {
      actionableAdvice = 'Invalid API Key or API Secret. Please check your credentials in the Cloudinary Console.';
    }

    return {
      success: false,
      message: actionableAdvice,
      raw_error: msg,
      http_code: httpCode
    };
  }
}

export async function deleteFromCloudinary(publicId) {
  if (!publicId) return { success: false, message: 'No public_id provided.' };
  try {
    const { cloudinary, isConfigured } = getCloudinaryClient();
    if (!isConfigured) return { success: false, message: 'Cloudinary not configured.' };
    const res = await cloudinary.uploader.destroy(publicId);
    return { success: res.result === 'ok', result: res };
  } catch (err) {
    console.warn(`[Cloudinary] Failed to delete image ${publicId}:`, err.message);
    return { success: false, error: err.message };
  }
}

const { isConfigured, cloudName } = getCloudinaryClient();
if (isConfigured) {
  console.log(`☁️ [Cloudinary] Initialized with cloud: ${cloudName}`);
} else {
  console.log('ℹ️ [Cloudinary] Credentials not fully set — waiting for config or using local /uploads fallback.');
}

export { cloudinary, isConfigured };
