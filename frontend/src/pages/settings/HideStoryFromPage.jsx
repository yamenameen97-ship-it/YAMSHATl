import { useCallback, useEffect, useState } from 'react';
import SettingsShell, { SettingsSection } from '../../components/settings/SettingsShell.jsx';
import UserPickerModal from '../../components/stories/UserPickerModal.jsx';
import {
  getHiddenStoryUsers,
  addHiddenStoryUser,
  removeHiddenStoryUser,
} from '../../api/users.js';
import { resolveMediaUrl } from '../../config/mediaConfig.js';

/**
 * HideStoryFromPage — v87.11
 * صفحة إدارة قائمة "إخفاء القصة من" (Hide Story From).
 * المستخدمون في هذه القائمة لن يروا أياً من قصصك — حتى لو كانوا أصدقاء.
 * مستقل عن الحظر الكامل: بقية المحتوى يظل مرئياً لهم.
 */
export default function HideStoryFromPage() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [busy, setBusy] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getHiddenStoryUsers();
      setList(Array.isArray(res?.data) ? res.data : []);
    } catch {
      setError('تعذّر تحميل قائمة المُخفاة');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const flash = (t) => {
    setMsg(t);
    setTimeout(() => setMsg(''), 1600);
  };

  const handleAdd = async (user) => {
    try {
      await addHiddenStoryUser(user.username);
      await load();
      flash(`لن يرى @${user.username} قصصك بعد الآن.`);
    } catch {
      flash('تعذّر إضافة المستخدم.');
    }
  };

  const handleRemove = async (username) => {
    if (busy) return;
    setBusy(username);
    try {
      await removeHiddenStoryUser(username);
      setList((prev) => prev.filter((u) => u.username !== username));
      flash(`سيتمكن @${username} من رؤية قصصك مجدداً.`);
    } catch {
      flash('تعذّر إزالة المستخدم.');
    } finally {
      setBusy('');
    }
  };

  const excluded = list.map((u) => u.username);

  return (
    <SettingsShell
      title="إخفاء القصة من"
      subtitle="لن يرى المستخدمون في هذه القائمة أياً من قصصك، حتى لو كانوا أصدقاء لك."
      icon="🙈"
      backTo="/settings/stories"
      message={msg}
    >
      <div dir="rtl" style={{ fontFamily: "'Noto Sans Arabic', 'Tajawal', system-ui, sans-serif" }}>
        <div className="hsf-info">
          <strong>ملاحظة:</strong> هذا الإجراء يخصّ القصص فقط. المستخدم المُخفَى عنه
          يظل قادراً على رؤية بقية محتواك (المنشورات، الريلز، الملف التعريفي).
          إن أردت إخفاء كل شيء، استخدم <em>الحظر</em> من إعدادات الخصوصية.
        </div>

        <SettingsSection title="القائمة" description={`العدد الحالي: ${list.length}`}>
          <div className="hsf-toolbar">
            <button type="button" className="hsf-add-btn" onClick={() => setPickerOpen(true)}>
              <span aria-hidden>＋</span> إخفاء القصة من مستخدم
            </button>
            <button type="button" className="hsf-refresh" onClick={load} disabled={loading}>
              {loading ? '…' : 'تحديث'}
            </button>
          </div>

          {error ? <div className="hsf-empty hsf-error">{error}</div> : null}

          {loading ? (
            <div className="hsf-empty">جارٍ التحميل…</div>
          ) : list.length === 0 ? (
            <div className="hsf-empty">
              لا يوجد أي مستخدم في هذه القائمة حالياً.<br/>
              كل أصدقائك يمكنهم رؤية قصصك.
            </div>
          ) : (
            <div className="hsf-list">
              {list.map((u) => (
                <div key={u.username} className="hsf-row">
                  <div className="hsf-user">
                    <img
                      src={resolveMediaUrl(u.avatar || '') || '/default-avatar.png'}
                      alt=""
                      onError={(e) => { e.currentTarget.src = '/default-avatar.png'; }}
                    />
                    <div>
                      <div className="hsf-name">@{u.username}</div>
                      {u.created_at ? (
                        <div className="hsf-since">
                          مخفي منذ {new Date(u.created_at).toLocaleDateString('ar-EG')}
                        </div>
                      ) : null}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="hsf-remove"
                    onClick={() => handleRemove(u.username)}
                    disabled={busy === u.username}
                  >
                    {busy === u.username ? '…' : 'إظهار'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </SettingsSection>
      </div>

      <UserPickerModal
        open={pickerOpen}
        title="إخفاء القصة من"
        excludedUsernames={excluded}
        onPick={async (user) => {
          await handleAdd(user);
          setPickerOpen(false);
        }}
        onClose={() => setPickerOpen(false)}
      />

      <style>{`
        .hsf-info { background: rgba(255,193,7,0.08); border: 1px solid rgba(255,193,7,0.25); color: #ffd479; padding: 10px 12px; border-radius: 10px; font-size: 12.5px; line-height: 1.8; margin-bottom: 12px; }
        .hsf-info em { font-style: normal; font-weight: 700; }
        .hsf-toolbar { display:flex; gap: 8px; margin-bottom: 12px; flex-wrap: wrap; }
        .hsf-add-btn { padding: 8px 14px; border-radius: 10px; border: 0; background: linear-gradient(135deg, #ef4444, #f97316); color: #fff; font-weight: 700; cursor: pointer; font-size: 13px; }
        .hsf-refresh { padding: 8px 14px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.14); background: transparent; color: inherit; cursor: pointer; font-size: 13px; }
        .hsf-refresh:disabled { opacity: 0.5; cursor: default; }
        .hsf-empty { padding: 26px 12px; text-align: center; opacity: 0.72; font-size: 13px; line-height: 1.7; }
        .hsf-empty.hsf-error { color: #ff8a8a; opacity: 1; }
        .hsf-list { display: flex; flex-direction: column; gap: 6px; }
        .hsf-row { display:flex; align-items:center; justify-content: space-between; padding: 8px 10px; border-radius: 10px; background: rgba(255,255,255,0.03); }
        .hsf-row:hover { background: rgba(255,255,255,0.06); }
        .hsf-user { display:flex; align-items:center; gap: 10px; min-width: 0; }
        .hsf-user img { width: 42px; height: 42px; border-radius: 50%; object-fit: cover; background: rgba(255,255,255,0.08); }
        .hsf-name { font-size: 13px; font-weight: 700; }
        .hsf-since { font-size: 11px; opacity: 0.6; margin-top: 2px; }
        .hsf-remove { padding: 6px 14px; border-radius: 8px; border: 1px solid rgba(80,200,120,0.4); background: transparent; color: #4ade80; cursor: pointer; font-weight: 600; font-size: 12px; }
        .hsf-remove:hover { background: rgba(80,200,120,0.1); }
        .hsf-remove:disabled { opacity: 0.5; cursor: default; }
      `}</style>
    </SettingsShell>
  );
}
