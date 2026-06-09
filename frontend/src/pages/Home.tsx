import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Heart, Laugh, Smile, Zap, Frown, Angry, Share2, MessageCircle } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";

const REACTION_ICONS = {
  like: { icon: Smile, label: "إعجاب", color: "text-blue-500" },
  heart: { icon: Heart, label: "قلب", color: "text-red-500" },
  laugh: { icon: Laugh, label: "ضحك", color: "text-yellow-500" },
  surprise: { icon: Zap, label: "دهشة", color: "text-purple-500" },
  sad: { icon: Frown, label: "حزن", color: "text-gray-500" },
  angry: { icon: Angry, label: "غضب", color: "text-orange-500" },
};

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [postContent, setPostContent] = useState("");
  const [selectedReactions, setSelectedReactions] = useState<Record<number, string>>({});

  // Queries
  const postsQuery = trpc.posts.list.useQuery({ limit: 20 });
  const createPostMutation = trpc.posts.create.useMutation();
  const addReactionMutation = trpc.reactions.add.useMutation();
  const reactionStatsQuery = trpc.reactions.getStats.useQuery(1, { enabled: false });

  const handleCreatePost = async () => {
    if (!postContent.trim()) return;
    
    try {
      await createPostMutation.mutateAsync({
        content: postContent,
      });
      setPostContent("");
      postsQuery.refetch();
    } catch (error) {
      console.error("Failed to create post:", error);
    }
  };

  const handleAddReaction = async (postId: number, type: string) => {
    try {
      await addReactionMutation.mutateAsync({
        postId,
        type: type as any,
      });
      setSelectedReactions(prev => ({
        ...prev,
        [postId]: type,
      }));
      postsQuery.refetch();
    } catch (error) {
      console.error("Failed to add reaction:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
            YamChat
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">منصة تواصل اجتماعي متكاملة</p>
        </div>

        {/* Create Post Section */}
        {isAuthenticated && (
          <Card className="p-6 mb-8 border-0 shadow-lg">
            <div className="flex gap-4 mb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                {user?.name?.[0] || "U"}
              </div>
              <div className="flex-1">
                <Textarea
                  placeholder="ماذا في بالك؟"
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  className="resize-none border-0 bg-gray-100 dark:bg-gray-800"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setPostContent("")}
              >
                إلغاء
              </Button>
              <Button
                onClick={handleCreatePost}
                disabled={!postContent.trim() || createPostMutation.isPending}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {createPostMutation.isPending ? "جاري الإرسال..." : "نشر"}
              </Button>
            </div>
          </Card>
        )}

        {/* Login Prompt */}
        {!isAuthenticated && (
          <Card className="p-8 mb-8 border-0 shadow-lg text-center">
            <h2 className="text-2xl font-bold mb-4">مرحباً بك في YamChat</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              انضم إلينا الآن واستمتع بتجربة تواصل اجتماعي فريدة
            </p>
            <Button
              onClick={() => window.location.href = getLoginUrl()}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-2"
            >
              تسجيل الدخول
            </Button>
          </Card>
        )}

        {/* Posts Feed */}
        <div className="space-y-6">
          {postsQuery.isLoading ? (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : postsQuery.data && postsQuery.data.length > 0 ? (
            postsQuery.data.map((post) => (
              <Card key={post.id} className="p-6 border-0 shadow-lg hover:shadow-xl transition-shadow">
                <div className="flex gap-4 mb-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                    {post.id % 10}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">مستخدم #{post.userId}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(post.createdAt).toLocaleDateString('ar-SA')}
                    </p>
                  </div>
                </div>

                {/* Post Content */}
                <p className="text-gray-800 dark:text-gray-200 mb-4 leading-relaxed">
                  {post.content}
                </p>

                {/* Post Stats */}
                <div className="flex gap-6 mb-4 text-sm text-gray-600 dark:text-gray-400">
                  <span>❤️ {post.likesCount} إعجاب</span>
                  <span>💬 {post.commentsCount} تعليق</span>
                  <span>🔄 {post.sharesCount} مشاركة</span>
                </div>

                {/* Reactions */}
                <div className="flex gap-2 flex-wrap">
                  {Object.entries(REACTION_ICONS).map(([type, { icon: Icon, label, color }]) => (
                    <Button
                      key={type}
                      variant={selectedReactions[post.id] === type ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleAddReaction(post.id, type)}
                      className={`gap-1 ${selectedReactions[post.id] === type ? "bg-gradient-to-r from-blue-600 to-purple-600" : ""}`}
                    >
                      <Icon className={`w-4 h-4 ${color}`} />
                      <span className="text-xs">{label}</span>
                    </Button>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Button variant="ghost" size="sm" className="flex-1">
                    <MessageCircle className="w-4 h-4 ml-2" />
                    رد
                  </Button>
                  <Button variant="ghost" size="sm" className="flex-1">
                    <Share2 className="w-4 h-4 ml-2" />
                    مشاركة
                  </Button>
                </div>
              </Card>
            ))
          ) : (
            <Card className="p-8 text-center border-0 shadow-lg">
              <p className="text-gray-600 dark:text-gray-400">لا توجد منشورات حالياً</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
