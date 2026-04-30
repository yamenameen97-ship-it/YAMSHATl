(() => {
  function escapeHTML(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function detectPlatform() {
    const ua = navigator.userAgent || '';
    const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isAndroid = /Android/i.test(ua);
    document.documentElement.classList.toggle('is-ios', isIOS);
    document.documentElement.classList.toggle('is-android', isAndroid);
    return isIOS ? 'ios' : isAndroid ? 'android' : 'web';
  }

  function socketOriginFromApiBase(apiBase) {
    try {
      return new URL(apiBase).origin;
    } catch (_) {
      return window.location.origin;
    }
  }
async function startLive(token, url) {
    try {
        const room = new LiveKit.Room();

        // الاتصال بالغرفة
        await room.connect(url, token);

        console.log("Connected to LiveKit room");

        // تشغيل الكاميرا
        const videoTrack = await LiveKit.createLocalVideoTrack();
        await room.localParticipant.publishTrack(videoTrack);

        // تشغيل المايك
        const audioTrack = await LiveKit.createLocalAudioTrack();
        await room.localParticipant.publishTrack(audioTrack);

        console.log("Live stream started successfully");

        // عرض الفيديو في الصفحة (اختياري)
        videoTrack.attach(document.getElementById("local-video"));

    } catch (error) {
        console.error("Live error:", error);
        alert("فشل تشغيل البث: " + error.message);
    }
}
  function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2400);
  }

  function renderComment(container, data) {
    if (!container || !data) return;
    const item = document.createElement('div');
    item.className = 'chat-msg';
    item.innerHTML = `<strong>${escapeHTML(data.user || data.username || 'مستخدم')}</strong>: ${escapeHTML(data.text || data.comment || '')}`;
    container.appendChild(item);
    container.scrollTop = container.scrollHeight;
  }

  function showFloatingHeart() {
    const heart = document.createElement('div');
    heart.className = 'heart';
    heart.innerHTML = '❤️';
    heart.style.right = `${20 + Math.floor(Math.random() * 90)}px`;
    document.body.appendChild(heart);
    setTimeout(() => heart.remove(), 2000);
  }

  function showFloatingGift(text) {
    const gift = document.createElement('div');
    gift.className = 'gift';
    gift.innerHTML = escapeHTML(text || 'هدية جديدة');
    document.body.appendChild(gift);
    setTimeout(() => gift.remove(), 3000);
  }

  async function syncPresence({ apiBase, roomId, isHost = false, socketId = '', deviceType = 'browser' }) {
    if (!window.requestJSON || !roomId) return null;
    return window.requestJSON(`${apiBase}/live_presence`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        room_id: roomId,
        socket_id: typeof socketId === 'function' ? socketId() : socketId,
        platform: detectPlatform(),
        device_type: deviceType,
        is_host: isHost,
        active: true,
      }),
    }).catch(() => null);
  }

  function startPresenceLoop(options) {
    let timer = null;
    const tick = () => syncPresence(options).then(result => {
      if (result && typeof options.onPresence === 'function') options.onPresence(result);
    });
    tick();
    timer = setInterval(tick, options.interval || 15000);
    return () => timer && clearInterval(timer);
  }

  window.LiveFix = {
    escapeHTML,
    detectPlatform,
    socketOriginFromApiBase,
    showToast,
    renderComment,
    showFloatingHeart,
    showFloatingGift,
    syncPresence,
    startPresenceLoop,
  };
})();
