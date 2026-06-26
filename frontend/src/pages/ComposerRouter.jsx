import { lazy, Suspense } from 'react';
import { useLocation } from 'react-router-dom';
import { RoutePageSkeleton } from '../components/feedback/Skeleton.jsx';

/**
 * ComposerRouter — v59.13.27
 * ----------------------------------------------------------------
 * موجّه ذكي يقرر أي صفحة إنشاء تُعرض بناءً على ?tab= في الـURL:
 *   - tab=post  → PostComposerPage  (بوست كتابة منشور — جديد)
 *   - tab=reel|story|photo|live|templates  → ReelComposer (الكاميرا الموحدة)
 *
 * هذا يصلح المشكلة الكارثية: زر (+) في الـBottomNav من الصفحة الرئيسية
 * كان يوجّه /compose?tab=post لكن /compose كان دائمًا يفتح ReelComposer
 * (شاشة الكاميرا/الريلز). الآن tab=post يفتح بوست كتابة المنشور فعلًا.
 */
const PostComposerPage = lazy(() => import('./PostComposerPage.jsx'));
const ReelComposer = lazy(() => import('./ReelComposer.jsx'));

function readTab(search) {
  try {
    const sp = new URLSearchParams(search);
    return String(sp.get('tab') || '').toLowerCase();
  } catch {
    return '';
  }
}

export default function ComposerRouter() {
  const location = useLocation();
  const tab = readTab(location.search);

  // tab=post → PostComposerPage (بوست كتابة المنشور)
  if (tab === 'post' || location.pathname.startsWith('/post')) {
    return (
      <Suspense fallback={<RoutePageSkeleton />}>
        <PostComposerPage />
      </Suspense>
    );
  }

  // أي tab آخر (reel, story, photo, live, templates) → ReelComposer
  return (
    <Suspense fallback={<RoutePageSkeleton />}>
      <ReelComposer />
    </Suspense>
  );
}
