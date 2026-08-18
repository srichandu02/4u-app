import { supabase, isSupabaseConfigured } from "../supabaseClient";

export async function fetchMatchMessages(matchId) {
  if (!isSupabaseConfigured()) {
    return [
      { id: "m1", match_id: matchId, sender_id: "them", kind: "text", body: "Hey there! Glad we connected on 4U 👋", is_read: true, created_at: new Date(Date.now() - 600000).toISOString() },
      { id: "m2", match_id: matchId, sender_id: "them", kind: "text", body: "Wanna play a quick game of Tic Tac Toe?", is_read: true, created_at: new Date(Date.now() - 300000).toISOString() },
    ];
  }

  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("match_id", matchId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function sendChatMessage(matchId, senderId, body, kind = "text", mediaUrl = null, metadata = {}) {
  if (!isSupabaseConfigured()) {
    return {
      id: "msg_" + Date.now(),
      match_id: matchId,
      sender_id: senderId,
      kind,
      body,
      media_url: mediaUrl,
      metadata,
      is_read: false,
      created_at: new Date().toISOString(),
    };
  }

  const { data, error } = await supabase
    .from("messages")
    .insert({
      match_id: matchId,
      sender_id: senderId,
      body: body || "",
      kind,
      media_url: mediaUrl,
      metadata,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function markMessagesAsRead(matchId, currentUserId) {
  if (!isSupabaseConfigured() || !matchId) return;
  try {
    await supabase
      .from("messages")
      .update({ is_read: true })
      .eq("match_id", matchId)
      .neq("sender_id", currentUserId)
      .eq("is_read", false);
  } catch (e) {}
}

export function subscribeToMatchMessages(matchId, onNewMessage) {
  if (!isSupabaseConfigured()) {
    return () => {};
  }

  const channel = supabase
    .channel(`messages-${matchId}`)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "messages", filter: `match_id=eq.${matchId}` },
      (payload) => onNewMessage(payload.new)
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
}

// Dedicated presence / typing channel manager per active chat
const activeChatChannels = new Map();

export function getOrCreateChatChannel(matchId) {
  if (!isSupabaseConfigured() || !matchId) return null;
  if (!activeChatChannels.has(matchId)) {
    const channel = supabase.channel(`chat-presence-${matchId}`);
    channel.subscribe();
    activeChatChannels.set(matchId, channel);
  }
  return activeChatChannels.get(matchId);
}

export function broadcastTyping(matchId, userId, isTyping) {
  const channel = getOrCreateChatChannel(matchId);
  if (!channel) return;
  channel.send({
    type: "broadcast",
    event: "typing",
    payload: { userId, isTyping },
  });
}

export function subscribeToTyping(matchId, onTypingChange) {
  const channel = getOrCreateChatChannel(matchId);
  if (!channel) return () => {};

  channel.on("broadcast", { event: "typing" }, (payload) => {
    onTypingChange(payload.payload);
  });

  return () => {
    // cleanup
  };
}
