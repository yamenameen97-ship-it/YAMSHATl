function seededBars(seed = '') {
  const source = String(seed || 'audio');
  const bars = [];
  let hash = 2166136261;
  for (let i = 0; i < source.length; i += 1) {
    hash ^= source.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  for (let i = 0; i < 24; i += 1) {
    hash ^= i + 31;
    hash = Math.imul(hash, 16777619);
    const height = 20 + Math.abs(hash % 75);
    bars.push(height);
  }
  return bars;
}

export default function AudioWaveform({ seed, compact = false }) {
  const bars = seededBars(seed);
  return (
    <div className={`audio-waveform ${compact ? 'compact' : ''}`} aria-hidden="true">
      {bars.map((height, index) => (
        <span key={`${seed}-${index}`} style={{ height: `${height}%` }} />
      ))}
    </div>
  );
}
