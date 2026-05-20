import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Heart,
  Gift,
  Send,
  Users,
  Mic,
  Settings,
  Maximize,
  Volume2,
  ShieldCheck,
  Sparkles,
  Crown,
  Play,
  Pause,
  MonitorPlay,
  Radio,
  MessageCircle,
} from 'lucide-react';

import MainLayout from '../../components/layout/MainLayout.jsx';

const LIVE_MESSAGES = [
  {
    id: 1,
    user: 'iMeshari',
    avatar: 'https://i.pravatar.cc/100?img=12',
    message: 'البث رهيب اليوم 🔥🔥',
  },
  {
    id: 2,
    user: 'Sara',
    avatar: 'https://i.pravatar.cc/100?img=32',
    message: 'الصوت واضح جداً 💜',
  },
  {
    id: 3,
    user: 'Lemon',
    avatar: 'https://i.pravatar.cc/100?img=18',
    message: 'ننتظر البطولة 👀',
  },
  {
    id: 4,
    user: 'Rakan',
    avatar: 'https://i.pravatar.cc/100?img=15',
    message: 'استمر يا بطل ❤️',
  },
];

const FOLLOWING = [
  {
    id: 1,
    name: 'فارس',
    viewers: '2.4K',
    avatar: 'https://i.pravatar.cc/100?img=11',
  },
  {
    id: 2,
    name: 'Lemon',
    viewers: '1.8K',
    avatar: 'https://i.pravatar.cc/100?img=20',
  },
  {
    id: 3,
    name: 'Sara',
    viewers: '1.2K',
    avatar: 'https://i.pravatar.cc/100?img=5',
  },
  {
    id: 4,
    name: 'AboTurki',
    viewers: '845',
    avatar: 'https://i.pravatar.cc/100?img=9',
  },
];

const TOP_SUPPORTERS = [
  {
    id: 1,
    name: 'iMeshari',
    amount: 100,
  },
  {
    id: 2,
    name: 'Lemon',
    amount: 50,
  },
  {
    id: 3,
    name: 'Sara',
    amount: 25,
  },
];

export default function LivePage() {
  const [messages, setMessages] = useState(LIVE_MESSAGES);
  const [message, setMessage] = useState('');
  const [isPlaying, setIsPlaying] = useState(true);
  const [viewers, setViewers] = useState(2400);
  const [latency, setLatency] = useState(23);
  const [streamTime, setStreamTime] = useState(0);

  const chatRef = useRef(null);

  useEffect(() => {
    const latencyInterval = setInterval(() => {
      setLatency(Math.floor(Math.random() * 40) + 18);
      setViewers((prev) => prev + Math.floor(Math.random() * 10 - 4));
    }, 4000);

    const timer = setInterval(() => {
      setStreamTime((prev) => prev + 1);
    }, 1000);

    return () => {
      clearInterval(latencyInterval);
      clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  const formattedTime = useMemo(() => {
    const hrs = Math.floor(streamTime / 3600)
      .toString()
      .padStart(2, '0');

    const mins = Math.floor((streamTime % 3600) / 60)
      .toString()
      .padStart(2, '0');

    const secs = (streamTime % 60).toString().padStart(2, '0');

    return `${hrs}:${mins}:${secs}`;
  }, [streamTime]);

  const sendMessage = () => {
    if (!message.trim()) return;

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        user: 'أنت',
        avatar: 'https://i.pravatar.cc/100?img=65',
        message,
      },
    ]);

    setMessage('');
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-[#050816] text-white overflow-hidden">
        <div className="flex h-[calc(100vh-70px)]">

          {/* Sidebar */}
          <aside className="hidden xl:flex w-[280px] border-r border-white/10 bg-[#080b1c] flex-col">
            <div className="px-6 py-7 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-fuchsia-500 to-violet-700 flex items-center justify-center shadow-2xl shadow-fuchsia-600/30">
                  <Radio size={22} />
                </div>

                <div>
                  <h1 className="text-2xl font-black tracking-wide">YAMSHAT</h1>
                  <p className="text-xs text-gray-400">Live Streaming Platform</p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-6 space-y-3">
              {[
                'الرئيسية',
                'الدردشات',
                'البث المباشر',
                'المجموعات',
                'الأصدقاء',
                'الإشعارات',
                'الإعدادات',
              ].map((item, index) => (
                <button
                  key={item}
                  className={`w-full rounded-2xl px-4 py-4 text-right transition-all duration-300 ${
                    index === 2
                      ? 'bg-gradient-to-r from-violet-700 to-fuchsia-600 shadow-lg shadow-violet-700/30'
                      : 'hover:bg-white/5'
                  }`}
                >
                  {item}
                </button>
              ))}

              <div className="pt-10">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-sm font-bold text-gray-300">
                    القنوات التي تتابعها
                  </h3>
                  <Sparkles size={16} className="text-fuchsia-400" />
                </div>

                <div className="space-y-4">
                  {FOLLOWING.map((streamer) => (
                    <div
                      key={streamer.id}
                      className="flex items-center justify-between bg-white/[0.03] rounded-2xl p-3 hover:bg-white/[0.05] transition"
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <img
                            src={streamer.avatar}
                            alt={streamer.name}
                            className="w-12 h-12 rounded-full object-cover"
                          />

                          <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-red-500 border border-black"></span>
                        </div>

                        <div>
                          <p className="font-semibold">{streamer.name}</p>
                          <p className="text-xs text-gray-400">
                            {streamer.viewers} مشاهدة
                          </p>
                        </div>
                      </div>

                      <span className="text-xs text-fuchsia-400 font-bold">
                        LIVE
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Main */}
          <main className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-1 2xl:grid-cols-[1fr_360px] gap-6 p-6">

              {/* Video Section */}
              <section className="space-y-6">
                <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-black shadow-[0_0_100px_rgba(124,58,237,0.25)]">

                  <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-900/30 via-transparent to-violet-900/40 z-10"></div>

                  <img
                    src="https://images.unsplash.com/photo-1603481546579-65d935ba9cdd?q=80&w=1600&auto=format&fit=crop"
                    alt="stream"
                    className="w-full h-[650px] object-cover"
                  />

                  {/* Top Overlay */}
                  <div className="absolute top-5 right-5 left-5 z-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-red-500 px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 animate-pulse">
                        <span className="w-2 h-2 rounded-full bg-white"></span>
                        مباشر
                      </div>

                      <div className="bg-black/40 backdrop-blur-xl px-4 py-2 rounded-xl text-sm flex items-center gap-2">
                        <Users size={16} />
                        {viewers.toLocaleString()}
                      </div>

                      <div className="bg-black/40 backdrop-blur-xl px-4 py-2 rounded-xl text-sm">
                        {formattedTime}
                      </div>
                    </div>

                    <button className="w-12 h-12 rounded-2xl bg-black/40 backdrop-blur-xl flex items-center justify-center hover:bg-black/60 transition">
                      <Settings size={18} />
                    </button>
                  </div>

                  {/* Bottom Controls */}
                  <div className="absolute bottom-0 inset-x-0 z-20 p-6 bg-gradient-to-t from-black via-black/70 to-transparent">
                    <div className="flex items-center justify-between gap-4">

                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setIsPlaying(!isPlaying)}
                          className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/10 flex items-center justify-center hover:bg-white/20 transition"
                        >
                          {isPlaying ? <Pause /> : <Play />}
                        </button>

                        <button className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/10 flex items-center justify-center hover:bg-white/20 transition">
                          <Volume2 />
                        </button>

                        <button className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/10 flex items-center justify-center hover:bg-white/20 transition">
                          <Mic />
                        </button>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="px-4 py-3 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 text-sm">
                          Latency: {latency}ms
                        </div>

                        <button className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/10 flex items-center justify-center hover:bg-white/20 transition">
                          <MonitorPlay />
                        </button>

                        <button className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/10 flex items-center justify-center hover:bg-white/20 transition">
                          <Maximize />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Streamer Info */}
                <div className="rounded-[30px] border border-white/10 bg-white/[0.03] backdrop-blur-2xl p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">

                    <div className="flex items-center gap-5">
                      <div className="relative">
                        <img
                          src="https://i.pravatar.cc/150?img=11"
                          alt="streamer"
                          className="w-24 h-24 rounded-full object-cover border-4 border-fuchsia-500"
                        />

                        <div className="absolute -bottom-2 right-1 bg-gradient-to-r from-fuchsia-500 to-violet-600 px-3 py-1 rounded-full text-xs font-bold shadow-lg shadow-violet-500/40">
                          LIVE
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <h2 className="text-3xl font-black">فارس</h2>
                          <ShieldCheck className="text-blue-400" fill="#60A5FA" />
                        </div>

                        <p className="text-gray-300 max-w-2xl leading-8">
                          أهلاً وسهلاً بالجميع 🔥 اليوم راح نلعب مع المتابعين ونسوي بطولة صغيرة لا تنسوا اللايك والاشتراك 💜
                        </p>

                        <div className="flex flex-wrap gap-2 mt-4">
                          {['Gaming', 'Arabic', 'Yamshat', 'Live'].map((tag) => (
                            <span
                              key={tag}
                              className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-gray-300"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button className="px-7 py-4 rounded-2xl bg-gradient-to-r from-violet-700 to-fuchsia-600 font-bold shadow-2xl shadow-fuchsia-700/30 hover:scale-105 transition-all duration-300 flex items-center gap-2">
                        <Heart size={18} />
                        متابعة
                      </button>

                      <button className="px-7 py-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300 flex items-center gap-2">
                        <Crown size={18} />
                        اشتراك
                      </button>
                    </div>
                  </div>
                </div>

                {/* Goals */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="rounded-[30px] border border-white/10 bg-white/[0.03] p-6 backdrop-blur-2xl">
                    <h3 className="text-xl font-black mb-6">حول البث</h3>

                    <div className="space-y-5 text-gray-300 leading-8">
                      <p>
                        بث مباشر احترافي داخل منصة Yamshat مع دعم كامل للبث التفاعلي والهدايا الفورية والدردشة المباشرة.
                      </p>

                      <div className="flex gap-3 pt-4">
                        {['YouTube', 'Discord', 'Instagram', 'TikTok'].map((social) => (
                          <button
                            key={social}
                            className="px-5 py-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition"
                          >
                            {social}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[30px] border border-white/10 bg-white/[0.03] p-6 backdrop-blur-2xl">
                    <h3 className="text-xl font-black mb-8">أهداف البث</h3>

                    <div className="space-y-8">
                      {[
                        {
                          title: 'دعم الشهر',
                          value: 845,
                          total: 1000,
                        },
                        {
                          title: 'هدف المتابعين',
                          value: 120,
                          total: 200,
                        },
                        {
                          title: 'هدف الاشتراكات',
                          value: 75,
                          total: 100,
                        },
                      ].map((goal) => (
                        <div key={goal.title}>
                          <div className="flex items-center justify-between mb-3">
                            <span className="font-semibold">{goal.title}</span>
                            <span className="text-sm text-gray-400">
                              {goal.value}/{goal.total}
                            </span>
                          </div>

                          <div className="h-4 rounded-full bg-white/5 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500"
                              style={{
                                width: `${(goal.value / goal.total) * 100}%`,
                              }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              {/* Chat */}
              <aside className="rounded-[32px] border border-white/10 bg-[#0b1020]/90 backdrop-blur-2xl flex flex-col overflow-hidden h-[calc(100vh-120px)] sticky top-6">

                <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-black">الدردشة المباشرة</h3>
                    <p className="text-sm text-gray-400 mt-1">
                      {viewers.toLocaleString()} مشاهد
                    </p>
                  </div>

                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-700 to-fuchsia-600 flex items-center justify-center shadow-xl shadow-fuchsia-700/30">
                    <MessageCircle />
                  </div>
                </div>

                <div
                  ref={chatRef}
                  className="flex-1 overflow-y-auto px-5 py-6 space-y-5"
                >
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className="flex items-start gap-3 animate-[fadeIn_0.4s_ease]"
                    >
                      <img
                        src={msg.avatar}
                        alt={msg.user}
                        className="w-11 h-11 rounded-full object-cover"
                      />

                      <div className="flex-1 rounded-2xl bg-white/[0.04] border border-white/5 p-4">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-fuchsia-300">
                            {msg.user}
                          </span>
                        </div>

                        <p className="text-gray-200 leading-7 text-sm">
                          {msg.message}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Gifts */}
                <div className="px-5 py-4 border-t border-white/10 bg-white/[0.02]">
                  <div className="grid grid-cols-3 gap-3 mb-5">
                    {[
                      { icon: '🎁', value: 25 },
                      { icon: '❤️', value: 50 },
                      { icon: '🔥', value: 100 },
                    ].map((gift, index) => (
                      <button
                        key={index}
                        className="rounded-2xl bg-gradient-to-br from-violet-700/30 to-fuchsia-700/20 border border-white/10 py-4 hover:scale-105 transition-all duration-300"
                      >
                        <div className="text-2xl mb-1">{gift.icon}</div>
                        <div className="text-sm text-gray-300">
                          {gift.value}
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex-1 relative">
                      <input
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            sendMessage();
                          }
                        }}
                        placeholder="اكتب رسالة..."
                        className="w-full bg-white/[0.04] border border-white/10 rounded-2xl px-5 py-4 outline-none focus:border-fuchsia-500 transition"
                      />
                    </div>

                    <button className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition">
                      <Gift />
                    </button>

                    <button
                      onClick={sendMessage}
                      className="w-14 h-14 rounded-2xl bg-gradient-to-r from-violet-700 to-fuchsia-600 flex items-center justify-center shadow-xl shadow-fuchsia-700/30 hover:scale-105 transition-all duration-300"
                    >
                      <Send size={18} />
                    </button>
                  </div>
                </div>

                {/* Top supporters */}
                <div className="border-t border-white/10 px-5 py-5 bg-black/20">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-black">الداعمون</h4>
                    <Crown className="text-yellow-400" />
                  </div>

                  <div className="space-y-3">
                    {TOP_SUPPORTERS.map((supporter) => (
                      <div
                        key={supporter.id}
                        className="flex items-center justify-between bg-white/[0.03] rounded-2xl p-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center font-black">
                            {supporter.name.charAt(0)}
                          </div>

                          <span>{supporter.name}</span>
                        </div>

                        <span className="text-yellow-400 font-bold">
                          {supporter.amount}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </aside>
            </div>
          </main>
        </div>
      </div>
    </MainLayout>
  );
}
