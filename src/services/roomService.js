import { supabase, isSupabaseConfigured } from "../supabaseClient";
import { awardXpAndCoins } from "./gamificationService";

export const SEED_ROOMS = [
  { id: "r1", title: "Late night lo-fi & chill vibes", host: "Aisha", host_id: "p1", tag: "Music", listeners: 14, is_live: true },
  { id: "r2", title: "Unpopular movie opinions thread", host: "Zara", host_id: "p5", tag: "Movies", listeners: 8, is_live: true },
  { id: "r3", title: "Startup war stories & dev talk", host: "Rohan", host_id: "p2", tag: "Tech", listeners: 19, is_live: true },
  { id: "r4", title: "Digital art & anime sketch club", host: "Meera", host_id: "p3", tag: "Art", listeners: 6, is_live: true },
];

export async function fetchLiveRooms() {
  if (!isSupabaseConfigured()) {
    return SEED_ROOMS;
  }
  try {
    const { data: rooms, error } = await supabase
      .from("rooms")
      .select(`
        *,
        host:host_id(id, name, username, avatar_url, verified),
        participants:room_participants(user_id, role, is_muted, profiles(id, name, username, avatar_url))
      `)
      .eq("is_live", true)
      .order("created_at", { ascending: false });

    if (error || !rooms || rooms.length === 0) return SEED_ROOMS;

    return rooms.map((r) => ({
      ...r,
      listeners: (r.participants || []).length || 1,
    }));
  } catch (e) {
    return SEED_ROOMS;
  }
}

export async function createLiveRoom(hostId, title, tag = "General") {
  if (!isSupabaseConfigured()) {
    const newRoom = {
      id: "room_" + Date.now(),
      title,
      host: "You",
      host_id: hostId,
      tag,
      listeners: 1,
      is_live: true,
      participants: [{ user_id: hostId, role: "host", profiles: { id: hostId, name: "You" } }],
    };
    SEED_ROOMS.unshift(newRoom);
    return newRoom;
  }

  const { data, error } = await supabase
    .from("rooms")
    .insert({ host_id: hostId, title: title.trim(), tag, is_live: true })
    .select("*, host:host_id(id, name, username, avatar_url)")
    .single();

  if (error) throw error;

  await supabase.from("room_participants").insert({ room_id: data.id, user_id: hostId, role: "host" });
  await awardXpAndCoins(hostId, 30, 15);

  return data;
}

export async function joinLiveRoom(roomId, userId, role = "listener") {
  if (!isSupabaseConfigured()) return true;
  try {
    await supabase.from("room_participants").upsert(
      { room_id: roomId, user_id: userId, role, is_muted: false, joined_at: new Date().toISOString() },
      { onConflict: "room_id,user_id" }
    );
    await awardXpAndCoins(userId, 5, 2);
    return true;
  } catch (e) {
    return false;
  }
}

export async function leaveLiveRoom(roomId, userId) {
  if (!isSupabaseConfigured()) return true;
  try {
    await supabase.from("room_participants").delete().eq("room_id", roomId).eq("user_id", userId);
    return true;
  } catch (e) {
    return false;
  }
}

export async function endLiveRoom(roomId, hostId) {
  if (!isSupabaseConfigured()) {
    const idx = SEED_ROOMS.findIndex((r) => r.id === roomId);
    if (idx !== -1) SEED_ROOMS.splice(idx, 1);
    return true;
  }
  await supabase.from("rooms").update({ is_live: false }).eq("id", roomId).eq("host_id", hostId);
  return true;
}

export async function updateParticipantRole(roomId, targetUserId, newRole) {
  if (!isSupabaseConfigured()) return true;
  await supabase.from("room_participants").update({ role: newRole }).eq("room_id", roomId).eq("user_id", targetUserId);
  return true;
}

export function subscribeToRoomBroadcast(roomId, onReaction, onMessage) {
  if (!isSupabaseConfigured() || !roomId) return () => {};

  const channel = supabase
    .channel(`room-live-${roomId}`)
    .on("broadcast", { event: "reaction" }, (p) => onReaction && onReaction(p.payload))
    .on("broadcast", { event: "chat" }, (p) => onMessage && onMessage(p.payload))
    .subscribe();

  return () => supabase.removeChannel(channel);
}

export function broadcastRoomReaction(roomId, emoji, senderName) {
  if (!isSupabaseConfigured() || !roomId) return;
  const channel = supabase.channel(`room-live-${roomId}`);
  channel.send({
    type: "broadcast",
    event: "reaction",
    payload: { emoji, senderName, id: Math.random().toString(36).slice(2) },
  });
}

export function broadcastRoomMessage(roomId, senderName, text) {
  if (!isSupabaseConfigured() || !roomId) return;
  const channel = supabase.channel(`room-live-${roomId}`);
  channel.send({
    type: "broadcast",
    event: "chat",
    payload: { senderName, text, id: Math.random().toString(36).slice(2), time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
  });
}
