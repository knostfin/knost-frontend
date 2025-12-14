/**
 * Cloudinary image transformation utilities
 * Generates optimized URLs for images served via Cloudinary
 */

const CLOUDINARY_BASE_URL = import.meta.env.VITE_CLOUDINARY_URL || 'https://res.cloudinary.com';

/**
 * Mapping of local image names to their Cloudinary public IDs
 * 
 * BEST PRACTICE: When uploading to Cloudinary, use the upload API with explicit public_id:
 * cloudinary.uploader.upload('logo.png', { public_id: 'logo' })
 * 
 * This avoids auto-generated suffixes like logo_abc123
 * 
 * If you already have images with suffixes, you can:
 * 1. Re-upload with explicit public_id, OR
 * 2. Use Cloudinary's rename feature, OR  
 * 3. Keep this mapping (fallback)
 */
const IMAGE_PUBLIC_IDS = {
  'logo.png': import.meta.env.VITE_CLOUDINARY_LOGO_ID || 'logo',
  'welcome-illustration.png': import.meta.env.VITE_CLOUDINARY_WELCOME_ID || 'welcome-illustration',
};

/**
 * Generate Cloudinary URL with transformations
 * @param {string} publicId - The image public ID or path
 * @param {Object} options - Transformation options
 * @param {number} options.width - Target width
 * @param {number} options.height - Target height
 * @param {string} options.format - Image format (auto, webp, avif, png, jpg)
 * @param {string} options.quality - Image quality (auto, best, good, eco, low)
 * @param {string} options.crop - Crop mode (fill, fit, scale, limit)
 * @returns {string} Optimized Cloudinary URL
 */
export function getCloudinaryUrl(publicId, options = {}) {
  const {
    width,
    height,
    format = 'auto',
    quality = 'auto',
    crop = 'limit',
  } = options;

  // If it's already a full URL, return as-is
  if (publicId?.startsWith('http')) {
    return publicId;
  }

  // If no Cloudinary config, fallback to local path
  if (!CLOUDINARY_BASE_URL.includes('cloudinary')) {
    return publicId?.startsWith('/') ? publicId : `/${publicId}`;
  }

  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  if (!cloudName) {
    // Fallback to local if not configured
    return publicId?.startsWith('/') ? publicId : `/${publicId}`;
  }

  // Build transformation string
  const transformations = [];
  
  if (width) transformations.push(`w_${width}`);
  if (height) transformations.push(`h_${height}`);
  if (crop) transformations.push(`c_${crop}`);
  transformations.push(`f_${format}`);
  transformations.push(`q_${quality}`);

  const transformStr = transformations.join(',');
  
  // Map local filename to Cloudinary public ID
  const cleanPublicId = publicId?.replace(/^\//, '') || 'logo.png';
  const actualPublicId = IMAGE_PUBLIC_IDS[cleanPublicId] || cleanPublicId;

  return `${CLOUDINARY_BASE_URL}/${cloudName}/image/upload/${transformStr}/${actualPublicId}`;
}

/**
 * Generate responsive image srcSet for Cloudinary
 * @param {string} publicId - The image public ID
 * @param {number[]} widths - Array of target widths
 * @param {Object} options - Additional transformation options
 * @returns {string} srcSet string
 */
export function getCloudinarySrcSet(publicId, widths = [62, 150, 300], options = {}) {
  return widths
    .map((width) => {
      const url = getCloudinaryUrl(publicId, { ...options, width });
      return `${url} ${width}w`;
    })
    .join(', ');
}

/**
 * Get optimized logo URL
 * @param {number} size - Display size in pixels
 * @returns {string} Optimized logo URL
 */
export function getLogoUrl(size = 62) {
  return getCloudinaryUrl('logo.png', {
    width: size,
    height: size,
    quality: 'auto',
    format: 'auto',
  });
}

/**
 * Fallback for local images when Cloudinary is not configured
 */
export function getImageUrl(path) {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  if (!cloudName) {
    return path?.startsWith('/') ? path : `/${path}`;
  }
  return getCloudinaryUrl(path);
}
