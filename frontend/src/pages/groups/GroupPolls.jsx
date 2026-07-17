import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import MainLayout from '../../components/layout/MainLayout.jsx';
import GroupSubHeader from '../../components/groups/GroupSubHeader.jsx';
import { listGroupPolls, createGroupPoll, voteInPoll, getGroupDetails } from '../../api/groups.js';
import { useToast } from '../../components/admin/ToastProvider.jsx';
import { getCurrentUsername } from '../../utils/auth.js';
import '../../styles/groups-features.css';

const computePct = (poll) => {
  const total = (poll.options || []).reduce((s, o) => s + (o.votes || 0), 0);
  return { total, pct: (opt) => total ? Math.round(((opt.votes || 0) * 100) / total) : 0 };
};

// v88.3.4: ألوان الأزرار حسب موقع الخيار (أخضر للأول = نعم، أحمر للثاني = لا، إلخ)
const OPTION_COLORS = [
  { bg: '#10B981', bgHover: '#059669', text: '#fff', shadow: 'rgba(16,185,129,.4)' },   // أخضر (نعم)
  { bg: '#EF4444', bgHover: '#DC2626', text: '#fff', shadow: 'rgba(239,68,68,.4)' },     // أحمر (لا)
  { bg: '#3B82F6', bgHover: '#2563EB', text: '#fff', shadow: 'rgba(59,130,246,.4)' },    // أزرق
  { bg: '#F59E0B', bgHover: '#D97706', text: '#fff', shadow: 'rgba(245,158,11,.4)' },    // برتقالي
  { bg: '#8B5CF6', bgHover: '#7C3AED', text: '#fff', shadow: 'rgba(139,92,246,.4)' },    // بنفسجي
  { bg: '#EC4899', bgHover: '#DB2777', text: '#fff', shadow: 'rgba(236,72,153,.4)' },    // وردي
  { bg: '#14B8A6', bgHover: '#0D9488', text: '#fff', shadow: 'rgba(20,184,166,.4)' },    // فيروزي
  { bg: '#6366F1', bgHover: '#4F46E5', text: '#fff', shadow: 'rgba(99,102,241,.4)' },    // نيلي
];

const GroupPolls = () => {
  const { groupId } = useParams();
  const { pushToast } = useToast();
  const currentUser = getCurrentUsername();

  const [polls, setPolls] = useState([]);
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    question: '',
    options: ['نعم', 'لا'],
    multi: false,
    closes_at: '',
  });

  const role = useMemo(() => {
    const m = group?.members?.find((x) => (x.username || x.user_id) === currentUser);
    return m?.role || 'member';
  }, [group, currentUser]);
  const canCreate = role !== 'member' || group?.settings?.members_can_create_polls;

  const refresh = async () => {
    try {
      setLoading(true);
      const [pl, det] = await Promise.allSettled([
        listGroupPolls(groupId),
        getGroupDetails(groupId),
      ]);
      if (pl.status === 'fulfilled') {
        const list = Array.isArray(pl.value?.data) ? pl.value.data : (pl.value?.data?.polls || []);
        setPolls(list);
      }
      if (det.status === 'fulfilled') setGroup(det.value?.data || null);
    } finally { setLoading(false); }
  };

  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, [groupId]);

  const submit = async () => {
    const q = form.question.trim();
    const opts = form.options.map((o) => o.trim()).filter(Boolean);
    if (!q || opts.length < 2) {
      pushToast?.({ type: 'error', title: 'بيانات ناقصة', description: 'السؤال وخياران على الأقل مطلوبان' });
      return;
    }
    setCreating(true);
    try {
      await createGroupPoll(groupId, {
        question: q,
        options: opts,
        multi_choice: form.multi,
        closes_at: form.closes_at ? new Date(form.closes_at).toISOString() : null,
      });
      setForm({ question: '', options: ['نعم', 'لا'], multi: false, closes_at: '' });
      setShowForm(false);
      await refresh();
      pushToast?.({ type: 'success', title: 'تم إنشاء الاستطلاع', description: 'تم نشر الاستطلاع داخل المجموعة — يمكن للأعضاء التصويت الآن' });
    } catch (e) {
      pushToast?.({ type: 'error', title: 'تعذر الإنشاء', description: e?.message });
    } finally { setCreating(false); }
  };

  // v88.3.4: تصويت متين — يمنع الضغطات المتكررة، يحدّث فوري (optimistic)، ويتعامل مع الأخطاء بأمان
  const handleVote = async (poll, optIndex, ev) => {
    if (ev) { ev.preventDefault(); ev.stopPropagation(); }
    if (poll._voting) return;
    // إذا سبق التصويت ولم يكن متعدد الخيارات، تجاهل
    const alreadyVoted = poll._voted_index !== undefined || (poll.user_vote !== undefined && poll.user_vote !== null);
    if (alreadyVoted && !poll.multi_choice) return;
    // إذا الاستطلاع مغلق
    const isClosed = poll.closes_at && new Date(poll.closes_at).getTime() < Date.now();
    if (isClosed) return;

    // تحديث تفاؤلي فوري — العدّ يبدأ مباشرة عند الضغط
    setPolls((p) => p.map((x) => {
      if (x.id !== poll.id) return x;
      const options = (x.options || []).map((o, i) => {
        if (i !== optIndex) return o;
        return { ...o, votes: (o.votes || 0) + 1 };
      });
      return { ...x, options, _voted_index: optIndex, _voting: true };
    }));

    try {
      const res = await voteInPoll(groupId, poll.id, String(optIndex));
      // في حال أرجع السيرفر النسخة الرسمية للاستطلاع، استبدلها
      const server = res?.data || res;
      if (server && server.id === poll.id && Array.isArray(server.options)) {
        setPolls((p) => p.map((x) => x.id === poll.id
          ? { ...server, _voted_index: optIndex, _voting: false }
          : x));
      } else {
        setPolls((p) => p.map((x) => x.id === poll.id ? { ...x, _voting: false } : x));
      }
      pushToast?.({ type: 'success', title: 'تم تصويتك ✅' });
    } catch (e) {
      // إرجاع التغيير التفاؤلي في حالة الفشل
      setPolls((p) => p.map((x) => {
        if (x.id !== poll.id) return x;
        const options = (x.options || []).map((o, i) => {
          if (i !== optIndex) return o;
          return { ...o, votes: Math.max(0, (o.votes || 0) - 1) };
        });
        return { ...x, options, _voted_index: undefined, _voting: false };
      }));
      pushToast?.({ type: 'error', title: 'تعذر التصويت', description: e?.response?.data?.detail || e?.message });
    }
  };

  return (
    <MainLayout>
      <div className="yamg-page" dir="rtl">
        <GroupSubHeader
          title={`استطلاعات ${group?.name || 'المجموعة'}`}
          subtitle={`${polls.length} استطلاع${polls.length === 0 ? '' : ' · مرئي لجميع أعضاء المجموعة'}`}
          action={canCreate && (
            <button className="yamg-btn" onClick={() => setShowForm((v) => !v)}>
              {showForm ? '✕ إغلاق' : '+ استطلاع'}
            </button>
          )}
        />

        {showForm && (
          <div className="yamg-card">
            <div className="yamg-col">
              <div style={{ fontSize: 12, color: 'var(--yamg-muted)', marginBottom: 6 }}>
                💡 نصيحة: الخيار الأول = زر أخضر (نعم)، الخيار الثاني = زر أحمر (لا). يمكنك كتابة أي كلمات أو أرقام تريدها.
              </div>
              <input
                className="yamg-input"
                placeholder="اكتب سؤال الاستطلاع (مثال: هل توافق على القرار؟)"
                value={form.question}
                onChange={(e) => setForm({ ...form, question: e.target.value })}
              />
              {form.options.map((opt, i) => {
                const c = OPTION_COLORS[i % OPTION_COLORS.length];
                return (
                  <div className="yamg-row" key={i} style={{ gap: 8, alignItems: 'center' }}>
                    <span
                      aria-hidden="true"
                      style={{
                        width: 14, height: 14, borderRadius: '50%',
                        background: c.bg, flexShrink: 0,
                        boxShadow: `0 0 0 3px ${c.shadow}`,
                      }}
                    />
                    <input
                      className="yamg-input"
                      placeholder={`الخيار ${i + 1}${i === 0 ? ' (سيظهر كزر أخضر)' : i === 1 ? ' (سيظهر كزر أحمر)' : ''}`}
                      value={opt}
                      onChange={(e) => {
                        const next = [...form.options]; next[i] = e.target.value;
                        setForm({ ...form, options: next });
                      }}
                    />
                    {form.options.length > 2 && (
                      <button
                        className="yamg-btn secondary"
                        onClick={() => setForm({ ...form, options: form.options.filter((_, idx) => idx !== i) })}
                      >✕</button>
                    )}
                  </div>
                );
              })}
              {form.options.length < 8 && (
                <button
                  className="yamg-btn secondary"
                  onClick={() => setForm({ ...form, options: [...form.options, ''] })}
                >+ إضافة خيار</button>
              )}
              <label className="yamg-row" style={{ cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={form.multi}
                  onChange={(e) => setForm({ ...form, multi: e.target.checked })}
                />
                <span>السماح بتعدد الاختيار</span>
              </label>
              <label>
                <div style={{ fontSize: 12, color: 'var(--yamg-muted)', marginBottom: 4 }}>تاريخ الإغلاق (اختياري)</div>
                <input
                  type="datetime-local"
                  className="yamg-input"
                  value={form.closes_at}
                  onChange={(e) => setForm({ ...form, closes_at: e.target.value })}
                />
              </label>
              <div className="yamg-row" style={{ justifyContent: 'flex-end' }}>
                <button className="yamg-btn secondary" onClick={() => setShowForm(false)}>إلغاء</button>
                <button className="yamg-btn" disabled={creating} onClick={submit}>
                  {creating ? '...إنشاء' : '📤 نشر داخل المجموعة'}
                </button>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="yamg-loading"><div className="yamg-spinner" />جاري التحميل...</div>
        ) : polls.length === 0 ? (
          <div className="yamg-empty">
            <span className="ic">📊</span>
            لا توجد استطلاعات بعد.
          </div>
        ) : (
          polls.map((poll) => {
            const { total, pct } = computePct(poll);
            const voted = poll._voted_index !== undefined || (poll.user_vote !== undefined && poll.user_vote !== null);
            const closed = poll.closes_at && new Date(poll.closes_at).getTime() < Date.now();
            const options = poll.options || [];
            const disabled = (voted && !poll.multi_choice) || closed || poll._voting;
            return (
              <article key={poll.id} className="yamg-card yamg-poll-card">
                {/* 1) السؤال — دائماً فوق الأزرار */}
                <div className="yamg-poll-question">
                  <span className="yamg-poll-icon">📊</span>
                  <span className="yamg-poll-question-text">{poll.question}</span>
                </div>

                {poll.creator && (
                  <div className="yamg-poll-creator">
                    بواسطة <b>@{poll.creator}</b>
                  </div>
                )}

                {/* 2) الأزرار — أفقياً، جنب بعض (مقابل بعض) */}
                <div className="yamg-poll-buttons-row">
                  {options.map((opt, i) => {
                    const c = OPTION_COLORS[i % OPTION_COLORS.length];
                    const p = pct(opt);
                    const label = typeof opt === 'string' ? opt : (opt.text || opt.label || '');
                    const isMyVote = (poll._voted_index === i) || (poll.user_vote === i);
                    return (
                      <button
                        key={i}
                        type="button"
                        className={`yamg-poll-btn ${isMyVote ? 'my-vote' : ''} ${disabled ? 'disabled' : ''}`}
                        style={{
                          '--pb-bg': c.bg,
                          '--pb-bg-hover': c.bgHover,
                          '--pb-shadow': c.shadow,
                        }}
                        onClick={(ev) => handleVote(poll, i, ev)}
                        disabled={disabled}
                        aria-label={`تصويت للخيار ${label}`}
                      >
                        <span className="yamg-poll-btn-fill" style={{ width: `${p}%` }} />
                        <span className="yamg-poll-btn-content">
                          <span className="yamg-poll-btn-label">
                            {isMyVote && '✓ '}{label}
                          </span>
                          <span className="yamg-poll-btn-stats">
                            {opt.votes || 0} صوت{total > 0 && ` · ${p}%`}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* 3) معلومات إضافية أسفل الأزرار */}
                <div className="yamg-poll-meta">
                  <span>🗳️ {total} صوت إجمالي</span>
                  {poll.multi_choice && <span className="yamg-tag">متعدد الخيارات</span>}
                  {closed && <span className="yamg-tag danger">🔒 مغلق</span>}
                  {poll.closes_at && !closed && (
                    <span>⏱️ يُغلق: {new Date(poll.closes_at).toLocaleString('ar-EG')}</span>
                  )}
                </div>
              </article>
            );
          })
        )}
      </div>
    </MainLayout>
  );
};

export default GroupPolls;
