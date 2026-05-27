
class UploadResumeManager {
  constructor() {
    this.activeUploads = new Map();
  }

  saveProgress(fileId, progress) {
    localStorage.setItem(
      `upload_progress_${fileId}`,
      JSON.stringify(progress)
    );
  }

  getProgress(fileId) {
    const data = localStorage.getItem(`upload_progress_${fileId}`);
    return data ? JSON.parse(data) : null;
  }

  clearProgress(fileId) {
    localStorage.removeItem(`upload_progress_${fileId}`);
  }
}

export const uploadResumeManager = new UploadResumeManager();
