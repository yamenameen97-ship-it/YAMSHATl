(() => {

  function escapeHTML(v) {
    return String(v || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function detectPlatform() {
    const ua = navigator.userAgent || '';
    if (/Android/i.test(ua)) return 'android';
    if (/iPhone|iPad|iPod/i.test(ua)) return 'ios';
    return 'web';
  }

  function showToast(msg) {
    const t = document.createElement('div');
    t.textContent = msg;
    t.style = "position:fixed;bottom:20px;right:20px;background:#000;color:#fff;padding:10px 14px;border-radius:10px;z-index:99999";
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2500);
  }

  async function startLive(token, url) {
    try {
      const room = new LiveKit.Room();

      await room.connect(url, token);

      const video = await LiveKit.createLocalVideoTrack();
      await room.localParticipant.publishTrack(video);

      const audio = await LiveKit.createLocalAudioTrack();
      await room.localParticipant.publishTrack(audio);

      const el = document.getElementById("local-video");
      if (el) video.attach(el);

      showToast("بدأ البث بنجاح ✔");

    } catch (e) {
      console.error(e);
      showToast("فشل تشغيل البث");
    }
  }

  window.LiveFix = {
    detectPlatform,
    escapeHTML,
    showToast,
    startLive
  };

})();
