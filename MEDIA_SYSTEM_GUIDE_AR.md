# 🎵 نظام الوسائط المتكامل ليام شات — دليل الاستخدام

تم بناء طبقة Media System كاملة (أصوات + فيديو + ريلز + إعدادات) داخل الفرونت إند مع ربط بالأحداث.

---

## 1. الملفات المضافة

### الخدمات (Services)
```
src/services/audio/audioService.js         ← محرك الأصوات المركزي
src/services/audio/mediaEventBridge.js     ← ربط الأصوات بأحداث الشات/الإشعارات/السوكت
src/services/audio/index.js
src/services/video/videoService.js         ← محرك الفيديو (HLS + إدارة فيديو واحد نشط)
src/services/video/index.js
```

### المكونات (Components)
```
src/components/video/UniversalPlayer.jsx   ← مشغل موحد لـ post / reel / live
src/components/video/ReelsPlayer.jsx       ← حاوية ريلز مع scroll-snap + preload
src/components/video/index.js
src/components/audio/SoundToggle.jsx       ← زر كتم/تفعيل سريع
src/components/audio/SoundSettingsPanel.jsx← لوحة إعدادات الأصوات الكاملة
src/components/audio/index.js
src/components/media/VideoPlayer.jsx       ← (مُصلَّح) أصبح wrapper حول UniversalPlayer
```

### Hooks
```
src/hooks/media/useAudio.js                ← Hook للأصوات
src/hooks/media/useVideo.js                ← Hook للفيديو
```

### ملفات الصوت (Public)
```
public/sounds/messages/   {received, sent, seen, failed}.mp3
public/sounds/notifications/ {like, comment, follow, mention, friend_request, generic, viewer_join, gift}.mp3
public/sounds/calls/      {voice_ring, video_ring, waiting, end, live_start, live_end}.mp3
public/sounds/typing/     {click}.mp3
public/sounds/system/     {open, back, refresh, success, error}.mp3
```
كل الأصوات مولدة احترافياً (synthesis) — قصيرة، منخفضة، غير مزعجة.

---

## 2. كيف يعمل النظام

### المحرك الصوتي (`audioService.js`)
- **Preload + Cache**: يحمّل كل الأصوات إلى `AudioBuffer` بمجرد أول تفاعل للمستخدم.
- **User Interaction Unlock**: يحل مشكلة autoplay policy تلقائياً.
- **Debounce**: يمنع تكرار نفس الصوت بسرعة (مثلاً عند وصول 10 رسائل بنفس الثانية).
- **Queue**: الأصوات التي تأتي قبل الـ unlock تُحفظ ثم تُشغَّل.
- **Volume + Mute + Vibration + Night Mode**: محفوظة في `localStorage`.

### مفاتيح الـ API الرئيسية
```js
import audioService from '@/services/audio/audioService.js';
import useAudio from '@/hooks/media/useAudio.js';

// مباشرة
audioService.play('msg_received');
audioService.startIncomingCall(true);  // video=true
audioService.stopIncomingCall();
audioService.onNotification('like');

// داخل مكون React
const { onNotification, settings, setEnabled } = useAudio();
```

### الربط التلقائي (`mediaEventBridge.js`)
تم تفعيله من داخل `main.jsx`. يستمع لـ:
- `chatBus`: `message:received`, `message:sent`, `message:seen`, `typing`, `call:incoming`, `call:ended`
- `socketManager.socket`: `notification`, `notification:like`, `notification:comment`, `notification:follow`, `notification:mention`, `notification:friend_request`, `live:started`, `live:ended`, `live:viewer_joined`, `live:gift`, `call:*`
- `notificationStore`: يكتشف وصول إشعار جديد تلقائياً

**ما عليك سوى أن تُصدر أحداث `chatBus` من منطق الشات الحالي** (`emitChatBus('message:received', { peer })`) وسيُشغَّل الصوت تلقائياً.

---

## 3. الفيديو الموحد

### استخدام في منشور (post)
```jsx
import { UniversalPlayer } from '@/components/video';

<UniversalPlayer src={post.videoUrl} poster={post.thumbnail} variant="post" />
```

### استخدام في الريلز
```jsx
import { ReelsPlayer } from '@/components/video';

<ReelsPlayer
  reels={reels}
  onLike={handleLike}
  onComment={handleComment}
  onShare={handleShare}
  renderOverlay={(reel) => (
    <div style={{ padding: 16, color: '#fff' }}>
      <strong>@{reel.author}</strong>
      <div>{reel.caption}</div>
    </div>
  )}
/>
```

**ميزات Reels تلقائياً**: scroll-snap عمودي، preload للفيديو التالي، تشغيل/إيقاف ذكي حسب الظهور، double-tap like، mute toggle.

### استخدام في البث المباشر (live)
```jsx
<UniversalPlayer
  src="https://live.yamshat.com/stream.m3u8"
  variant="live"
  qualities={[
    { label: 'Auto', url: stream.master },
    { label: '720p', url: stream.hd },
    { label: '480p', url: stream.sd },
  ]}
/>
```
- HLS.js يُحمَّل **ديناميكياً** عند الحاجة.
- على Safari/iOS يستخدم HLS الأصلي تلقائياً.

---

## 4. صفحة إعدادات الأصوات

أضفنا تبويب **"الأصوات"** داخل `/settings`:
- مفتاح رئيسي On/Off
- شريط مستوى الصوت
- اهتزاز
- الوضع الليلي (خفض تلقائي 22:00 - 07:00)
- تفعيل/تعطيل كل فئة (رسائل، إشعارات، مكالمات، كتابة، نظام)
- اختيار نغمة رنين (صوتية + فيديو) مع زر تجربة
- معاينة سريعة لكل صوت

---

## 5. الـ Backend المطلوب (مرجع للفريق)

النظام يعمل بالكامل في الفرونت، لكن للاحترافية الكاملة:

| المسار | الوظيفة |
|--------|---------|
| `POST /api/users/me/audio-settings` | حفظ إعدادات الأصوات على السحابة (sync بين الأجهزة) |
| `GET /api/users/me/audio-settings` | استرجاع الإعدادات |
| `POST /api/media/video/upload` | رفع فيديو |
| `POST /api/media/video/transcode` | تحويل إلى HLS متعدد الجودة |
| `GET /api/media/video/:id/manifest` | تسليم master.m3u8 |
| `GET /api/media/video/:id/thumbnail` | thumbnail preloading |
| `POST /api/live/start` / `/end` | بدء/إنهاء بث (يطلق `live:*` socket events) |

---

## 6. التركيب والتشغيل

```bash
cd frontend
npm install        # سيُحمّل hls.js تلقائياً
npm run dev
```

تم إضافة `hls.js@^1.5.15` إلى `package.json`. إذا لم يُحمَّل، النظام يستخدم HLS الأصلي للمتصفح (يعمل على Safari/iOS بدون مشاكل).

---

## 7. خريطة الأحداث ↔ الأصوات

| الحدث | الصوت | الفئة |
|------|------|------|
| استلام رسالة | `msg_received` | messages |
| إرسال رسالة | `msg_sent` | messages |
| رسالة مقروءة (Seen) | `msg_seen` | messages |
| فشل إرسال | `msg_failed` | messages |
| typing | `typing_click` | typing |
| إعجاب | `notif_like` | notifications |
| تعليق | `notif_comment` | notifications |
| متابعة | `notif_follow` | notifications |
| منشن | `notif_mention` | notifications |
| طلب صداقة | `notif_friend_req` | notifications |
| مكالمة واردة (صوت) | `ring_voice` (loop) | calls |
| مكالمة واردة (فيديو) | `ring_video` (loop) | calls |
| إنهاء مكالمة | `call_end` | calls |
| بدء بث | `live_start` | calls |
| انتهاء بث | `live_end` | calls |
| دخول مشاهد | `notif_viewer_join` | notifications |
| هدية في البث | `notif_gift` | notifications |

---

## 8. ما تم إصلاحه أيضاً

- ✅ `src/components/media/VideoPlayer.jsx` كان مكسوراً (كل الكود في سطر واحد بـ `\n` حرفياً) — أُعيد بناؤه ك‍ wrapper نظيف فوق `UniversalPlayer`.

---

## 9. ملاحظات للأداء

- جميع الأصوات `~1-3KB` لكل ملف (synth + MP3 q=5).
- HLS.js يُحمَّل lazy عند ظهور أول فيديو HLS.
- `videoService` يضمن أن **فيديو واحد فقط** يعمل في كل لحظة → توفير CPU/شبكة.
- `ReelsPlayer` يستخدم `IntersectionObserver` → بدون polling.

نظام نظيف، قابل للتوسعة، وجاهز للإنتاج 🚀
