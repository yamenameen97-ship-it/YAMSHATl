import React from 'react';

export const AdminDashboardEnhanced = () => {
  const stats = [
    { title: 'إجمالي المستخدمين', value: '128,560', growth: '+12.5%', icon: '👥', color: 'from-violet-500 to-purple-700' },
    { title: 'البثوث المباشرة', value: '1,245', growth: '+18.7%', icon: '📡', color: 'from-cyan-500 to-blue-700' },
    { title: 'المشاهدات الكلية', value: '2.45M', growth: '+15.3%', icon: '👁️', color: 'from-rose-500 to-pink-700' },
    { title: 'الإيرادات', value: '$45,231', growth: '+21.4%', icon: '💰', color: 'from-emerald-500 to-green-700' },
    { title: 'المنشورات', value: '15,890', growth: '+17.2%', icon: '🎁', color: 'from-indigo-500 to-violet-700' },
    { title: 'الريلز', value: '8,456', growth: '+11.3%', icon: '🎵', color: 'from-orange-500 to-amber-700' },
  ];

  const menu = ['لوحة التحكم','إدارة البثوث','إدارة المنشورات','إدارة الشات','إدارة الستوري','إدارة الريلز','إدارة المستخدمين','التقارير والإحصائيات','الإعدادات العامة'];
  const users = ['PlayerOne','KhaledGamer','ShadowGirl','MoxX','ProHunter'];

  return (
    <div dir="rtl" className="min-h-screen bg-[#050816] text-white flex overflow-hidden">
      <aside className="w-[280px] bg-[#0a1022] border-l border-white/10 p-6 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 mb-10">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-fuchsia-500 to-violet-700 flex items-center justify-center text-2xl">🔴</div>
            <div>
              <h1 className="text-2xl font-bold">LiveStream</h1>
              <p className="text-sm text-zinc-400">Super Admin</p>
            </div>
          </div>

          <div className="bg-[#121932] rounded-3xl p-4 mb-8 border border-white/10 flex items-center gap-3">
            <img src="https://i.pravatar.cc/100?img=12" className="w-14 h-14 rounded-2xl object-cover" />
            <div>
              <h2 className="font-bold">المدير العام</h2>
              <p className="text-emerald-400 text-sm">● متصل</p>
            </div>
          </div>

          <nav className="space-y-2">
            {menu.map((item, index) => (
              <button key={item} className={`w-full text-right px-5 py-4 rounded-2xl border transition ${index === 0 ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 border-violet-500' : 'bg-[#0e152c] border-transparent hover:border-violet-500/40 hover:bg-[#151d38]'}`}>
                {item}
              </button>
            ))}
          </nav>
        </div>

        <button className="w-full bg-red-600/20 border border-red-500/40 py-4 rounded-2xl">تسجيل الخروج</button>
      </aside>

      <main className="flex-1 overflow-y-auto p-8 bg-[radial-gradient(circle_at_top,rgba(120,60,255,0.18),transparent_35%),#050816]">
        <div className="flex items-center justify-between mb-8">
          <input placeholder="بحث عن مستخدم، بث، منشور..." className="w-[420px] bg-[#0d1428] border border-white/10 rounded-2xl px-5 py-4 outline-none" />
          <div className="flex items-center gap-4">
            <button className="w-12 h-12 rounded-2xl bg-[#0d1428] border border-white/10">🌙</button>
            <button className="w-12 h-12 rounded-2xl bg-[#0d1428] border border-white/10">🔔</button>
            <img src="https://i.pravatar.cc/100?img=15" className="w-12 h-12 rounded-2xl object-cover border border-violet-500" />
          </div>
        </div>

        <div className="grid grid-cols-6 gap-5 mb-8">
          {stats.map((stat) => (
            <div key={stat.title} className="bg-[#0d1428] border border-white/10 rounded-3xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-2xl`}>
                  {stat.icon}
                </div>
                <span className="text-emerald-400 text-sm">{stat.growth}</span>
              </div>
              <h3 className="text-zinc-400 text-sm mb-1">{stat.title}</h3>
              <p className="text-3xl font-black">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="col-span-2 bg-[#0d1428] border border-white/10 rounded-3xl p-6">
            <h2 className="text-xl font-bold mb-6">المشاهدات خلال آخر 7 أيام</h2>
            <div className="h-[320px] flex items-end justify-around rounded-3xl bg-[#121932] p-6">
              {[140,260,210,340,180,290,420].map((h, i) => (
                <div key={i} className="flex flex-col items-center gap-3">
                  <div className="w-14 rounded-t-full bg-gradient-to-t from-fuchsia-600 to-violet-400" style={{ height: `${h}px` }} />
                  <span className="text-xs text-zinc-400">{12 + i} مايو</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-[#0d1428] border border-white/10 rounded-3xl p-6 h-[240px]">
              <h2 className="text-xl font-bold mb-6">توزيع المحتوى</h2>
              <div className="relative mx-auto w-44 h-44 rounded-full bg-[conic-gradient(#7c3aed_0_40%,#2563eb_40_65%,#22c55e_65_85%,#f97316_85_95%,#facc15_95_100%)] flex items-center justify-center">
                <div className="w-24 h-24 rounded-full bg-[#0d1428] flex items-center justify-center text-center">100%</div>
              </div>
            </div>

            <div className="bg-[#0d1428] border border-white/10 rounded-3xl p-6">
              <h2 className="text-xl font-bold mb-4">النشاطات الأخيرة</h2>
              <div className="space-y-4">
                {users.map((u, i) => (
                  <div key={u} className="flex items-center justify-between bg-[#111936] rounded-2xl p-3">
                    <div className="flex items-center gap-3">
                      <img src={`https://i.pravatar.cc/100?img=${i + 20}`} className="w-11 h-11 rounded-xl" />
                      <div>
                        <p className="font-semibold">{u}</p>
                        <p className="text-xs text-zinc-400">قام ببث جديد</p>
                      </div>
                    </div>
                    <span className="text-xs bg-red-500/20 text-red-400 px-3 py-1 rounded-full">LIVE</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboardEnhanced;
