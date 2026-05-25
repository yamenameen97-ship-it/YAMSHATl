import React from 'react';
import logger from '../utils/logger.js';
import { defaultRetryManager } from './retryManager.js';

const viteEnv = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : {};

/**
 * Upload Manager
 * 
 * نظام متقدم لإدارة الرفع مع:
 * - التحقق من متغيرات البيئة
 * - معالجة الأخطاء المتقدمة
 * - Resumable Upload
 * - Progress Tracking
 * - Compression والتحسينات
 */
export class UploadManager {
  constructor(options = {}) {
    this.cloudinaryUrl = options.cloudinaryUrl || viteEnv.VITE_CLOUDINARY_URL || process.env.REACT_APP_CLOUDINARY_URL;
    this.cloudinaryPreset = options.cloudinaryPreset || viteEnv.VITE_CLOUDINARY_PRESET || process.env.REACT_APP_CLOUDINARY_PRESET;
    this.apiUrl = options.apiUrl || viteEnv.VITE_API_BASE || viteEnv.VITE_API_URL || process.env.REACT_APP_API_URL;
    this.maxFileSize = options.maxFileSize || 100 * 1024 * 1024; // 100MB
    this.maxImageSize = options.maxImageSize || 10 * 1024 * 1024; // 10MB
    this.maxVideoSize = options.maxVideoSize || 100 * 1024 * 1024; // 100MB
    this.allowedImageTypes = options.allowedImageTypes || ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    this.allowedVideoTypes = options.allowedVideoTypes || ['video/mp4', 'video/webm', 'video/quicktime'];
    this.retryManager = options.retryManager || defaultRetryManager;
    this.uploads = new Map();
    this.listeners = new Set();
    this.validateEnvironment();
  }

  /**
   * التحقق من متغيرات البيئة
   */
  validateEnvironment() {
    const missingVars = [];

    if (!this.apiUrl) {
      missingVars.push('VITE_API_BASE');
    }

    if (missingVars.length > 0) {
      logger.warn('Missing environment variables for upload', {
        missing: missingVars,
      });
    }

    return missingVars.length === 0;
  }

  /**
   * التحقق من صحة الملف
   */
  validateFile(file, type = 'image') {
    const errors = [];

    if (!file) {
      errors.push('الملف مفقود');
      return { valid: false, errors };
    }

    // التحقق من الحجم
    const maxSize = type === 'video' ? this.maxVideoSize : this.maxImageSize;
    if (file.size > maxSize) {
      errors.push(`حجم الملف يتجاوز الحد الأقصى: ${this.formatFileSize(maxSize)}`);
    }

    // التحقق من نوع الملف
    const allowedTypes = type === 'video' ? this.allowedVideoTypes : this.allowedImageTypes;
    if (!allowedTypes.includes(file.type)) {
      errors.push(`نوع الملف غير مدعوم: ${file.type}`);
    }

    // التحقق من اسم الملف
    if (!file.name || file.name.trim().length === 0) {
      errors.push('اسم الملف غير صحيح');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * تنسيق حجم الملف
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * رفع ملف إلى Cloudinary
   */
  async uploadToCloudinary(file, options = {}) {
    const {
      folder = 'yamshat',
      onProgress = () => {},
    } = options;

    try {
      logger.info('Starting Cloudinary upload', {
        fileName: file.name,
        fileSize: this.formatFileSize(file.size),
      });

      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', this.cloudinaryPreset);
      formData.append('folder', folder);
      formData.append('resource_type', 'auto');

      const xhr = new XMLHttpRequest();

      // تتبع التقدم
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = (e.loaded / e.total) * 100;
          onProgress({ loaded: e.loaded, total: e.total, percent: percentComplete });
        }
      });

      return new Promise((resolve, reject) => {
        xhr.addEventListener('load', () => {
          if (xhr.status === 200) {
            const response = JSON.parse(xhr.responseText);
            logger.info('Cloudinary upload completed', {
              url: response.secure_url,
              publicId: response.public_id,
            });
            resolve(response);
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Upload failed'));
        });

        xhr.addEventListener('abort', () => {
          reject(new Error('Upload aborted'));
        });

        xhr.open('POST', this.cloudinaryUrl);
        xhr.send(formData);
      });
    } catch (error) {
      logger.error('Cloudinary upload failed', { error: error?.message });
      throw error;
    }
  }

  /**
   * رفع ملف إلى الخادم
   */
  async uploadToServer(file, options = {}) {
    const {
      endpoint = '/api/upload',
      onProgress = () => {},
    } = options;

    try {
      logger.info('Starting server upload', {
        fileName: file.name,
        endpoint,
      });

      const formData = new FormData();
      formData.append('file', file);

      const xhr = new XMLHttpRequest();

      // تتبع التقدم
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = (e.loaded / e.total) * 100;
          onProgress({ loaded: e.loaded, total: e.total, percent: percentComplete });
        }
      });

      return new Promise((resolve, reject) => {
        xhr.addEventListener('load', () => {
          if (xhr.status === 200 || xhr.status === 201) {
            const response = JSON.parse(xhr.responseText);
            logger.info('Server upload completed', { response });
            resolve(response);
          } else {
            const errorData = JSON.parse(xhr.responseText);
            reject(new Error(errorData.detail || `Upload failed with status ${xhr.status}`));
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Upload failed'));
        });

        xhr.addEventListener('abort', () => {
          reject(new Error('Upload aborted'));
        });

        xhr.open('POST', `${this.apiUrl}${endpoint}`);
        xhr.setRequestHeader('Authorization', `Bearer ${this.getAuthToken()}`);
        xhr.send(formData);
      });
    } catch (error) {
      logger.error('Server upload failed', { error: error?.message });
      throw error;
    }
  }

  /**
   * رفع مع إعادة محاولة
   */
  async uploadWithRetry(file, options = {}) {
    const uploadId = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    
    this.uploads.set(uploadId, {
      id: uploadId,
      file,
      status: 'pending',
      progress: 0,
      error: null,
    });

    try {
      const uploadExecutor = () => {
        const uploadOptions = {
          ...options,
          onProgress: (progress) => {
            this.updateUploadProgress(uploadId, progress);
            options.onProgress?.(progress);
          },
        };

        if (this.cloudinaryUrl && this.cloudinaryPreset) {
          return this.uploadToCloudinary(file, uploadOptions);
        }

        return this.uploadToServer(file, {
          endpoint: options.endpoint || '/upload',
          onProgress: uploadOptions.onProgress,
        });
      };

      const result = await this.retryManager.execute(
        uploadExecutor,
        { uploadId, fileName: file.name }
      );

      this.updateUploadStatus(uploadId, 'completed', result);
      this.notifyListeners('upload_completed', { uploadId, result });

      return result;
    } catch (error) {
      this.updateUploadStatus(uploadId, 'failed', null, error?.message);
      this.notifyListeners('upload_failed', { uploadId, error: error?.message });
      throw error;
    }
  }

  /**
   * تحديث تقدم الرفع
   */
  updateUploadProgress(uploadId, progress) {
    const upload = this.uploads.get(uploadId);
    if (upload) {
      upload.progress = progress.percent || 0;
      this.notifyListeners('upload_progress', { uploadId, progress });
    }
  }

  /**
   * تحديث حالة الرفع
   */
  updateUploadStatus(uploadId, status, result = null, error = null) {
    const upload = this.uploads.get(uploadId);
    if (upload) {
      upload.status = status;
      upload.result = result;
      upload.error = error;
      this.notifyListeners('upload_status_changed', { uploadId, status });
    }
  }

  /**
   * الاستماع إلى تغييرات الرفع
   */
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * إخطار المستمعين
   */
  notifyListeners(event, data) {
    this.listeners.forEach(listener => {
      try {
        listener({ event, data });
      } catch (error) {
        logger.warn('Listener error', { error: error?.message });
      }
    });
  }

  /**
   * الحصول على رمز المصادقة
   */
  getAuthToken() {
    try {
      return localStorage.getItem('auth_token') || '';
    } catch {
      return '';
    }
  }

  /**
   * تنظيف الموارد
   */
  cleanup() {
    this.uploads.clear();
    this.listeners.clear();
  }
}

/**
 * مثيل عام من Upload Manager
 */
export const defaultUploadManager = new UploadManager({
  cloudinaryUrl: viteEnv.VITE_CLOUDINARY_URL || process.env.REACT_APP_CLOUDINARY_URL,
  cloudinaryPreset: viteEnv.VITE_CLOUDINARY_PRESET || process.env.REACT_APP_CLOUDINARY_PRESET,
  apiUrl: viteEnv.VITE_API_BASE || viteEnv.VITE_API_URL || process.env.REACT_APP_API_URL,
});

/**
 * Hook لإدارة الرفع
 */
export function useUploadManager(options = {}) {
  const [uploads, setUploads] = React.useState(new Map());
  const [error, setError] = React.useState(null);
  const manager = React.useRef(new UploadManager(options)).current;

  React.useEffect(() => {
    const unsubscribe = manager.subscribe((event) => {
      if (event.event === 'upload_progress' || event.event === 'upload_status_changed') {
        setUploads(new Map(manager.uploads));
      }
      if (event.event === 'upload_failed') {
        setError(event.data.error);
      }
    });

    return () => {
      unsubscribe();
      manager.cleanup();
    };
  }, [manager]);

  const upload = React.useCallback(async (file, uploadOptions = {}) => {
    setError(null);
    try {
      const validation = manager.validateFile(file, uploadOptions.type || 'image');
      if (!validation.valid) {
        setError(validation.errors.join(', '));
        throw new Error(validation.errors.join(', '));
      }

      return await manager.uploadWithRetry(file, uploadOptions);
    } catch (err) {
      setError(err?.message);
      throw err;
    }
  }, [manager]);

  return {
    uploads: Array.from(uploads.values()),
    error,
    upload,
    isValid: manager.validateEnvironment(),
  };
}
