
import React, { useState } from "react";
import { Radio, Users, MessageCircle, Heart, Share2 } from "lucide-react";

export default function LiveEnhanced() {
  const [liked, setLiked] = useState(false);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <div className="relative flex-1">
        <video
          className="w-full h-[60vh] object-cover"
          autoPlay
          muted
          loop
          playsInline
          src="https://www.w3schools.com/html/mov_bbb.mp4"
        />

        <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-600 px-3 py-1 rounded-full text-sm font-bold">
          <Radio size={16} />
          LIVE
        </div>

        <div className="absolute top-4 right-4 bg-black/60 px-3 py-1 rounded-full text-sm flex items-center gap-2">
          <Users size={16} />
          1.2K
        </div>

        <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
          <div>
            <h2 className="font-bold text-lg">@yamshat_live</h2>
            <p className="text-sm opacity-80">
              بث مباشر تجريبي مطور للمشروع
            </p>
          </div>

          <div className="flex flex-col gap-4 items-center">
            <button
              onClick={() => setLiked(!liked)}
              className="bg-white/10 p-3 rounded-full"
            >
              <Heart
                size={24}
                fill={liked ? "red" : "transparent"}
                color={liked ? "red" : "white"}
              />
            </button>

            <button className="bg-white/10 p-3 rounded-full">
              <MessageCircle size={24} />
            </button>

            <button className="bg-white/10 p-3 rounded-full">
              <Share2 size={24} />
            </button>
          </div>
        </div>
      </div>

      <div className="h-[40vh] overflow-y-auto bg-zinc-900 p-4">
        <h3 className="font-bold mb-3">التعليقات المباشرة</h3>

        <div className="space-y-3 text-sm">
          <div className="bg-zinc-800 p-3 rounded-xl">
            🔥 بث ممتاز جداً
          </div>

          <div className="bg-zinc-800 p-3 rounded-xl">
            👏 التصميم صار احترافي
          </div>

          <div className="bg-zinc-800 p-3 rounded-xl">
            ❤️ جودة البث ممتازة
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <input
            className="flex-1 bg-zinc-800 rounded-xl px-4 py-3 outline-none"
            placeholder="اكتب تعليق..."
          />
          <button className="bg-red-600 px-5 rounded-xl">
            إرسال
          </button>
        </div>
      </div>
    </div>
  );
}
