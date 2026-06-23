import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../../components/layout/MainLayout.jsx';
import GroupSubHeader from '../../components/groups/GroupSubHeader.jsx';
import { createGroup, createGroupRule, updateGroupSettings } from '../../api/groups.js';
import { useToast } from '../../components/admin/ToastProvider.jsx';
import '../../styles/groups-features.css';

/**
 * GroupCreateWizard — معالج إنشاء مجموعة بخطوات
 * 1) النوع/التصنيف   2) الاسم والوصف   3) الخصوصية   4) القواعد   5) مراجعة وإنشاء
 */
const CATEGORIES = [
  { id: 'study',   icon: '🎓', label: 'دراسة' },
  { id: 'tech',    icon: '💻', label: 'تقنية' },
  { id: 'games',   icon: '🎮', label: 'ألعاب' },
  { id: 'design',  icon: '🖋️', label: 'تصميم' },
  { id: 'sports',  icon: '⚽', label: 'رياضة' },
  { id: 'music',   icon: '🎵', label: 'موسيقى' },
  { id: 'family',  icon: '👨‍👩‍👧', label: 'عائلة' },
  { id: 'business',icon: '💼', label: 'أعمال' },
  { id: 'fun',     icon: '😄', label: 'ترفيه' },
  { id: 'other',   icon: '✨', label: 'أخرى' },
];

const PRIVACY = [
  { id: 'public',  icon: '🌐', label: 'عامة',   hint: 'يمكن لأي شخص الانضمام والمشاهدة' },
  { id: 'private', icon: '🔒', label: 'خاصة',   hint: 'يتطلب موافقة على طلبات الانضمام' },
  { id: 'secret',  icon: '🔐', label: 'سرّية',  hint: 'بالدعوة فقط، لا تظهر في البحث'    },
];

const STEPS = [
  { id: 0, title: 'النوع', label: 'اختر تصنيف مجموعتك' },
  { id: 1, title: 'الهوية', label: 'الاسم والوصف' },
  { id: 2, title: 'الخصوصية', label: 'من يمكنه الانضمام؟' },
  { id: 3, title: 'القواعد', label: 'قواعد المجموعة (اختياري)' },
  { id: 4, title: 'مراجعة', label: 'تحقق وأنشئ' },
];

const GroupCreateWizard = () => {
  const navigate = useNavigate();
  const { pushToast } = useToast();
  const [step, setStep] = useState(0);
  const [creating, setCreating] = useState(false);

  const [data, setData] = useState({
    category: 'tech',
    name: '',
    description: '',
    privacy: 'public',
    rules: [],
    newRule: '',
    allowPosts: true,
    allowMedia: true,
    requireApproval: false,
  });

  const update = (patch) => setData((d) => ({ ...d, ...patch }));

  const canNext = () => {
    if (step === 0) return !!data.category;
    if (step === 1) return data.name.trim().length >= 2;
    return true;
  };

  const addRule = () => {
    const r = data.newRule.trim();
    if (!r) return;
    update({ rules: [...data.rules, r], newRule: '' });
  };

  const handleCreate = async () => {
    setCreating(true);
    try {
      const res = await createGroup({
        name: data.name.trim(),
        description: data.description.trim(),
        category: data.category,
        privacy: data.privacy,
      });
      const created = res?.data?.group || res?.data || {};
      const gid = created.id;
      if (!gid) throw new Error('لم يتم استلام معرّف المجموعة من الخادم');

      // إعدادات
      try {
        await updateGroupSettings(gid, {
          allow_posts: data.allowPosts,
          allow_media: data.allowMedia,
          require_join_approval: data.requireApproval || data.privacy === 'private',
        });
      } catch { /* اختيارية */ }

      // قواعد
      for (const rule of data.rules) {
        try { await createGroupRule(gid, { title: rule, body: rule }); } catch { /* تجاهل فردي */ }
      }

      pushToast?.({ type: 'success', title: 'تم!', description: 'تم إنشاء مجموعتك بنجاح.' });
      navigate(`/groups/${gid}/chat`);
    } catch (e) {
      pushToast?.({ type: 'error', title: 'تعذر إنشاء المجموعة', description: e?.message });
    } finally {
      setCreating(false);
    }
  };

  return (
    <MainLayout>
      <div className="yamg-page" dir="rtl">
        <GroupSubHeader
          title="معالج إنشاء مجموعة"
          subtitle={`الخطوة ${step + 1} من ${STEPS.length} — ${STEPS[step].title}`}
        />

        {/* مؤشر التقدم */}
        <div className="yamg-wizard-steps">
          {STEPS.map((s, i) => (
            <div key={s.id} className={`step ${i < step ? 'done' : i === step ? 'active' : ''}`} />
          ))}
        </div>

        <div className="yamg-card">
          <div className="yamg-wizard-step-title">الخطوة {step + 1}</div>
          <h2 className="yamg-wizard-step-h">{STEPS[step].label}</h2>

          {step === 0 && (
            <div className="yamg-wizard-grid">
              {CATEGORIES.map((c) => (
                <div
                  key={c.id}
                  className={`yamg-wizard-tile ${data.category === c.id ? 'active' : ''}`}
                  onClick={() => update({ category: c.id })}
                >
                  <span className="ic">{c.icon}</span>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{c.label}</div>
                </div>
              ))}
            </div>
          )}

          {step === 1 && (
            <div className="yamg-col">
              <input
                className="yamg-input"
                placeholder="اسم المجموعة (2 حروف على الأقل)"
                value={data.name}
                onChange={(e) => update({ name: e.target.value })}
              />
              <textarea
                className="yamg-textarea"
                placeholder="وصف مختصر — عن ماذا تتحدّث هذه المجموعة؟"
                value={data.description}
                onChange={(e) => update({ description: e.target.value })}
              />
              <div style={{ fontSize: 12, color: 'var(--yamg-muted)' }}>
                {data.name.length}/40 حرف للاسم · {data.description.length}/200 للوصف
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="yamg-col">
              {PRIVACY.map((p) => (
                <div
                  key={p.id}
                  className={`yamg-wizard-tile ${data.privacy === p.id ? 'active' : ''}`}
                  style={{ textAlign: 'right', padding: 14 }}
                  onClick={() => update({ privacy: p.id })}
                >
                  <div className="yamg-row" style={{ alignItems: 'flex-start' }}>
                    <span style={{ fontSize: 28 }}>{p.icon}</span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{p.label}</div>
                      <div style={{ fontSize: 12, color: 'var(--yamg-muted)', marginTop: 4 }}>{p.hint}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {step === 3 && (
            <div className="yamg-col">
              <p style={{ color: 'var(--yamg-muted)', fontSize: 13, margin: 0 }}>
                يمكنك إضافة قواعد لاحقاً من الإعدادات. اكتب قاعدة واضغط زر الإضافة.
              </p>
              <div className="yamg-row">
                <input
                  className="yamg-input"
                  placeholder="مثال: ممنوع المحتوى المسيء"
                  value={data.newRule}
                  onChange={(e) => update({ newRule: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && addRule()}
                />
                <button className="yamg-btn" onClick={addRule}>+ إضافة</button>
              </div>
              {data.rules.length === 0 ? (
                <div style={{ color: 'var(--yamg-muted)', fontSize: 12, padding: 10 }}>لم تُضف قواعد بعد.</div>
              ) : (
                <ol style={{ paddingInlineStart: 20, color: '#e2e8f0', fontSize: 14 }}>
                  {data.rules.map((r, i) => (
                    <li key={i} style={{ marginBottom: 6 }}>
                      {r}
                      <button
                        onClick={() => update({ rules: data.rules.filter((_, idx) => idx !== i) })}
                        style={{ marginInlineStart: 8, background: 'transparent', color: '#fca5a5', border: 0, cursor: 'pointer' }}
                      >✕</button>
                    </li>
                  ))}
                </ol>
              )}
              <div className="yamg-noti-row">
                <div>
                  <div className="yamg-noti-label">السماح بالمنشورات</div>
                  <div className="yamg-noti-hint">يمكن للأعضاء نشر منشورات في خلاصة المجموعة</div>
                </div>
                <label className="yamg-switch">
                  <input type="checkbox" checked={data.allowPosts} onChange={(e) => update({ allowPosts: e.target.checked })} />
                  <span className="slider" />
                </label>
              </div>
              <div className="yamg-noti-row">
                <div>
                  <div className="yamg-noti-label">السماح برفع الوسائط</div>
                  <div className="yamg-noti-hint">صور، فيديو، ملفات في الدردشة والمنشورات</div>
                </div>
                <label className="yamg-switch">
                  <input type="checkbox" checked={data.allowMedia} onChange={(e) => update({ allowMedia: e.target.checked })} />
                  <span className="slider" />
                </label>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="yamg-col">
              <div className="yamg-row"><strong>الاسم:</strong> <span>{data.name}</span></div>
              <div className="yamg-row"><strong>التصنيف:</strong>
                <span className="yamg-tag">
                  {CATEGORIES.find((c) => c.id === data.category)?.icon}{' '}
                  {CATEGORIES.find((c) => c.id === data.category)?.label}
                </span>
              </div>
              <div className="yamg-row"><strong>الخصوصية:</strong>
                <span className="yamg-tag">
                  {PRIVACY.find((p) => p.id === data.privacy)?.icon}{' '}
                  {PRIVACY.find((p) => p.id === data.privacy)?.label}
                </span>
              </div>
              <div><strong>الوصف:</strong>
                <p style={{ color: 'var(--yamg-muted)', marginTop: 4 }}>{data.description || '— لا يوجد —'}</p>
              </div>
              <div><strong>القواعد ({data.rules.length}):</strong>
                {data.rules.length === 0
                  ? <p style={{ color: 'var(--yamg-muted)', marginTop: 4 }}>— لا قواعد —</p>
                  : <ul style={{ paddingInlineStart: 20, marginTop: 4 }}>
                      {data.rules.map((r, i) => <li key={i} style={{ fontSize: 13 }}>{r}</li>)}
                    </ul>}
              </div>
            </div>
          )}

          <div className="yamg-wizard-nav">
            <button
              className="yamg-btn secondary"
              onClick={() => step === 0 ? navigate('/groups') : setStep((s) => s - 1)}
              disabled={creating}
            >{step === 0 ? '✕ إلغاء' : '← السابق'}</button>
            {step < STEPS.length - 1 ? (
              <button
                className="yamg-btn"
                onClick={() => setStep((s) => s + 1)}
                disabled={!canNext()}
              >التالي →</button>
            ) : (
              <button className="yamg-btn" onClick={handleCreate} disabled={creating}>
                {creating ? '...جاري الإنشاء' : '✨ إنشاء المجموعة'}
              </button>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default GroupCreateWizard;
