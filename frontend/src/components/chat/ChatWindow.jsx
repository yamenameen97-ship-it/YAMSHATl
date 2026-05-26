import { memo, useCallback, useEffect, useMemo, useState } from 'react';

/**
 * ChatWindow
 * ----------
 * - يستخدم svh/dvh عبر classes من mobile-first.css (لا inline height: 100%)
 * - overflow بأمان: messages-scroll-area تحتوي flex:1 + min-height:0
 * - context menu يُغلق على scroll / resize / Escape (تجربة لمس أفضل)
 * - handlers مستقرّون عبر useCallback لتقليل rerenders
 */
function ChatWindow({
  messages,
  loading,
  loadingMore,
  searchQuery,
  typing,
  typingNode,
  language,
  currentUser,
  shouldVirtualize,
  scrollRef,
  topSentinelRef,
  bottomRef,
  onReply,
  onForward,
  onDeleteForEveryone,
  onToggleReaction,
  onOpenMediaViewer,
}) {
  const [contextMenu, setContextMenu] = useState(null);
  const [pinnedMessages, setPinnedMessages] = useState([]);
  const [activeThread, setActiveThread] = useState(null);

  const closeContextMenu = useCallback(() => setContextMenu(null), []);

  useEffect(() => {
    if (!contextMenu) return undefined;
    const closeOnEsc = (event) => {
      if (event.key === 'Escape') closeContextMenu();
    };
    window.addEventListener('click', closeContextMenu);
    window.addEventListener('scroll', closeContextMenu, true);
    window.addEventListener('resize', closeContextMenu);
    window.addEventListener('keydown', closeOnEsc);
    return () => {
      window.removeEventListener('click', closeContextMenu);
      window.removeEventListener('scroll', closeContextMenu, true);
      window.removeEventListener('resize', closeContextMenu);
      window.removeEventListener('keydown', closeOnEsc);
    };
  }, [contextMenu, closeContextMenu]);

  // إشعار body لإخفاء bottom-nav أثناء الدردشة (CSS handles the rest)
  useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    document.body.classList.add('is-chat-open');
    return () => document.body.classList.remove('is-chat-open');
  }, []);

  const handlePinMessage = useCallback((message) => {
    setPinnedMessages((prev) => (
      prev.find((m) => m.id === message.id) ? prev : [...prev, message]
    ));
    setContextMenu(null);
  }, []);

  const handleClearPinned = useCallback(() => setPinnedMessages([]), []);

  const handleCloseThread = useCallback(() => setActiveThread(null), []);

  const handleContextMenu = useCallback((event, message) => {
    event.preventDefault();
    // على iOS clientX/clientY قد لا تكون متاحة من touch — استخدم البديل
    const x = event.clientX ?? event.touches?.[0]?.clientX ?? 0;
    const y = event.clientY ?? event.touches?.[0]?.clientY ?? 0;
    setContextMenu({ x, y, message });
  }, []);

  const handleReplyClick = useCallback(() => {
    if (contextMenu?.message) onReply?.(contextMenu.message);
    setContextMenu(null);
  }, [contextMenu, onReply]);

  const handleForwardClick = useCallback(() => {
    if (contextMenu?.message) onForward?.(contextMenu.message);
    setContextMenu(null);
  }, [contextMenu, onForward]);

  const handlePinClick = useCallback(() => {
    if (contextMenu?.message) handlePinMessage(contextMenu.message);
  }, [contextMenu, handlePinMessage]);

  const handleDeleteClick = useCallback(() => {
    if (contextMenu?.message) onDeleteForEveryone?.(contextMenu.message);
    setContextMenu(null);
  }, [contextMenu, onDeleteForEveryone]);

  const lastPinned = pinnedMessages[pinnedMessages.length - 1];

  const renderMessage = useCallback((message) => {
    const isMine = message.sender === currentUser;

    return (
      <div
        key={message.id}
        className={`message-row ${isMine ? 'mine' : 'other'}`}
        onContextMenu={(event) => handleContextMenu(event, message)}
      >
        <div className={`message-bubble ${isMine ? 'mine' : ''}`}>
          {message.replyTo && (
            <div className="reply-thread-preview">
              <div className="reply-sender">{message.replyTo.sender}</div>
              <div className="muted">{message.replyTo.text?.slice(0, 50)}...</div>
            </div>
          )}

          {message.type === 'image' && message.media_url && (
            <div className="smart-media-preview">
              <img
                src={message.media_url}
                alt="preview"
                loading="lazy"
                decoding="async"
                onClick={() => onOpenMediaViewer?.(message)}
              />
            </div>
          )}

          <div className="message-text">{message.text}</div>

          <div className="message-meta">
            <span className="muted">{message.time}</span>
            {isMine && <span className="status">✓✓</span>}
          </div>
        </div>
      </div>
    );
  }, [currentUser, handleContextMenu, onOpenMediaViewer]);

  return (
    <div className="chat-window-container">
      {pinnedMessages.length > 0 && (
        <div className="pinned-messages-bar">
          <div className="pinned-row">
            <span aria-hidden="true">📌</span>
            <div className="pinned-text">
              <strong>رسالة مثبتة:</strong> {lastPinned?.text?.slice(0, 40)}...
            </div>
          </div>
          <button
            type="button"
            className="pinned-close"
            onClick={handleClearPinned}
            aria-label="إلغاء التثبيت"
          >
            ✕
          </button>
        </div>
      )}

      <div className="messages-scroll-area" ref={scrollRef}>
        <div ref={topSentinelRef} />
        {messages.map(renderMessage)}
        {typing && typingNode}
        <div ref={bottomRef} />
      </div>

      {contextMenu && (
        <div
          className="context-menu"
          style={{
            position: 'fixed',
            top: contextMenu.y,
            left: contextMenu.x,
          }}
          role="menu"
        >
          <button type="button" onClick={handleReplyClick} role="menuitem">رد</button>
          <button type="button" onClick={handleForwardClick} role="menuitem">تحويل</button>
          <button type="button" onClick={handlePinClick} role="menuitem">تثبيت 📌</button>
          <button type="button" onClick={handleDeleteClick} role="menuitem" className="danger">حذف للجميع</button>
        </div>
      )}

      {activeThread && (
        <div className="thread-overlay">
          <div className="thread-header">
            <h3>سلسلة الردود</h3>
            <button type="button" onClick={handleCloseThread}>إغلاق</button>
          </div>
          <div className="thread-body" />
        </div>
      )}
    </div>
  );
}

export default memo(ChatWindow);
