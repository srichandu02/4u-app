import React, { useState, useEffect } from "react";
import { Bell, Check, UserPlus, Heart, Trophy, MessageCircle, Gamepad2, Radio, Sparkles } from "lucide-react";
import { Modal } from "../../components/ui/Modal";
import { Avatar } from "../../components/ui/Avatar";
import { fetchUserNotifications, markAllNotificationsAsRead, subscribeToNotifications } from "../../services/notificationService";

export function NotificationDrawer({ isOpen, onClose, currentUserId, onNotificationClick }) {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!isOpen || !currentUserId) return;
    (async () => {
      const data = await fetchUserNotifications(currentUserId);
      setNotifications(data);
    })();

    const unsub = subscribeToNotifications(currentUserId, (newNotif) => {
      setNotifications((prev) => [newNotif, ...prev]);
    });

    return unsub;
  }, [isOpen, currentUserId]);

  const handleMarkAllRead = async () => {
    await markAllNotificationsAsRead(currentUserId);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const getIcon = (type) => {
    switch (type) {
      case "friend_request":
      case "friend_accept":
        return <UserPlus size={16} className="text-[#10B981]" />;
      case "post_like":
        return <Heart size={16} className="text-[#FF5E3A]" />;
      case "comment":
        return <MessageCircle size={16} className="text-[#3B82F6]" />;
      case "game_invite":
        return <Gamepad2 size={16} className="text-[#FFAB38]" />;
      case "achievement":
        return <Trophy size={16} className="text-[#FFAB38]" />;
      default:
        return <Sparkles size={16} className="text-[#8B5CF6]" />;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Activity & Notifications 🔔">
      <div className="flex flex-col gap-3">
        <div className="flex justify-between items-center px-1">
          <span className="text-xs text-[#A6A1CC] f-body">Recent Updates</span>
          <button
            onClick={handleMarkAllRead}
            className="text-xs text-[#FF5E3A] hover:underline flex items-center gap-1 f-body cursor-pointer font-medium"
          >
            <Check size={14} /> Mark all read
          </button>
        </div>

        {notifications.length === 0 ? (
          <div className="py-12 text-center text-xs text-[#A6A1CC] f-body">
            <Bell size={28} className="mx-auto text-[#A6A1CC] mb-2 opacity-50" />
            You're all caught up! No notifications right now.
          </div>
        ) : (
          <div className="flex flex-col gap-2 max-h-80 overflow-y-auto no-scrollbar">
            {notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => onNotificationClick && onNotificationClick(n)}
                className={`p-3 rounded-2xl border flex items-center gap-3 transition-all cursor-pointer ${
                  n.is_read
                    ? "bg-[#13122A] border-[#363168]"
                    : "bg-[#1C1A3A] border-[#FF5E3A]/50 shadow-md"
                }`}
              >
                {n.actor ? (
                  <div className="relative">
                    <Avatar name={n.actor.name} src={n.actor.avatar_url} size={40} />
                    <span className="absolute -bottom-1 -right-1 p-0.5 rounded-full bg-[#13122A]">
                      {getIcon(n.type)}
                    </span>
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-2xl bg-[#FF5E3A]/20 flex items-center justify-center text-lg border border-[#FF5E3A]/40 flex-shrink-0">
                    {getIcon(n.type)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="f-display font-bold text-xs text-[#F5F3FF] truncate">{n.title}</h4>
                  <p className="f-body text-[11px] text-[#A6A1CC] truncate">{n.body}</p>
                </div>
                {!n.is_read && (
                  <span className="w-2 h-2 rounded-full bg-[#FF5E3A] flex-shrink-0" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
