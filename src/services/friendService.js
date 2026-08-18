import { supabase, isSupabaseConfigured } from "../supabaseClient";
import { awardXpAndCoins } from "./gamificationService";
import { createNotification } from "./notificationService";

export async function sendFriendRequest(requesterId, receiverId) {
  if (!isSupabaseConfigured()) {
    return { id: "mock_req_" + Date.now(), requester_id: requesterId, receiver_id: receiverId, status: "pending" };
  }

  // Check if reversed request already exists
  const { data: reversed } = await supabase
    .from("friend_requests")
    .select("*")
    .eq("requester_id", receiverId)
    .eq("receiver_id", requesterId)
    .eq("status", "pending")
    .maybeSingle();

  if (reversed) {
    return acceptFriendRequest(reversed.id, receiverId, requesterId);
  }

  const { data, error } = await supabase
    .from("friend_requests")
    .insert({ requester_id: requesterId, receiver_id: receiverId, status: "pending" })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return { status: "already_sent" };
    }
    throw error;
  }

  // Send real-time notification
  await createNotification({
    userId: receiverId,
    actorId: requesterId,
    type: "friend_request",
    title: "New Friend Request",
    body: "Someone sent you a friend request on 4U.",
    entityId: data.id,
    entityType: "friend_request",
  });

  return data;
}

export async function acceptFriendRequest(requestId, userA, userB) {
  if (!isSupabaseConfigured()) {
    return { success: true };
  }

  // 1. Update friend request status
  await supabase
    .from("friend_requests")
    .update({ status: "accepted", updated_at: new Date().toISOString() })
    .eq("id", requestId);

  // 2. Insert canonical pair into friendships
  const [pairA, pairB] = userA < userB ? [userA, userB] : [userB, userA];
  await supabase.from("friendships").upsert(
    { user_a: pairA, user_b: pairB, created_at: new Date().toISOString() },
    { onConflict: "user_a,user_b" }
  );

  // 3. Award XP to both users for making a friend
  await awardXpAndCoins(userA, 50, 20);
  await awardXpAndCoins(userB, 50, 20);

  // 4. Send notification to requester
  await createNotification({
    userId: userA,
    actorId: userB,
    type: "friend_accept",
    title: "Friend Request Accepted 🎉",
    body: "You are now friends on 4U! Say hello.",
  });

  return { success: true };
}

export async function rejectFriendRequest(requestId) {
  if (!isSupabaseConfigured()) return { success: true };
  await supabase
    .from("friend_requests")
    .update({ status: "rejected", updated_at: new Date().toISOString() })
    .eq("id", requestId);
  return { success: true };
}

export async function cancelFriendRequest(requesterId, receiverId) {
  if (!isSupabaseConfigured()) return { success: true };
  await supabase
    .from("friend_requests")
    .delete()
    .eq("requester_id", requesterId)
    .eq("receiver_id", receiverId)
    .eq("status", "pending");
  return { success: true };
}

export async function removeFriend(userA, userB) {
  if (!isSupabaseConfigured()) return { success: true };
  const [pairA, pairB] = userA < userB ? [userA, userB] : [userB, userA];
  await supabase
    .from("friendships")
    .delete()
    .eq("user_a", pairA)
    .eq("user_b", pairB);

  await supabase
    .from("friend_requests")
    .delete()
    .or(`and(requester_id.eq.${userA},receiver_id.eq.${userB}),and(requester_id.eq.${userB},receiver_id.eq.${userA})`);

  return { success: true };
}

export async function fetchFriends(userId) {
  if (!isSupabaseConfigured()) return [];
  try {
    const { data: friendships, error } = await supabase
      .from("friendships")
      .select(`
        id, created_at, user_a, user_b
      `)
      .or(`user_a.eq.${userId},user_b.eq.${userId}`);

    if (error || !friendships) return [];

    const friendIds = friendships.map((f) => (f.user_a === userId ? f.user_b : f.user_a));
    if (friendIds.length === 0) return [];

    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, name, username, avatar_url, verified, bio, age, city, streak")
      .in("id", friendIds);

    return profiles || [];
  } catch (e) {
    return [];
  }
}

export async function fetchPendingFriendRequests(userId) {
  if (!isSupabaseConfigured()) return [];
  try {
    const { data, error } = await supabase
      .from("friend_requests")
      .select(`
        id, requester_id, receiver_id, status, created_at,
        requester:requester_id(id, name, username, avatar_url, verified, bio)
      `)
      .eq("receiver_id", userId)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (e) {
    return [];
  }
}

export async function toggleFollow(followerId, followingId) {
  if (!isSupabaseConfigured()) {
    return { following: true };
  }
  const { data: existing } = await supabase
    .from("followers")
    .select("*")
    .eq("follower_id", followerId)
    .eq("following_id", followingId)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("followers")
      .delete()
      .eq("follower_id", followerId)
      .eq("following_id", followingId);
    return { following: false };
  } else {
    await supabase.from("followers").insert({ follower_id: followerId, following_id: followingId });
    
    // Notification
    await createNotification({
      userId: followingId,
      actorId: followerId,
      type: "follow",
      title: "New Follower",
      body: "Started following your 4U profile.",
    });

    return { following: true };
  }
}

export async function checkRelationshipStatus(currentUserId, targetUserId) {
  if (!isSupabaseConfigured() || !currentUserId || !targetUserId || currentUserId === targetUserId) {
    return { isFriend: false, isPendingSent: false, isPendingReceived: false, isFollowing: false, isBlocked: false };
  }

  const [pairA, pairB] = currentUserId < targetUserId ? [currentUserId, targetUserId] : [targetUserId, currentUserId];

  const [{ data: friendship }, { data: reqSent }, { data: reqRecv }, { data: follow }, { data: block }] = await Promise.all([
    supabase.from("friendships").select("id").eq("user_a", pairA).eq("user_b", pairB).maybeSingle(),
    supabase.from("friend_requests").select("id").eq("requester_id", currentUserId).eq("receiver_id", targetUserId).eq("status", "pending").maybeSingle(),
    supabase.from("friend_requests").select("id").eq("requester_id", targetUserId).eq("receiver_id", currentUserId).eq("status", "pending").maybeSingle(),
    supabase.from("followers").select("follower_id").eq("follower_id", currentUserId).eq("following_id", targetUserId).maybeSingle(),
    supabase.from("blocked_users").select("blocker_id").eq("blocker_id", currentUserId).eq("blocked_id", targetUserId).maybeSingle(),
  ]);

  return {
    isFriend: !!friendship,
    isPendingSent: !!reqSent,
    isPendingReceived: !!reqRecv,
    isFollowing: !!follow,
    isBlocked: !!block,
  };
}

export async function blockUser(blockerId, blockedId) {
  if (!isSupabaseConfigured()) return true;
  await supabase.from("blocked_users").upsert({ blocker_id: blockerId, blocked_id: blockedId });
  // Also remove friendship and follows if existing
  await removeFriend(blockerId, blockedId);
  return true;
}

export async function unblockUser(blockerId, blockedId) {
  if (!isSupabaseConfigured()) return true;
  await supabase.from("blocked_users").delete().eq("blocker_id", blockerId).eq("blocked_id", blockedId);
  return true;
}

export async function muteUser(muterId, mutedId) {
  if (!isSupabaseConfigured()) return true;
  await supabase.from("muted_users").upsert({ muter_id: muterId, muted_id: mutedId });
  return true;
}

export async function unmuteUser(muterId, mutedId) {
  if (!isSupabaseConfigured()) return true;
  await supabase.from("muted_users").delete().eq("muter_id", muterId).eq("muted_id", mutedId);
  return true;
}
