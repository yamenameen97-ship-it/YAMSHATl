import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Zap, Trophy, Users } from "lucide-react";
import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";

export default function PKBattle() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [battleId, setBattleId] = useState<number | null>(null);
  const [host1Score, setHost1Score] = useState(0);
  const [host2Score, setHost2Score] = useState(0);
  const [isActive, setIsActive] = useState(false);

  // Queries
  const createBattleMutation = trpc.pkBattles.create.useMutation();
  const addPointsMutation = trpc.pkBattles.addScore.useMutation();
  const endBattleMutation = trpc.pkBattles.end.useMutation();

  const handleCreateBattle = async () => {
    try {
      const result = await createBattleMutation.mutateAsync({
        host2Id: 2,
        stream1Id: 1,
        stream2Id: 2,
      });
      setBattleId(1);
      setIsActive(true);
      setHost1Score(0);
      setHost2Score(0);
    } catch (error) {
      console.error("Failed to create battle:", error);
    }
  };

  const handleAddPoints = async (hostNumber: number, points: number) => {
    if (!battleId) return;

    try {
      await addPointsMutation.mutateAsync({
        battleId,
        hostNumber: hostNumber === 1 ? "1" : "2",
        points,
      });

      if (hostNumber === 1) {
        setHost1Score(prev => prev + points);
      } else {
        setHost2Score(prev => prev + points);
      }
    } catch (error) {
      console.error("Failed to add points:", error);
    }
  };

  const handleEndBattle = async () => {
    if (!battleId) return;

    try {
      const winnerId = host1Score > host2Score ? 1 : host2Score > host1Score ? 2 : 0;
      await endBattleMutation.mutateAsync({
        battleId,
        winnerId,
      });
      setIsActive(false);
    } catch (error) {
      console.error("Failed to end battle:", error);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <Card className="p-8 text-center">
          <p className="text-gray-600 mb-4">يجب تسجيل الدخول لعرض المعارك</p>
          <Button onClick={() => setLocation("/")}>العودة للرئيسية</Button>
        </Card>
      </div>
    );
  }

  const winner = host1Score > host2Score ? 1 : host2Score > host1Score ? 2 : 0;
  const totalScore = host1Score + host2Score;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-yellow-500 to-red-500 flex items-center justify-center gap-3">
            <Zap className="w-10 h-10 text-yellow-400" />
            معركة PK
            <Zap className="w-10 h-10 text-yellow-400" />
          </h1>
          <p className="text-gray-400 mt-2">معركة حية بين المضيفين</p>
        </div>

        {!isActive ? (
          <Card className="p-8 text-center border-0 shadow-2xl bg-gradient-to-br from-gray-800 to-gray-900 mb-8">
            <Trophy className="w-16 h-16 mx-auto text-yellow-400 mb-4" />
            <h2 className="text-2xl font-bold text-white mb-4">ابدأ معركة جديدة</h2>
            <p className="text-gray-400 mb-6">تحدى مضيف آخر وتنافس على النقاط!</p>
            <Button
              onClick={handleCreateBattle}
              disabled={createBattleMutation.isPending}
              className="bg-gradient-to-r from-red-600 to-yellow-600 hover:from-red-700 hover:to-yellow-700 text-white font-bold py-3 px-8 text-lg"
            >
              {createBattleMutation.isPending ? "جاري الإنشاء..." : "إنشاء معركة"}
            </Button>
          </Card>
        ) : (
          <>
            {/* Battle Arena */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Host 1 */}
              <Card className={`p-8 border-0 shadow-2xl transition-all ${
                winner === 1 ? "bg-gradient-to-br from-green-600 to-green-700" : "bg-gradient-to-br from-blue-600 to-blue-700"
              }`}>
                <div className="text-center">
                  <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4">
                    <Users className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">المضيف 1</h3>
                  <p className="text-white/80 mb-6">أحمد محمد</p>

                  {/* Score Display */}
                  <div className="bg-black/30 rounded-lg p-6 mb-6">
                    <p className="text-white/60 text-sm mb-2">النقاط</p>
                    <p className="text-6xl font-bold text-white">{host1Score}</p>
                  </div>

                  {/* Add Points Buttons */}
                  <div className="grid grid-cols-3 gap-2">
                    {[10, 50, 100].map((points) => (
                      <Button
                        key={points}
                        onClick={() => handleAddPoints(1, points)}
                        className="bg-white/20 hover:bg-white/30 text-white font-bold"
                      >
                        +{points}
                      </Button>
                    ))}
                  </div>
                </div>
              </Card>

              {/* Host 2 */}
              <Card className={`p-8 border-0 shadow-2xl transition-all ${
                winner === 2 ? "bg-gradient-to-br from-green-600 to-green-700" : "bg-gradient-to-br from-purple-600 to-purple-700"
              }`}>
                <div className="text-center">
                  <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4">
                    <Users className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">المضيف 2</h3>
                  <p className="text-white/80 mb-6">فاطمة علي</p>

                  {/* Score Display */}
                  <div className="bg-black/30 rounded-lg p-6 mb-6">
                    <p className="text-white/60 text-sm mb-2">النقاط</p>
                    <p className="text-6xl font-bold text-white">{host2Score}</p>
                  </div>

                  {/* Add Points Buttons */}
                  <div className="grid grid-cols-3 gap-2">
                    {[10, 50, 100].map((points) => (
                      <Button
                        key={points}
                        onClick={() => handleAddPoints(2, points)}
                        className="bg-white/20 hover:bg-white/30 text-white font-bold"
                      >
                        +{points}
                      </Button>
                    ))}
                  </div>
                </div>
              </Card>
            </div>

            {/* Battle Stats */}
            <Card className="p-6 border-0 shadow-2xl bg-gradient-to-r from-gray-800 to-gray-900 mb-8">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-gray-400 text-sm mb-1">إجمالي النقاط</p>
                  <p className="text-3xl font-bold text-white">{totalScore}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">الفرق</p>
                  <p className="text-3xl font-bold text-yellow-400">{Math.abs(host1Score - host2Score)}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">الفائز المتوقع</p>
                  <p className="text-3xl font-bold text-green-400">
                    {winner === 1 ? "المضيف 1" : winner === 2 ? "المضيف 2" : "متساوي"}
                  </p>
                </div>
              </div>
            </Card>

            {/* End Battle Button */}
            <div className="text-center">
              <Button
                onClick={handleEndBattle}
                disabled={endBattleMutation.isPending}
                className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold py-3 px-8 text-lg"
              >
                {endBattleMutation.isPending ? "جاري الإنهاء..." : "إنهاء المعركة"}
              </Button>
            </div>
          </>
        )}

        {/* Battle History */}
        <Card className="p-6 border-0 shadow-2xl bg-gradient-to-br from-gray-800 to-gray-900 mt-8">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-400" />
            سجل المعارك
          </h3>
          <div className="space-y-3">
            {[
              { host1: "أحمد محمد", host2: "فاطمة علي", score: "250 - 180", winner: "أحمد محمد" },
              { host1: "محمود حسن", host2: "سارة علي", score: "300 - 280", winner: "محمود حسن" },
              { host1: "علي محمد", host2: "خديجة أحمد", score: "200 - 200", winner: "تعادل" },
            ].map((battle, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-black/30 rounded-lg">
                <div className="flex-1">
                  <p className="text-white font-semibold">{battle.host1} vs {battle.host2}</p>
                  <p className="text-gray-400 text-sm">{battle.score}</p>
                </div>
                <div className="text-right">
                  <p className="text-yellow-400 font-bold">{battle.winner}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
