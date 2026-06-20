import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, Users, CheckCircle, XCircle, TrendingUp } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";

export default function AdminDashboard() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("overview");

  if (!isAuthenticated || user?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <Card className="p-8 text-center">
          <p className="text-gray-600 mb-4">ليس لديك صلاحية للوصول إلى لوحة التحكم</p>
          <Button onClick={() => setLocation("/")}>العودة للرئيسية</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-pink-600 flex items-center gap-2">
            <BarChart3 className="w-8 h-8" />
            لوحة التحكم الإدارية
          </h1>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">إجمالي المستخدمين</p>
                <p className="text-3xl font-bold mt-2">1,234</p>
              </div>
              <Users className="w-8 h-8 opacity-50" />
            </div>
          </Card>

          <Card className="p-6 border-0 shadow-lg bg-gradient-to-br from-green-500 to-green-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">المنشورات النشطة</p>
                <p className="text-3xl font-bold mt-2">5,678</p>
              </div>
              <TrendingUp className="w-8 h-8 opacity-50" />
            </div>
          </Card>

          <Card className="p-6 border-0 shadow-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">البث المباشر الآن</p>
                <p className="text-3xl font-bold mt-2">42</p>
              </div>
              <BarChart3 className="w-8 h-8 opacity-50" />
            </div>
          </Card>

          <Card className="p-6 border-0 shadow-lg bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">إجمالي العملات</p>
                <p className="text-3xl font-bold mt-2">98,765</p>
              </div>
              <BarChart3 className="w-8 h-8 opacity-50" />
            </div>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
            <TabsTrigger value="verification">طلبات التوثيق</TabsTrigger>
            <TabsTrigger value="withdrawals">طلبات السحب</TabsTrigger>
            <TabsTrigger value="reports">التقارير</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6 border-0 shadow-lg">
                <h3 className="text-xl font-bold mb-4">النشاط الأخير</h3>
                <div className="space-y-3">
                  {[
                    { action: "مستخدم جديد", time: "قبل 5 دقائق" },
                    { action: "منشور جديد", time: "قبل 10 دقائق" },
                    { action: "بث مباشر بدأ", time: "قبل 15 دقيقة" },
                    { action: "عملية سحب", time: "قبل 20 دقيقة" },
                  ].map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <span>{item.action}</span>
                      <span className="text-sm text-gray-500">{item.time}</span>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-6 border-0 shadow-lg">
                <h3 className="text-xl font-bold mb-4">الإحصائيات</h3>
                <div className="space-y-3">
                  {[
                    { label: "معدل النمو", value: "+12.5%" },
                    { label: "المستخدمون النشطون", value: "856" },
                    { label: "متوسط الجلسة", value: "24 دقيقة" },
                    { label: "معدل الاحتفاظ", value: "78%" },
                  ].map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <span>{item.label}</span>
                      <span className="font-bold text-blue-600">{item.value}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* Verification Requests Tab */}
          <TabsContent value="verification">
            <Card className="p-6 border-0 shadow-lg">
              <h3 className="text-xl font-bold mb-4">طلبات التوثيق المعلقة</h3>
              <div className="space-y-3">
                {[
                  { user: "أحمد محمد", status: "pending", date: "2026-06-08" },
                  { user: "فاطمة علي", status: "pending", date: "2026-06-07" },
                  { user: "سارة حسن", status: "pending", date: "2026-06-06" },
                ].map((request, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div>
                      <p className="font-semibold">{request.user}</p>
                      <p className="text-sm text-gray-500">{request.date}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" className="bg-green-600 hover:bg-green-700">
                        <CheckCircle className="w-4 h-4 ml-1" />
                        موافقة
                      </Button>
                      <Button size="sm" variant="outline" className="text-red-600">
                        <XCircle className="w-4 h-4 ml-1" />
                        رفض
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* Withdrawal Requests Tab */}
          <TabsContent value="withdrawals">
            <Card className="p-6 border-0 shadow-lg">
              <h3 className="text-xl font-bold mb-4">طلبات السحب المعلقة</h3>
              <div className="space-y-3">
                {[
                  { user: "محمد أحمد", amount: 5000, status: "pending", date: "2026-06-08" },
                  { user: "علي حسن", amount: 3500, status: "pending", date: "2026-06-07" },
                  { user: "خديجة محمود", amount: 7200, status: "pending", date: "2026-06-06" },
                ].map((request, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div>
                      <p className="font-semibold">{request.user}</p>
                      <p className="text-sm text-gray-500">{request.amount} ريال - {request.date}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" className="bg-green-600 hover:bg-green-700">
                        <CheckCircle className="w-4 h-4 ml-1" />
                        موافقة
                      </Button>\n                      <Button size="sm" variant="outline" className="text-red-600">
                        <XCircle className="w-4 h-4 ml-1" />
                        رفض
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports">
            <Card className="p-6 border-0 shadow-lg">
              <h3 className="text-xl font-bold mb-4">التقارير والإحصائيات</h3>
              <div className="space-y-4">
                <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/10 rounded-lg">
                  <p className="font-semibold mb-2">تقرير المستخدمين</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    إجمالي المستخدمين: 1,234 | المستخدمون النشطون: 856 | معدل النمو: +12.5%
                  </p>
                </div>
                <div className="p-4 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-900/10 rounded-lg">
                  <p className="font-semibold mb-2">تقرير المحتوى</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    إجمالي المنشورات: 5,678 | البث المباشر النشط: 42 | إجمالي التفاعلات: 45,234
                  </p>
                </div>
                <div className="p-4 bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-900/10 rounded-lg">
                  <p className="font-semibold mb-2">تقرير العملات</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    إجمالي العملات: 98,765 | العملات المباعة: 45,234 | الأرباح: 22,617 ريال
                  </p>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
