import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MessageCircle, Send, Search, Plus } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";

interface Chat {
  id: number;
  name: string;
  avatar: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
}

interface Message {
  id: number;
  senderId: number;
  senderName: string;
  content: string;
  timestamp: string;
  isOwn: boolean;
}

export default function Messages() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedChat, setSelectedChat] = useState<number | null>(null);
  const [messageText, setMessageText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Mock data
  const chats: Chat[] = [
    {
      id: 1,
      name: "أحمد محمد",
      avatar: "A",
      lastMessage: "شكراً على المشاركة!",
      timestamp: "قبل 5 دقائق",
      unread: 2,
    },
    {
      id: 2,
      name: "فاطمة علي",
      avatar: "F",
      lastMessage: "هل تريد البث معاً؟",
      timestamp: "قبل ساعة",
      unread: 0,
    },
    {
      id: 3,
      name: "محمود حسن",
      avatar: "M",
      lastMessage: "رائع جداً!",
      timestamp: "أمس",
      unread: 1,
    },
  ];

  const messages: Message[] = [
    {
      id: 1,
      senderId: 1,
      senderName: "أحمد محمد",
      content: "مرحباً! كيف حالك؟",
      timestamp: "10:30",
      isOwn: false,
    },
    {
      id: 2,
      senderId: user?.id || 0,
      senderName: "أنت",
      content: "مرحباً! أنا بخير، شكراً للسؤال",
      timestamp: "10:32",
      isOwn: true,
    },
    {
      id: 3,
      senderId: 1,
      senderName: "أحمد محمد",
      content: "هل تريد البث معاً اليوم؟",
      timestamp: "10:35",
      isOwn: false,
    },
    {
      id: 4,
      senderId: user?.id || 0,
      senderName: "أنت",
      content: "بالتأكيد! سأكون جاهزاً الساعة 8 مساءً",
      timestamp: "10:37",
      isOwn: true,
    },
    {
      id: 5,
      senderId: 1,
      senderName: "أحمد محمد",
      content: "شكراً على المشاركة!",
      timestamp: "10:40",
      isOwn: false,
    },
  ];

  const filteredChats = chats.filter(chat =>
    chat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSendMessage = () => {
    if (messageText.trim()) {
      // ✅ v59.0: تم إزالة console.log من الإنتاج.
      // ملاحظة: هذا الملف legacy غير مرتبط بنظام الشات الأساسي (Chat.jsx)،
      // ويُحتفظ به للتوافق فقط. الإرسال الفعلي يحدث في ChatInput.jsx + api/chat.js.
      setMessageText("");
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <Card className="p-8 text-center">
          <p className="text-gray-600 mb-4">يجب تسجيل الدخول لعرض الرسائل</p>
          <Button onClick={() => setLocation("/")}>العودة للرئيسية</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex">
      {/* Chats List */}
      <div className="w-full md:w-80 border-r border-gray-200 dark:border-gray-700 flex flex-col bg-white dark:bg-slate-900">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <MessageCircle className="w-6 h-6" />
            الرسائل
          </h1>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <Input
              placeholder="ابحث عن محادثة..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-gray-100 dark:bg-gray-800 border-0"
            />
          </div>
        </div>

        {/* Chats */}
        <div className="flex-1 overflow-y-auto">
          {filteredChats.map((chat) => (
            <div
              key={chat.id}
              onClick={() => setSelectedChat(chat.id)}
              className={`p-4 border-b border-gray-100 dark:border-gray-800 cursor-pointer transition-colors ${
                selectedChat === chat.id
                  ? "bg-blue-50 dark:bg-blue-900/20"
                  : "hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
            >
              <div className="flex gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                  {chat.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {chat.name}
                    </h3>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {chat.timestamp}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                    {chat.lastMessage}
                  </p>
                </div>
                {chat.unread > 0 && (
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center flex-shrink-0">
                    {chat.unread}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* New Chat Button */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600">
            <Plus className="w-4 h-4 ml-2" />
            محادثة جديدة
          </Button>
        </div>
      </div>

      {/* Chat View */}
      {selectedChat ? (
        <div className="hidden md:flex flex-1 flex-col">
          {/* Chat Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                A
              </div>
              <div>
                <h2 className="font-semibold text-gray-900 dark:text-white">
                  أحمد محمد
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  نشط الآن
                </p>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.isOwn ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-xs px-4 py-2 rounded-lg ${
                    message.isOwn
                      ? "bg-blue-600 text-white rounded-br-none"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-none"
                  }`}
                >
                  <p>{message.content}</p>
                  <p className={`text-xs mt-1 ${
                    message.isOwn ? "text-blue-100" : "text-gray-500 dark:text-gray-400"
                  }`}>
                    {message.timestamp}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Message Input */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900">
            <div className="flex gap-2">
              <Input
                placeholder="اكتب رسالة..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                className="flex-1"
              />
              <Button
                onClick={handleSendMessage}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center bg-white dark:bg-slate-900">
          <div className="text-center">
            <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              اختر محادثة لبدء الرسائل
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
