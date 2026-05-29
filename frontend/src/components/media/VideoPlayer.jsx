/**
 * VideoPlayer (legacy entry) — now a thin wrapper around UniversalPlayer.
 *
 * Kept for backwards compatibility with existing imports throughout the app.
 * New code should import `UniversalPlayer` directly from `components/video`.
 */
import { memo } from 'react';
import UniversalPlayer from '../video/UniversalPlayer.jsx';

const VideoPlayer = memo(function VideoPlayer({
  src,
  poster,
  width = '100%',
  height = 'auto',
  autoplay = false,
  muted = false,
  loop = false,
  qualities = [],
  onPlay,
  onPause,
  onEnded,
  onError,
  className = '',
}) {
  return (
    <div style={{ width, height }} className={className}>
      <UniversalPlayer
        src={src}
        poster={poster}
        variant="post"
        autoplay={autoplay}
        muted={muted}
        loop={loop}
        qualities={qualities}
        onError={onError}
      />
    </div>
  );
});

VideoPlayer.displayName = 'VideoPlayer';
export default VideoPlayer;
