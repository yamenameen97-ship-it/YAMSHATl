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
    options: ['', ''],
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
      setForm({ question: '', options: ['', ''], multi: false, closes_at: '' });
      setShowForm(false);
      await refresh();
      pushToast?.({ type: 'success', title: 'تم إنشاء الاستطلاع' });
    } catch (e) {
      pushToast?.({ type: 'error', title: 'تعذر الإنشاء', description: e?.message });
    } finally { setCreating(false); }
  };

  const handleVote = async (poll, optIndex) => {
    if (poll._voting) return;
    setPolls((p) => p.map((x) => x.id === poll.id ? { ...x, _voting: true } : x));
    try {
      await voteInPoll(groupId, poll.id, String(optIndex));
      setPolls((p) => p.map((x) => {
        if (x.id !== poll.id) return x;
        const options = (x.options || []).map((o, i) => {
          if (i !== optIndex) return o;
          return { ...o, votes: (o.votes || 0) + 1, _voted: true };
        });
        return { ...x, options, _voted_index: optIndex, _voting: false };
      }));
      pushToast?.({ type: 'success', title: 'تم تصويتك' });
    } catch (e) {
      setPolls((p) => p.map((x) => x.id === poll.id ? { ...x, _voting: false } : x));
      pushToast?.({ type: 'error', title: 'تعذر التصويت' });
    }
  };

  return (
    <MainLayout>
      <div className="yamg-page" dir="rtl">
        <GroupSubHeader
          title={`استطلاعات ${group?.name || 'المجموعة'}`}
          subtitle={`${polls.length} استطلاع`}
          action={canCreate && (
            <button className="yamg-btn" onClick={() => setShowForm((v) => !v)}>
              {showForm ? '✕ إغلاق' : '+ استطلاع'}
            </button>
          )}
        />

        {showForm && (
          <div className="yamg-card">
            <div className="yamg-col">
              <input
                className="yamg-input"
                placeholder="سؤال الاستطلاع"
                value={form.question}
                onChange={(e) => setForm({ ...form, question: e.target.value })}
              />
              {form.options.map((opt, i) => (
                <div className="yamg-row" key={i}>
                  <input
                    className="yamg-input"
                    placeholder={`الخيار ${i + 1}`}
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
              ))}
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
                  {creating ? '...إنشاء' : 'نشر الاستطلاع'}
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
            return (
              <article key={poll.id} className="yamg-card">
                <div className="yamg-poll-q">{poll.question}</div>
                {(poll.options || []).map((opt, i) => {
                  const p = pct(opt);
                  const isVoted = (poll._voted_index === i) || (poll.user_vote === i);
                  return (
                    <div
                      key={i}
                      className={`yamg-poll-opt ${isVoted ? 'voted' : ''}`}
                      onClick={() => !voted && !closed && handleVote(poll, i)}
                      style={{ cursor: voted || closed ? 'default' : 'pointer' }}
                    >
                      <div className="bar" style={{ width: `${p}%` }} />
                      <span className="label">{isVoted && '✓ '}{opt.text || opt.label || opt}</span>
                      {(voted || closed) && <span className="pct">{p}% · {opt.votes || 0}</span>}
                    </div>
                  );
                })}
                <div className="yamg-row" style={{ marginTop: 8, fontSize: 11, color: 'var(--yamg-muted)' }}>
                  <span>{total} صوت</span>
                  {poll.multi_choice && <span className="yamg-tag">متعدد الخيارات</span>}
                  {closed && <span className="yamg-tag danger">مغلق</span>}
                  {poll.closes_at && !closed && (
                    <span>يُغلق: {new Date(poll.closes_at).toLocaleString('ar-EG')}</span>
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
