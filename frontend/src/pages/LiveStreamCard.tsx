import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Eye, Gift } from "lucide-react";
import { LiveStream } from "@/types";

interface LiveStreamCardProps {
  stream: LiveStream;
}

export default function LiveStreamCard({ stream }: LiveStreamCardProps) {
  return (
    <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 overflow-hidden hover:border-purple-500/50 transition-colors cursor-pointer group">
      {/* Thumbnail */}
      <div className="relative h-40 bg-gradient-to-br from-purple-500/20 to-pink-500/20 overflow-hidden">
        {stream.thumbnail && (
          <img
            src={stream.thumbnail}
            alt={stream.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          />
        )}

        {/* Live Badge */}
        {stream.status === "online" && (
          <div className="absolute top-3 right-3">
            <Badge className="bg-red-500 hover:bg-red-600 animate-pulse">
              <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse" />
              مباشر
            </Badge>
          </div>
        )}

        {/* Viewer Count */}
        <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur px-3 py-1 rounded-full flex items-center gap-2">
          <Eye className="w-4 h-4 text-white" />
          <span className="text-white text-sm">{stream.viewerCount}</span>
        </div>
      </div>

      {/* Stream Info */}
      <div className="p-4">
        <h3 className="text-white font-semibold truncate mb-2">{stream.title}</h3>
        <p className="text-gray-400 text-sm line-clamp-2 mb-4">{stream.description}</p>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-slate-700/50 rounded p-2">
            <div className="text-gray-400 text-xs">المشاهدون</div>
            <div className="text-white font-semibold">{stream.viewerCount}</div>
          </div>
          <div className="bg-slate-700/50 rounded p-2">
            <div className="text-gray-400 text-xs flex items-center gap-1">
              <Gift className="w-3 h-3" />
              الهدايا
            </div>
            <div className="text-white font-semibold">{stream.totalGiftsValue}</div>
          </div>
        </div>

        {/* Action Button */}
        <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
          <Users className="w-4 h-4 mr-2" />
          انضم للبث
        </Button>
      </div>
    </Card>
  );
}
