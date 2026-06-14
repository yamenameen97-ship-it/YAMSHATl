import { useState } from 'react';
import SettingsShell, { SettingsSection, SettingsRow, SettingsToggle } from '../../components/settings/SettingsShell.jsx';

const KEY = 'yamshat:voice-settings';
const load = () => { try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; } };
const save = (p) => { try { localStorage.setItem(KEY, JSON.stringify(p)); } catch {} };

export default function VoiceRoomsSettingsPage() {
  const [prefs, setPrefs] = useState(() => ({
    micEnabled: true,
    autoMuteOnJoin: true,
    noiseCancellation: true,
    echoCancellation: true,
    autoGainControl: true,
    audioQuality: 'high',
    pushToTalk: false,
    voiceActivation: true,
    voiceActivationThreshold: 50,
    allowSpeakerRequest: true,
    autoAcceptFromFollowers: false,
    backgroundNoiseSuppress: true,
    headphoneSafeMode: true,
    spatialAudio: false,
    showSpeakerIndicator: true,
    showWaveform: true,
    recordRooms: false,
    allowGuests: true,
    moderationEnabled: true,
    autoKickInactive: false,
    inactivityMinutes: 15,
    maxRoomSize: 50,
    languagePreference: 'ar',
    allowTranslation: false,
    notifyOnRoomStart: true,
    privateRoomDefault: false,
    ...load(),
  }));
  const [msg, setMsg] = useState('');

  const u = (k, v) => {
    const n = { ...prefs, [k]: v };
    setPrefs(n); save(n);
    setMsg('تم الحفظ.');
    setTimeout(() => setMsg(''), 1500);
  };

  return (
    <SettingsShell title="إعدادات الغرف الصوتية" subtitle="الميكروفون، الصوت، والتحكم في الغرف." icon="🎙️" backTo="/voice" message={msg}>
      <SettingsSection title="الميكروفون والصوت">
        <SettingsRow icon="🎤" title="تفعيل الميكروفون">
          <SettingsToggle on={prefs.micEnabled} onChange={(v) => u('micEnabled', v)} />
        </SettingsRow>
        <SettingsRow icon="🔇" title="كتم الميكروفون عند الانضمام">
          <SettingsToggle on={prefs.autoMuteOnJoin} onChange={(v) => u('autoMuteOnJoin', v)} />
        </SettingsRow>
        <SettingsRow icon="🎚️" title="جودة الصوت">
          <select className="settings-select" value={prefs.audioQuality} onChange={(e) => u('audioQuality', e.target.value)}>
            <option value="auto">تلقائي</option>
            <option value="low">منخفضة (موفر بيانات)</option>
            <option value="medium">متوسطة</option>
            <option value="high">عالية</option>
            <option value="studio">استوديو HD</option>
          </select>
        </SettingsRow>
        <SettingsRow icon="🌐" title="الصوت المكاني (Spatial Audio)">
          <SettingsToggle on={prefs.spatialAudio} onChange={(v) => u('spatialAudio', v)} />
        </SettingsRow>
        <SettingsRow icon="🎧" title="وضع السماعات الآمن" description="حماية السمع من الأصوات العالية">
          <SettingsToggle on={prefs.headphoneSafeMode} onChange={(v) => u('headphoneSafeMode', v)} />
        </SettingsRow>
      </SettingsSection>

      <SettingsSection title="معالجة الصوت">
        <SettingsRow icon="🔇" title="إلغاء الضوضاء">
          <SettingsToggle on={prefs.noiseCancellation} onChange={(v) => u('noiseCancellation', v)} />
        </SettingsRow>
        <SettingsRow icon="🔁" title="إلغاء الصدى">
          <SettingsToggle on={prefs.echoCancellation} onChange={(v) => u('echoCancellation', v)} />
        </SettingsRow>
        <SettingsRow icon="📊" title="تعديل الكسب التلقائي">
          <SettingsToggle on={prefs.autoGainControl} onChange={(v) => u('autoGainControl', v)} />
        </SettingsRow>
        <SettingsRow icon="🌫️" title="كبت الضوضاء الخلفية">
          <SettingsToggle on={prefs.backgroundNoiseSuppress} onChange={(v) => u('backgroundNoiseSuppress', v)} />
        </SettingsRow>
      </SettingsSection>

      <SettingsSection title="طريقة التحدث">
        <SettingsRow icon="🗣️" title="التنشيط الصوتي (Voice Activation)">
          <SettingsToggle on={prefs.voiceActivation} onChange={(v) => u('voiceActivation', v)} />
        </SettingsRow>
        {prefs.voiceActivation ? (
          <SettingsRow icon="📈" title="حساسية التنشيط الصوتي (0-100)">
            <input className="settings-input" type="number" min="0" max="100" value={prefs.voiceActivationThreshold} onChange={(e) => u('voiceActivationThreshold', Number(e.target.value))} />
          </SettingsRow>
        ) : null}
        <SettingsRow icon="🔘" title="اضغط للتحدث (Push to Talk)">
          <SettingsToggle on={prefs.pushToTalk} onChange={(v) => u('pushToTalk', v)} />
        </SettingsRow>
      </SettingsSection>

      <SettingsSection title="غرفي وإدارتها (للمضيف)">
        <SettingsRow icon="🙋" title="السماح بطلبات التحدث">
          <SettingsToggle on={prefs.allowSpeakerRequest} onChange={(v) => u('allowSpeakerRequest', v)} />
        </SettingsRow>
        <SettingsRow icon="✅" title="قبول المتابعين تلقائيًا">
          <SettingsToggle on={prefs.autoAcceptFromFollowers} onChange={(v) => u('autoAcceptFromFollowers', v)} />
        </SettingsRow>
        <SettingsRow icon="🎁" title="السماح بالضيوف من خارج التطبيق">
          <SettingsToggle on={prefs.allowGuests} onChange={(v) => u('allowGuests', v)} />
        </SettingsRow>
        <SettingsRow icon="🛡️" title="وضع الإشراف">
          <SettingsToggle on={prefs.moderationEnabled} onChange={(v) => u('moderationEnabled', v)} />
        </SettingsRow>
        <SettingsRow icon="🚪" title="طرد غير النشطين تلقائيًا">
          <SettingsToggle on={prefs.autoKickInactive} onChange={(v) => u('autoKickInactive', v)} />
        </SettingsRow>
        {prefs.autoKickInactive ? (
          <SettingsRow icon="⏱️" title="فترة عدم النشاط (دقائق)">
            <input className="settings-input" type="number" value={prefs.inactivityMinutes} onChange={(e) => u('inactivityMinutes', Number(e.target.value))} />
          </SettingsRow>
        ) : null}
        <SettingsRow icon="👥" title="الحد الأقصى للمشاركين">
          <input className="settings-input" type="number" value={prefs.maxRoomSize} onChange={(e) => u('maxRoomSize', Number(e.target.value))} />
        </SettingsRow>
        <SettingsRow icon="🔒" title="غرفة خاصة افتراضيًا">
          <SettingsToggle on={prefs.privateRoomDefault} onChange={(v) => u('privateRoomDefault', v)} />
        </SettingsRow>
        <SettingsRow icon="⏺️" title="تسجيل الغرف تلقائيًا">
          <SettingsToggle on={prefs.recordRooms} onChange={(v) => u('recordRooms', v)} />
        </SettingsRow>
      </SettingsSection>

      <SettingsSection title="العرض والتنبيهات">
        <SettingsRow icon="💡" title="مؤشر المتحدث">
          <SettingsToggle on={prefs.showSpeakerIndicator} onChange={(v) => u('showSpeakerIndicator', v)} />
        </SettingsRow>
        <SettingsRow icon="〰️" title="عرض موجة الصوت">
          <SettingsToggle on={prefs.showWaveform} onChange={(v) => u('showWaveform', v)} />
        </SettingsRow>
        <SettingsRow icon="🔔" title="إشعار عند بدء غرفة من المتابعين">
          <SettingsToggle on={prefs.notifyOnRoomStart} onChange={(v) => u('notifyOnRoomStart', v)} />
        </SettingsRow>
      </SettingsSection>

      <SettingsSection title="اللغة والترجمة">
        <SettingsRow icon="🌍" title="اللغة المفضلة">
          <select className="settings-select" value={prefs.languagePreference} onChange={(e) => u('languagePreference', e.target.value)}>
            <option value="ar">العربية</option>
            <option value="en">English</option>
            <option value="all">كل اللغات</option>
          </select>
        </SettingsRow>
        <SettingsRow icon="🔤" title="ترجمة فورية للكلام">
          <SettingsToggle on={prefs.allowTranslation} onChange={(v) => u('allowTranslation', v)} />
        </SettingsRow>
      </SettingsSection>
    </SettingsShell>
  );
}
