import useAudio from '../../hooks/media/useAudio.js';

/**
 * SoundToggle — quick header/inline button to mute/unmute the whole app.
 */
export default function SoundToggle({ className = '', size = 36 }) {
  const { settings, setEnabled } = useAudio();
  const enabled = settings.enabled;

  return (
    <button
      type="button"
      onClick={() => setEnabled(!enabled)}
      aria-label={enabled ? 'كتم الأصوات' : 'تشغيل الأصوات'}
      title={enabled ? 'كتم الأصوات' : 'تشغيل الأصوات'}
      className={className}
      style={{
        width: size, height: size, borderRadius: size / 2,
        border: '1px solid rgba(255,255,255,0.15)',
        background: enabled ? 'rgba(255,255,255,0.08)' : 'rgba(255, 80, 80, 0.18)',
        color: 'var(--text, #fff)',
        cursor: 'pointer',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size * 0.45,
      }}
    >
      {enabled ? '🔔' : '🔕'}
    </button>
  );
}
