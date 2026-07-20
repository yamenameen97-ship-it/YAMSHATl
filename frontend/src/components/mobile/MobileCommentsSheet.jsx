import { memo, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { addComment, getComments } from '../../api/posts.js';
import { useToast } from '../admin/ToastProvider.jsx';
import { resolveMediaUrl } from '../../config/mediaConfig.js';

/**
 * MobileCommentsSheet — bottom sheet لعرض/إضافة التعليقات على منشور.
 * يستخدم getComments + addComment الحقيقيين من backend.
 *
 * ✅ v88.19 FIX (ROOT CAUSE):
 *  المشكلة: صندوق كتابة التعليق (composer) كان يختفي جزئياً خلف أزرار نظام
 *  الهاتف السفلية (home indicator / gesture bar) لأن التصميم القديم استخدم
 *   position: absolute; bottom: var(--ym-kb-inset, 0px);
 *  وبدون لوحة مفاتيح مفتوحة، ‎--ym-kb-inset = 0‎، فيلتصق الـ composer بحافة
 *  الشاشة تماماً ويصادر مساحة الـ safe-area-inset-bottom.
 *
 *  الحل الجذري (مستوحى من درج تعليقات الريلز الذي يعمل بشكل مثالي):
 *  1) الـ overlay يحمل padding-bottom بمقدار (safe-area + kb-inset) لرفع
 *     البانل بأكمله فوق أزرار النظام ولوحة المفاتيح.
 *  2) الـ sheet عضو flex-column طبيعي بدون position:absolute متضارب.
 *  3) الـ composer الآن flex-item عادي (flex-shrink:0) يبقى مرئياً دائماً
 *     في نهاية عمود الـ sheet — نفس منطق ym-reels-drawer-input بالضبط.
 */
function MobileCommentsSheet({ open, postId, onClose }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const queryClient = useQueryClient();
  const { pushToast } = useToast();

  useEffect(() => {
    if (!open || !postId) return;
    let cancelled = false;
    setLoading(true);
    getComments(postId)
      .then((res) => {
        if (cancelled) return;
        const data = res?.data;
        // ✅ v85.9 FIX: دعم أشكال إرجاع متعدّدة من الـ backend — مصفوفة مباشرة،
        // أو { items }، أو { comments }، أو { results }، أو { data: [...] } ملتففة مرتين.
        let raw = [];
        if (Array.isArray(data)) raw = data;
        else if (Array.isArray(data?.items)) raw = data.items;
        else if (Array.isArray(data?.comments)) raw = data.comments;
        else if (Array.isArray(data?.results)) raw = data.results;
        else if (Array.isArray(data?.data)) raw = data.data;
        else if (Array.isArray(data?.data?.items)) raw = data.data.items;

        // ✅ v85.7 FIX: تسطيح شجرة التعليقات (جذور + ردود) إلى قائمة مسطحة
        // لأن الـ backend يُرجع الآن items كشجرة (داخل كل جذر replies[]).
        // ✅ v85.9 FIX: تجنّب الحلقات اللانهائية لو أرجع الباكاند مرجعاً دائرياً.
        const flat = [];
        const seen = new Set();
        const walk = (nodes) => {
          if (!Array.isArray(nodes)) return;
          for (const n of nodes) {
            if (!n || typeof n !== 'object') continue;
            const key = n.id ?? `${n.user_id || ''}-${n.created_at || ''}-${(n.content || n.text || '').slice(0,20)}`;
            if (seen.has(key)) continue;
            seen.add(key);
            flat.push(n);
            if (Array.isArray(n.replies) && n.replies.length) walk(n.replies);
            if (Array.isArray(n.children) && n.children.length) walk(n.children);
          }
        };
        walk(raw);
        setComments(flat);
      })
      .catch((err) => {
        // 500 من الـ backend عند غياب التعليقات => نتعامل بصمت بدون رمي خطأ في الكونسول
        const status = err?.response?.status;
        if (status && status !== 500) {
          console.warn('Failed to load comments', err?.message || err);
        }
        if (!cancelled) setComments([]);
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [open, postId]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    // ✅ v60.8 FIX: تعيين data-attribute على body حتى يتم إخفاء BottomNav عبر CSS
    // وبالتالي تظهر منطقة كتابة التعليق بالكامل ولا تفقد خلف شريط التنقل
    document.body.setAttribute('data-ym-sheet', 'open');

    // ✅ v88.19 FIX: مواكبة visualViewport (لوحة المفاتيح على الجوال)
    // كي يبقى صندوق كتابة التعليق فوق لوحة المفاتيح دائماً بدلاً من الاختفاء أسفل الشاشة.
    // نضبط متغير CSS ‎--ym-kb-inset‎ إلى ارتفاع لوحة المفاتيح المرئية.
    const updateKbInset = () => {
      try {
        const vv = window.visualViewport;
        if (!vv) { document.documentElement.style.setProperty('--ym-kb-inset', '0px'); return; }
        const kb = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
        document.documentElement.style.setProperty('--ym-kb-inset', `${Math.round(kb)}px`);
      } catch { /* ignore */ }
    };
    updateKbInset();
    window.visualViewport?.addEventListener('resize', updateKbInset);
    window.visualViewport?.addEventListener('scroll', updateKbInset);

    return () => {
      document.body.style.overflow = prev;
      document.body.removeAttribute('data-ym-sheet');
      window.visualViewport?.removeEventListener('resize', updateKbInset);
      window.visualViewport?.removeEventListener('scroll', updateKbInset);
      document.documentElement.style.setProperty('--ym-kb-inset', '0px');
    };
  }, [open]);

  const handleSend = async () => {
    const content = draft.trim();
    if (!content || !postId) return;
    setSending(true);
    try {
      const res = await addComment(postId, content);
      const newComment = res?.data?.comment || res?.data || {
        id: `local-${Date.now()}`,
        content,
        author_name: 'أنت',
        created_at: new Date().toISOString(),
      };
      setComments((prev) => [newComment, ...prev]);
      setDraft('');
      queryClient.invalidateQueries({ queryKey: ['feed-data'] });
      pushToast?.({ type: 'success', title: 'تمت إضافة التعليق' });

      // ✅ v87.8 FIX: إعادة جلب التعليقات من الخادم فور الإرسال لضمان التزامن الحقيقي.
      // إذا فشل التخزين داخل الخادم لأي سبب (مثلاً: allow_comments=false يتم تجاوزه مؤقتاً،
      // او رد 200 خاطئ)، سيظهر ذلك فوراً بدل الانتظار للمرة التالية.
      try {
        const refetch = await getComments(postId);
        const data = refetch?.data;
        let raw = [];
        if (Array.isArray(data)) raw = data;
        else if (Array.isArray(data?.items)) raw = data.items;
        else if (Array.isArray(data?.comments)) raw = data.comments;
        else if (Array.isArray(data?.results)) raw = data.results;
        else if (Array.isArray(data?.data)) raw = data.data;
        const flat = [];
        const seen = new Set();
        const walk = (nodes) => {
          if (!Array.isArray(nodes)) return;
          for (const n of nodes) {
            if (!n || typeof n !== 'object') continue;
            const key = n.id ?? `${n.user_id || ''}-${n.created_at || ''}-${(n.content || n.text || '').slice(0,20)}`;
            if (seen.has(key)) continue;
            seen.add(key);
            flat.push(n);
            if (Array.isArray(n.replies) && n.replies.length) walk(n.replies);
            if (Array.isArray(n.children) && n.children.length) walk(n.children);
          }
        };
        walk(raw);
        if (flat.length) setComments(flat);
      } catch (refetchErr) {
        // إذا فشلت إعادة الجلب، نبقي التعليق المضاف محلياً (فعلناه أعلاه).
        console.warn('Refetch after add failed', refetchErr?.message || refetchErr);
      }
    } catch (err) {
      console.error('Add comment failed', err);
      pushToast?.({ type: 'error', title: 'تعذر إضافة التعليق' });
    } finally {
      setSending(false);
    }
  };

  if (!open) return null;

  return (
    <div className="ym-sheet-overlay" data-yam-comments-sheet="true" role="dialog" aria-modal="true" aria-label="التعليقات" dir="rtl" onClick={onClose}>
      <style>{`
        /* ═════════════════════════════════════════════════════════════════
           v88.19 ROOT-CAUSE FIX: صندوق تعليقات المنشور مطابق لصندوق تعليقات
           الريلز — لن يختفي composer خلف أزرار نظام الهاتف السفلية أو خلف
           BottomNav أو خلف لوحة المفاتيح. نفس منطق ym-reels-drawer.
           ═════════════════════════════════════════════════════════════════ */

        /* 1) الـ overlay = حاوية fixed تحتضن الشيت في الأسفل.
              padding-bottom يرفع البانل بأكمله فوق أزرار النظام + لوحة المفاتيح. */
        html body .ym-sheet-overlay[data-yam-comments-sheet="true"] {
          position: fixed !important;
          inset: 0 !important;
          z-index: 2147483000 !important;
          background: rgba(0,0,0,0.55) !important;
          display: flex !important;
          align-items: flex-end !important;
          justify-content: center !important;
          /* ⭐ المفتاح: نفس padding درج الريلز — safe-area + كيبورد إن وُجد.
             هذا يرفع كامل البانل (بما فيه الـ composer) فوق أزرار الهاتف. */
          padding: 0 0 calc(env(safe-area-inset-bottom, 0px) + var(--ym-kb-inset, 0px)) !important;
          margin: 0 !important;
          box-sizing: border-box !important;
          pointer-events: auto !important;
          visibility: visible !important;
          opacity: 1 !important;
        }

        /* 2) الـ sheet نفسه = flex-column طبيعي، بدون position:absolute متضارب.
              الارتفاع يستخدم dvh لكي يتقلص تلقائياً عند فتح الكيبورد. */
        html body .ym-sheet-overlay[data-yam-comments-sheet="true"] .ym-sheet {
          position: relative !important;
          width: 100% !important;
          max-width: 640px !important;
          /* ارتفاع البانل الفعلي — dvh يتقلص مع الكيبورد */
          height: min(82dvh, 720px) !important;
          max-height: 82dvh !important;
          min-height: 320px !important;
          margin: 0 !important;
          background: #0f1420 !important;
          border-radius: 22px 22px 0 0 !important;
          border-top: 1px solid rgba(139,92,246,0.35) !important;
          box-shadow: 0 -20px 60px rgba(0,0,0,0.55) !important;
          display: flex !important;
          flex-direction: column !important;
          overflow: hidden !important;
          transform: none !important;
          pointer-events: auto !important;
          visibility: visible !important;
          opacity: 1 !important;
          /* إلغاء أي تثبيت مطلق قديم كان يُلصق الشيت بأسفل الشاشة */
          inset: auto !important;
          top: auto !important;
          bottom: auto !important;
          left: auto !important;
          right: auto !important;
        }

        /* 3) مقبض السحب (handle) */
        html body .ym-sheet-overlay[data-yam-comments-sheet="true"] .ym-sheet-handle {
          width: 44px !important;
          height: 4px !important;
          background: rgba(255,255,255,0.28) !important;
          border-radius: 2px !important;
          margin: 8px auto 0 !important;
          flex-shrink: 0 !important;
        }

        /* 4) الهيدر — flex item عادي */
        html body .ym-sheet-overlay[data-yam-comments-sheet="true"] .ym-sheet-head {
          flex-shrink: 0 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: space-between !important;
          padding: 12px 16px 12px !important;
          border-bottom: 1px solid rgba(255,255,255,0.06) !important;
        }
        html body .ym-sheet-overlay[data-yam-comments-sheet="true"] .ym-sheet-head h3 {
          margin: 0 !important;
          color: #fff !important;
          font-size: 16px !important;
          font-weight: 700 !important;
        }
        html body .ym-sheet-overlay[data-yam-comments-sheet="true"] .ym-sheet-close {
          background: transparent !important;
          border: 0 !important;
          color: #fff !important;
          cursor: pointer !important;
          padding: 6px !important;
          border-radius: 8px !important;
        }

        /* 5) الجسم = flex:1 يستهلك المساحة المتبقية، قابل للتمرير.
              لا نحتاج padding-bottom اصطناعي لأن الـ composer الآن flex-item
              حقيقي في نفس العمود (نفس مبدأ الريلز). */
        html body .ym-sheet-overlay[data-yam-comments-sheet="true"] .ym-sheet-body {
          flex: 1 1 auto !important;
          min-height: 0 !important;
          overflow-y: auto !important;
          overflow-x: hidden !important;
          -webkit-overflow-scrolling: touch !important;
          overscroll-behavior: contain !important;
          padding: 12px 16px !important;
          display: block !important;
          visibility: visible !important;
          opacity: 1 !important;
          pointer-events: auto !important;
        }

        /* 6) الـ COMPOSER = flex item راسخ في نهاية العمود.
              ⭐ لا position:absolute — لا bottom:0 — تماماً كـ ym-reels-drawer-input
              يبقى دائماً مرئياً فوق أزرار الهاتف لأن الـ overlay هو من يرفعه. */
        html body .ym-sheet-overlay[data-yam-comments-sheet="true"] .ym-sheet-composer {
          position: relative !important;
          left: auto !important;
          right: auto !important;
          bottom: auto !important;
          top: auto !important;
          inset: auto !important;
          transform: none !important;
          margin: 0 !important;
          flex-shrink: 0 !important;
          display: flex !important;
          align-items: center !important;
          gap: 10px !important;
          padding: 12px 14px !important;
          background: rgba(15, 20, 32, 0.98) !important;
          backdrop-filter: blur(10px) !important;
          -webkit-backdrop-filter: blur(10px) !important;
          border-top: 1px solid rgba(255,255,255,0.08) !important;
          z-index: 5 !important;
          visibility: visible !important;
          opacity: 1 !important;
          pointer-events: auto !important;
        }

        /* 7) حقل الإدخال */
        html body .ym-sheet-overlay[data-yam-comments-sheet="true"] .ym-sheet-input {
          flex: 1 1 auto !important;
          min-width: 0 !important;
          min-height: 44px !important;
          background: rgba(255,255,255,0.06) !important;
          border: 1px solid rgba(255,255,255,0.08) !important;
          border-radius: 22px !important;
          padding: 10px 16px !important;
          color: #fff !important;
          font-family: inherit !important;
          font-size: 16px !important; /* يمنع Safari/iOS من التكبير التلقائي */
          outline: 0 !important;
        }

        /* 8) زر الإرسال */
        html body .ym-sheet-overlay[data-yam-comments-sheet="true"] .ym-sheet-send {
          width: 44px !important;
          height: 44px !important;
          flex-shrink: 0 !important;
          border-radius: 50% !important;
          border: 0 !important;
          background: linear-gradient(135deg, #8b5cf6, #6d28d9) !important;
          color: #fff !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          cursor: pointer !important;
          box-shadow: 0 6px 18px rgba(139,92,246,0.45) !important;
        }
        html body .ym-sheet-overlay[data-yam-comments-sheet="true"] .ym-sheet-send:disabled {
          opacity: 0.5 !important;
          cursor: not-allowed !important;
        }

        /* 9) إخفاء نهائي لأي BottomNav محتمل أثناء فتح ورقة التعليقات
              (تكرار الحماية على مستوى المكوّن حتى لو لم يُحمَّل CSS القديم) */
        html body[data-ym-sheet="open"] .mobile-bottom-nav,
        html body[data-ym-sheet="open"] .yam-bottom-nav,
        html body[data-ym-sheet="open"] .ym-bottomnav,
        html body[data-ym-sheet="open"] nav.bottom-nav,
        html body[data-ym-sheet="open"] [class*="BottomNav"],
        html body[data-ym-sheet="open"] [class*="bottomnav"] {
          display: none !important;
          visibility: hidden !important;
          pointer-events: none !important;
        }
      `}</style>
      <div className="ym-sheet" dir="rtl" onClick={(e) => e.stopPropagation()}>
        <div className="ym-sheet-handle" aria-hidden="true" />
        <header className="ym-sheet-head">
          <h3>التعليقات</h3>
          <button type="button" className="ym-sheet-close" onClick={onClose} aria-label="إغلاق">
            <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
              <path d="M6 6 L18 18 M18 6 L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </header>

        <div className="ym-sheet-body">
          {loading ? (
            <div className="ym-sheet-empty">جارٍ التحميل...</div>
          ) : comments.length === 0 ? (
            <div className="ym-sheet-empty">
              <div className="icon">💬</div>
              لا توجد تعليقات بعد. كن أول من يعلّق!
            </div>
          ) : (
            <ul className="ym-comment-list">
              {comments.map((c) => {
                const author = c.author_name || c.username || c.user || 'مستخدم';
                const avatar = resolveMediaUrl(c.user_avatar || c.avatar || c.author_avatar || '');
                const txt = c.content || c.text || '';
                return (
                  <li key={c.id || `c-${Math.random()}`} className="ym-comment-item">
                    <span className="ym-comment-avatar">
                      {avatar ? <img src={avatar} alt="" loading="lazy" /> : <span className="ph">{String(author).charAt(0)}</span>}
                    </span>
                    <div className="ym-comment-body">
                      <div className="ym-comment-author">{author}</div>
                      <div className="ym-comment-text" dir="auto">{txt}</div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <footer className="ym-sheet-composer">
          <input
            type="text"
            placeholder="اكتب تعليقاً..."
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            disabled={sending}
            dir="auto"
            className="ym-sheet-input"
          />
          <button
            type="button"
            className="ym-sheet-send"
            onClick={handleSend}
            disabled={!draft.trim() || sending}
            aria-label="إرسال"
          >
            {sending ? '...' : (
              <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                <path d="M3 12 L21 4 L17 21 L13 13 Z" fill="currentColor" />
              </svg>
            )}
          </button>
        </footer>
      </div>
    </div>
  );
}

export default memo(MobileCommentsSheet);
