import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Bell, Heart, MessageCircle, Gift, Users, Radio, Trash2 } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";

const NOTIFICATION_ICONS: Record<string, any> = {
  follow: { icon: Users, color: "text-blue-500", bg: "bg-blue-100 dark:bg-blue-900/30" },
  like: { icon: Heart, color: "text-red-500", bg: "bg-red-100 dark:bg-red-900/30" },
  comment: { icon: MessageCircle, color: "text-green-500", bg: "bg-green-100 dark:bg-green-900/30" },
  gift: { icon: Gift, color: "text-yellow-500", bg: "bg-yellow-100 dark:bg-yellow-900/30" },
  message: { icon: MessageCircle, color: "text-purple-500", bg: "bg-purple-100 dark:bg-purple-900/30" },
  stream: { icon: Radio, color: "text-orange-500", bg: "bg-orange-100 dark:bg-orange-900/30" },
};

export default function Notifications() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [filter, setFilter] = useState<string>("all");

  // Queries
  const notificationsQuery = trpc.notifications.list.useQuery({ limit: 100 }, { enabled: isAuthenticated });
  const markAsReadMutation = trpc.notifications.markAsRead.useMutation();

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      await markAsReadMutation.mutateAsync(notificationId);
      notificationsQuery.refetch();
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <Card className="p-8 text-center">
          <p className="text-gray-600 mb-4">يجب تسجيل الدخول لعرض الإشعارات</p>
          <Button onClick={() => setLocation("/")}>العودة للرئيسية</Button>
        </Card>
      </div>
    );
  }

  const notifications = notificationsQuery.data || [];
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const filteredNotifications = filter === "all" 
    ? notifications 
    : notifications.filter(n => n.type === filter);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 flex items-center gap-2">
              <Bell className="w-8 h-8" />
              الإشعارات
            </h1>
            {unreadCount > 0 && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                لديك {unreadCount} إشعارات جديدة
              </p>
            )}
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            onClick={() => setFilter("all")}
            className={filter === "all" ? "bg-gradient-to-r from-blue-600 to-purple-600" : ""}
          >
            الكل
          </Button>
          {Object.keys(NOTIFICATION_ICONS).map((type) => (
            <Button
              key={type}
              variant={filter === type ? "default" : "outline"}
              onClick={() => setFilter(type)}
              className={filter === type ? "bg-gradient-to-r from-blue-600 to-purple-600" : ""}
            >
              {type}
            </Button>
          ))}
        </div>

        {/* Notifications List */}
        <div className="space-y-3">
          {filteredNotifications.length > 0 ? (
            filteredNotifications.map((notification) => {
              const notifConfig = NOTIFICATION_ICONS[notification.type] || NOTIFICATION_ICONS.message;
              const Icon = notifConfig.icon;

              return (
                <Card
                  key={notification.id}
                  className={`p-4 border-0 shadow-lg cursor-pointer transition-all hover:shadow-xl ${
                    !notification.isRead ? "bg-blue-50 dark:bg-blue-900/20" : ""
                  }`}
                  onClick={() => !notification.isRead && handleMarkAsRead(notification.id)}
                >
                  <div className="flex gap-4 items-start">
                    <div className={`p-3 rounded-full flex-shrink-0 ${notifConfig.bg}`}>
                      <Icon className={`w-6 h-6 ${notifConfig.color}`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {notification.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {notification.body}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        {new Date(notification.createdAt).toLocaleDateString('ar-SA', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>

                    <div className="flex-shrink-0 flex items-center gap-2">
                      {!notification.isRead && (
                        <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-gray-400 hover:text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })
          ) : (
            <Card className="p-8 text-center border-0 shadow-lg">
              <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">لا توجد إشعارات</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
