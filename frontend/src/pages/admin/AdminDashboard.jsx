import {
  Home,
  Users,
  Radio,
  FileText,
  MessageCircle,
  PlayCircle,
  BarChart3,
  Settings,
  Bell,
  Search,
  Eye,
  DollarSign,
  Gift,
  Image,
} from "lucide-react";

const stats = [
  { title: "إجمالي المستخدمين", value: "128,560", growth: "+12.5%", icon: <Users size={22} /> },
  { title: "البثوث المباشرة", value: "1,245", growth: "+18.7%", icon: <Radio size={22} /> },
  { title: "المشاهدات الكلية", value: "2.45M", growth: "+15.3%", icon: <Eye size={22} /> },
  { title: "الإيرادات", value: "$45,231", growth: "+21.4%", icon: <DollarSign size={22} /> },
  { title: "المنشورات", value: "15,890", growth: "+17.2%", icon: <Gift size={22} /> },
  { title: "الريلز", value: "8,456", growth: "+11.3%", icon: <Image size={22} /> },
];

const streams = [
  "مغامرات جديدة في اللعبة الأسطورية",
  "بطولة احترافية مباشرة",
  "تحديات البطولة رقم اثنين",
  "تجربة لعبة جديدة",
  "بث مباشر - رد على الأسئلة",
];

const posts = [
  "لقطات حصرية للبث",
  "شكراً لدعمكم",
  "أخبار عن التحديثات",
  "استخدامات إضافية",
  "مغامرة من اللعبة الجديدة",
];

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-[#050816] text-white flex flex-row-reverse">
      <aside className="w-[280px] bg-[#0b1023] border-l border-[#1f2937] p-5 hidden lg:flex flex-col">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-full bg-purple-600"></div>
          <div>
            <h2 className="font-bold">المدير العام</h2>
            <p className="text-sm text-green-400">متصل</p>
          </div>
        </div>

        <nav className="space-y-2">
          <SidebarItem icon={<Home size={18} />} title="لوحة التحكم" active />
          <SidebarItem icon={<Radio size={18} />} title="إدارة البثوث" />
          <SidebarItem icon={<FileText size={18} />} title="إدارة المنشورات" />
          <SidebarItem icon={<MessageCircle size={18} />} title="إدارة الشات" />
          <SidebarItem icon={<PlayCircle size={18} />} title="إدارة الستوري" />
          <SidebarItem icon={<Users size={18} />} title="إدارة المستخدمين" />
          <SidebarItem icon={<BarChart3 size={18} />} title="التقارير والإحصائيات" />
          <SidebarItem icon={<Settings size={18} />} title="الإعدادات العامة" />
        </nav>
      </aside>

      <main className="flex-1 p-4 lg:p-6 overflow-auto">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4 mb-6">
          <div className="relative w-full lg:w-[420px]">
            <Search size={18} className="absolute top-1/2 -translate-y-1/2 right-4 text-gray-400" />
            <input
              type="text"
              placeholder="بحث عن مستخدم، بث، منشور..."
              className="w-full bg-[#0b1023] border border-[#1f2937] rounded-xl h-12 pr-12 pl-4 outline-none"
            />
          </div>

          <div className="flex items-center gap-4">
            <button className="w-11 h-11 rounded-xl bg-[#0b1023] border border-[#1f2937] flex items-center justify-center">
              <Bell size={18} />
            </button>

            <div className="flex items-center gap-3 bg-[#0b1023] px-4 py-2 rounded-xl border border-[#1f2937]">
              <div className="w-10 h-10 rounded-full bg-purple-600"></div>
              <div>
                <p className="font-semibold">المدير العام</p>
                <p className="text-xs text-gray-400">Super Admin</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6 gap-4 mb-6">
          {stats.map((item, index) => (
            <div key={index} className="bg-[#0b1023] border border-[#1f2937] rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-purple-600/20 flex items-center justify-center text-purple-400">
                  {item.icon}
                </div>
                <span className="text-green-400 text-sm">{item.growth}</span>
              </div>

              <h3 className="text-gray-400 text-sm mb-2">{item.title}</h3>
              <p className="text-2xl font-bold">{item.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mb-6">
          <div className="xl:col-span-2 bg-[#0b1023] border border-[#1f2937] rounded-2xl p-5">
            <h2 className="text-lg font-bold mb-6">المشاهدات خلال آخر 7 أيام</h2>

            <div className="h-[280px] rounded-2xl bg-gradient-to-b from-purple-500/20 to-transparent border border-[#1f2937] flex items-end justify-between px-3 pb-5">
              {[35, 60, 40, 75, 50, 90, 70].map((h, i) => (
                <div
                  key={i}
                  className="w-10 rounded-t-full bg-gradient-to-t from-purple-600 to-fuchsia-400"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
          </div>

          <div className="bg-[#0b1023] border border-[#1f2937] rounded-2xl p-5 flex flex-col items-center justify-center">
            <h2 className="text-lg font-bold mb-6">توزيع المحتوى</h2>

            <div className="w-56 h-56 rounded-full border-[18px] border-purple-600 relative flex items-center justify-center">
              <div className="absolute inset-5 rounded-full bg-[#050816]"></div>
              <div className="z-10 text-center">
                <p className="text-gray-400 text-sm">الإجمالي</p>
                <p className="text-2xl font-bold">100%</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 mb-6">
          <DataCard title="إدارة البثوث" data={streams} />
          <DataCard title="إدارة المنشورات" data={posts} />
        </div>
      </main>
    </div>
  );
}

function SidebarItem({ icon, title, active }) {
  return (
    <button
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${
        active ? "bg-purple-600 text-white" : "hover:bg-[#151c33] text-gray-300"
      }`}
    >
      {icon}
      <span>{title}</span>
    </button>
  );
}

function DataCard({ title, data }) {
  return (
    <div className="bg-[#0b1023] border border-[#1f2937] rounded-2xl p-5">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-bold">{title}</h2>
      </div>

      <div className="space-y-3">
        {data.map((item, i) => (
          <div key={i} className="flex items-center justify-between bg-[#111827] rounded-xl px-4 py-3">
            <div>
              <p>{item}</p>
              <span className="text-xs text-gray-400">10:30 PM</span>
            </div>

            <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm">
              نشط
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
