// StoryViewer — لفّافة توافق خلفي تستخدم StoryViewerEnhanced الجديد.
// RTL + خط Noto Sans Arabic مُطبّقان داخل المكوّن المحسّن.
import StoryViewerEnhanced from './StoryViewerEnhanced.jsx';

export default function StoryViewer({ group, onClose, onNext, ...rest }) {
  return (
    <StoryViewerEnhanced
      group={group}
      onClose={onClose}
      onNextGroup={onNext}
      onPrevGroup={rest.onPrev}
      currentUserId={rest.currentUserId}
    />
  );
}
