import { supabase, isSupabaseConfigured } from "../supabaseClient";
import { awardXpAndCoins } from "./gamificationService";
import { createNotification } from "./notificationService";

export async function togglePostLike(postId, userId, authorId = null, reaction = "❤️") {
  if (!isSupabaseConfigured()) {
    return { liked: true, reaction };
  }
  try {
    const { data: existing } = await supabase
      .from("post_likes")
      .select("*")
      .eq("post_id", postId)
      .eq("user_id", userId)
      .maybeSingle();

    if (existing) {
      await supabase
        .from("post_likes")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", userId);
      return { liked: false, reaction: null };
    } else {
      await supabase
        .from("post_likes")
        .insert({ post_id: postId, user_id: userId, reaction });

      // Award XP
      await awardXpAndCoins(userId, 5, 2);

      // Notify post author
      if (authorId && authorId !== userId) {
        await createNotification({
          userId: authorId,
          actorId: userId,
          type: "post_like",
          title: "Post Liked ❤️",
          body: "Someone reacted to your post.",
          entityId: postId,
          entityType: "post",
        });
      }

      return { liked: true, reaction };
    }
  } catch (e) {
    return { liked: true, reaction };
  }
}

export async function fetchPostComments(postId) {
  if (!isSupabaseConfigured()) {
    return [
      { id: "c1", content: "Super cool update! 🔥", created_at: new Date(Date.now() - 1800000).toISOString(), author: { id: "p1", name: "Aisha", avatar_url: null, verified: true } },
      { id: "c2", content: "Let's play a game soon! 🎮", created_at: new Date(Date.now() - 3600000).toISOString(), author: { id: "p2", name: "Rohan", avatar_url: null, verified: false } },
    ];
  }
  try {
    const { data, error } = await supabase
      .from("post_comments")
      .select("*, author:author_id(id, name, username, avatar_url, verified)")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (e) {
    return [];
  }
}

export async function addPostComment(postId, authorId, content, postAuthorId = null) {
  if (!content || !content.trim()) return null;

  if (!isSupabaseConfigured()) {
    return {
      id: "mock_c_" + Date.now(),
      post_id: postId,
      author_id: authorId,
      content: content.trim(),
      created_at: new Date().toISOString(),
      author: { id: authorId, name: "You", avatar_url: null, verified: true },
    };
  }

  const { data, error } = await supabase
    .from("post_comments")
    .insert({ post_id: postId, author_id: authorId, content: content.trim() })
    .select("*, author:author_id(id, name, username, avatar_url, verified)")
    .single();

  if (error) throw error;

  // Award XP for contributing to conversation
  await awardXpAndCoins(authorId, 10, 5);

  // Notify author
  if (postAuthorId && postAuthorId !== authorId) {
    await createNotification({
      userId: postAuthorId,
      actorId: authorId,
      type: "comment",
      title: "New Comment 💬",
      body: `Commented: "${content.trim().slice(0, 40)}${content.length > 40 ? "…" : ""}"`,
      entityId: postId,
      entityType: "post",
    });
  }

  return data;
}

export async function deletePost(postId, userId) {
  if (!isSupabaseConfigured()) return true;
  const { error } = await supabase.from("posts").delete().eq("id", postId).eq("author_id", userId);
  if (error) throw error;
  return true;
}

export async function togglePostSave(postId, userId) {
  if (!isSupabaseConfigured()) return true;
  try {
    const { data: existing } = await supabase
      .from("post_saves")
      .select("*")
      .eq("post_id", postId)
      .eq("user_id", userId)
      .maybeSingle();

    if (existing) {
      await supabase.from("post_saves").delete().eq("post_id", postId).eq("user_id", userId);
      return false;
    } else {
      await supabase.from("post_saves").insert({ post_id: postId, user_id: userId });
      return true;
    }
  } catch (e) {
    return true;
  }
}
