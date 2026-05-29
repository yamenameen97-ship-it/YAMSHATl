import useAudio from '../../hooks/media/useAudio.js';
import audioService, { SOUND_CATALOG } from '../../services/audio/audioService.js';

/**
 * SoundSettingsPanel — full UI for "الإعدادات > الأصوات".
 * Render this inside your Settings page (a new tab).
 */
const RINGTONE_KEYS = ['ring_voice', 'ring_video'];

const ROW = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.08)',
  gap: 12,
};

function Toggle({ checked, onChange, label }) {
  return (
    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
      <input type="checkbox" checked={!!checked} onChange={(e) => onChange(e.target.checked)} />
      <span>{label}</span>
    </label>
  );
}

export default function SoundSettingsPanel() {
  const { settings, update, setVolume, setEnabled, setCategory, play } = useAudio();

  const previewRingtone = (key) => {
    audioService.stop('ring_voice');
    audioService.stop('ring_video');
    audioService.play(key, { force: true });
    setTimeout(() => audioService.stop(key), 1500);
  };

  return (
    <div className="yamshat-sound-settings" style={{
      padding: 16,
      borderRadius: 16,
      background: 'var(--surface, rgba(255,255,255,0.04))',
      color: 'var(--text, #fff)',
      maxWidth: 640,
    }}>
      <h3 style={{ margin: 0, marginBottom: 12 }}>إعدادات الأصوات</h3>
      <p style={{ opacity: 0.7, margin: '0 0 16px', fontSize: 13 }}>
        تحكم كامل في أصوات التطبيق: الرسائل، الإشعارات، الرنين، الكتابة، والنظام.
      </p>

      {/* Master switch */}
      <div style={ROW}>
        <strong>تشغيل الأصوات بشكل عام</strong>
        <Toggle checked={settings.enabled} onChange={setEnabled} label={settings.enabled ? 'مفعلة' : 'صامت'} />
      </div>

      {/* Volume */}
      <div style={{ ...ROW, flexDirection: 'column', alignItems: 'stretch' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <strong>مستوى الصوت</strong>
          <span>{Math.round(settings.volume * 100)}%</span>
        </div>
        <input
          type="range" min="0" max="1" step="0.05"
          value={settings.volume}
          onChange={(e) => setVolume(parseFloat(e.target.value))}
          style={{ width: '100%', marginTop: 8 }}
        />
      </div>

      {/* Vibrate */}
      <div style={ROW}>
        <strong>الاهتزاز</strong>
        <Toggle checked={settings.vibrate} onChange={(b) => update({ vibrate: b })} label={settings.vibrate ? 'مفعّل' : 'متوقف'} />
      </div>

      {/* Night mode */}
      <div style={ROW}>
        <strong>الوضع الليلي للصوت (خفض تلقائي 22:00 - 07:00)</strong>
        <Toggle checked={settings.nightMode} onChange={(b) => update({ nightMode: b })} label={settings.nightMode ? 'مفعّل' : 'متوقف'} />
      </div>

      <h4 style={{ marginTop: 20, marginBottom: 6 }}>الفئات</h4>

      <div style={ROW}>
        <span>أصوات الرسائل</span>
        <Toggle checked={settings.categories.messages} onChange={(b) => setCategory('messages', b)} label="" />
      </div>
      <div style={ROW}>
        <span>أصوات الإشعارات</span>
        <Toggle checked={settings.categories.notifications} onChange={(b) => setCategory('notifications', b)} label="" />
      </div>
      <div style={ROW}>
        <span>أصوات المكالمات والبث</span>
        <Toggle checked={settings.categories.calls} onChange={(b) => setCategory('calls', b)} label="" />
      </div>
      <div style={ROW}>
        <span>صوت الكتابة (typing click)</span>
        <Toggle checked={settings.categories.typing} onChange={(b) => setCategory('typing', b)} label="" />
      </div>
      <div style={ROW}>
        <span>أصوات النظام (فتح/رجوع/تحديث)</span>
        <Toggle checked={settings.categories.system} onChange={(b) => setCategory('system', b)} label="" />
      </div>

      <h4 style={{ marginTop: 20, marginBottom: 6 }}>نغمة الرنين</h4>
      <div style={ROW}>
        <span>نغمة المكالمة الصوتية</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <select
            value={settings.ringtone}
            onChange={(e) => update({ ringtone: e.target.value })}
            style={{ padding: '6px 10px', borderRadius: 8 }}
          >
            {RINGTONE_KEYS.map((k) => (
              <option key={k} value={k}>{k === 'ring_voice' ? 'كلاسيكية' : 'عصرية'}</option>
            ))}
          </select>
          <button type="button" onClick={() => previewRingtone(settings.ringtone)} style={btnSm}>تجربة</button>
        </div>
      </div>
      <div style={ROW}>
        <span>نغمة مكالمة الفيديو</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <select
            value={settings.videoRingtone}
            onChange={(e) => update({ videoRingtone: e.target.value })}
            style={{ padding: '6px 10px', borderRadius: 8 }}
          >
            {RINGTONE_KEYS.map((k) => (
              <option key={k} value={k}>{k === 'ring_voice' ? 'كلاسيكية' : 'عصرية'}</option>
            ))}
          </select>
          <button type="button" onClick={() => previewRingtone(settings.videoRingtone)} style={btnSm}>تجربة</button>
        </div>
      </div>

      <h4 style={{ marginTop: 20, marginBottom: 6 }}>معاينة سريعة</h4>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {Object.keys(SOUND_CATALOG).filter((k) => !SOUND_CATALOG[k].loop).slice(0, 12).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => play(k, { force: true })}
            style={chipStyle}
          >
            ▶ {k}
          </button>
        ))}
      </div>
    </div>
  );
}

const btnSm = {
  padding: '6px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)',
  background: 'rgba(255,255,255,0.06)', color: 'inherit', cursor: 'pointer', fontSize: 12,
};

const chipStyle = {
  padding: '6px 10px', borderRadius: 999, border: '1px solid rgba(255,255,255,0.12)',
  background: 'rgba(255,255,255,0.05)', color: 'inherit', cursor: 'pointer', fontSize: 11,
};
