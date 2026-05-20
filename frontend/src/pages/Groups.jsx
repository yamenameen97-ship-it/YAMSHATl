import { useEffect, useRef, useState } from 'react';
import MainLayout from '../components/layout/MainLayout.jsx';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import Modal from '../components/ui/Modal.jsx';
import EmptyState from '../components/feedback/EmptyState.jsx';
import { createGroup, getGroups } from '../api/groups.js';
import mediaUploadService from '../services/media/mediaUploadService.js';

const ROLES = [
  { id: 'admin', label: 'مدير', color: '#ff4444' },
  { id: 'moderator', label: 'مشرف', color: '#ffaa00' },
  { id: 'member', label: 'عضو', color: '#44ff44' }
];

export default function Groups() {
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({ 
    name: '', 
    description: '',
    image: null,
    imagePreview: null,
    coverImage: null,
    coverImagePreview: null
  });
  const [savingGroup, setSavingGroup] = useState(false);
  const [activeTab, setActiveTab] = useState('members'); // members, settings, analytics
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const imageInputRef = useRef(null);
  const coverInputRef = useRef(null);

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      const { data } = await getGroups();
      setGroups(data || []);
      if (data?.length > 0) setSelectedGroup(data[0]);
    } catch (error) {
      console.error('خطأ في تحميل المجموعات:', error);
    }
  };

  const handleImageSelect = async (event, type = 'image') => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      alert('الملف كبير جداً. الحد الأقصى 50 ميجا.');
      return;
    }

    const preview = URL.createObjectURL(file);
    
    if (type === 'image') {
      if (createForm.imagePreview) URL.revokeObjectURL(createForm.imagePreview);
      setCreateForm(prev => ({ ...prev, image: file, imagePreview: preview }));
    } else {
      if (createForm.coverImagePreview) URL.revokeObjectURL(createForm.coverImagePreview);
      setCreateForm(prev => ({ ...prev, coverImage: file, coverImagePreview: preview }));
    }
  };

  const uploadGroupMedia = async (file, purpose) => {
    if (!file) return null;
    
    try {
      setUploadingMedia(true);
      const uploadRes = await mediaUploadService.uploadFile(file, {
        purpose: purpose,
        onProgress: (payload) => {
          const percent = typeof payload === 'number' ? Number(payload || 0) : Number(payload?.percent || 0);
          console.log(`تقدم الرفع: ${percent}%`);
        },
      });
      return uploadRes?.mediaUrl || uploadRes?.url || uploadRes?.file_url || '';
    } catch (error) {
      console.error(`خطأ في رفع ${purpose}:`, error);
      return null;
    } finally {
      setUploadingMedia(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!createForm.name.trim()) {
      alert('يرجى إدخال اسم المجموعة');
      return;
    }

    try {
      setSavingGroup(true);
      
      // رفع الصور إذا كانت موجودة
      let imageUrl = '';
      let coverImageUrl = '';
      
      if (createForm.image) {
        imageUrl = await uploadGroupMedia(createForm.image, 'group-image');
      }
      
      if (createForm.coverImage) {
        coverImageUrl = await uploadGroupMedia(createForm.coverImage, 'group-cover');
      }

      // إنشاء المجموعة مع الصور
      const groupData = {
        name: createForm.name.trim(),
        description: createForm.description.trim(),
        image_url: imageUrl || undefined,
        cover_image_url: coverImageUrl || undefined,
      };

      const { data } = await createGroup(groupData);
      const createdGroup = data || {
        id: `local-${Date.now()}`,
        name: createForm.name.trim(),
        description: createForm.description.trim(),
        image_url: imageUrl || '',
        cover_image_url: coverImageUrl || '',
        members_count: 1
      };

      setGroups((prev) => [createdGroup, ...prev]);
      setSelectedGroup(createdGroup);
      
      // تنظيف النموذج
      if (createForm.imagePreview) URL.revokeObjectURL(createForm.imagePreview);
      if (createForm.coverImagePreview) URL.revokeObjectURL(createForm.coverImagePreview);
      
      setCreateForm({
        name: '',
        description: '',
        image: null,
        imagePreview: null,
        coverImage: null,
        coverImagePreview: null
      });
      setShowCreateModal(false);
      alert('تم إنشاء المجموعة بنجاح!');
    } catch (error) {
      console.error('خطأ في إنشاء المجموعة:', error);
      alert('فشل إنشاء المجموعة. حاول مرة أخرى.');
    } finally {
      setSavingGroup(false);
    }
  };

  const closeCreateModal = () => {
    if (createForm.imagePreview) URL.revokeObjectURL(createForm.imagePreview);
    if (createForm.coverImagePreview) URL.revokeObjectURL(createForm.coverImagePreview);
    
    setCreateForm({
      name: '',
      description: '',
      image: null,
      imagePreview: null,
      coverImage: null,
      coverImagePreview: null
    });
    setShowCreateModal(false);
  };

  return (
    <MainLayout>
      <div style={{ display: 'flex', height: 'calc(100vh - 70px)', maxWidth: 1200, margin: '0 auto' }}>
        
        {/* Groups Sidebar */}
        <div style={{ width: 300, borderLeft: '1px solid var(--line)', padding: 20, overflowY: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ margin: 0 }}>مجموعاتي</h3>
            <Button size="small" onClick={() => setShowCreateModal(true)}>➕</Button>
          </div>
          <div style={{ display: 'grid', gap: 10 }}>
            {groups.map(g => (
              <Card 
                key={g.id} 
                onClick={() => setSelectedGroup(g)}
                style={{ 
                  padding: 12, 
                  cursor: 'pointer', 
                  background: selectedGroup?.id === g.id ? 'rgba(139, 92, 246, 0.1)' : '',
                  border: selectedGroup?.id === g.id ? '1px solid var(--primary)' : '1px solid transparent'
                }}
              >
                <div style={{ fontWeight: 'bold' }}>{g.name}</div>
                <div className="muted" style={{ fontSize: 12 }}>{g.members_count} عضو</div>
              </Card>
            ))}
          </div>
        </div>

        {/* Group Content */}
        {selectedGroup ? (
          <div style={{ flex: 1, padding: 30, overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 30 }}>
              <div>
                <h1 style={{ margin: '0 0 8px 0' }}>{selectedGroup.name}</h1>
                <p className="muted">{selectedGroup.description}</p>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <Button variant="secondary" onClick={() => setShowInviteModal(true)}>➕ دعوة</Button>
                <Button onClick={() => setShowAnalytics(true)}>📊 التحليلات</Button>
              </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 20, borderBottom: '1px solid var(--line)', marginBottom: 24 }}>
              {['members', 'moderation', 'settings'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding: '12px 0',
                    background: 'none',
                    border: 'none',
                    borderBottom: activeTab === tab ? '2px solid var(--primary)' : '2px solid transparent',
                    color: activeTab === tab ? 'white' : '#888',
                    cursor: 'pointer',
                    fontWeight: activeTab === tab ? 'bold' : 'normal'
                  }}
                >
                  {tab === 'members' ? 'الأعضاء' : tab === 'moderation' ? 'الرقابة' : 'الإعدادات'}
                </button>
              ))}
            </div>

            {activeTab === 'members' && (
              <div style={{ display: 'grid', gap: 12 }}>
                {[
                  { id: 1, name: 'أحمد محمد', role: 'admin' },
                  { id: 2, name: 'سارة خالد', role: 'moderator' },
                  { id: 3, name: 'ياسين علي', role: 'member' }
                ].map(member => (
                  <Card key={member.id} style={{ padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 35, height: 35, borderRadius: '50%', background: '#444' }} />
                      <div style={{ fontWeight: 'bold' }}>{member.name}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                      <span style={{ 
                        fontSize: 11, 
                        padding: '2px 8px', 
                        borderRadius: 10, 
                        background: ROLES.find(r => r.id === member.role).color + '33',
                        color: ROLES.find(r => r.id === member.role).color
                      }}>
                        {ROLES.find(r => r.id === member.role).label}
                      </span>
                      <button style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}>⚙️</button>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {activeTab === 'moderation' && (
              <div style={{ display: 'grid', gap: 20 }}>
                <Card style={{ padding: 20 }}>
                  <h4>المنشورات المعلقة (Pending)</h4>
                  <div className="muted" style={{ textAlign: 'center', padding: '20px 0' }}>لا توجد منشورات بانتظار المراجعة</div>
                </Card>
                <Card style={{ padding: 20 }}>
                  <h4>قواعد المجموعة</h4>
                  <div style={{ display: 'grid', gap: 10, marginTop: 15 }}>
                    <div style={{ padding: 10, background: 'rgba(255,255,255,0.05)', borderRadius: 8 }}>1. الاحترام المتبادل بين الأعضاء</div>
                    <div style={{ padding: 10, background: 'rgba(255,255,255,0.05)', borderRadius: 8 }}>2. يمنع نشر الروابط الخارجية دون إذن</div>
                  </div>
                </Card>
              </div>
            )}
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <EmptyState title="اختر مجموعة لعرض تفاصيلها" />
          </div>
        )}
      </div>

      {/* Invite Modal */}
      <Modal isOpen={showInviteModal} onClose={() => setShowInviteModal(false)} title="دعوة أعضاء للمجموعة">
        <div style={{ padding: 20 }}>
          <p>شارك رابط الدعوة مع أصدقائك:</p>
          <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
            <input 
              readOnly 
              value={`https://yamshat.com/join/${selectedGroup?.id}`} 
              style={{ flex: 1, background: '#222', border: '1px solid #444', padding: 10, borderRadius: 8, color: 'white' }}
            />
            <Button onClick={() => alert('تم النسخ!')}>نسخ</Button>
          </div>
          <div className="divider"><span>أو ابحث عن صديق</span></div>
          <input placeholder="ابحث بالاسم أو البريد..." style={{ width: '100%', background: '#222', border: '1px solid #444', padding: 10, borderRadius: 8, color: 'white', marginTop: 15 }} />
        </div>
      </Modal>

      <Modal isOpen={showCreateModal} onClose={closeCreateModal} title="إنشاء مجموعة جديدة">
        <div style={{ padding: 20, display: 'grid', gap: 14, maxHeight: '80vh', overflowY: 'auto' }}>
          <label style={{ display: 'grid', gap: 8 }}>
            <span style={{ fontWeight: 700 }}>اسم المجموعة</span>
            <input
              value={createForm.name}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="اكتب اسم المجموعة"
              style={{ width: '100%', borderRadius: 12, padding: 12, background: '#222', border: '1px solid #444', color: 'white' }}
            />
          </label>

          <label style={{ display: 'grid', gap: 8 }}>
            <span style={{ fontWeight: 700 }}>وصف المجموعة</span>
            <textarea
              value={createForm.description}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, description: event.target.value }))}
              placeholder="اكتب وصف واضح للمجموعة"
              rows={4}
              style={{ width: '100%', borderRadius: 12, padding: 12, background: '#222', border: '1px solid #444', color: 'white' }}
            />
          </label>

          <label style={{ display: 'grid', gap: 8 }}>
            <span style={{ fontWeight: 700 }}>صورة المجموعة</span>
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              style={{
                padding: 12,
                borderRadius: 12,
                background: '#222',
                border: '2px dashed #444',
                color: '#888',
                cursor: 'pointer',
                fontWeight: 600,
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.borderColor = '#666'}
              onMouseLeave={(e) => e.target.style.borderColor = '#444'}
            >
              {createForm.imagePreview ? '✓ تم اختيار صورة' : '📷 اختر صورة المجموعة'}
            </button>
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => handleImageSelect(e, 'image')}
              hidden
            />
            {createForm.imagePreview && (
              <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', height: 150 }}>
                <img src={createForm.imagePreview} alt="معاينة" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <button
                  type="button"
                  onClick={() => {
                    if (createForm.imagePreview) URL.revokeObjectURL(createForm.imagePreview);
                    setCreateForm(prev => ({ ...prev, image: null, imagePreview: null }));
                  }}
                  style={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    background: 'rgba(0,0,0,0.7)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    width: 32,
                    height: 32,
                    cursor: 'pointer',
                    fontSize: 18
                  }}
                >
                  ✕
                </button>
              </div>
            )}
          </label>

          <label style={{ display: 'grid', gap: 8 }}>
            <span style={{ fontWeight: 700 }}>صورة الغلاف</span>
            <button
              type="button"
              onClick={() => coverInputRef.current?.click()}
              style={{
                padding: 12,
                borderRadius: 12,
                background: '#222',
                border: '2px dashed #444',
                color: '#888',
                cursor: 'pointer',
                fontWeight: 600,
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.borderColor = '#666'}
              onMouseLeave={(e) => e.target.style.borderColor = '#444'}
            >
              {createForm.coverImagePreview ? '✓ تم اختيار صورة' : '🖼️ اختر صورة الغلاف'}
            </button>
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => handleImageSelect(e, 'cover')}
              hidden
            />
            {createForm.coverImagePreview && (
              <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', height: 150 }}>
                <img src={createForm.coverImagePreview} alt="معاينة" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <button
                  type="button"
                  onClick={() => {
                    if (createForm.coverImagePreview) URL.revokeObjectURL(createForm.coverImagePreview);
                    setCreateForm(prev => ({ ...prev, coverImage: null, coverImagePreview: null }));
                  }}
                  style={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    background: 'rgba(0,0,0,0.7)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    width: 32,
                    height: 32,
                    cursor: 'pointer',
                    fontSize: 18
                  }}
                >
                  ✕
                </button>
              </div>
            )}
          </label>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <Button variant="secondary" onClick={closeCreateModal}>إلغاء</Button>
            <Button
              onClick={handleCreateGroup}
              loading={savingGroup || uploadingMedia}
              disabled={!createForm.name.trim() || savingGroup || uploadingMedia}
            >
              {uploadingMedia ? 'جارٍ رفع الصور...' : 'إنشاء المجموعة'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Analytics Modal */}
      <Modal isOpen={showAnalytics} onClose={() => setShowAnalytics(false)} title="تحليلات المجموعة">
        <div style={{ padding: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15, marginBottom: 20 }}>
            <Card style={{ padding: 15, textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: 'var(--primary)' }}>+12%</div>
              <div className="muted">نمو الأعضاء (هذا الشهر)</div>
            </Card>
            <Card style={{ padding: 15, textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#44ff44' }}>850</div>
              <div className="muted">عضو نشط يومياً</div>
            </Card>
          </div>
          <h4>أكثر الأعضاء تفاعلاً</h4>
          <div style={{ height: 150, background: 'rgba(255,255,255,0.05)', borderRadius: 12, marginTop: 10, display: 'flex', alignItems: 'flex-end', gap: 10, padding: 15 }}>
            {[40, 70, 50, 90, 60].map((h, i) => (
              <div key={i} style={{ flex: 1, height: `${h}%`, background: 'var(--primary)', borderRadius: '4px 4px 0 0' }} />
            ))}
          </div>
        </div>
      </Modal>
    </MainLayout>
  );
}
