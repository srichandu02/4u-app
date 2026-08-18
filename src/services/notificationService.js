import { supabase, isSupabaseConfigured } from "../supabaseClient";

const MOCK_NOTIFICATIONS = [
  {
    id: "n1",
    type: "friend_request",
    title: "New Friend Request",
    body: "Aisha sent you a friend request",
    actor: { name: "Aisha", avatar_url: null },
    is_read: false,
    created_at: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    id: "n2",
    type: "post_like",
    title: "Post Liked",
    body: "Meera liked your post",
    actor: { name: "Meera", avatar_url: null },
    is_read: false,
    created_at: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: "n3",
    type: "achievement",
    title: "Achievement Unlocked! 🏆",
    body: "You unlocked 'First Connection' and earned +50 XP",
    actor: null,
    is_read: true,
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
];

export async function createNotification({
  userId,
  actorId = null,
  type,
  title,
  body,
  entityId = null,
  entityType = null,
}) {
  if (!isSupabaseConfigured() || !userId) return;
  if (actorId && actorId === userId) return; // Don't notify oneself

  try {
    const { data, error } = await supabase
      .from("notifications")
      .insert({
        user_id: userId,
        actor_id: actorId,
        type,
        title,
        body,
        entity_id: entityId,
        entity_type: entityType,
        is_read: false,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (e) {
    console.warn("Failed to create notification:", e);
  }
}

export async function fetchUserNotifications(userId) {
  if (!isSupabaseConfigured()) {
    return MOCK_NOTIFICATIONS;
  }
  try {
    const { data, error } = await supabase
      .from("notifications")
      .select("*, actor:actor_id(id, name, username, avatar_url, verified)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error || !data || data.length === 0) return MOCK_NOTIFICATIONS;
    return data;
  } catch (e) {
    return MOCK_NOTIFICATIONS;
  }
}

export async function markNotificationAsRead(notificationId) {
  if (!isSupabaseConfigured()) return;
  try {
    await supabase.from("notifications").update({ is_read: true }).eq("id", notificationId);
  } catch (e) {}
}

export async function markAllNotificationsAsRead(userId) {
  if (!isSupabaseConfigured()) return;
  try {
    await supabase.from("notifications").update({ is_read: true }).eq("user_id", userId);
  } catch (e) {}
}

export function subscribeToNotifications(userId, onNewNotification) {
  if (!isSupabaseConfigured() || !userId) return () => {};
  const channel = supabase
    .channel(`notifications-realtime-${userId}`)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
      (payload) => onNewNotification(payload.new)
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
}
