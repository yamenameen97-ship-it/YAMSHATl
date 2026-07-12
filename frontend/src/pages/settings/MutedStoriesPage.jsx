import { useState, useEffect, useCallback } from 'react';
import SettingsShell, { SettingsSection, SettingsRow } from '../../components/settings/SettingsShell.jsx';
import { getMutedStoryUsers, unmuteUserStories } from '../../api/stories.js';
import UserPickerModal from '../../components/stories/UserPickerModal.jsx';

/**
 * MutedStoriesPage — v87.12
 * صفحة إدارة قائمة المستخدمين المكتومة قصصهم (Mute User Stories).
 * المستخدمون هنا قصصهم لا تظهر في شريط الستوري لكن يبقون مرئيين في بقية التطبيق.
 */
export default function MutedStoriesPage() {
  const [mutedUsers, setMutedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPicker, setShowPicker] = useState(false);
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await getMutedStoryUsers();
      setMutedUsers(Array.isArray(res?.data) ? res.data : []);
    } catch {
      setMutedUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleUnmute = async (username) => {
    try {
      await unmuteUserStories(username);
      setMutedUsers(prev => prev.filter(u => u.username !== username));
      setMsg('تم إلغاء الكتم ✓');
      setTimeout(() => setMsg(''), 1500);
    } catch {
      setMsg('تعذّر التحديث');
      setTimeout(() => setMsg(''), 1500);
    }
  };

  return (
    <SettingsShell
      title="قصص مكتومة"
      subtitle="المستخدمون الذين كتمت قصصهم — لن تظهر قصصهم في شريط الستوري."
      icon="🔕"
      backTo="/settings/stories"
      message={msg}
    >
      <div dir="rtl" style={{ fontFamily: "'Noto Sans Arabic', 'Tajawal', system-ui, sans-serif" }}>

        <SettingsSection title="قائمة القصص المكتومة" description={`${mutedUsers.length} مستخدم مكتوم`}>
          <SettingsRow icon="➕" title="كتم قصص مستخدم">
            <button
              type="button"
              className="settings-link-btn"
              onClick={() => setShowPicker(true)}
            >فتح</button>
          </SettingsRow>

          {loading && (
            <div style={{ textAlign: 'center', padding: 24, color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>
              جاري التحميل…
            </div>
          )}

          {!loading && mutedUsers.length === 0 && (
            <div style={{ textAlign: 'center', padding: 32, color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
              لا يوجد مستخدمون مكتومون بعد
            </div>
          )}

          {!loading && mutedUsers.map((user) => (
            <div key={user.username} className="yam-muted-story-row">
              <img
                src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username)}&background=8b5cf6&color=fff`}
                alt=""
                className="yam-muted-story-avatar"
                loading="lazy"
              />
              <div className="yam-muted-story-info">
                <strong>{user.username}</strong>
              </div>
              <button
                type="button"
                className="yam-muted-story-unmute"
                onClick={() => handleUnmute(user.username)}
              >إلغاء الكتم</button>
            </div>
          ))}
        </SettingsSection>

        <div style={{ padding: '0 16px', fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>
          <p>📌 الكتم يخفي قصص المستخدم من شريط الستوري فقط — يبقى بإمكانك رؤية بوستاته وريلزه وبروفايله.</p>
          <p>📌 الفرق عن الحظر: الحظر يمنع كل التفاعل. الكتم يخفي القصص فقط دون إشعار الطرف الآخر.</p>
        </div>
      </div>

      {showPicker && (
        <UserPickerModal
          open={showPicker}
          title="كتم قصص مستخدم"
          excludedUsernames={mutedUsers.map(u => u.username)}
          onPick={async (pickedUser) => {
            const username = pickedUser?.username;
            if (!username) return;
            // استخدم الـ API من stories.js للكتم
            const { muteUserStories } = await import('../../api/stories.js');
            try {
              await muteUserStories(username);
              setShowPicker(false);
              setMsg('تم كتم القصص ✓');
              setTimeout(() => setMsg(''), 1500);
              load();
            } catch {
              setMsg('تعذّر الكتم');
              setTimeout(() => setMsg(''), 1500);
            }
          }}
          onClose={() => setShowPicker(false)}
        />
      )}

      <style>{`
        .yam-muted-story-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 16px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .yam-muted-story-row:hover { background: rgba(255,255,255,0.03); }
        .yam-muted-story-avatar {
          width: 40px; height: 40px; border-radius: 50%;
          object-fit: cover; background: #1a1a22;
        }
        .yam-muted-story-info { flex: 1; display: flex; flex-direction: column; }
        .yam-muted-story-info strong { font-size: 14px; color: #fff; }
        .yam-muted-story-unmute {
          background: rgba(239,68,68,0.15);
          border: 1px solid rgba(239,68,68,0.3);
          color: #fca5a5;
          padding: 6px 14px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 600;
          font-family: inherit;
        }
        .settings-link-btn {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 6px 14px; border-radius: 10px;
          background: linear-gradient(135deg, #4f9cff, #6b7cff);
          color: #fff; font-weight: 700; font-size: 12px;
          text-decoration: none; cursor: pointer;
        }
      `}</style>
    </SettingsShell>
  );
}
