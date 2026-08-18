import { supabase, isSupabaseConfigured } from "../supabaseClient";

export const GAMES_CATALOG = [
  { id: "tictactoe", title: "Tic Tac Toe", icon: "❌⭕", description: "3x3 grid strategy game", category: "Strategy", minPlayers: 2 },
  { id: "rps", title: "Rock Paper Scissors", icon: "✊✋✌️", description: "Best of 3 quick hand duel", category: "Casual", minPlayers: 2 },
  { id: "connect4", title: "Connect Four", icon: "🔴🟡", description: "Drop tokens into 6x7 grid", category: "Strategy", minPlayers: 2 },
  { id: "trivia", title: "Trivia Battle", icon: "💡", description: "Multi-category quiz match", category: "Trivia", minPlayers: 2 },
  { id: "emojiguess", title: "Emoji Guess", icon: "😃❓", description: "Decode emoji phrase puzzles", category: "Puzzle", minPlayers: 2 },
  { id: "wouldyourather", title: "Would You Rather", icon: "❓🤔", description: "Dilemmas & choice comparison", category: "Social", minPlayers: 2 },
  { id: "truthordare", title: "Truth or Dare", icon: "🙈🔥", description: "Fun icebreaker party game", category: "Social", minPlayers: 2 },
];

export async function createGameSession(gameId, hostId, initialProps = {}) {
  const initialState = {
    board: initialProps.board || Array(9).fill(null),
    turn: hostId,
    status: "waiting",
    winner: null,
    scores: { [hostId]: 0 },
    history: [],
    ...initialProps,
  };

  if (!isSupabaseConfigured()) {
    return {
      id: "session_" + Date.now(),
      game_id: gameId,
      host_id: hostId,
      status: "waiting",
      state: initialState,
      current_turn: hostId,
    };
  }

  const { data, error } = await supabase
    .from("game_sessions")
    .insert({
      game_id: gameId,
      host_id: hostId,
      state: initialState,
      current_turn: hostId,
    })
    .select()
    .single();

  if (error) throw error;
  await supabase.from("game_players").insert({ session_id: data.id, user_id: hostId });

  return data;
}

export async function joinGameSession(sessionId, userId) {
  if (!isSupabaseConfigured()) return true;
  try {
    await supabase.from("game_players").insert({ session_id: sessionId, user_id: userId });
    await supabase.from("game_sessions").update({ status: "in_progress" }).eq("id", sessionId);
    return true;
  } catch (e) {
    return true;
  }
}

export async function updateGameState(sessionId, newState, currentTurn = null, winnerId = null) {
  if (!isSupabaseConfigured()) return true;
  const updates = { state: newState, updated_at: new Date().toISOString() };
  if (currentTurn !== undefined) updates.current_turn = currentTurn;
  if (winnerId !== undefined) {
    updates.winner_id = winnerId;
    if (winnerId) updates.status = "completed";
  }

  await supabase.from("game_sessions").update(updates).eq("id", sessionId);
  return true;
}

export function subscribeToGameSession(sessionId, onSessionUpdate) {
  if (!isSupabaseConfigured()) return () => {};
  const channel = supabase
    .channel(`game-session-${sessionId}`)
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "game_sessions", filter: `id=eq.${sessionId}` },
      (payload) => onSessionUpdate(payload.new)
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
}

export async function sendGameInvite(matchId, senderId, receiverId, gameId) {
  const game = GAMES_CATALOG.find((g) => g.id === gameId) || GAMES_CATALOG[0];
  const body = `🎮 ${game.icon} Invited you to play ${game.title}!`;
  
  if (!isSupabaseConfigured()) {
    return { gameId, matchId, senderId, receiverId };
  }

  const { data: session } = await supabase
    .from("game_sessions")
    .insert({ game_id: gameId, host_id: senderId, state: { gameId, matchId, status: "waiting" } })
    .select()
    .single();

  await supabase.from("game_invites").insert({
    session_id: session.id,
    sender_id: senderId,
    receiver_id: receiverId,
    game_id: gameId,
  });

  await supabase.from("messages").insert({
    match_id: matchId,
    sender_id: senderId,
    body: JSON.stringify({ type: "game_invite", gameId, sessionId: session.id, title: game.title, icon: game.icon }),
    kind: "game_invite",
  });

  return session;
}
