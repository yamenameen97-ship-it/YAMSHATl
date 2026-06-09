import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Share2, Smile } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Post } from "@/types";
import ReactionPicker from "./ReactionPicker";

interface PostCardProps {
  post: Post;
}

export default function PostCard({ post }: PostCardProps) {
  const [showReactions, setShowReactions] = useState(false);
  const utils = trpc.useUtils();

  const reactionCountsQuery = trpc.reactions.getCounts.useQuery({ postId: post.id });
  const userReactionQuery = trpc.reactions.getUserReaction.useQuery({ postId: post.id });
  const createReactionMutation = trpc.reactions.create.useMutation({
    onSuccess: () => {
      utils.reactions.getCounts.invalidate({ postId: post.id });
      utils.reactions.getUserReaction.invalidate({ postId: post.id });
    },
  });

  const handleReaction = (type: "like" | "love" | "haha" | "wow" | "sad" | "angry") => {
    createReactionMutation.mutate({ postId: post.id, type });
    setShowReactions(false);
  };

  const reactionEmojis = {
    like: "👍",
    love: "❤️",
    haha: "😆",
    wow: "😮",
    sad: "😢",
    angry: "😡",
  };

  return (
    <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 overflow-hidden hover:border-purple-500/50 transition-colors">
      {/* Post Header */}
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500" />
          <div>
            <h4 className="text-white font-semibold">المستخدم</h4>
            <p className="text-gray-400 text-sm">قبل ساعة</p>
          </div>
        </div>
      </div>

      {/* Post Content */}
      <div className="p-4">
        <p className="text-gray-100 mb-4">{post.content}</p>

        {post.image && (
          <img
            src={post.image}
            alt="Post"
            className="w-full rounded-lg mb-4 max-h-96 object-cover"
          />
        )}

        {post.hashtags && (
          <div className="flex flex-wrap gap-2 mb-4">
            {(post.hashtags as string[]).map((tag, idx) => (
              <span key={idx} className="text-purple-400 text-sm hover:text-purple-300 cursor-pointer">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Reaction Counts */}
      {reactionCountsQuery.data && (
        <div className="px-4 py-2 border-t border-slate-700 text-sm text-gray-400">
          <div className="flex gap-4">
            {reactionCountsQuery.data.likeCount > 0 && (
              <span>👍 {reactionCountsQuery.data.likeCount}</span>
            )}
            {reactionCountsQuery.data.loveCount > 0 && (
              <span>❤️ {reactionCountsQuery.data.loveCount}</span>
            )}
            {reactionCountsQuery.data.hahaCount > 0 && (
              <span>😆 {reactionCountsQuery.data.hahaCount}</span>
            )}
            {reactionCountsQuery.data.wowCount > 0 && (
              <span>😮 {reactionCountsQuery.data.wowCount}</span>
            )}
            {reactionCountsQuery.data.sadCount > 0 && (
              <span>😢 {reactionCountsQuery.data.sadCount}</span>
            )}
            {reactionCountsQuery.data.angryCount > 0 && (
              <span>😡 {reactionCountsQuery.data.angryCount}</span>
            )}
          </div>
        </div>
      )}

      {/* Post Actions */}
      <div className="px-4 py-3 border-t border-slate-700 flex gap-2">
        <div className="relative flex-1">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-gray-300 hover:text-purple-400"
            onClick={() => setShowReactions(!showReactions)}
          >
            <Smile className="w-4 h-4 mr-2" />
            تفاعل
          </Button>

          {showReactions && (
            <ReactionPicker
              onSelect={handleReaction}
              onClose={() => setShowReactions(false)}
            />
          )}
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="flex-1 text-gray-300 hover:text-blue-400"
        >
          <MessageCircle className="w-4 h-4 mr-2" />
          تعليق
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="flex-1 text-gray-300 hover:text-green-400"
        >
          <Share2 className="w-4 h-4 mr-2" />
          شارك
        </Button>
      </div>
    </Card>
  );
}
