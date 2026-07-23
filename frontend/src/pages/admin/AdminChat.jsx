import { useEffect, useMemo, useRef, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout.jsx';
import {
  getAdminChatThreads,
  getAdminChatThreadMessages,
  deleteAdminChatMessage,
  restoreAdminChatMessage,
  muteAdminChatUser,
  banAdminChatUser,
  scanAdminChatNsfw,
} from '../../api/admin.js';
import socket from '../../api/socket.js';
import { useToast } from '../../components/admin/ToastProvider.jsx';

/**
 * ========================================================================
 * AdminChat — إدارة الشات (v88.46 Stage 2)
 * ------------------------------------------------------------------------
 *  - عربية كاملة (RTL)، تصميم متناسق مع باقي صفحات الأدمن
 *  - أزرار: حذف الرسالة / كتم المُرسل / حظره
 *  - كشف تلقائي للوسائط الإباحية (NSFW auto-scan) عند فتح المحادثة
 *  - Endpoints جديدة تحت /admin/chat/*
 * ========================================================================
 */

// تنظيف نص الرسالة من أي بادئات/علامات تشفير قبل عرضها للأدمن
function cleanEncryptedText(text) {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(/\[\/?ENCRYPTED[^\]]*\]/gi, '')
    .replace(/^\.\.\.\s*/, '')
    .trim();
}

function truncate(text, n = 60) {
  const t = cleanEncryptedText(text);
  if (!t) return 'لا توجد رسائل بعد';
  return t.length > n ? `${t.slice(0, n)}…` : t;
}

function formatTime(ts) {
  if (!ts) return '';
  try {
    const d = new Date(ts);
    return d.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

// إشارات محلية لاكتشاف الوسائط الإباحية بسرعة (قبل استدعاء الـ backend)
const NSFW_URL_HINTS = ['porn', 'xxx', 'sex', 'nsfw', 'nude', 'adult'];
function localNsfwHint(mediaUrl, text) {
  const url = String(mediaUrl || '').toLowerCase();
  const t = String(text || '').toLowerCase();
  for (const h of NSFW_URL_HINTS) {
    if (url.includes(h) || t.includes(h)) return true;
  }
  return false;
}

export default function AdminChat() {
  const [threads, setThreads] = useState([]);
  const [activeThread, setActiveThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [busyId, setBusyId] = useState(null); // معرف الرسالة/المستخدم قيد المعالجة
  const [nsfwMap, setNsfwMap] = useState({}); // messageId → { score, is_nsfw, reasons }
  const scannedRef = useRef(new Set()); // منع إعادة الفحص لنفس الرسالة
  const { pushToast } = useToast();

  const loadThreads = async () => {
    try {
      setLoading(true);
      const { data } = await getAdminChatThreads({ limit: 300 });
      const list = Array.isArray(data) ? data : (data?.items || []);
      setThreads(list);
    } catch {
      setThreads([]);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (thread) => {
    if (!thread?.id) return;
    try {
      const { data } = await getAdminChatThreadMessages(thread.id, { limit: 400 });
      const items = data?.items || data?.messages || [];
      setMessages(items);
      // ابدأ فحص NSFW لكل رسالة وسائط لم تُفحص بعد
      scheduleNsfwScan(items);
    } catch {
      setMessages([]);
    }
  };

  // فحص تلقائي للوسائط الإباحية — يستدعي /admin/chat/scan-nsfw لكل وسائط جديدة
  const scheduleNsfwScan = async (items) => {
    const targets = items.filter((m) => {
      const isMedia = m.type === 'media' || m.kind === 'media' || m.media_url;
      const key = String(m.id);
      if (!isMedia && !localNsfwHint(m.media_url, m.content)) return false;
      if (scannedRef.current.has(key)) return false;
      return true;
    });
    for (const m of targets) {
      const key = String(m.id);
      scannedRef.current.add(key);
      try {
        const { data } = await scanAdminChatNsfw({
          media_url: m.media_url || null,
          text: m.content || m.text || null,
          message_id: m.id,
        });
        setNsfwMap((prev) => ({
          ...prev,
          [key]: {
            score: data?.nsfw_score || 0,
            is_nsfw: Boolean(data?.is_nsfw),
            reasons: data?.reasons || [],
          },
        }));
        if (data?.is_nsfw) {
          pushToast({
            title: 'رُصد محتوى إباحي محتمل',
            description: `في رسالة #${m.id} — سكور ${data.nsfw_score}%`,
            type: 'warning',
          });
        }
      } catch {
        /* ignore individual scan errors */
      }
    }
  };

  useEffect(() => {
    loadThreads();
    const onAbuse = (payload) => {
      pushToast({
        title: 'تم رصد إساءة',
        description: `في محادثة مع ${payload?.user || 'مستخدم'}`,
        type: 'warning',
      });
      loadThreads();
    };
    socket.on('abuse_detected', onAbuse);
    return () => socket.off('abuse_detected', onAbuse);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- إجراءات المدير ----------
  const handleRestore = async (messageId) => {
    if (!messageId) return;
    setBusyId(`restore-${messageId}`);
    try {
      // v88.46 (النقطة 6): نستخدم النقطة الإدارية الموحّدة بدل نقطة المستخدم العادية
      await restoreAdminChatMessage(messageId, '');
      pushToast({ title: 'تمت استعادة الرسالة', type: 'success' });
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? { ...m, deleted: false, is_deleted: false }
            : m,
        ),
      );
    } catch (err) {
      pushToast({
        title: 'فشلت استعادة الرسالة',
        description: err?.response?.data?.detail || 'حاول مرة أخرى',
        type: 'error',
      });
    } finally {
      setBusyId(null);
    }
  };

  const handleDeleteMessage = async (msg) => {
    if (!msg?.id) return;
    if (!window.confirm(`هل تريد حذف الرسالة #${msg.id} نهائياً؟`)) return;
    const reason = window.prompt('سبب الحذف (اختياري):', '') || '';
    setBusyId(`msg-${msg.id}`);
    try {
      await deleteAdminChatMessage(msg.id, reason);
      pushToast({ title: 'تم حذف الرسالة', description: `#${msg.id}`, type: 'success' });
      setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, deleted: true } : m)));
    } catch (err) {
      pushToast({
        title: 'تعذر حذف الرسالة',
        description: err?.response?.data?.detail || 'حاول مرة أخرى',
        type: 'error',
      });
    } finally {
      setBusyId(null);
    }
  };

  const resolveUserId = async (username) => {
    // نستخدم البحث الإداري لإيجاد id للمستخدم
    if (!username) return null;
    try {
      const { getAdminUsers } = await import('../../api/admin.js');
      const { data } = await getAdminUsers({ q: username, limit: 5 });
      const arr = data?.items || data?.users || (Array.isArray(data) ? data : []);
      const match = arr.find((u) => u.username === username) || arr[0];
      return match?.id || null;
    } catch {
      return null;
    }
  };

  const handleMuteUser = async (username) => {
    if (!username) return;
    const durationStr = window.prompt(
      `مدة الكتم بالدقائق (اتركها فارغة = 30 يوم افتراضياً) — @${username}`,
      '60',
    );
    if (durationStr === null) return;
    const duration_minutes = durationStr.trim() ? Number(durationStr.trim()) : null;
    if (durationStr.trim() && (Number.isNaN(duration_minutes) || duration_minutes <= 0)) {
      pushToast({ title: 'مدة غير صالحة', type: 'error' });
      return;
    }
    const reason = window.prompt('سبب الكتم (اختياري):', '') || '';
    setBusyId(`mute-${username}`);
    const userId = await resolveUserId(username);
    if (!userId) {
      pushToast({ title: 'تعذر إيجاد المستخدم', description: `@${username}`, type: 'error' });
      setBusyId(null);
      return;
    }
    try {
      await muteAdminChatUser(userId, { muted: true, duration_minutes, reason });
      pushToast({
        title: 'تم كتم المستخدم عن الشات',
        description: `@${username}${duration_minutes ? ` لمدة ${duration_minutes} دقيقة` : ''}`,
        type: 'success',
      });
    } catch (err) {
      pushToast({
        title: 'تعذر كتم المستخدم',
        description: err?.response?.data?.detail || 'حاول مرة أخرى',
        type: 'error',
      });
    } finally {
      setBusyId(null);
    }
  };

  const handleBanUser = async (username) => {
    if (!username) return;
    if (!window.confirm(`هل تريد حظر المستخدم @${username} بالكامل؟`)) return;
    const reason = window.prompt('سبب الحظر (اختياري):', '') || '';
    setBusyId(`ban-${username}`);
    const userId = await resolveUserId(username);
    if (!userId) {
      pushToast({ title: 'تعذر إيجاد المستخدم', description: `@${username}`, type: 'error' });
      setBusyId(null);
      return;
    }
    try {
      await banAdminChatUser(userId, reason);
      pushToast({ title: 'تم حظر المستخدم', description: `@${username}`, type: 'success' });
      loadThreads();
    } catch (err) {
      pushToast({
        title: 'تعذر حظر المستخدم',
        description: err?.response?.data?.detail || 'حاول مرة أخرى',
        type: 'error',
      });
    } finally {
      setBusyId(null);
    }
  };

  const filteredThreads = useMemo(() => {
    if (!searchTerm.trim()) return threads;
    const q = searchTerm.trim().toLowerCase();
    return threads.filter((t) => {
      const name = (t.username || t.name || '').toLowerCase();
      const last = cleanEncryptedText(t.last_message || '').toLowerCase();
      const parts = (t.participants || []).join(',').toLowerCase();
      return name.includes(q) || last.includes(q) || parts.includes(q);
    });
  }, [threads, searchTerm]);

  const nsfwFlaggedCount = useMemo(
    () => Object.values(nsfwMap).filter((v) => v?.is_nsfw).length,
    [nsfwMap],
  );

  return (
    <AdminLayout>
      <div className="adm-chat" dir="rtl">
        {/* الشريط العلوي */}
        <div className="adm-chat-toolbar">
          <div className="adm-chat-toolbar-left">
            <div className="adm-chat-stat">
              <span className="adm-chat-stat-dot adm-chat-stat-dot-ok" />
              <strong>{threads.length}</strong>
              <span>محادثات نشطة</span>
            </div>
            <div className="adm-chat-stat">
              <span className="adm-chat-stat-dot adm-chat-stat-dot-warn" />
              <strong>{threads.filter((t) => t.flagged || (t.abuse_score || 0) > 50).length}</strong>
              <span>تحت المراقبة</span>
            </div>
            <div className="adm-chat-stat">
              <span className="adm-chat-stat-dot adm-chat-stat-dot-danger" />
              <strong>{nsfwFlaggedCount}</strong>
              <span>وسائط إباحية مرصودة</span>
            </div>
            <div className="adm-chat-stat">
              <span className="adm-chat-stat-dot adm-chat-stat-dot-info" />
              <strong>مفعّل</strong>
              <span>الإشراف الفوري + NSFW</span>
            </div>
          </div>
          <div className="adm-chat-toolbar-right">
            <input
              type="search"
              className="adm-chat-search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ابحث عن مستخدم أو محتوى رسالة..."
            />
          </div>
        </div>

        <div className="adm-chat-grid">
          {/* قائمة المحادثات */}
          <aside className="adm-chat-list-card">
            <div className="adm-chat-card-head">
              <h3>المحادثات النشطة</h3>
              <span className="adm-chat-count">{filteredThreads.length}</span>
            </div>
            <div className="adm-chat-thread-list">
              {loading ? (
                <div className="adm-chat-empty">جاري تحميل المحادثات...</div>
              ) : filteredThreads.length === 0 ? (
                <div className="adm-chat-empty">
                  {searchTerm ? 'لا نتائج مطابقة لبحثك' : 'لا توجد محادثات حالياً'}
                </div>
              ) : (
                filteredThreads.map((thread) => {
                  const isActive = activeThread?.id === thread.id;
                  const isFlagged = thread.flagged || (thread.abuse_score || 0) > 50;
                  const lastMsg = truncate(thread.last_message, 50);
                  return (
                    <button
                      type="button"
                      key={thread.id}
                      className={`adm-chat-thread ${isActive ? 'is-active' : ''} ${isFlagged ? 'is-flagged' : ''}`}
                      onClick={() => {
                        setActiveThread(thread);
                        loadMessages(thread);
                      }}
                    >
                      <div className="adm-chat-thread-avatar">
                        {(thread.username || '?').charAt(0).toUpperCase()}
                      </div>
                      <div className="adm-chat-thread-body">
                        <div className="adm-chat-thread-row">
                          <strong>{thread.username || 'مستخدم'}</strong>
                          {isFlagged ? <span className="adm-chat-flag">⚠</span> : null}
                          <span className="adm-chat-thread-time">{formatTime(thread.updated_at || thread.last_at)}</span>
                        </div>
                        <p className="adm-chat-thread-preview">{lastMsg}</p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </aside>

          {/* محتوى المحادثة */}
          <section className="adm-chat-main-card">
            {activeThread ? (
              <>
                <div className="adm-chat-card-head">
                  <div className="adm-chat-active-info">
                    <div className="adm-chat-active-avatar">
                      {(activeThread.username || '?').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3>{activeThread.username || 'مستخدم'}</h3>
                      <small>مراقبة فورية للمحادثة · كشف الإساءة والوسائط مفعّل</small>
                    </div>
                  </div>
                  <div className="adm-chat-active-actions">
                    <button
                      type="button"
                      className="adm-chat-btn ghost"
                      onClick={() => loadMessages(activeThread)}
                    >
                      تحديث
                    </button>
                    <button
                      type="button"
                      className="adm-chat-btn warn"
                      disabled={busyId === `mute-${activeThread.username}`}
                      onClick={() => handleMuteUser(activeThread.username)}
                    >
                      كتم المستخدم
                    </button>
                    <button
                      type="button"
                      className="adm-chat-btn danger"
                      disabled={busyId === `ban-${activeThread.username}`}
                      onClick={() => handleBanUser(activeThread.username)}
                    >
                      حظر
                    </button>
                  </div>
                </div>

                <div className="adm-chat-messages">
                  {messages.length === 0 ? (
                    <div className="adm-chat-empty">لا توجد رسائل في هذه المحادثة بعد.</div>
                  ) : (
                    messages.map((msg) => {
                      const isMedia = msg.type === 'media' || msg.kind === 'media' || msg.media_url;
                      const cleanText = cleanEncryptedText(msg.content || msg.text || msg.message || '');
                      const nsfwInfo = nsfwMap[String(msg.id)];
                      const isNsfw = nsfwInfo?.is_nsfw || (msg.nsfw_score || 0) >= 60;
                      const flagged = (msg.ai_score || 0) > 70 || isNsfw;
                      return (
                        <div
                          key={msg.id}
                          className={`adm-chat-msg ${msg.deleted ? 'is-deleted' : ''} ${flagged ? 'is-flagged' : ''} ${isNsfw ? 'is-nsfw' : ''}`}
                        >
                          <div className="adm-chat-msg-head">
                            <strong>{msg.sender || msg.from || activeThread.username}</strong>
                            <span className="adm-chat-msg-time">{formatTime(msg.created_at || msg.timestamp)}</span>
                            {msg.ai_score ? (
                              <span className={`adm-chat-msg-ai ${msg.ai_score > 70 ? 'high' : msg.ai_score > 40 ? 'mid' : 'low'}`}>
                                AI {msg.ai_score}%
                              </span>
                            ) : null}
                            {isNsfw ? (
                              <span className="adm-chat-msg-nsfw">
                                NSFW {nsfwInfo?.score ?? msg.nsfw_score ?? 0}%
                              </span>
                            ) : null}
                          </div>
                          <div className="adm-chat-msg-body">
                            {isMedia ? (
                              <div className="adm-chat-msg-media">
                                <span className="adm-chat-msg-media-icon">📎</span>
                                <span>
                                  {isNsfw ? 'وسائط بانتظار المراجعة (مشتبه إباحية)' : 'وسائط بانتظار المراجعة'}
                                </span>
                                {msg.media_url ? (
                                  <button
                                    type="button"
                                    className="adm-chat-link"
                                    onClick={() => window.open(msg.media_url, '_blank', 'noopener,noreferrer')}
                                  >
                                    عرض الأصل
                                  </button>
                                ) : null}
                              </div>
                            ) : (
                              <p>{cleanText || '— رسالة فارغة —'}</p>
                            )}

                            {/* أزرار الإجراء لكل رسالة */}
                            <div className="adm-chat-msg-actions">
                              {msg.deleted ? (
                                <button
                                  type="button"
                                  className="adm-chat-btn solid xs"
                                  disabled={busyId === `restore-${msg.id}`}
                                  onClick={() => handleRestore(msg.id)}
                                >
                                  {busyId === `restore-${msg.id}` ? 'جارٍ...' : 'استعادة'}
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  className="adm-chat-btn danger xs"
                                  disabled={busyId === `msg-${msg.id}`}
                                  onClick={() => handleDeleteMessage(msg)}
                                >
                                  {busyId === `msg-${msg.id}` ? 'جارٍ...' : 'حذف'}
                                </button>
                              )}
                              <button
                                type="button"
                                className="adm-chat-btn warn xs"
                                disabled={busyId === `mute-${msg.sender}`}
                                onClick={() => handleMuteUser(msg.sender || activeThread.username)}
                              >
                                كتم المُرسل
                              </button>
                              <button
                                type="button"
                                className="adm-chat-btn danger xs"
                                disabled={busyId === `ban-${msg.sender}`}
                                onClick={() => handleBanUser(msg.sender || activeThread.username)}
                              >
                                حظر
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            ) : (
              <div className="adm-chat-placeholder">
                <div className="adm-chat-placeholder-icon">💬</div>
                <h3>اختر محادثة لبدء المراقبة</h3>
                <p>الإشراف الفوري على الإساءات وفحص الوسائط الإباحية مُفعّل لكل المحادثات.</p>
                <ul className="adm-chat-placeholder-tips">
                  <li>اضغط على أي محادثة من القائمة الجانبية لعرض رسائلها.</li>
                  <li>الرسائل المُشار إليها بـ <em>⚠</em> تحتاج مراجعة سريعة.</li>
                  <li>الرسائل المُلوَّنة بالأحمر مع شارة <em>NSFW</em> رصدها الكاشف التلقائي.</li>
                  <li>تقدر تحذف رسالة أو تكتم/تحظر مُرسلها مباشرة من الأزرار في كل رسالة.</li>
                </ul>
              </div>
            )}
          </section>
        </div>
      </div>

      <style>{`
        .adm-chat {
          font-family: 'Noto Sans Arabic', system-ui, sans-serif;
          color: #e2e8f0;
          padding: 0;
          margin: 0;
          direction: rtl;
          display: flex;
          flex-direction: column;
          gap: 8px;
          width: 100%;
          min-height: 0;
          height: 100%;
        }
        .adm-chat *, .adm-chat *::before, .adm-chat *::after { box-sizing: border-box; }

        .adm-chat-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 8px 10px;
          background: linear-gradient(180deg, #131a33, #0f152a);
          border: 1px solid rgba(148,163,184,0.10);
          border-radius: 12px;
        }
        .adm-chat-toolbar-left {
          display: flex;
          flex-wrap: wrap;
          gap: 14px;
          align-items: center;
        }
        .adm-chat-stat {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          color: #cbd5e1;
        }
        .adm-chat-stat strong {
          color: #f8fafc;
          font-size: 13px;
          font-weight: 800;
        }
        .adm-chat-stat-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          display: inline-block;
        }
        .adm-chat-stat-dot-ok     { background: #10b981; box-shadow: 0 0 8px #10b981; }
        .adm-chat-stat-dot-warn   { background: #f59e0b; box-shadow: 0 0 8px #f59e0b; }
        .adm-chat-stat-dot-info   { background: #8b5cf6; box-shadow: 0 0 8px #8b5cf6; }
        .adm-chat-stat-dot-danger { background: #ef4444; box-shadow: 0 0 8px #ef4444; }

        .adm-chat-search {
          width: 280px;
          max-width: 100%;
          height: 32px;
          padding: 0 12px;
          border-radius: 8px;
          border: 1px solid rgba(148,163,184,0.18);
          background: rgba(15,23,42,0.55);
          color: #e2e8f0;
          font-size: 12px;
          font-family: inherit;
          outline: none;
        }
        .adm-chat-search::placeholder { color: #64748b; }
        .adm-chat-search:focus {
          border-color: rgba(139,92,246,0.55);
          background: rgba(15,23,42,0.85);
        }

        .adm-chat-grid {
          display: grid;
          grid-template-columns: minmax(260px, 320px) 1fr;
          gap: 8px;
          flex: 1;
          min-height: 0;
        }
        @media (max-width: 920px) {
          .adm-chat-grid { grid-template-columns: 1fr; }
        }

        .adm-chat-list-card, .adm-chat-main-card {
          background: linear-gradient(180deg, #131a33, #0f152a);
          border: 1px solid rgba(148,163,184,0.10);
          border-radius: 12px;
          display: flex;
          flex-direction: column;
          min-height: 0;
          overflow: hidden;
        }
        .adm-chat-card-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding: 10px 12px;
          border-bottom: 1px solid rgba(148,163,184,0.10);
          flex-shrink: 0;
        }
        .adm-chat-card-head h3 {
          margin: 0;
          color: #f8fafc;
          font-size: 13px;
          font-weight: 800;
        }
        .adm-chat-count {
          background: rgba(139,92,246,0.15);
          color: #a78bfa;
          font-size: 11px;
          font-weight: 800;
          padding: 2px 8px;
          border-radius: 999px;
        }

        .adm-chat-thread-list {
          flex: 1;
          min-height: 0;
          overflow-y: auto;
          padding: 6px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          scrollbar-width: thin;
          scrollbar-color: rgba(139,92,246,0.55) transparent;
        }
        .adm-chat-thread-list::-webkit-scrollbar { width: 6px; }
        .adm-chat-thread-list::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, rgba(139,92,246,0.7), rgba(99,102,241,0.7));
          border-radius: 5px;
        }
        .adm-chat-thread {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          padding: 8px;
          border-radius: 8px;
          border: 1px solid transparent;
          background: rgba(15,23,42,0.35);
          color: inherit;
          font-family: inherit;
          text-align: right;
          cursor: pointer;
          transition: background .15s ease, border-color .15s ease, transform .12s ease;
          width: 100%;
        }
        .adm-chat-thread:hover {
          background: rgba(139,92,246,0.08);
          border-color: rgba(139,92,246,0.30);
          transform: translateY(-1px);
        }
        .adm-chat-thread.is-active {
          background: rgba(139,92,246,0.16);
          border-color: rgba(139,92,246,0.50);
        }
        .adm-chat-thread.is-flagged {
          border-color: rgba(239,68,68,0.40);
          background: rgba(239,68,68,0.05);
        }
        .adm-chat-thread-avatar {
          width: 36px;
          height: 36px;
          flex-shrink: 0;
          border-radius: 50%;
          background: linear-gradient(135deg, #8b5cf6, #ec4899);
          color: #fff;
          font-weight: 800;
          font-size: 14px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .adm-chat-thread-body { flex: 1; min-width: 0; }
        .adm-chat-thread-row {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .adm-chat-thread-row strong {
          color: #f8fafc;
          font-size: 12px;
          font-weight: 700;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .adm-chat-thread-time {
          margin-inline-start: auto;
          color: #64748b;
          font-size: 10px;
          flex-shrink: 0;
        }
        .adm-chat-flag { color: #fbbf24; font-size: 11px; }
        .adm-chat-thread-preview {
          margin: 2px 0 0;
          color: #94a3b8;
          font-size: 10.5px;
          line-height: 1.35;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .adm-chat-active-info {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
        }
        .adm-chat-active-avatar {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: linear-gradient(135deg, #8b5cf6, #3b82f6);
          color: #fff;
          font-weight: 800;
          font-size: 14px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .adm-chat-active-info h3 {
          margin: 0;
          color: #f8fafc;
          font-size: 13px;
          font-weight: 800;
        }
        .adm-chat-active-info small {
          color: #94a3b8;
          font-size: 10.5px;
          display: block;
          margin-top: 2px;
        }
        .adm-chat-active-actions {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
        }

        .adm-chat-btn {
          height: 30px;
          padding: 0 12px;
          border-radius: 8px;
          font-size: 11px;
          font-weight: 700;
          font-family: inherit;
          cursor: pointer;
          border: 1px solid transparent;
          transition: background .15s ease, transform .1s ease;
        }
        .adm-chat-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .adm-chat-btn.xs { height: 24px; padding: 0 8px; font-size: 10.5px; border-radius: 6px; }
        .adm-chat-btn.ghost {
          background: rgba(148,163,184,0.10);
          color: #cbd5e1;
          border-color: rgba(148,163,184,0.20);
        }
        .adm-chat-btn.ghost:hover { background: rgba(148,163,184,0.18); }
        .adm-chat-btn.solid {
          background: linear-gradient(135deg, #8b5cf6, #6366f1);
          color: #fff;
        }
        .adm-chat-btn.solid:hover { filter: brightness(1.08); }
        .adm-chat-btn.warn {
          background: linear-gradient(135deg, #f59e0b, #ea580c);
          color: #fff;
        }
        .adm-chat-btn.warn:hover { filter: brightness(1.08); }
        .adm-chat-btn.danger {
          background: linear-gradient(135deg, #ef4444, #b91c1c);
          color: #fff;
        }
        .adm-chat-btn.danger:hover { filter: brightness(1.08); }

        .adm-chat-messages {
          flex: 1;
          min-height: 0;
          overflow-y: auto;
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          scrollbar-width: thin;
          scrollbar-color: rgba(139,92,246,0.55) transparent;
        }
        .adm-chat-messages::-webkit-scrollbar { width: 6px; }
        .adm-chat-messages::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, rgba(139,92,246,0.7), rgba(99,102,241,0.7));
          border-radius: 5px;
        }

        .adm-chat-msg {
          background: rgba(15,23,42,0.45);
          border: 1px solid rgba(148,163,184,0.10);
          border-radius: 10px;
          padding: 8px 10px;
          max-width: 92%;
        }
        .adm-chat-msg.is-deleted {
          opacity: 0.7;
          border-style: dashed;
          border-color: rgba(239,68,68,0.30);
        }
        .adm-chat-msg.is-flagged {
          border-color: rgba(239,68,68,0.45);
          background: rgba(239,68,68,0.06);
        }
        .adm-chat-msg.is-nsfw {
          border-color: rgba(220,38,38,0.65);
          background: rgba(220,38,38,0.10);
          box-shadow: 0 0 0 1px rgba(220,38,38,0.35);
        }
        .adm-chat-msg-head {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 4px;
          flex-wrap: wrap;
        }
        .adm-chat-msg-head strong {
          color: #f8fafc;
          font-size: 11px;
          font-weight: 700;
        }
        .adm-chat-msg-time { color: #64748b; font-size: 10px; }
        .adm-chat-msg-ai {
          margin-inline-start: auto;
          font-size: 9.5px;
          font-weight: 800;
          padding: 1px 6px;
          border-radius: 999px;
        }
        .adm-chat-msg-ai.low  { background: rgba(16,185,129,0.18); color: #34d399; }
        .adm-chat-msg-ai.mid  { background: rgba(234,179,8,0.18);  color: #fde047; }
        .adm-chat-msg-ai.high { background: rgba(239,68,68,0.18);  color: #fca5a5; }
        .adm-chat-msg-nsfw {
          font-size: 9.5px;
          font-weight: 800;
          padding: 1px 6px;
          border-radius: 999px;
          background: rgba(220,38,38,0.30);
          color: #fecaca;
          border: 1px solid rgba(220,38,38,0.55);
        }

        .adm-chat-msg-body p {
          margin: 0;
          color: #e2e8f0;
          font-size: 12px;
          line-height: 1.55;
          word-break: break-word;
        }
        .adm-chat-msg-media {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 10px;
          background: rgba(99,102,241,0.10);
          border: 1px dashed rgba(99,102,241,0.40);
          border-radius: 8px;
          color: #c7d2fe;
          font-size: 11px;
        }
        .adm-chat-msg-media-icon { font-size: 14px; }
        .adm-chat-link {
          background: transparent;
          border: none;
          color: #a78bfa;
          font-weight: 800;
          font-size: 11px;
          cursor: pointer;
          font-family: inherit;
          text-decoration: underline;
          padding: 0;
        }
        .adm-chat-msg-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 6px;
        }

        .adm-chat-placeholder {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 32px 20px;
          color: #cbd5e1;
        }
        .adm-chat-placeholder-icon {
          font-size: 42px;
          margin-bottom: 10px;
          opacity: 0.85;
          filter: drop-shadow(0 4px 12px rgba(139,92,246,0.4));
        }
        .adm-chat-placeholder h3 {
          margin: 0 0 6px;
          color: #f8fafc;
          font-size: 15px;
          font-weight: 800;
        }
        .adm-chat-placeholder p {
          margin: 0 0 14px;
          color: #94a3b8;
          font-size: 12px;
          max-width: 460px;
          line-height: 1.55;
        }
        .adm-chat-placeholder-tips {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 6px;
          font-size: 11.5px;
          color: #94a3b8;
          max-width: 460px;
          text-align: right;
        }
        .adm-chat-placeholder-tips li {
          padding: 6px 10px;
          background: rgba(148,163,184,0.06);
          border-radius: 8px;
          border-inline-end: 3px solid rgba(139,92,246,0.55);
        }
        .adm-chat-placeholder-tips em {
          color: #fbbf24;
          font-style: normal;
          font-weight: 800;
        }

        .adm-chat-empty {
          padding: 18px;
          text-align: center;
          color: #64748b;
          font-size: 11.5px;
        }

        .admin-page-shell-modern:has(.adm-chat) { overflow: hidden; }
      `}</style>
    </AdminLayout>
  );
}
