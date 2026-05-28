
import React from "react";
import WifiOff from "lucide-react/dist/esm/icons/wifi-off";

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-6 text-center">
      <div className="bg-zinc-900 p-6 rounded-3xl shadow-2xl">
        <WifiOff size={70} className="mx-auto mb-5 text-red-500" />
        <h1 className="text-3xl font-bold mb-3">
          أنت غير متصل بالإنترنت
        </h1>

        <p className="opacity-70 mb-6">
          يمكنك الاستمرار بتصفح المحتوى المحفوظ مؤقتاً حتى يعود الاتصال.
        </p>

        <button
          onClick={() => window.location.reload()}
          className="bg-red-600 px-6 py-3 rounded-2xl"
        >
          إعادة المحاولة
        </button>
      </div>
    </div>
  );
}
