import mediaUploadService from '../media/mediaUploadService.js';

export class MediaUploadPipeline {
  async compressImage(file, onProgress) {
    const prepared = await mediaUploadService.prepareFile(file, onProgress);
    return prepared.file;
  }

  async uploadWithProgress(file, onProgress) {
    return mediaUploadService.uploadFile(file, { onProgress });
  }

  async uploadVoiceNote(blob, options = {}) {
    return mediaUploadService.uploadVoiceNote(blob, options);
  }
}

export const mediaUploadPipeline = new MediaUploadPipeline();
export default mediaUploadPipeline;
