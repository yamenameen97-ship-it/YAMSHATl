import { useMemo } from 'react';

function hashSeed(seed = '') {
  const source = String(seed || 'audio');
  let hash = 2166136261;
  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function pseudoRandom(seed) {
  let value = hashSeed(seed) || 1;
  return () => {
    value ^= value << 13;
    value ^= value >>> 17;
    value ^= value << 5;
    return ((value >>> 0) % 1000) / 1000;
  };
}

function buildWaveform(seed = '', compact = false) {
  const count = compact ? 28 : 40;
  const random = pseudoRandom(seed);
  const raw = [];

  for (let index = 0; index < count; index += 1) {
    const centerDistance = Math.abs(index - (count - 1) / 2) / (count / 2);
    const envelope = 1 - Math.min(0.72, centerDistance * 0.72);
    const oscillation = Math.sin((index / count) * Math.PI * 2.8 + random() * 1.4);
    const harmonic = Math.sin((index / count) * Math.PI * 6.2 + random() * 2.2) * 0.24;
    const noise = (random() - 0.5) * 0.2;
    const normalized = Math.max(0.18, Math.min(1, 0.46 + oscillation * 0.24 + harmonic + noise));
    raw.push(normalized * envelope);
  }

  return raw.map((value, index) => {
    const left = raw[index - 1] ?? value;
    const right = raw[index + 1] ?? value;
    const smoothed = (left * 0.25) + (value * 0.5) + (right * 0.25);
    return Math.round(24 + (smoothed * 72));
  });
}

export default function AudioWaveform({ seed, compact = false, progress = 0, playing = false }) {
  const bars = useMemo(() => buildWaveform(seed, compact), [seed, compact]);
  const normalizedProgress = Number.isFinite(progress) ? Math.max(0, Math.min(1, progress)) : 0;

  return (
    <div
      className={`audio-waveform ${compact ? 'compact' : ''} ${playing ? 'playing' : ''}`}
      aria-hidden="true"
    >
      {bars.map((height, index) => {
        const completion = bars.length > 1 ? index / (bars.length - 1) : 0;
        return (
          <span
            key={`${seed || 'audio'}-${index}`}
            className={completion <= normalizedProgress ? 'active' : ''}
            style={{
              '--bar-height': `${height}%`,
              '--bar-delay': `${index * 24}ms`,
            }}
          />
        );
      })}
    </div>
  );
}
