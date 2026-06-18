import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { User, Star, Trophy, Copy, Share2, Edit2 } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function Profile() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [isEditing, setIsEditing] = useState(false);
  const [bio, setBio] = useState("");
  const [referralCopied, setReferralCopied] = useState(false);

  // Queries
  const profileQuery = trpc.profiles.get.useQuery(user?.id || 0, { enabled: !!user?.id });
  const updateProfileMutation = trpc.profiles.update.useMutation();
  const createReferralMutation = trpc.referrals.createCode.useMutation();

  const handleUpdateProfile = async () => {
    try {
      await updateProfileMutation.mutateAsync({
        bio,
      });
      setIsEditing(false);
      profileQuery.refetch();
      toast.success("تم تحديث الملف الشخصي");
    } catch (error) {
      toast.error("فشل تحديث الملف الشخصي");
    }
  };

  const handleCreateReferralCode = async () => {
    try {
      const code = `REF${user?.id}${Math.random().toString(36).substring(7).toUpperCase()}`;
      await createReferralMutation.mutateAsync({
        code,
        reward: 100,
      });
      toast.success("تم إنشاء كود الإحالة");
    } catch (error) {
      toast.error("فشل إنشاء كود الإحالة");
    }
  };

  const handleCopyReferral = () => {
    const code = `REF${user?.id}`;
    navigator.clipboard.writeText(code);
    setReferralCopied(true);
    setTimeout(() => setReferralCopied(false), 2000);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <Card className="p-8 text-center">
          <p className="text-gray-600 mb-4">يجب تسجيل الدخول لعرض الملف الشخصي</p>
          <Button onClick={() => setLocation("/")}>العودة للرئيسية</Button>
        </Card>
      </div>
    );
  }

  const profile = profileQuery.data;
  const level = profile?.level || 1;
  const experience = profile?.experience || 0;
  const nextLevelExp = level * 1000;
  const expProgress = (experience / nextLevelExp) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 flex items-center gap-2">
            <User className="w-8 h-8" />
            ملفي الشخصي
          </h1>
        </div>

        {/* Profile Card */}
        <Card className="p-8 border-0 shadow-lg mb-8">
          <div className="flex gap-6 mb-8">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-3xl font-bold flex-shrink-0">
              {user?.name?.[0] || "U"}
            </div>

            {/* User Info */}
            <div className="flex-1">
              <h2 className="text-3xl font-bold mb-2">{user?.name}</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">{user?.email}</p>
              
              {/* Level and Experience */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="w-5 h-5 text-yellow-500" />
                  <span className="font-semibold">المستوى {level}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all"
                    style={{ width: `${expProgress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {experience} / {nextLevelExp} نقطة خبرة
                </p>
              </div>

              {/* Verification Badge */}
              {profile?.isVerified ? (
                <div className="inline-flex items-center gap-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full text-sm">
                  <Trophy className="w-4 h-4" />
                  موثق
                </div>
              ) : (
                <Button size="sm" variant="outline">
                  طلب التوثيق
                </Button>
              )}
            </div>

            {/* Edit Button */}
            {!isEditing && (
              <Button
                onClick={() => setIsEditing(true)}
                variant="outline"
                size="sm"
                className="self-start"
              >
                <Edit2 className="w-4 h-4 ml-2" />
                تعديل
              </Button>
            )}
          </div>

          {/* Bio Section */}
          {isEditing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">السيرة الذاتية</label>
                <Textarea
                  placeholder="أخبرنا عن نفسك..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleUpdateProfile}
                  disabled={updateProfileMutation.isPending}
                  className="bg-gradient-to-r from-blue-600 to-purple-600"
                >
                  {updateProfileMutation.isPending ? "جاري الحفظ..." : "حفظ التغييرات"}
                </Button>
                <Button
                  onClick={() => setIsEditing(false)}
                  variant="outline"
                >
                  إلغاء
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-gray-700 dark:text-gray-300">
              {profile?.bio || "لم يتم إضافة سيرة ذاتية بعد"}
            </div>
          )}
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Followers */}
          <Card className="p-6 border-0 shadow-lg">
            <h3 className="text-lg font-semibold mb-2">المتابعون</h3>
            <p className="text-4xl font-bold text-blue-600">{profile?.followers || 0}</p>
          </Card>

          {/* Following */}
          <Card className="p-6 border-0 shadow-lg">
            <h3 className="text-lg font-semibold mb-2">يتابع</h3>
            <p className="text-4xl font-bold text-purple-600">{profile?.following || 0}</p>
          </Card>

          {/* Achievements */}
          <Card className="p-6 border-0 shadow-lg">
            <h3 className="text-lg font-semibold mb-2">الإنجازات</h3>
            <p className="text-4xl font-bold text-yellow-600">5</p>
          </Card>
        </div>

        {/* Referral Section */}
        <Card className="p-6 border-0 shadow-lg mb-8">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Share2 className="w-6 h-6" />
            كود الإحالة الخاص بي
          </h2>

          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-6 rounded-lg">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              شارك هذا الكود مع أصدقائك واحصل على 100 عملة لكل شخص يسجل
            </p>

            <div className="flex gap-2 mb-4">
              <Input
                value={`REF${user?.id}`}
                readOnly
                className="bg-white dark:bg-gray-800"
              />
              <Button
                onClick={handleCopyReferral}
                variant="outline"
                className={referralCopied ? "bg-green-100 dark:bg-green-900/30" : ""}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>

            <Button
              onClick={handleCreateReferralCode}
              disabled={createReferralMutation.isPending}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600"
            >
              {createReferralMutation.isPending ? "جاري الإنشاء..." : "إنشاء كود جديد"}
            </Button>
          </div>
        </Card>

        {/* Achievements Section */}
        <Card className="p-6 border-0 shadow-lg">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Trophy className="w-6 h-6" />
            الشارات والإنجازات
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: "البداية", icon: "🎯", unlocked: true },
              { name: "أول منشور", icon: "📝", unlocked: true },
              { name: "100 متابع", icon: "👥", unlocked: false },
              { name: "البث المباشر", icon: "📹", unlocked: false },
              { name: "1000 عملة", icon: "💰", unlocked: false },
              { name: "الموثق", icon: "✓", unlocked: false },
              { name: "المتفاعل", icon: "❤️", unlocked: false },
              { name: "النجم", icon: "⭐", unlocked: false },
            ].map((achievement, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-lg text-center transition-all ${
                  achievement.unlocked
                    ? "bg-gradient-to-br from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30"
                    : "bg-gray-100 dark:bg-gray-800 opacity-50"
                }`}
              >
                <div className="text-4xl mb-2">{achievement.icon}</div>
                <p className="text-sm font-semibold">{achievement.name}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
