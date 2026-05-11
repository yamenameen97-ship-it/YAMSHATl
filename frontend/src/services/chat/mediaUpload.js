import axios from 'axios';
import logger from '../../utils/logger.js';

class MediaUploadPipeline {
  constructor() {
    this.chunkSize = 1024 * 1024; // 1MB chunks
    this.maxRetries = 3;
  }

  async compressImage(file) {
    // Basic implementation using Canvas for compression
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          let width = img.width;
          let height = img.height;
          const maxDim = 1200;
          
          if (width > height && width > maxDim) {
            height *= maxDim / width;
            width = maxDim;
          } else if (height > maxDim) {
            width *= maxDim / height;
            height = maxDim;
          }
          
          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob((blob) => {
            resolve(new File([blob], file.name, { type: 'image/jpeg' }));
          }, 'image/jpeg', 0.7);
        };
      };
    });
  }

  async uploadWithProgress(file, onProgress) {
    let processedFile = file;
    if (file.type.startsWith('image/')) {
      processedFile = await this.compressImage(file);
    }

    if (processedFile.size > this.chunkSize * 2) {
      return this.chunkUpload(processedFile, onProgress);
    }

    return this.simpleUploadWithRetry(processedFile, onProgress);
  }

  async simpleUploadWithRetry(file, onProgress, attempt = 1) {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post('/api/upload', formData, {
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          if (onProgress) onProgress(percentCompleted);
        }
      });

      return response.data;
    } catch (error) {
      if (attempt < this.maxRetries) {
        logger.warn(`Upload failed, retrying attempt ${attempt + 1}...`);
        return this.simpleUploadWithRetry(file, onProgress, attempt + 1);
      }
      throw error;
    }
  }

  async chunkUpload(file, onProgress) {
    const totalChunks = Math.ceil(file.size / this.chunkSize);
    const uploadId = Date.now().toString();
    
    for (let i = 0; i < totalChunks; i++) {
      const start = i * this.chunkSize;
      const end = Math.min(file.size, start + this.chunkSize);
      const chunk = file.slice(start, end);
      
      const formData = new FormData();
      formData.append('chunk', chunk);
      formData.append('chunkIndex', i);
      formData.append('totalChunks', totalChunks);
      formData.append('uploadId', uploadId);
      formData.append('fileName', file.name);

      await this.uploadChunkWithRetry(formData, i, totalChunks, onProgress);
    }

    // Finalize upload
    const finalizeResponse = await axios.post('/api/upload/finalize', { uploadId, fileName: file.name });
    return finalizeResponse.data;
  }

  async uploadChunkWithRetry(formData, index, total, onProgress, attempt = 1) {
    try {
      await axios.post('/api/upload/chunk', formData);
      if (onProgress) {
        const percentCompleted = Math.round(((index + 1) * 100) / total);
        onProgress(percentCompleted);
      }
    } catch (error) {
      if (attempt < this.maxRetries) {
        return this.uploadChunkWithRetry(formData, index, total, onProgress, attempt + 1);
      }
      throw error;
    }
  }
}

export const mediaUploadPipeline = new MediaUploadPipeline();
export default mediaUploadPipeline;
