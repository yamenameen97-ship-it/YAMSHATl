import { useRef, useState } from 'react';
import Button from '../ui/Button.jsx';

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const COMPRESSION_QUALITY = 0.85;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export default function ImageUploader({ onUploadComplete, onError, label = 'رفع صورة' }) {
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef(null);

  const compressImage = async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Calculate new dimensions (max 1920x1080)
          let width = img.width;
          let height = img.height;
          const maxWidth = 1920;
          const maxHeight = 1080;
          
          if (width > height) {
            if (width > maxWidth) {
              height *= maxWidth / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width *= maxHeight / height;
              height = maxHeight;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob(
            (blob) => {
              resolve(new File([blob], file.name, { type: file.type }));
            },
            file.type,
            COMPRESSION_QUALITY
          );
        };
        img.onerror = () => reject(new Error('فشل تحميل الصورة'));
      };
      reader.onerror = () => reject(new Error('فشل قراءة الملف'));
    });
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      onError?.('نوع الملف غير مدعوم. استخدم JPEG أو PNG أو WebP أو GIF');
      return;
    }

    // Validate file size
    if (file.size > MAX_IMAGE_SIZE) {
      onError?.(`حجم الملف كبير جداً. الحد الأقصى: ${MAX_IMAGE_SIZE / (1024 * 1024)}MB`);
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setPreview(event.target.result);
    };
    reader.readAsDataURL(file);

    // Upload
    await uploadImage(file);
  };

  const uploadImage = async (file) => {
    try {
      setUploading(true);
      setProgress(0);

      // Compress image
      const compressedFile = await compressImage(file);
      
      // Simulate upload with progress
      const formData = new FormData();
      formData.append('image', compressedFile);

      // Mock upload progress
      for (let i = 0; i <= 100; i += 10) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        setProgress(i);
      }

      // Mock API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      onUploadComplete?.(compressedFile, preview);
    } catch (error) {
      onError?.(error.message);
      setPreview(null);
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const handleRemoveImage = () => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="image-uploader">
      {preview ? (
        <div className="image-preview">
          <img src={preview} alt="معاينة" />
          <div className="preview-actions">
            <Button
              variant="secondary"
              size="small"
              onClick={handleRemoveImage}
              disabled={uploading}
            >
              إزالة
            </Button>
            <Button
              size="small"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              تغيير
            </Button>
          </div>
          {uploading && (
            <div className="upload-progress">
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${progress}%` }} />
              </div>
              <p>{progress}%</p>
            </div>
          )}
        </div>
      ) : (
        <div className="image-upload-area">
          <div className="upload-icon">🖼️</div>
          <p>{label}</p>
          <p className="muted">PNG, JPEG, WebP أو GIF</p>
          <Button
            variant="secondary"
            onClick={() => fileInputRef.current?.click()}
            loading={uploading}
          >
            اختر صورة
          </Button>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={ALLOWED_TYPES.join(',')}
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />
    </div>
  );
}
