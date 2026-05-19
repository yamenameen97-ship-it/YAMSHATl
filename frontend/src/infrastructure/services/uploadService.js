/**
 * Unified Upload Service
 * 
 * Provides:
 * - Centralized file upload handling
 * - Progress tracking
 * - Cancellation support
 * - Chunk upload for large files
 * - Retry logic
 * - File validation
 */

import apiClient from '../../core/api/client.js';
import logger from '../../core/utils/logger.js';

// ============================================
// Constants
// ============================================

const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB
const ALLOWED_TYPES = {
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  video: ['video/mp4', 'video/webm', 'video/quicktime'],
  audio: ['audio/mpeg', 'audio/wav', 'audio/ogg'],
  document: ['application/pdf', 'application/msword'],
};

// ============================================
// Upload Manager
// ============================================

class UploadManager {
  constructor() {
    this.uploads = new Map();
    this.abortControllers = new Map();
  }

  // ============================================
  // File Validation
  // ============================================

  validateFile(file, allowedTypes = []) {
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`File size exceeds maximum limit of ${MAX_FILE_SIZE / 1024 / 1024}MB`);
    }

    // Check file type
    if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
      throw new Error(`File type "${file.type}" is not allowed`);
    }

    return true;
  }

  // ============================================
  // Single File Upload
  // ============================================

  async uploadFile(file, endpoint, options = {}) {
    const uploadId = `upload_${Date.now()}_${Math.random()}`;

    try {
      // Validate file
      this.validateFile(file, options.allowedTypes);

      // Create abort controller
      const abortController = new AbortController();
      this.abortControllers.set(uploadId, abortController);

      // Create FormData
      const formData = new FormData();
      formData.append('file', file);

      // Add additional fields
      if (options.metadata) {
        Object.entries(options.metadata).forEach(([key, value]) => {
          formData.append(key, value);
        });
      }

      // Track upload progress
      const uploadProgress = {
        id: uploadId,
        fileName: file.name,
        fileSize: file.size,
        uploadedSize: 0,
        progress: 0,
        status: 'uploading',
        startTime: Date.now(),
      };

      this.uploads.set(uploadId, uploadProgress);

      logger.info(`[Upload] Starting upload: ${file.name}`, { uploadId });

      // Perform upload
      const response = await apiClient.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (event) => {
          uploadProgress.uploadedSize = event.loaded;
          uploadProgress.progress = Math.round((event.loaded / event.total) * 100);

          if (options.onProgress) {
            options.onProgress(uploadProgress);
          }

          logger.debug(`[Upload] Progress: ${uploadProgress.progress}%`, { uploadId });
        },
        signal: abortController.signal,
      });

      uploadProgress.status = 'completed';
      uploadProgress.response = response.data;

      logger.info(`[Upload] Completed: ${file.name}`, { uploadId });

      if (options.onSuccess) {
        options.onSuccess(response.data);
      }

      return response.data;
    } catch (error) {
      const uploadProgress = this.uploads.get(uploadId);

      if (error.name === 'AbortError') {
        uploadProgress.status = 'cancelled';
        logger.info(`[Upload] Cancelled: ${file.name}`, { uploadId });

        if (options.onCancel) {
          options.onCancel();
        }
      } else {
        uploadProgress.status = 'failed';
        uploadProgress.error = error.message;

        logger.error(`[Upload] Failed: ${file.name}`, { uploadId, error });

        if (options.onError) {
          options.onError(error);
        }
      }

      throw error;
    } finally {
      this.abortControllers.delete(uploadId);
      // Keep upload record for a while for status tracking
      setTimeout(() => {
        this.uploads.delete(uploadId);
      }, 5000);
    }
  }

  // ============================================
  // Multiple Files Upload
  // ============================================

  async uploadMultiple(files, endpoint, options = {}) {
    const uploadIds = [];
    const results = [];
    const errors = [];

    const maxConcurrent = options.maxConcurrent || 3;
    const queue = Array.from(files);

    const uploadNext = async () => {
      if (queue.length === 0) return;

      const file = queue.shift();

      try {
        const result = await this.uploadFile(file, endpoint, {
          ...options,
          onProgress: (progress) => {
            if (options.onProgress) {
              options.onProgress(progress);
            }
          },
        });

        results.push(result);
      } catch (error) {
        errors.push({ file: file.name, error });
      }

      return uploadNext();
    };

    // Start concurrent uploads
    const uploadPromises = Array(Math.min(maxConcurrent, files.length))
      .fill(null)
      .map(() => uploadNext());

    await Promise.all(uploadPromises);

    if (options.onComplete) {
      options.onComplete({ results, errors });
    }

    return { results, errors };
  }

  // ============================================
  // Chunked Upload for Large Files
  // ============================================

  async uploadChunked(file, endpoint, options = {}) {
    const uploadId = `upload_${Date.now()}_${Math.random()}`;

    try {
      this.validateFile(file, options.allowedTypes);

      const abortController = new AbortController();
      this.abortControllers.set(uploadId, abortController);

      const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
      const uploadProgress = {
        id: uploadId,
        fileName: file.name,
        fileSize: file.size,
        totalChunks,
        uploadedChunks: 0,
        progress: 0,
        status: 'uploading',
        startTime: Date.now(),
      };

      this.uploads.set(uploadId, uploadProgress);

      logger.info(`[Chunked Upload] Starting: ${file.name} (${totalChunks} chunks)`, { uploadId });

      // Upload chunks
      for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
        if (abortController.signal.aborted) {
          throw new Error('Upload cancelled');
        }

        const start = chunkIndex * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, file.size);
        const chunk = file.slice(start, end);

        const formData = new FormData();
        formData.append('chunk', chunk);
        formData.append('chunkIndex', chunkIndex);
        formData.append('totalChunks', totalChunks);
        formData.append('fileId', uploadId);
        formData.append('fileName', file.name);

        await apiClient.post(endpoint, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          signal: abortController.signal,
        });

        uploadProgress.uploadedChunks++;
        uploadProgress.progress = Math.round((uploadProgress.uploadedChunks / totalChunks) * 100);

        if (options.onProgress) {
          options.onProgress(uploadProgress);
        }

        logger.debug(`[Chunked Upload] Chunk ${chunkIndex + 1}/${totalChunks}`, { uploadId });
      }

      uploadProgress.status = 'completed';

      logger.info(`[Chunked Upload] Completed: ${file.name}`, { uploadId });

      if (options.onSuccess) {
        options.onSuccess(uploadProgress);
      }

      return uploadProgress;
    } catch (error) {
      const uploadProgress = this.uploads.get(uploadId);

      if (error.message === 'Upload cancelled') {
        uploadProgress.status = 'cancelled';
        if (options.onCancel) {
          options.onCancel();
        }
      } else {
        uploadProgress.status = 'failed';
        uploadProgress.error = error.message;

        if (options.onError) {
          options.onError(error);
        }
      }

      logger.error(`[Chunked Upload] Failed: ${file.name}`, { uploadId, error });

      throw error;
    } finally {
      this.abortControllers.delete(uploadId);
    }
  }

  // ============================================
  // Upload Control
  // ============================================

  cancelUpload(uploadId) {
    const abortController = this.abortControllers.get(uploadId);
    if (abortController) {
      abortController.abort();
      logger.info('[Upload] Cancelled', { uploadId });
    }
  }

  cancelAll() {
    this.abortControllers.forEach((controller) => {
      controller.abort();
    });
    logger.info('[Upload] All uploads cancelled');
  }

  // ============================================
  // Status Tracking
  // ============================================

  getUploadStatus(uploadId) {
    return this.uploads.get(uploadId) || null;
  }

  getAllUploads() {
    return Array.from(this.uploads.values());
  }

  getActiveUploads() {
    return Array.from(this.uploads.values()).filter(u => u.status === 'uploading');
  }

  clearCompleted() {
    for (const [id, upload] of this.uploads.entries()) {
      if (upload.status === 'completed' || upload.status === 'failed' || upload.status === 'cancelled') {
        this.uploads.delete(id);
      }
    }
  }
}

// ============================================
// Export Singleton Instance
// ============================================

export const uploadManager = new UploadManager();

export default uploadManager;
