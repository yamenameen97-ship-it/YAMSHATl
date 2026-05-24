/**
 * Image Optimizer Utility
 * Features: WebP conversion, Lazy loading helpers, Responsive sizes
 */

const SUPPORTED_FORMATS = ['webp', 'jpg', 'png', 'gif'];
const QUALITY_LEVELS = {
  low: 60,
  medium: 75,
  high: 85,
  ultra: 95,
};

/**
 * Checks if browser supports WebP format
 */
export function supportsWebP() {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  return canvas.toDataURL('image/webp').indexOf('image/webp') === 5;
}

/**
 * Converts image to WebP format
 */
export async function convertToWebP(imageUrl, quality = 'high') {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      
      canvas.toBlob(
        (blob) => {
          const url = URL.createObjectURL(blob);
          resolve(url);
        },
        'image/webp',
        QUALITY_LEVELS[quality] / 100
      );
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = imageUrl;
  });
}

/**
 * Optimizes image by resizing
 */
export async function optimizeImage(imageUrl, width, height, quality = 'high') {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(
        (blob) => {
          const url = URL.createObjectURL(blob);
          resolve(url);
        },
        supportsWebP() ? 'image/webp' : 'image/jpeg',
        QUALITY_LEVELS[quality] / 100
      );
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = imageUrl;
  });
}

/**
 * Generates responsive image sizes
 */
export function getResponsiveSizes(baseWidth = 800) {
  return {
    thumbnail: Math.round(baseWidth * 0.25), // 200px
    small: Math.round(baseWidth * 0.5), // 400px
    medium: Math.round(baseWidth * 0.75), // 600px
    large: baseWidth, // 800px
    xlarge: Math.round(baseWidth * 1.5), // 1200px
  };
}

/**
 * Generates srcSet for responsive images
 */
export function generateSrcSet(imageUrl, sizes = null) {
  const responsiveSizes = sizes || getResponsiveSizes();
  const srcSet = [];

  Object.entries(responsiveSizes).forEach(([name, width]) => {
    srcSet.push(`${imageUrl}?w=${width} ${width}w`);
  });

  return srcSet.join(', ');
}

/**
 * Creates lazy loading image element
 */
export function createLazyImage(imageUrl, alt = '', options = {}) {
  const {
    width = 'auto',
    height = 'auto',
    className = '',
    placeholder = null,
    quality = 'high',
  } = options;

  const img = document.createElement('img');
  img.alt = alt;
  img.className = `lazy-image ${className}`;
  img.style.width = width;
  img.style.height = height;

  // Set placeholder
  if (placeholder) {
    img.src = placeholder;
  } else {
    // Use a low-quality placeholder
    img.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E%3Crect fill='%23f0f0f0' width='400' height='300'/%3E%3C/svg%3E`;
  }

  // Set data attributes for lazy loading
  img.dataset.src = imageUrl;
  img.dataset.quality = quality;

  // Lazy load the image
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const lazyImg = entry.target;
          lazyImg.src = lazyImg.dataset.src;
          lazyImg.classList.add('loaded');
          observer.unobserve(lazyImg);
        }
      });
    });
    observer.observe(img);
  } else {
    // Fallback for browsers without IntersectionObserver
    img.src = imageUrl;
  }

  return img;
}

/**
 * Preloads images
 */
export function preloadImages(imageUrls) {
  const promises = imageUrls.map((url) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(url);
      img.onerror = () => reject(new Error(`Failed to preload: ${url}`));
      img.src = url;
    });
  });

  return Promise.all(promises);
}

/**
 * Gets optimal image format based on browser support
 */
export function getOptimalFormat() {
  if (supportsWebP()) return 'webp';
  return 'jpeg';
}

/**
 * Generates picture element with multiple formats
 */
export function generatePictureElement(imageUrl, alt = '', options = {}) {
  const {
    width = 'auto',
    height = 'auto',
    className = '',
    sizes = null,
  } = options;

  const responsiveSizes = sizes || getResponsiveSizes();
  const picture = document.createElement('picture');

  // WebP source
  if (supportsWebP()) {
    const webpSource = document.createElement('source');
    webpSource.type = 'image/webp';
    webpSource.srcSet = Object.entries(responsiveSizes)
      .map(([, width]) => `${imageUrl}?format=webp&w=${width} ${width}w`)
      .join(', ');
    picture.appendChild(webpSource);
  }

  // JPEG fallback
  const jpegSource = document.createElement('source');
  jpegSource.type = 'image/jpeg';
  jpegSource.srcSet = Object.entries(responsiveSizes)
    .map(([, width]) => `${imageUrl}?format=jpeg&w=${width} ${width}w`)
    .join(', ');
  picture.appendChild(jpegSource);

  // Img element
  const img = document.createElement('img');
  img.src = imageUrl;
  img.alt = alt;
  img.className = `responsive-image ${className}`;
  img.style.width = width;
  img.style.height = height;
  picture.appendChild(img);

  return picture;
}

/**
 * Calculates image dimensions maintaining aspect ratio
 */
export function calculateDimensions(originalWidth, originalHeight, maxWidth, maxHeight) {
  let width = originalWidth;
  let height = originalHeight;

  if (width > maxWidth) {
    height = Math.round((height * maxWidth) / width);
    width = maxWidth;
  }

  if (height > maxHeight) {
    width = Math.round((width * maxHeight) / height);
    height = maxHeight;
  }

  return { width, height };
}

/**
 * Compresses image file
 */
export async function compressImage(file, maxWidth = 1200, maxHeight = 1200, quality = 'high') {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const { width, height } = calculateDimensions(
          img.width,
          img.height,
          maxWidth,
          maxHeight
        );

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            resolve(blob);
          },
          supportsWebP() ? 'image/webp' : 'image/jpeg',
          QUALITY_LEVELS[quality] / 100
        );
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Gets image metadata
 */
export async function getImageMetadata(imageUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      resolve({
        width: img.width,
        height: img.height,
        aspectRatio: img.width / img.height,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
      });
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = imageUrl;
  });
}

/**
 * Creates blur hash for placeholder
 */
export function createBlurHash(imageUrl, size = 4) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, size, size);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.1);
      resolve(dataUrl);
    };
    img.onerror = () => reject(new Error('Failed to create blur hash'));
    img.src = imageUrl;
  });
}

export default {
  supportsWebP,
  convertToWebP,
  optimizeImage,
  getResponsiveSizes,
  generateSrcSet,
  createLazyImage,
  preloadImages,
  getOptimalFormat,
  generatePictureElement,
  calculateDimensions,
  compressImage,
  getImageMetadata,
  createBlurHash,
};
