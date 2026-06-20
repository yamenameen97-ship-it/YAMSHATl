import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout.jsx';
import { createGroup, uploadGroupImage } from '../api/groups.js';
import { useToast } from '../components/admin/ToastProvider.jsx';
import '../styles/create-group.css';

const CreateGroup = () => {
  const navigate = useNavigate();
  const { pushToast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'عام',
    isPublic: true,
    image: null
  });

  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);

  const categories = [
    { id: 1, name: 'عام' },
    { id: 2, name: 'دراسة' },
    { id: 3, name: 'تقنية' },
    { id: 4, name: 'ألعاب' },
    { id: 5, name: 'تصميم' },
    { id: 6, name: 'ترفيه' }
  ];

  const handleInputChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  }, []);

  const handleImageChange = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // حد أقصى 5MB للصورة
    const MAX = 5 * 1024 * 1024;
    if (file.size > MAX) {
      pushToast?.({ type: 'warning', title: 'الصورة كبيرة', description: 'الحد الأقصى 5 ميجابايت' });
      return;
    }
    setFormData((prev) => ({ ...prev, image: file }));
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  }, [pushToast]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      pushToast?.({ type: 'warning', title: 'خطأ', description: 'أدخل اسم المجموعة' });
      return;
    }

    setLoading(true);
    try {
      const response = await createGroup({
        name: formData.name.trim(),
        description: formData.description.trim(),
        category: formData.category,
        is_public: formData.isPublic
      });

      const body = response?.data || response || {};
      const newGroupId = body.id || body.group_id || body.group?.id;

      // ✅ رفع صورة المجموعة فعلياً بعد إنشائها
      if (newGroupId && formData.image) {
        try {
          await uploadGroupImage(newGroupId, formData.image, 'avatar');
        } catch (imgErr) {
          console.warn('Group created but image upload failed:', imgErr);
          pushToast?.({
            type: 'warning',
            title: 'تنبيه',
            description: 'تم إنشاء المجموعة لكن فشل رفع الصورة. يمكنك رفعها لاحقاً من الإعدادات.',
          });
        }
      }

      if (newGroupId) {
        pushToast?.({
          type: 'success',
          title: 'تم',
          description: 'تم إنشاء المجموعة بنجاح',
        });
        navigate(`/groups/${newGroupId}/chat`, { replace: true });
      } else {
        pushToast?.({
          type: 'warning',
          title: 'تنبيه',
          description: 'تم الإنشاء لكن لم نستلم معرّف المجموعة من الخادم',
        });
        navigate('/groups');
      }
    } catch (error) {
      console.error('Error creating group:', error);
      pushToast?.({
        type: 'error',
        title: 'خطأ',
        description: error?.message || 'فشل إنشاء المجموعة'
      });
    } finally {
      setLoading(false);
    }
  }, [formData, pushToast, navigate]);

  return (
    <MainLayout>
    <div
      className="yam-create-group-page"
      dir="rtl"
      style={{ fontFamily: "'Noto Sans Arabic','Cairo','Tahoma',sans-serif" }}
    >
      <header className="yam-create-header">
        <button className="yam-back-btn" onClick={() => navigate(-1)} aria-label="رجوع">
          <span>❮</span>
        </button>
        <h1>إنشاء مجموعة جديدة</h1>
        <div style={{ width: '40px' }}></div>
      </header>

      <form className="yam-create-form" onSubmit={handleSubmit}>
        {/* صورة المجموعة */}
        <section className="yam-form-section">
          <label className="yam-form-label">صورة المجموعة</label>
          <div className="yam-image-upload-area">
            {imagePreview ? (
              <div className="yam-image-preview">
                <img src={imagePreview} alt="معاينة" />
                <button
                  type="button"
                  className="yam-remove-image-btn"
                  onClick={() => {
                    setImagePreview(null);
                    setFormData((prev) => ({ ...prev, image: null }));
                  }}
                  aria-label="حذف الصورة"
                >
                  ✕
                </button>
              </div>
            ) : (
              <label className="yam-upload-label">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  style={{ display: 'none' }}
                />
                <span className="yam-upload-icon">📸</span>
                <span className="yam-upload-text">اختر صورة</span>
              </label>
            )}
          </div>
        </section>

        {/* اسم المجموعة */}
        <section className="yam-form-section">
          <label className="yam-form-label">اسم المجموعة *</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="مثال: مطورين العرب"
            className="yam-form-input"
            maxLength={100}
            required
            dir="rtl"
          />
          <span className="yam-char-count">{formData.name.length}/100</span>
        </section>

        {/* وصف المجموعة */}
        <section className="yam-form-section">
          <label className="yam-form-label">وصف المجموعة</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="أضف وصفاً للمجموعة..."
            className="yam-form-textarea"
            maxLength={500}
            rows={4}
            dir="rtl"
          />
          <span className="yam-char-count">{formData.description.length}/500</span>
        </section>

        {/* التصنيف */}
        <section className="yam-form-section">
          <label className="yam-form-label">التصنيف</label>
          <select
            name="category"
            value={formData.category}
            onChange={handleInputChange}
            className="yam-form-select"
            dir="rtl"
          >
            {categories.map((cat) => (
              <option key={cat.id} value={cat.name}>{cat.name}</option>
            ))}
          </select>
        </section>

        {/* الخصوصية */}
        <section className="yam-form-section">
          <label className="yam-form-label">الخصوصية</label>
          <div className="yam-privacy-options">
            <label className="yam-privacy-option">
              <input
                type="radio"
                name="isPublic"
                value="true"
                checked={formData.isPublic === true}
                onChange={() => setFormData((prev) => ({ ...prev, isPublic: true }))}
              />
              <span>عامة - يمكن لأي شخص الانضمام</span>
            </label>
            <label className="yam-privacy-option">
              <input
                type="radio"
                name="isPublic"
                value="false"
                checked={formData.isPublic === false}
                onChange={() => setFormData((prev) => ({ ...prev, isPublic: false }))}
              />
              <span>خاصة - بالدعوة فقط</span>
            </label>
          </div>
        </section>

        {/* الأزرار */}
        <section className="yam-form-actions">
          <button
            type="button"
            className="yam-btn-secondary"
            onClick={() => navigate(-1)}
            disabled={loading}
          >
            إلغاء
          </button>
          <button
            type="submit"
            className="yam-btn-primary"
            disabled={loading}
          >
            {loading ? 'جاري الإنشاء...' : 'إنشاء المجموعة'}
          </button>
        </section>
      </form>

      <div style={{ height: '40px' }}></div>
    </div>
    </MainLayout>
  );
};

export default CreateGroup;
