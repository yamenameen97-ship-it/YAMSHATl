import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Users, Gift, Radio, X } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";

export default function LiveStream() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamTitle, setStreamTitle] = useState("");
  const [maxGuests, setMaxGuests] = useState(1);
  const [currentStream, setCurrentStream] = useState<any>(null);
  const [guests, setGuests] = useState<any[]>([]);
  const [guestEmail, setGuestEmail] = useState("");

  // Queries
  const liveStreamsQuery = trpc.liveStreams.list.useQuery({ limit: 20 });
  const createStreamMutation = trpc.liveStreams.create.useMutation();
  const endStreamMutation = trpc.liveStreams.end.useMutation();
  const addGuestMutation = trpc.streamGuests.add.useMutation();
  const removeGuestMutation = trpc.streamGuests.remove.useMutation();
  const getGuestsQuery = trpc.streamGuests.getByStream.useQuery(currentStream?.id || 0, {
    enabled: !!currentStream?.id,
  });

  const handleStartStream = async () => {
    if (!streamTitle.trim() || !isAuthenticated) return;

    try {
      await createStreamMutation.mutateAsync({
        title: streamTitle,
        maxGuests,
      });
      setStreamTitle("");
      setIsStreaming(true);
      liveStreamsQuery.refetch();
    } catch (error) {
      console.error("Failed to start stream:", error);
    }
  };

  const handleEndStream = async () => {
    if (!currentStream) return;

    try {
      await endStreamMutation.mutateAsync(currentStream.id);
      setIsStreaming(false);
      setCurrentStream(null);
      setGuests([]);
      liveStreamsQuery.refetch();
    } catch (error) {
      console.error("Failed to end stream:", error);
    }
  };

  const handleAddGuest = async () => {
    if (!guestEmail.trim() || !currentStream) return;

    try {
      await addGuestMutation.mutateAsync({
        streamId: currentStream.id,
        guestId: parseInt(guestEmail) || 0,
        seatNumber: guests.length + 1,
      });
      setGuestEmail("");
      getGuestsQuery.refetch();
    } catch (error) {
      console.error("Failed to add guest:", error);
    }
  };

  const handleRemoveGuest = async (guestId: number) => {
    if (!currentStream) return;

    try {
      await removeGuestMutation.mutateAsync({
        streamId: currentStream.id,
        guestId,
      });
      getGuestsQuery.refetch();
    } catch (error) {
      console.error("Failed to remove guest:", error);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <Card className="p-8 text-center">
          <p className="text-gray-600 mb-4">يجب تسجيل الدخول لاستخدام البث المباشر</p>
          <Button onClick={() => setLocation("/")}>العودة للرئيسية</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-pink-600 flex items-center gap-2">
            <Radio className="w-8 h-8" />
            البث المباشر
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Start Stream Section */}
          <div className="lg:col-span-2">
            {!isStreaming ? (
              <Card className="p-6 border-0 shadow-lg">
                <h2 className="text-2xl font-bold mb-4">ابدأ بثك المباشر</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">عنوان البث</label>
                    <Input
                      placeholder="أدخل عنوان البث..."
                      value={streamTitle}
                      onChange={(e) => setStreamTitle(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">عدد الضيوف المسموح</label>
                    <div className="flex gap-2">
                      {[1, 2, 4, 6, 9].map((num) => (
                        <Button
                          key={num}
                          variant={maxGuests === num ? "default" : "outline"}
                          onClick={() => setMaxGuests(num)}
                          className={maxGuests === num ? "bg-gradient-to-r from-red-600 to-pink-600" : ""}
                        >
                          {num}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <Button
                    onClick={handleStartStream}
                    disabled={!streamTitle.trim() || createStreamMutation.isPending}
                    className="w-full bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white py-2"
                  >
                    {createStreamMutation.isPending ? "جاري البدء..." : "ابدأ البث"}
                  </Button>
                </div>
              </Card>
            ) : (
              <Card className="p-6 border-0 shadow-lg">
                <div className="bg-black rounded-lg aspect-video mb-4 flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-pulse mb-4">
                      <Radio className="w-16 h-16 text-red-500 mx-auto" />
                    </div>
                    <p className="text-white text-lg font-bold">{streamTitle}</p>
                    <p className="text-gray-400 text-sm mt-2">البث مباشر الآن</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="معرف الضيف (ID)..."
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                    />
                    <Button
                      onClick={handleAddGuest}
                      disabled={!guestEmail.trim() || guests.length >= maxGuests}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      إضافة ضيف
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {guests.map((guest, idx) => (
                      <div
                        key={idx}
                        className="bg-gray-200 dark:bg-gray-700 rounded-lg p-3 flex items-center justify-between"
                      >
                        <span className="font-medium">الضيف {idx + 1}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveGuest(guest.guestId)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  <Button
                    onClick={handleEndStream}
                    disabled={endStreamMutation.isPending}
                    className="w-full bg-red-600 hover:bg-red-700 text-white"
                  >
                    {endStreamMutation.isPending ? "جاري الإنهاء..." : "إنهاء البث"}
                  </Button>
                </div>
              </Card>
            )}
          </div>

          {/* Live Streams List */}
          <div>
            <Card className="p-6 border-0 shadow-lg">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Radio className="w-5 h-5 text-red-500" />
                البث المباشر الآن
              </h3>

              <div className="space-y-3">
                {liveStreamsQuery.data && liveStreamsQuery.data.length > 0 ? (
                  liveStreamsQuery.data.map((stream) => (
                    <div
                      key={stream.id}
                      className="p-3 bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 rounded-lg cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => setCurrentStream(stream)}
                    >
                      <p className="font-semibold text-sm">{stream.title}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        👥 {stream.viewerCount} مشاهد
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        🎁 {stream.totalGiftsValue} عملة
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">لا توجد بث مباشر حالياً</p>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
