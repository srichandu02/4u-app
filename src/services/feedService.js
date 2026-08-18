import { supabase, isSupabaseConfigured } from "../supabaseClient";
import { awardXpAndCoins } from "./gamificationService";

const SEED_POSTS = [
  {
    id: "post_1",
    content: "Excited to join 4U! Looking for gaming buddies to play Tic Tac Toe and Connect Four tonight 🎮✨ #gaming #friends",
    audience: "public",
    likes_count: 14,
    comments_count: 3,
    created_at: new Date(Date.now() - 3600000).toISOString(),
    author: { id: "p1", name: "Aisha", username: "aisha_vibes", age: 24, city: "Mumbai", verified: true, avatar_url: null },
    media: [
      { id: "m1", media_type: "image", url: "https://images.unsplash.com/photo-1534423861386-85a16f5d13fd?w=800&auto=format&fit=crop" }
    ],
    is_liked: false,
    is_saved: false,
  },
  {
    id: "post_2",
    content: "Late night lo-fi playlists & chill conversations in the Music room! Who's listening? 🎧🌙 #music #vibes",
    audience: "public",
    likes_count: 29,
    comments_count: 7,
    created_at: new Date(Date.now() - 7200000).toISOString(),
    author: { id: "p2", name: "Rohan", username: "rohan_builds", age: 27, city: "Bengaluru", verified: false, avatar_url: null },
    media: [],
    is_liked: true,
    is_saved: false,
  },
  {
    id: "post_3",
    content: "Sketchbook Sunday! Worked on some digital anime concept art today. What do you think? 🎨📚 #art #anime",
    audience: "public",
    likes_count: 42,
    comments_count: 12,
    created_at: new Date(Date.now() - 14400000).toISOString(),
    author: { id: "p3", name: "Meera", username: "meera_art", age: 22, city: "Delhi", verified: true, avatar_url: null },
    media: [
      { id: "m2", media_type: "image", url: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=800&auto=format&fit=crop" }
    ],
    is_liked: false,
    is_saved: true,
  }
];

export async function fetchFeedPosts({ filter = "all", currentUserId = null, page = 1, limit = 20 } = {}) {
  if (!isSupabaseConfigured()) {
    if (filter === "user" && currentUserId) {
      return SEED_POSTS.filter((p) => p.author?.id === currentUserId || p.author_id === currentUserId);
    }
    return SEED_POSTS;
  }

  try {
    let query = supabase
      .from("posts")
      .select(`
        *,
        author:author_id (id, name, username, avatar_url, verified, age, city),
        media:post_media (id, media_type, url, order_index)
      `);

    if (filter === "user" && currentUserId) {
      query = query.eq("author_id", currentUserId);
    } else if (filter === "trending") {
      query = query.order("likes_count", { ascending: false });
    } else if (filter === "following" && currentUserId) {
      const { data: following } = await supabase
        .from("followers")
        .select("following_id")
        .eq("follower_id", currentUserId);
      const followingIds = (following || []).map((f) => f.following_id);
      if (followingIds.length > 0) {
        query = query.in("author_id", followingIds);
      }
    }

    query = query
      .order("created_at", { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    const { data: posts, error } = await query;
    if (error || !posts || posts.length === 0) {
      return page === 1 ? SEED_POSTS : [];
    }

    // Check likes and saves for current user
    let userLikedPostIds = new Set();
    let userSavedPostIds = new Set();

    if (currentUserId) {
      const postIds = posts.map((p) => p.id);
      const [{ data: likes }, { data: saves }] = await Promise.all([
        supabase.from("post_likes").select("post_id").eq("user_id", currentUserId).in("post_id", postIds),
        supabase.from("post_saves").select("post_id").eq("user_id", currentUserId).in("post_id", postIds),
      ]);
      if (likes) userLikedPostIds = new Set(likes.map((l) => l.post_id));
      if (saves) userSavedPostIds = new Set(saves.map((s) => s.post_id));
    }

    return posts.map((post) => ({
      ...post,
      media: (post.media || []).sort((a, b) => a.order_index - b.order_index),
      is_liked: userLikedPostIds.has(post.id),
      is_saved: userSavedPostIds.has(post.id),
    }));
  } catch (e) {
    return page === 1 ? SEED_POSTS : [];
  }
}

export async function createPost({ authorId, content, mediaUrls = [], audience = "public" }) {
  if (!isSupabaseConfigured()) {
    const newPost = {
      id: "post_" + Date.now(),
      content,
      audience,
      likes_count: 0,
      comments_count: 0,
      created_at: new Date().toISOString(),
      author: { id: authorId, name: "You", username: "you", verified: true, avatar_url: null },
      media: mediaUrls.map((url, idx) => ({ id: `m_${idx}`, media_type: "image", url })),
      is_liked: false,
      is_saved: false,
    };
    SEED_POSTS.unshift(newPost);
    return newPost;
  }

  const { data: post, error: postErr } = await supabase
    .from("posts")
    .insert({ author_id: authorId, content: content || "", audience })
    .select("*, author:author_id(id, name, username, avatar_url, verified)")
    .single();

  if (postErr) throw postErr;

  if (mediaUrls.length > 0) {
    const mediaInserts = mediaUrls.map((url, index) => ({
      post_id: post.id,
      media_type: url.includes(".mp4") || url.includes(".webm") || url.includes("video") ? "video" : "image",
      url,
      order_index: index,
    }));
    await supabase.from("post_media").insert(mediaInserts);
  }

  // Extract hashtags (#tag) and index them
  const hashtags = (content || "").match(/#[a-z0-9_]+/gi);
  if (hashtags && hashtags.length > 0) {
    for (const rawTag of hashtags) {
      const tag = rawTag.slice(1).toLowerCase();
      try {
        const { data: tagRow } = await supabase
          .from("hashtags")
          .upsert({ tag }, { onConflict: "tag" })
          .select()
          .single();
        if (tagRow) {
          await supabase.from("post_hashtags").insert({ post_id: post.id, hashtag_id: tagRow.id });
        }
      } catch (err) {}
    }
  }

  // Award XP for creating post
  await awardXpAndCoins(authorId, 30, 15);

  return {
    ...post,
    media: mediaUrls.map((url, index) => ({
      id: `m_${index}`,
      media_type: url.includes(".mp4") || url.includes("video") ? "video" : "image",
      url,
      order_index: index,
    })),
    is_liked: false,
    is_saved: false,
  };
}
