import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import MainLayout from '../components/layout/MainLayout.jsx';
import { useToast } from '../components/admin/ToastProvider.jsx';
import {
  addLiveComment,
  createLiveRoom,
  endLiveRoom,
  getLiveComments,
  getLiveRoom,
  getLiveRooms,
  getLiveToken,
  sendLiveGift,
  triggerLiveRecovery,
  updateLiveRecording,
} from '../api/live.js';
import socketManager from '../services/socketManager.js';
import { getCurrentUsername } from '../utils/auth.js';
import { avatarGradient, formatTimeAgo, initialsFromName } from '../components/yamshat/YamshatDesign.js';

const GIFTS = [
  { id: 1, name: 'وردة', icon: '🌹', price: 10 },
  { id: 2, name: 'قهوة', icon: '☕', price: 50 },
  { id: 3, name: 'قلب كبير', icon: '💜', price: 100 },
  { id: 4, name: 'نجمة', icon: '⭐', price: 250 },
  { id: 5, name: 'تاج', icon: '👑', price: 1000 },
];

const ROOM_FILTERS = [
  { key: 'all', label: 'الكل' },
  { key: 'active', label: 'النشطة' },
  { key: 'mine', label: 'الخاصة بي' },
  { key: 'ready', label: 'جاهزة للبث' },
];

function Avatar({ name = '', src, size = 42, ring = false }) {
  const style = {
    width: size,
    height: size,
    borderRadius: '50%',
    objectFit: 'cover',
    flexShrink: 0,
    border: ring ? '2px solid rgba(239,68,68,0.88)' : 'none',
    boxShadow: ring ? '0 0 0 4px rgba(239,68,68,0.12)' : 'none',
  };
  return src
    ? <img src={src} alt={name} style={style} />
    : <div style={{ ...style, display: 'grid', placeItems: 'center', color: 'white', fontWeight: 900, background: avatarGradient(name) }}>{initialsFromName(name).slice(0, 1)}</div>;
}

function FloatingHearts({ items }) {
  const latestComments = [...comments].slice(-6).reverse();
  const consoleStatCards = [
    { key: 'viewers', icon: '👁️', label: 'المشاهدون', value: viewerCount || 0, accent: 'purple' },
    { key: 'likes', icon: '💜', label: 'الإعجابات', value: heartsCount || 0, accent: 'pink' },
    { key: 'gifts', icon: '🎁', label: 'الهدايا', value: currentPot || 0, accent: 'gold' },
    { key: 'duration', icon: '⏱️', label: 'حالة البث', value: joinedRole ? 'متصل الآن' : 'جاهز', accent: 'blue' },
  ];
  const serviceStatusCards = [
    { label: 'قاعدة البيانات', value: activeRoom?.id ? 'مرتبطة' : 'غير مرتبطة' },
    { label: 'LiveKit', value: streamReady ? 'مفعّل' : 'ينتظر الإعداد' },
    { label: 'الاتصال', value: connectionLabel },
    { label: 'الوسائط', value: mediaStatus },
  ];

  return (
    <MainLayout>
      <div className="yam-console-page desktop-post mobile-post">
        <div className="yam-console-header">
          <div className="yam-console-header-copy">
            <div className="yam-console-page-kicker">أنت الآن مباشر</div>
            <h1>تحكم البث المباشر</h1>
            <p>تصميم موحد ومضغوط للبث على الويب والويب للجوال وتطبيق الموبايل بدون تشتت للأزرار أو تمدد مبالغ فيه للصفحات.</p>
          </div>
          <div className="yam-console-header-actions">
            <button type="button" className="yam-console-live-pill">● مباشر</button>
            <button type="button" className="yam-console-icon-btn" onClick={loadRooms} title="تحديث البيانات">↻</button>
            <button type="button" className="yam-console-icon-btn" onClick={handleShare} title="مشاركة رابط البث">⋯</button>
          </div>
        </div>

        <div className="yam-console-layout">
          <div className="yam-console-main-column">
            <div className="yam-console-hero-grid">
              <section className="yam-console-stage-card">
                <FloatingHearts items={floatingHearts} />
                <div className="yam-console-stage-glow" />

                <div className="yam-console-stage-media">
                  <div className="yam-console-stage-overlay-top">
                    <div className="yam-console-live-metrics-inline">
                      <span className="yam-console-inline-badge live">LIVE</span>
                      <span className="yam-console-inline-badge">👁 {viewerCount}</span>
                    </div>
                    <button
                      type="button"
                      className="yam-console-overlay-edit"
                      onClick={() => {
                        if (activeRoom?.id) loadRoomDetails(activeRoom.id);
                      }}
                    >
                      ✎
                    </button>
                  </div>

                  <video ref={remoteVideoRef} className={`yam-console-main-video ${joinedRole === 'viewer' ? 'visible' : ''}`} playsInline autoPlay controls={false} />
                  <video ref={previewVideoRef} className={`yam-console-preview-video ${hasPreview ? 'visible' : ''} ${joinedRole === 'host' ? 'host-mode' : ''}`} playsInline muted autoPlay />

                  {joinedRole === 'viewer' && remoteParticipantName ? (
                    <div className="yam-console-remote-pill">البث من {remoteParticipantName}</div>
                  ) : null}

                  {!joinedRole ? (
                    <div className="yam-console-empty-stage">
                      <div className="yam-console-empty-icon">🎥</div>
                      <h2>{activeRoom?.title || 'بث مباشر مميز'}</h2>
                      <p>المضيف: <strong>{hostName}</strong></p>
                      <span>تكامل LiveKit • تعليقات لحظية • غرفة بث مرتبطة بالخادم</span>
                    </div>
                  ) : null}

                  <button
                    type="button"
                    className="yam-console-overlay-cta"
                    onClick={() => {
                      if (activeRoom?.id) loadRoomDetails(activeRoom.id);
                    }}
                  >
                    تحديث المعاينة
                  </button>
                </div>
              </section>

              <section className="yam-console-card yam-console-stats-card">
                <div className="yam-console-card-head">
                  <strong>إحصائيات البث</strong>
                  <span>LIVE</span>
                </div>
                <div className="yam-console-stat-stack">
                  {consoleStatCards.map((item) => (
                    <div key={item.key} className={`yam-console-stat-row ${item.accent}`}>
                      <div className="yam-console-stat-icon">{item.icon}</div>
                      <div className="yam-console-stat-copy">
                        <strong>{item.value}</strong>
                        <span>{item.label}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <section className="yam-console-card yam-console-quick-actions-card">
              <div className="yam-console-quick-grid">
                {isHost ? (
                  <button type="button" className="yam-console-quick-btn danger" onClick={stopLive}>
                    <span>⏹</span>
                    <strong>إيقاف البث</strong>
                  </button>
                ) : (
                  <button
                    type="button"
                    className="yam-console-quick-btn primary"
                    onClick={() => connectToLiveKit('viewer')}
                    disabled={busy === 'connect-livekit'}
                  >
                    <span>▶</span>
                    <strong>دخول المشاهدة</strong>
                  </button>
                )}

                <button type="button" className="yam-console-quick-btn" onClick={handleShare}>
                  <span>📤</span>
                  <strong>مشاركة البث</strong>
                </button>

                {isHost ? (
                  <button type="button" className="yam-console-quick-btn" onClick={toggleRecording}>
                    <span>{recordingStatus === 'recording' ? '⏺' : '●'}</span>
                    <strong>{recordingStatus === 'recording' ? 'إيقاف التسجيل' : 'بدء التسجيل'}</strong>
                  </button>
                ) : (
                  <button type="button" className="yam-console-quick-btn" onClick={sendHeart}>
                    <span>💜</span>
                    <strong>إرسال قلب</strong>
                  </button>
                )}

                {isHost ? (
                  <button type="button" className="yam-console-quick-btn" onClick={toggleCamera}>
                    <span>{cameraEnabled ? '📷' : '📷‍🚫'}</span>
                    <strong>{cameraEnabled ? 'الكاميرا' : 'تشغيل الكاميرا'}</strong>
                  </button>
                ) : (
                  <button
                    type="button"
                    className="yam-console-quick-btn"
                    onClick={() => document.getElementById('yam-console-rooms')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                  >
                    <span>📡</span>
                    <strong>غرف البث</strong>
                  </button>
                )}

                {isHost ? (
                  <button type="button" className="yam-console-quick-btn" onClick={toggleMic}>
                    <span>{microphoneEnabled ? '🎤' : '🔇'}</span>
                    <strong>{microphoneEnabled ? 'كتم الصوت' : 'فتح الصوت'}</strong>
                  </button>
                ) : (
                  <button
                    type="button"
                    className="yam-console-quick-btn"
                    onClick={() => {
                      setShowGiftTray((prev) => !prev);
                      setShowMobileCommentComposer(false);
                    }}
                  >
                    <span>🎁</span>
                    <strong>الهدايا</strong>
                  </button>
                )}

                {isHost ? (
                  <button
                    type="button"
                    className="yam-console-quick-btn primary"
                    onClick={() => connectToLiveKit('host')}
                    disabled={busy === 'connect-livekit'}
                  >
                    <span>📡</span>
                    <strong>{joinedRole === 'host' ? 'إعادة مزامنة البث' : 'بدء البث الحقيقي'}</strong>
                  </button>
                ) : (
                  <button
                    type="button"
                    className="yam-console-quick-btn"
                    onClick={() => document.getElementById('yam-console-chat')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                  >
                    <span>💬</span>
                    <strong>الرسائل</strong>
                  </button>
                )}
              </div>
            </section>

            <section className="yam-console-card yam-console-title-card">
              <div className="yam-console-card-head aligned-start">
                <div>
                  <div className="yam-console-section-label">عنوان البث</div>
                  <strong>{activeRoom?.title || `بث مباشر مع ${hostName}`}</strong>
                </div>
                <button type="button" className="yam-console-icon-btn" onClick={loadRooms} title="تحديث العنوان والبيانات">✎</button>
              </div>
              <div className="yam-console-title-meta">
                <div className="yam-console-host-inline">
                  <Avatar name={hostName} size={44} ring />
                  <div>
                    <strong>{hostName}</strong>
                    <span>{joinedRole === 'host' ? 'أنت تبث الآن' : joinedRole === 'viewer' ? 'أنت في وضع المشاهدة' : 'جاهز للانطلاق'}</span>
                  </div>
                </div>
                <div className="yam-console-service-pills">
                  <span className={`yam-console-service-pill ${streamReady ? 'good' : ''}`}>LiveKit {streamReady ? 'جاهز' : 'قيد الإعداد'}</span>
                  <span className={`yam-console-service-pill ${connectionLabel === 'متصل' ? 'good' : ''}`}>الاتصال {connectionLabel}</span>
                  <span className="yam-console-service-pill">التسجيل {recordingStatus}</span>
                </div>
              </div>
            </section>

            <div className="yam-console-dual-grid">
              <section className="yam-console-card yam-console-goal-card">
                <div className="yam-console-card-head">
                  <strong>هدف الهدايا</strong>
                  <span>{currentPot} / {goalTarget}</span>
                </div>
                <div className="yam-console-goal-progress">
                  <span style={{ width: `${goalPercent}%` }} />
                </div>
                <div className="yam-console-goal-footer">
                  <strong>{goalPercent}% مكتمل</strong>
                  <button type="button" className="yam-console-subtle-btn" onClick={() => setShowGiftTray((prev) => !prev)}>عرض الهدايا</button>
                </div>
                <div className="yam-console-supporters">
                  {topGifters.length ? topGifters.map(([name, coins]) => (
                    <span key={name} className="yam-console-support-pill">{name} • {coins}</span>
                  )) : <span className="yam-console-support-pill">لا يوجد داعمين بعد</span>}
                </div>
              </section>

              <section className="yam-console-card yam-console-health-card">
                <div className="yam-console-card-head">
                  <strong>حالة البث</strong>
                  <span>{healthScore}%</span>
                </div>
                <div className="yam-console-micro-grid">
                  <div className="yam-console-mini-stat">
                    <span>البت ريت</span>
                    <strong>{bitrate} kbps</strong>
                  </div>
                  <div className="yam-console-mini-stat">
                    <span>التأخير</span>
                    <strong>{latencyMs}ms</strong>
                  </div>
                  <div className="yam-console-mini-stat">
                    <span>آخر نشاط</span>
                    <strong>{activeRoom?.last_activity_at ? formatTimeAgo(activeRoom.last_activity_at) : 'الآن'}</strong>
                  </div>
                  <div className="yam-console-mini-stat">
                    <span>المضيفون</span>
                    <strong>{coHosts.length || 1}</strong>
                  </div>
                </div>
              </section>
            </div>

            <section id="yam-console-chat" className="yam-console-card yam-console-chat-card">
              <div className="yam-console-card-head">
                <strong>لوحة الرسائل</strong>
                <span>{comments.length} رسالة</span>
              </div>

              <div className="yam-console-chat-toolbar">
                <button type="button" className={`yam-console-chat-pill ${showGiftTray ? '' : 'active'}`} onClick={() => setShowGiftTray(false)}>الكل</button>
                <button type="button" className={`yam-console-chat-pill ${showGiftTray ? 'active' : ''}`} onClick={() => setShowGiftTray((prev) => !prev)}>الهدايا</button>
                <button type="button" className="yam-console-chat-pill" onClick={() => document.getElementById('yam-console-services')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>إعدادات الرسائل</button>
              </div>

              <div className="yam-console-chat-list">
                {latestComments.length ? latestComments.map((comment, index) => {
                  const author = comment.user || comment.username || 'عضو';
                  return (
                    <div key={comment.id || `${author}-${index}`} className="yam-console-message-row">
                      <Avatar name={author} size={42} />
                      <div className="yam-console-message-body">
                        <div className="yam-console-message-headline">
                          <strong>{author}</strong>
                          <span className="yam-console-level-badge">Lv {12 - index}</span>
                        </div>
                        <p>{comment.text}</p>
                      </div>
                      <span className="yam-console-message-time">الآن</span>
                    </div>
                  );
                }) : (
                  <div className="yam-console-empty-list">لا توجد رسائل بعد، ابدأ التفاعل من الشات المباشر.</div>
                )}
                <div ref={commentsEndRef} />
              </div>

              {showGiftTray ? (
                <div className="yam-console-gift-grid">
                  {GIFTS.map((gift) => (
                    <button key={gift.id} type="button" className="yam-console-gift-card" onClick={() => giveGift(gift)}>
                      <span>{gift.icon}</span>
                      <strong>{gift.name}</strong>
                      <small>{gift.price} عملة</small>
                    </button>
                  ))}
                </div>
              ) : null}

              <div className="yam-console-chat-composer">
                <input
                  value={commentText}
                  onChange={(event) => setCommentText(event.target.value)}
                  placeholder="اكتب تعليقك"
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') sendComment();
                  }}
                />
                <button type="button" onClick={sendComment}>إرسال</button>
              </div>
            </section>
          </div>

          <aside className="yam-console-side-column">
            <section id="yam-console-rooms" className="yam-console-card">
              <div className="yam-console-card-head">
                <strong>غرف البث</strong>
                <button type="button" className="yam-console-subtle-btn primary" onClick={handleCreateRoom} disabled={busy === 'create'}>+ إنشاء</button>
              </div>
              <div className="yam-console-room-tools">
                <input
                  className="yam-console-room-search"
                  value={roomQuery}
                  onChange={(event) => setRoomQuery(event.target.value)}
                  placeholder="ابحث عن بث أو مضيف"
                />
                <div className="yam-console-room-filters">
                  {ROOM_FILTERS.map((filter) => (
                    <button
                      key={filter.key}
                      type="button"
                      className={`yam-console-filter-chip ${roomFilter === filter.key ? 'active' : ''}`}
                      onClick={() => setRoomFilter(filter.key)}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
                <select className="yam-console-room-sort" value={roomSort} onChange={(event) => setRoomSort(event.target.value)}>
                  <option value="viewers">الأكثر مشاهدة</option>
                  <option value="newest">الأحدث</option>
                </select>
              </div>
              <div className="yam-console-room-list">
                {loadingRooms ? <div className="yam-console-empty-list">جارٍ تحميل الغرف...</div> : filteredRooms.length ? filteredRooms.map((room) => (
                  <button key={room.id} type="button" className={`yam-console-room-card ${activeRoom?.id === room.id ? 'active' : ''}`} onClick={() => setActiveRoom(room)}>
                    <div>
                      <strong>{room.title}</strong>
                      <p>@{room.host || room.username}</p>
                    </div>
                    <span>{room.viewer_count || 0} 👁</span>
                  </button>
                )) : <div className="yam-console-empty-list">لا توجد غرف مطابقة للفلاتر الحالية.</div>}
              </div>
            </section>

            <section className="yam-console-card">
              <div className="yam-console-card-head">
                <strong>المضيفون المشاركون</strong>
                <span>{coHosts.length || 1}</span>
              </div>
              <div className="yam-console-participants-list">
                {(coHosts.length ? coHosts : [hostName]).map((name) => (
                  <div key={name} className="yam-console-participant-row">
                    <Avatar name={name} size={40} />
                    <div>
                      <strong>{name}</strong>
                      <span>{name === hostName ? 'المضيف الرئيسي' : 'مضيف مشارك'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section id="yam-console-services" className="yam-console-card">
              <div className="yam-console-card-head">
                <strong>الخدمات والربط</strong>
                <span>{loadingRoom ? 'جارٍ الفحص' : 'جاهز'}</span>
              </div>
              <div className="yam-console-service-grid">
                {serviceStatusCards.map((item) => (
                  <div key={item.label} className="yam-console-service-box">
                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                  </div>
                ))}
              </div>
              <div className="yam-console-side-actions">
                <button type="button" className="yam-console-subtle-btn" onClick={loadRooms}>تحديث شامل</button>
                {joinedRole ? (
                  <button type="button" className="yam-console-subtle-btn" onClick={() => disconnectLiveSession({ keepPreview: false })}>فصل الاتصال</button>
                ) : null}
                <button type="button" className="yam-console-subtle-btn" onClick={sendHeart}>إرسال قلب</button>
                <button type="button" className="yam-console-subtle-btn" onClick={() => setShowGiftTray((prev) => !prev)}>فتح الهدايا</button>
              </div>
            </section>
          </aside>
        </div>

        <div className="yam-console-mobile-dock">
          <button type="button" className="yam-console-mobile-tab" onClick={handleShare}>
            <span>📤</span>
            <strong>مشاركة</strong>
          </button>
          <button type="button" className="yam-console-mobile-tab" onClick={() => document.getElementById('yam-console-rooms')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
            <span>👥</span>
            <strong>غرف</strong>
          </button>
          <button
            type="button"
            className="yam-console-mobile-tab center"
            onClick={() => {
              setShowGiftTray((prev) => !prev);
              setShowMobileCommentComposer(false);
            }}
          >
            <span>🎁</span>
            <strong>إرسال هدية</strong>
          </button>
          <button
            type="button"
            className={`yam-console-mobile-tab ${showMobileCommentComposer ? 'active' : ''}`}
            onClick={() => {
              setShowMobileCommentComposer((prev) => !prev);
              setShowGiftTray(false);
            }}
          >
            <span>💬</span>
            <strong>تعليق</strong>
          </button>
          <button type="button" className="yam-console-mobile-tab" onClick={() => document.getElementById('yam-console-services')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
            <span>⋯</span>
            <strong>المزيد</strong>
          </button>
        </div>

        {showMobileCommentComposer ? (
          <div className="yam-console-mobile-composer">
            <input
              value={commentText}
              onChange={(event) => setCommentText(event.target.value)}
              placeholder="اكتب تعليقك"
              onKeyDown={(event) => {
                if (event.key === 'Enter') sendComment();
              }}
            />
            <button type="button" onClick={sendComment}>إرسال</button>
          </div>
        ) : null}

        <style>{`
          .yam-console-page {
            min-height: 100%;
            padding: 18px 18px 120px;
            direction: rtl;
            color: #f8fafc;
            background:
              radial-gradient(circle at top right, rgba(139, 92, 246, 0.18), transparent 26%),
              radial-gradient(circle at top left, rgba(59, 130, 246, 0.12), transparent 22%),
              linear-gradient(180deg, #050816 0%, #090d1f 42%, #0b1020 100%);
          }
          .yam-console-header,
          .yam-console-card,
          .yam-console-stage-card {
            border: 1px solid rgba(255,255,255,0.08);
            background: rgba(10, 14, 30, 0.88);
            box-shadow: 0 22px 60px rgba(2, 6, 23, 0.4);
            backdrop-filter: blur(16px);
          }
          .yam-console-header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 16px;
            border-radius: 28px;
            padding: 20px 22px;
            margin-bottom: 18px;
          }
          .yam-console-page-kicker {
            color: #a78bfa;
            font-size: 13px;
            font-weight: 800;
            margin-bottom: 8px;
          }
          .yam-console-header-copy h1 {
            margin: 0;
            font-size: clamp(24px, 4vw, 34px);
          }
          .yam-console-header-copy p {
            margin: 8px 0 0;
            color: #94a3b8;
            max-width: 880px;
            line-height: 1.8;
          }
          .yam-console-header-actions {
            display: flex;
            align-items: center;
            gap: 10px;
            flex-wrap: wrap;
          }
          .yam-console-live-pill,
          .yam-console-icon-btn,
          .yam-console-subtle-btn,
          .yam-console-filter-chip,
          .yam-console-chat-pill,
          .yam-console-mobile-tab,
          .yam-console-overlay-edit,
          .yam-console-overlay-cta,
          .yam-console-room-card,
          .yam-console-gift-card,
          .yam-console-quick-btn,
          .yam-console-chat-composer button,
          .yam-console-mobile-composer button {
            border: none;
            transition: transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
            cursor: pointer;
          }
          .yam-console-live-pill {
            min-height: 42px;
            padding: 0 18px;
            border-radius: 999px;
            color: #fff;
            font-weight: 900;
            background: linear-gradient(135deg, #ef4444, #dc2626);
          }
          .yam-console-icon-btn {
            width: 42px;
            height: 42px;
            border-radius: 14px;
            color: #fff;
            background: rgba(255,255,255,0.08);
            font-size: 18px;
          }
          .yam-console-layout {
            display: grid;
            grid-template-columns: minmax(0, 1.45fr) minmax(300px, 0.75fr);
            gap: 18px;
            align-items: start;
          }
          .yam-console-main-column,
          .yam-console-side-column {
            display: grid;
            gap: 18px;
          }
          .yam-console-hero-grid {
            display: grid;
            grid-template-columns: minmax(0, 1fr) 290px;
            gap: 18px;
          }
          .yam-console-stage-card,
          .yam-console-card {
            border-radius: 28px;
            overflow: hidden;
          }
          .yam-console-card {
            padding: 18px;
          }
          .yam-console-card-head {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            margin-bottom: 14px;
          }
          .yam-console-card-head.aligned-start {
            align-items: flex-start;
          }
          .yam-console-card-head span,
          .yam-console-section-label,
          .yam-console-mini-stat span,
          .yam-console-service-box span,
          .yam-console-stat-copy span,
          .yam-console-participant-row span,
          .yam-console-host-inline span,
          .yam-console-room-card p,
          .yam-console-empty-list,
          .yam-console-empty-stage span,
          .yam-console-empty-stage p,
          .yam-console-message-time {
            color: #94a3b8;
          }
          .yam-console-section-label {
            margin-bottom: 6px;
            font-size: 12px;
            font-weight: 700;
          }
          .yam-console-stage-card {
            position: relative;
            padding: 14px;
            min-height: 430px;
          }
          .yam-console-stage-glow {
            position: absolute;
            inset: 0;
            background:
              radial-gradient(circle at top, rgba(139,92,246,0.24), transparent 42%),
              radial-gradient(circle at bottom left, rgba(59,130,246,0.14), transparent 35%);
            pointer-events: none;
            z-index: 0;
          }
          .yam-console-stage-media {
            position: relative;
            min-height: 400px;
            border-radius: 24px;
            overflow: hidden;
            background: linear-gradient(180deg, rgba(14, 18, 38, 0.9), rgba(6, 10, 24, 0.96));
            border: 1px solid rgba(255,255,255,0.08);
          }
          .yam-console-stage-overlay-top {
            position: absolute;
            top: 14px;
            left: 14px;
            right: 14px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            z-index: 3;
          }
          .yam-console-live-metrics-inline {
            display: flex;
            align-items: center;
            gap: 8px;
          }
          .yam-console-inline-badge,
          .yam-console-remote-pill,
          .yam-console-service-pill,
          .yam-console-level-badge,
          .yam-console-support-pill {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            border-radius: 999px;
            border: 1px solid rgba(255,255,255,0.08);
            background: rgba(15,23,42,0.72);
            color: #fff;
            font-weight: 800;
          }
          .yam-console-inline-badge {
            min-height: 34px;
            padding: 0 12px;
            font-size: 12px;
          }
          .yam-console-inline-badge.live {
            background: rgba(239,68,68,0.2);
            color: #fecaca;
          }
          .yam-console-overlay-edit {
            width: 38px;
            height: 38px;
            border-radius: 12px;
            color: #fff;
            background: rgba(11, 17, 34, 0.7);
          }
          .yam-console-main-video,
          .yam-console-preview-video {
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: none;
            background: #000;
          }
          .yam-console-main-video.visible,
          .yam-console-preview-video.visible,
          .yam-console-preview-video.host-mode {
            display: block;
          }
          .yam-console-preview-video.host-mode:not(.visible) {
            display: none;
          }
          .yam-console-remote-pill {
            position: absolute;
            right: 16px;
            bottom: 16px;
            min-height: 38px;
            padding: 0 14px;
            z-index: 3;
          }
          .yam-console-empty-stage {
            position: absolute;
            inset: 0;
            display: grid;
            align-content: center;
            justify-items: center;
            text-align: center;
            padding: 28px;
            z-index: 1;
          }
          .yam-console-empty-icon {
            width: 94px;
            height: 94px;
            border-radius: 30px;
            display: grid;
            place-items: center;
            margin-bottom: 16px;
            font-size: 40px;
            background: linear-gradient(135deg, rgba(139,92,246,0.36), rgba(59,130,246,0.18));
          }
          .yam-console-empty-stage h2 {
            margin: 0 0 8px;
            font-size: clamp(24px, 4vw, 32px);
          }
          .yam-console-empty-stage p {
            margin: 0 0 10px;
          }
          .yam-console-overlay-cta {
            position: absolute;
            right: 16px;
            bottom: 16px;
            min-height: 42px;
            padding: 0 16px;
            border-radius: 14px;
            color: #fff;
            background: rgba(15, 23, 42, 0.86);
            z-index: 2;
          }
          .yam-console-stats-card {
            align-content: start;
          }
          .yam-console-stat-stack {
            display: grid;
            gap: 12px;
          }
          .yam-console-stat-row {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 14px;
            border-radius: 18px;
            border: 1px solid rgba(255,255,255,0.06);
            background: rgba(15, 23, 42, 0.56);
          }
          .yam-console-stat-row.purple .yam-console-stat-icon { background: rgba(168,85,247,0.18); color: #c084fc; }
          .yam-console-stat-row.pink .yam-console-stat-icon { background: rgba(236,72,153,0.16); color: #f9a8d4; }
          .yam-console-stat-row.gold .yam-console-stat-icon { background: rgba(250,204,21,0.16); color: #fde68a; }
          .yam-console-stat-row.blue .yam-console-stat-icon { background: rgba(59,130,246,0.16); color: #93c5fd; }
          .yam-console-stat-icon {
            width: 48px;
            height: 48px;
            border-radius: 16px;
            display: grid;
            place-items: center;
            font-size: 22px;
          }
          .yam-console-stat-copy {
            display: grid;
            gap: 4px;
          }
          .yam-console-stat-copy strong {
            font-size: 20px;
          }
          .yam-console-quick-grid {
            display: grid;
            grid-template-columns: repeat(6, minmax(0, 1fr));
            gap: 12px;
          }
          .yam-console-quick-btn {
            min-height: 92px;
            border-radius: 22px;
            background: rgba(15,23,42,0.6);
            color: #fff;
            padding: 14px 12px;
            display: grid;
            gap: 8px;
            justify-items: center;
            text-align: center;
            border: 1px solid rgba(255,255,255,0.06);
          }
          .yam-console-quick-btn span {
            font-size: 24px;
            line-height: 1;
            color: #a78bfa;
          }
          .yam-console-quick-btn strong {
            font-size: 14px;
          }
          .yam-console-quick-btn.primary,
          .yam-console-subtle-btn.primary,
          .yam-console-chat-composer button,
          .yam-console-mobile-composer button,
          .yam-console-mobile-tab.center {
            background: linear-gradient(135deg, #8b5cf6, #5b21b6);
            box-shadow: 0 16px 30px rgba(91,33,182,0.36);
          }
          .yam-console-quick-btn.danger {
            background: linear-gradient(135deg, rgba(239,68,68,0.2), rgba(127,29,29,0.55));
          }
          .yam-console-title-meta {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 14px;
            flex-wrap: wrap;
          }
          .yam-console-host-inline {
            display: flex;
            align-items: center;
            gap: 12px;
          }
          .yam-console-host-inline strong {
            display: block;
            margin-bottom: 4px;
          }
          .yam-console-service-pills,
          .yam-console-supporters,
          .yam-console-room-filters,
          .yam-console-side-actions {
            display: flex;
            align-items: center;
            gap: 8px;
            flex-wrap: wrap;
          }
          .yam-console-service-pill,
          .yam-console-support-pill,
          .yam-console-level-badge {
            min-height: 34px;
            padding: 0 12px;
            font-size: 12px;
          }
          .yam-console-service-pill.good {
            background: rgba(16,185,129,0.16);
            color: #bbf7d0;
          }
          .yam-console-dual-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 18px;
          }
          .yam-console-goal-progress {
            width: 100%;
            height: 12px;
            border-radius: 999px;
            background: rgba(148,163,184,0.18);
            overflow: hidden;
            margin: 8px 0 12px;
          }
          .yam-console-goal-progress span {
            display: block;
            height: 100%;
            background: linear-gradient(90deg, #8b5cf6, #c084fc, #7c3aed);
          }
          .yam-console-goal-footer {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            flex-wrap: wrap;
            margin-bottom: 12px;
          }
          .yam-console-subtle-btn {
            min-height: 38px;
            padding: 0 14px;
            border-radius: 999px;
            background: rgba(255,255,255,0.08);
            color: #fff;
            font-weight: 800;
          }
          .yam-console-micro-grid,
          .yam-console-service-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 12px;
          }
          .yam-console-mini-stat,
          .yam-console-service-box {
            border-radius: 18px;
            padding: 14px;
            background: rgba(15, 23, 42, 0.56);
            border: 1px solid rgba(255,255,255,0.06);
            display: grid;
            gap: 6px;
          }
          .yam-console-mini-stat strong,
          .yam-console-service-box strong {
            color: #fff;
            font-size: 17px;
          }
          .yam-console-chat-toolbar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
            flex-wrap: wrap;
            margin-bottom: 12px;
          }
          .yam-console-chat-pill {
            min-height: 36px;
            padding: 0 14px;
            border-radius: 999px;
            color: #dbe4ff;
            background: rgba(15,23,42,0.56);
            border: 1px solid rgba(255,255,255,0.06);
            font-weight: 800;
          }
          .yam-console-chat-pill.active,
          .yam-console-filter-chip.active {
            background: linear-gradient(135deg, rgba(139,92,246,0.94), rgba(59,130,246,0.9));
            color: #fff;
          }
          .yam-console-chat-list,
          .yam-console-room-list,
          .yam-console-participants-list,
          .yam-console-gift-grid {
            display: grid;
            gap: 10px;
          }
          .yam-console-chat-list {
            max-height: 420px;
            overflow-y: auto;
            padding-inline-end: 4px;
          }
          .yam-console-message-row,
          .yam-console-participant-row {
            display: grid;
            grid-template-columns: auto minmax(0, 1fr) auto;
            gap: 12px;
            align-items: center;
            border-radius: 18px;
            padding: 12px 14px;
            background: rgba(15, 23, 42, 0.52);
            border: 1px solid rgba(255,255,255,0.06);
          }
          .yam-console-participant-row {
            grid-template-columns: auto minmax(0, 1fr);
          }
          .yam-console-message-body,
          .yam-console-participant-row div {
            min-width: 0;
          }
          .yam-console-message-headline {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 6px;
            flex-wrap: wrap;
          }
          .yam-console-message-body p {
            margin: 0;
            color: #f8fafc;
            line-height: 1.7;
            word-break: break-word;
          }
          .yam-console-room-tools {
            display: grid;
            gap: 10px;
            margin-bottom: 12px;
          }
          .yam-console-room-search,
          .yam-console-room-sort {
            width: 100%;
            min-height: 46px;
            border-radius: 16px;
            border: 1px solid rgba(255,255,255,0.08);
            background: rgba(15,23,42,0.58);
            color: #fff;
            padding: 0 14px;
          }
          .yam-console-filter-chip {
            min-height: 36px;
            padding: 0 14px;
            border-radius: 999px;
            background: rgba(15,23,42,0.56);
            color: #e2e8f0;
            border: 1px solid rgba(255,255,255,0.06);
            font-weight: 800;
          }
          .yam-console-room-card {
            width: 100%;
            padding: 14px;
            border-radius: 18px;
            text-align: start;
            background: rgba(15,23,42,0.5);
            color: #fff;
            border: 1px solid rgba(255,255,255,0.06);
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
          }
          .yam-console-room-card.active {
            background: rgba(124,58,237,0.18);
            border-color: rgba(167,139,250,0.26);
          }
          .yam-console-room-card strong,
          .yam-console-message-body strong,
          .yam-console-card-head strong,
          .yam-console-participant-row strong,
          .yam-console-title-card strong {
            color: #fff;
          }
          .yam-console-room-card p {
            margin: 4px 0 0;
          }
          .yam-console-gift-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
            margin-top: 12px;
          }
          .yam-console-gift-card {
            border-radius: 18px;
            padding: 14px 12px;
            background: rgba(15,23,42,0.56);
            color: #fff;
            border: 1px solid rgba(255,255,255,0.06);
            display: grid;
            gap: 6px;
            justify-items: center;
          }
          .yam-console-gift-card span {
            font-size: 28px;
          }
          .yam-console-chat-composer,
          .yam-console-mobile-composer {
            display: flex;
            gap: 10px;
            margin-top: 12px;
          }
          .yam-console-chat-composer input,
          .yam-console-mobile-composer input {
            flex: 1;
            min-width: 0;
            min-height: 48px;
            border-radius: 16px;
            border: 1px solid rgba(255,255,255,0.08);
            background: rgba(15,23,42,0.7);
            color: #fff;
            padding: 0 14px;
          }
          .yam-console-chat-composer button,
          .yam-console-mobile-composer button {
            min-width: 96px;
            border-radius: 16px;
            color: #fff;
            font-weight: 800;
          }
          .yam-console-mobile-dock,
          .yam-console-mobile-composer {
            display: none;
          }
          .yam-console-mobile-dock {
            position: fixed;
            left: 12px;
            right: 12px;
            bottom: calc(14px + env(safe-area-inset-bottom, 0px));
            z-index: 30;
            border-radius: 24px;
            padding: 10px;
            border: 1px solid rgba(255,255,255,0.08);
            background: rgba(9, 13, 28, 0.94);
            backdrop-filter: blur(18px);
            box-shadow: 0 22px 50px rgba(2, 6, 23, 0.45);
            grid-template-columns: repeat(5, minmax(0, 1fr));
            gap: 8px;
          }
          .yam-console-mobile-tab {
            min-height: 72px;
            border-radius: 18px;
            background: rgba(255,255,255,0.05);
            color: #fff;
            display: grid;
            gap: 6px;
            justify-items: center;
            align-content: center;
            padding: 6px;
          }
          .yam-console-mobile-tab span {
            font-size: 22px;
            line-height: 1;
          }
          .yam-console-mobile-tab strong {
            font-size: 12px;
          }
          .yam-console-mobile-tab.active {
            background: linear-gradient(135deg, rgba(139,92,246,0.9), rgba(59,130,246,0.85));
          }
          .yam-console-mobile-tab.center {
            transform: translateY(-10px);
            border-radius: 22px;
          }
          .yam-console-mobile-composer {
            position: fixed;
            left: 12px;
            right: 12px;
            bottom: calc(108px + env(safe-area-inset-bottom, 0px));
            z-index: 31;
            padding: 10px;
            border-radius: 20px;
            background: rgba(9, 13, 28, 0.96);
            border: 1px solid rgba(255,255,255,0.08);
            box-shadow: 0 18px 40px rgba(2, 6, 23, 0.42);
          }
          .yam-console-live-pill:hover,
          .yam-console-icon-btn:hover,
          .yam-console-subtle-btn:hover,
          .yam-console-filter-chip:hover,
          .yam-console-chat-pill:hover,
          .yam-console-room-card:hover,
          .yam-console-gift-card:hover,
          .yam-console-overlay-edit:hover,
          .yam-console-overlay-cta:hover,
          .yam-console-quick-btn:hover,
          .yam-console-chat-composer button:hover,
          .yam-console-mobile-tab:hover,
          .yam-console-mobile-composer button:hover {
            transform: translateY(-1px);
          }
          .yam-live-hearts-layer {
            position: absolute;
            inset: 0;
            overflow: hidden;
            pointer-events: none;
            z-index: 4;
          }
          .yam-live-heart {
            position: absolute;
            bottom: 18px;
            font-size: 30px;
            animation-name: yamHeartFly;
            animation-timing-function: ease-out;
            animation-fill-mode: forwards;
          }
          @keyframes yamHeartFly {
            0% { transform: translateY(0) scale(0.8); opacity: 0.2; }
            25% { opacity: 1; }
            100% { transform: translateY(-260px) translateX(16px) scale(1.16); opacity: 0; }
          }
          @media (max-width: 1280px) {
            .yam-console-layout,
            .yam-console-hero-grid {
              grid-template-columns: 1fr;
            }
            .yam-console-quick-grid {
              grid-template-columns: repeat(3, minmax(0, 1fr));
            }
          }
          @media (max-width: 860px) {
            .yam-console-page {
              padding: 12px 12px 190px;
            }
            .yam-console-header,
            .yam-console-card,
            .yam-console-stage-card {
              border-radius: 24px;
            }
            .yam-console-header {
              padding: 16px;
            }
            .yam-console-header-actions {
              width: 100%;
              justify-content: space-between;
            }
            .yam-console-stage-card {
              min-height: auto;
              padding: 12px;
            }
            .yam-console-stage-media {
              min-height: 280px;
            }
            .yam-console-quick-grid,
            .yam-console-dual-grid,
            .yam-console-micro-grid,
            .yam-console-service-grid,
            .yam-console-gift-grid {
              grid-template-columns: repeat(2, minmax(0, 1fr));
            }
            .yam-console-message-row {
              grid-template-columns: auto minmax(0, 1fr);
            }
            .yam-console-message-time {
              display: none;
            }
            .yam-console-mobile-dock,
            .yam-console-mobile-composer {
              display: grid;
            }
            .yam-console-chat-composer {
              display: none;
            }
          }
          @media (max-width: 560px) {
            .yam-console-header-copy h1 {
              font-size: 24px;
            }
            .yam-console-header-copy p {
              font-size: 13px;
            }
            .yam-console-card,
            .yam-console-stage-card {
              padding: 14px;
            }
            .yam-console-stage-media {
              min-height: 220px;
            }
            .yam-console-quick-grid,
            .yam-console-dual-grid,
            .yam-console-micro-grid,
            .yam-console-service-grid,
            .yam-console-gift-grid {
              grid-template-columns: 1fr;
            }
            .yam-console-live-metrics-inline {
              flex-wrap: wrap;
            }
            .yam-console-mobile-dock {
              gap: 6px;
              padding: 8px;
            }
            .yam-console-mobile-tab {
              min-height: 66px;
            }
            .yam-console-mobile-tab strong {
              font-size: 11px;
            }
          }
        `}</style>
      </div>
    </MainLayout>
  );
}
