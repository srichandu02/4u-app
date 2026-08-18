import { supabase, isSupabaseConfigured } from "../supabaseClient";

export async function fetchProfileById(userId) {
  if (!isSupabaseConfigured()) {
    return null;
  }
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    if (error) throw error;
    return data;
  } catch (e) {
    return null;
  }
}

export async function fetchProfileByUsername(username) {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("username", username)
      .single();
    if (error) throw error;
    return data;
  } catch (e) {
    return null;
  }
}

export async function updateProfile(userId, updates) {
  if (!isSupabaseConfigured()) {
    try {
      const raw = localStorage.getItem(`4u_mock_profile_${userId}`);
      const curr = raw ? JSON.parse(raw) : {};
      const updated = { ...curr, ...updates };
      localStorage.setItem(`4u_mock_profile_${userId}`, JSON.stringify(updated));
      return updated;
    } catch (e) {
      return updates;
    }
  }

  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getProfileStats(userId) {
  if (!isSupabaseConfigured()) {
    return { friendsCount: 12, followersCount: 48, followingCount: 35, postsCount: 6 };
  }
  try {
    const [friends, followers, following, posts] = await Promise.all([
      supabase.from("friendships").select("id", { count: "exact" }).or(`user_a.eq.${userId},user_b.eq.${userId}`),
      supabase.from("followers").select("follower_id", { count: "exact" }).eq("following_id", userId),
      supabase.from("followers").select("following_id", { count: "exact" }).eq("follower_id", userId),
      supabase.from("posts").select("id", { count: "exact" }).eq("author_id", userId),
    ]);

    return {
      friendsCount: friends.count || 0,
      followersCount: followers.count || 0,
      followingCount: following.count || 0,
      postsCount: posts.count || 0,
    };
  } catch (e) {
    return { friendsCount: 0, followersCount: 0, followingCount: 0, postsCount: 0 };
  }
}
