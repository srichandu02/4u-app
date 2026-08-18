// matchmaking.js
import { supabase } from "./supabaseClient";

// Calls the try_match() Postgres function — see schema.sql.
// Runs as one transaction server-side, so it's safe even if many
// users tap "Connect" at the same moment.
export async function tryMatch(userId, interests) {
  const { data, error } = await supabase.rpc("try_match", {
    p_user_id: userId,
    p_interests: interests,
  });
  if (error) throw error;
  const row = data?.[0];
  if (!row || !row.matched_id) return null; // added to queue, no match yet

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", row.matched_id)
    .single();

  return { profile, matchId: row.matched_match_id };
}

// While waiting in the queue, listen for a new row in `matches`
// that includes this user — that means someone else matched with them.
export function subscribeToIncomingMatch(userId, onMatched) {
  const channel = supabase
    .channel(`incoming-match-${userId}`)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "matches", filter: `user_b=eq.${userId}` },
      (payload) => onMatched(payload.new)
    )
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "matches", filter: `user_a=eq.${userId}` },
      (payload) => onMatched(payload.new)
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
}

export async function leaveQueue(userId) {
  await supabase.from("match_queue").delete().eq("user_id", userId);
}

// Load every match this user is part of, with the other person's profile
// and their most recent message — used to populate the Chat tab on launch.
export async function loadUserMatches(userId) {
  const { data, error } = await supabase
    .from("matches")
    .select("id, user_a, user_b, created_at, profiles_a:user_a(id,name), profiles_b:user_b(id,name)")
    .or(`user_a.eq.${userId},user_b.eq.${userId}`)
    .order("created_at", { ascending: false });
  if (error) throw error;

  return (data || []).map((m) => {
    const other = m.user_a === userId ? m.profiles_b : m.profiles_a;
    return { matchId: m.id, otherId: other.id, otherName: other.name };
  });
}

// ---- Chat ----

export async function loadMessages(matchId) {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("match_id", matchId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data;
}

export async function sendMessage(matchId, senderId, body, kind = "text") {
  const { error } = await supabase.from("messages").insert({ match_id: matchId, sender_id: senderId, body, kind });
  if (error) throw error;
}

// Real-time updates — replaces the old 2.5s polling loop entirely.
export function subscribeToMessages(matchId, onNewMessage) {
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

// ---- Calls ----

export async function logCall(matchId, callerId, callType, status, durationSeconds) {
  const { error } = await supabase.from("call_logs").insert({
    match_id: matchId,
    caller_id: callerId,
    call_type: callType,
    status,
    duration_seconds: durationSeconds,
  });
  if (error) throw error;

  const icon = callType === "video" ? "📹" : "📞";
  const text =
    status === "no_answer"
      ? `${icon} No answer`
      : `${icon} ${callType === "video" ? "Video" : "Voice"} call · ${formatDuration(durationSeconds)}`;
  await sendMessage(matchId, callerId, text, "call_log");
}

function formatDuration(s) {
  const m = Math.floor(s / 60).toString().padStart(2, "0");
  const sec = (s % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
}

// ---- Reports ----

export async function fileReport(reporterId, reportedId, context, reason) {
  const { error } = await supabase.from("reports").insert({ reporter_id: reporterId, reported_id: reportedId, context, reason });
  if (error) throw error;
}
