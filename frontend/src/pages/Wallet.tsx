import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Wallet as WalletIcon, TrendingUp, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";

// ✅ FIX (v59.13.3): ثوابت لتأمين مدخلات الشراء/السحب
const MAX_PURCHASE_AMOUNT = 1_000_000; // سقف أعلى للشراء لمنع أرقام ضخمة عن طريق الخطأ

// تحويل آمن للمدخل: يعيد null للفراغ/NaN بدل 0 حتى يظهر placeholder
function parseAmountInput(raw: string, max: number): number | null {
  if (raw === '' || raw == null) return null;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || Number.isNaN(n)) return null;
  if (n < 0) return 0;
  if (n > max) return max;
  return n;
}

export default function Wallet() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  // ✅ FIX: نستخدم null بدل 0 حتى يظهر placeholder بدل رقم وهمي
  const [purchaseAmount, setPurchaseAmount] = useState<number | null>(null);
  const [withdrawAmount, setWithdrawAmount] = useState<number | null>(null);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);

  // Queries
  const walletQuery = trpc.wallets.get.useQuery(undefined, { enabled: isAuthenticated });
  const transactionQuery = trpc.wallets.getTransactionHistory.useQuery({ limit: 50 }, { enabled: isAuthenticated });
  const updateBalanceMutation = trpc.wallets.updateBalance.useMutation();

  const balance = walletQuery.data?.balance || 0;

  const handlePurchaseCoins = async () => {
    if (!purchaseAmount || purchaseAmount <= 0) return;
    if (purchaseAmount > MAX_PURCHASE_AMOUNT) return;

    try {
      await updateBalanceMutation.mutateAsync(purchaseAmount);
      setPurchaseAmount(null);
      walletQuery.refetch();
      transactionQuery.refetch();
    } catch (error) {
      console.error("Failed to purchase coins:", error);
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || withdrawAmount <= 0) return;
    if (!walletQuery.data) return;
    // ✅ FIX: تنبيه واضح عند تجاوز الرصيد
    if (withdrawAmount > balance) {
      setWithdrawError(`المبلغ يتجاوز الرصيد المتاح (${balance} عملة)`);
      return;
    }
    setWithdrawError(null);

    try {
      await updateBalanceMutation.mutateAsync(-withdrawAmount);
      setWithdrawAmount(null);
      walletQuery.refetch();
      transactionQuery.refetch();
    } catch (error) {
      console.error("Failed to withdraw:", error);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <Card className="p-8 text-center">
          <p className="text-gray-600 mb-4">يجب تسجيل الدخول لعرض المحفظة</p>
          <Button onClick={() => setLocation("/")}>العودة للرئيسية</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600 flex items-center gap-2">
            <WalletIcon className="w-8 h-8" />
            محفظتي
          </h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Balance Card */}
          <Card className="p-6 border-0 shadow-lg bg-gradient-to-br from-green-500 to-emerald-600 text-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">الرصيد الحالي</h3>
              <WalletIcon className="w-6 h-6" />
            </div>
            <p className="text-4xl font-bold">
              {walletQuery.data?.balance || 0}
            </p>
            <p className="text-sm mt-2 opacity-90">عملة</p>
          </Card>

          {/* Total Earned Card */}
          <Card className="p-6 border-0 shadow-lg bg-gradient-to-br from-blue-500 to-cyan-600 text-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">إجمالي الأرباح</h3>
              <TrendingUp className="w-6 h-6" />
            </div>
            <p className="text-4xl font-bold">
              {walletQuery.data?.totalEarned || 0}
            </p>
            <p className="text-sm mt-2 opacity-90">عملة</p>
          </Card>

          {/* Total Spent Card */}
          <Card className="p-6 border-0 shadow-lg bg-gradient-to-br from-orange-500 to-red-600 text-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">إجمالي الإنفاق</h3>
              <ArrowUpRight className="w-6 h-6" />
            </div>
            <p className="text-4xl font-bold">
              {walletQuery.data?.totalSpent || 0}
            </p>
            <p className="text-sm mt-2 opacity-90">عملة</p>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Purchase Coins */}
          <Card className="p-6 border-0 shadow-lg">
            <h2 className="text-xl font-bold mb-4">شراء عملات</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">عدد العملات</label>
                <Input
                  type="number"
                  placeholder="أدخل عدد العملات"
                  value={purchaseAmount ?? ''}
                  onChange={(e) => setPurchaseAmount(parseAmountInput(e.target.value, MAX_PURCHASE_AMOUNT))}
                  min="0"
                  max={MAX_PURCHASE_AMOUNT}
                />
                {purchaseAmount === MAX_PURCHASE_AMOUNT && (
                  <p className="text-xs text-orange-600 mt-1">تم الوصول للحد الأعلى للشراء</p>
                )}
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  السعر: <span className="font-bold">{((purchaseAmount ?? 0) * 0.1).toFixed(2)}</span> ريال
                </p>
              </div>

              <Button
                onClick={handlePurchaseCoins}
                disabled={!purchaseAmount || purchaseAmount <= 0 || updateBalanceMutation.isPending}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
              >
                {updateBalanceMutation.isPending ? "جاري الشراء..." : "شراء الآن"}
              </Button>
            </div>
          </Card>

          {/* Withdraw */}
          <Card className="p-6 border-0 shadow-lg">
            <h2 className="text-xl font-bold mb-4">سحب أرباح</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">مبلغ السحب</label>
                <Input
                  type="number"
                  placeholder="أدخل المبلغ"
                  value={withdrawAmount ?? ''}
                  onChange={(e) => {
                    const next = parseAmountInput(e.target.value, balance || MAX_PURCHASE_AMOUNT);
                    setWithdrawAmount(next);
                    // تنبيه فوري عند تجاوز الرصيد
                    if (next !== null && next > balance) {
                      setWithdrawError(`المبلغ يتجاوز الرصيد المتاح (${balance} عملة)`);
                    } else {
                      setWithdrawError(null);
                    }
                  }}
                  min="0"
                  max={balance}
                />
                {withdrawError && (
                  <p className="text-xs text-red-600 mt-1" role="alert">{withdrawError}</p>
                )}
              </div>

              <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  الرصيد المتاح: <span className="font-bold">{balance}</span> عملة
                </p>
              </div>

              <Button
                onClick={handleWithdraw}
                disabled={!withdrawAmount || withdrawAmount <= 0 || !walletQuery.data || withdrawAmount > balance || updateBalanceMutation.isPending}
                className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white"
              >
                {updateBalanceMutation.isPending ? "جاري السحب..." : "سحب الآن"}
              </Button>
            </div>
          </Card>

          {/* Quick Actions */}
          <Card className="p-6 border-0 shadow-lg">
            <h2 className="text-xl font-bold mb-4">عمليات سريعة</h2>
            
            <div className="space-y-2">
              {[100, 500, 1000, 5000].map((amount) => (
                <Button
                  key={amount}
                  variant="outline"
                  onClick={() => setPurchaseAmount(Math.min(amount, MAX_PURCHASE_AMOUNT))}
                  className="w-full justify-start"
                >
                  <span className="ml-2">{amount}</span> عملة
                </Button>
              ))}
            </div>
          </Card>
        </div>

        {/* Transaction History */}
        <Card className="p-6 border-0 shadow-lg mt-8">
          <h2 className="text-2xl font-bold mb-6">سجل العمليات</h2>
          
          <div className="space-y-3">
            {transactionQuery.data && transactionQuery.data.length > 0 ? (
              transactionQuery.data.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {transaction.amount > 0 ? (
                      <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full">
                        <ArrowDownLeft className="w-5 h-5 text-green-600" />
                      </div>
                    ) : (
                      <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full">
                        <ArrowUpRight className="w-5 h-5 text-red-600" />
                      </div>
                    )}
                    <div>
                      <p className="font-semibold">{transaction.type}</p>
                      <p className="text-sm text-gray-500">{transaction.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${transaction.amount > 0 ? "text-green-600" : "text-red-600"}`}>
                      {transaction.amount > 0 ? "+" : ""}{transaction.amount}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(transaction.createdAt).toLocaleDateString('ar-SA')}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 py-8">لا توجد عمليات حالياً</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
