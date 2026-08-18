import { supabase, isSupabaseConfigured } from "../supabaseClient";
import { awardXpAndCoins } from "./gamificationService";
import { createNotification } from "./notificationService";

const SEED_STORIES = [
  {
    id: "story_1",
    author_id: "p1",
    author: { id: "p1", name: "Aisha", username: "aisha_vibes", avatar_url: null, verified: true },
    media_type: "image",
    media_url: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop",
    text_content: "Morning coffee & soundcheck ☕🎶",
    created_at: new Date(Date.now() - 7200000).toISOString(),
    viewed: false,
  },
  {
    id: "story_2",
    author_id: "p3",
    author: { id: "p3", name: "Meera", username: "meera_art", avatar_url: null, verified: true },
    media_type: "text",
    background_gradient: "linear-gradient(135deg, #EC4899, #8B5CF6)",
    text_content: "Who's down for a Tic Tac Toe rematch right now? 🎮🔥",
    created_at: new Date(Date.now() - 14400000).toISOString(),
    viewed: false,
  },
  {
    id: "story_3",
    author_id: "p5",
    author: { id: "p5", name: "Zara", username: "zara_cinema", avatar_url: null, verified: true },
    media_type: "image",
    media_url: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&auto=format&fit=crop",
    text_content: "Movie night recommendations! Drop your top picks 🍿🎬",
    created_at: new Date(Date.now() - 21600000).toISOString(),
    viewed: true,
  },
];

export async function fetchActiveStories(currentUserId) {
  if (!isSupabaseConfigured()) {
    return SEED_STORIES;
  }
  try {
    const { data: stories, error } = await supabase
      .from("stories")
      .select("*, author:author_id(id, name, username, avatar_url, verified)")
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false });

    if (error || !stories || stories.length === 0) {
      return SEED_STORIES;
    }

    let viewedStoryIds = new Set();
    if (currentUserId) {
      const { data: views } = await supabase
        .from("story_views")
        .select("story_id")
        .eq("viewer_id", currentUserId);
      if (views) viewedStoryIds = new Set(views.map((v) => v.story_id));
    }

    return stories.map((s) => ({
      ...s,
      viewed: viewedStoryIds.has(s.id),
    }));
  } catch (e) {
    return SEED_STORIES;
  }
}

export async function createStory({ authorId, mediaType = "text", mediaUrl = null, textContent = "", backgroundGradient = null }) {
  if (!isSupabaseConfigured()) {
    const story = {
      id: "story_" + Date.now(),
      author_id: authorId,
      author: { id: authorId, name: "You", username: "you", avatar_url: null, verified: true },
      media_type: mediaType,
      media_url: mediaUrl,
      text_content: textContent,
      background_gradient: backgroundGradient || "linear-gradient(135deg, #FF5E3A, #FFAB38)",
      created_at: new Date().toISOString(),
      viewed: true,
    };
    SEED_STORIES.unshift(story);
    return story;
  }

  const { data, error } = await supabase
    .from("stories")
    .insert({
      author_id: authorId,
      media_type: mediaType,
      media_url: mediaUrl,
      text_content: textContent,
      background_gradient: backgroundGradient,
      expires_at: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
    })
    .select("*, author:author_id(id, name, username, avatar_url, verified)")
    .single();

  if (error) throw error;

  await awardXpAndCoins(authorId, 25, 10);
  return data;
}

export async function markStoryViewed(storyId, viewerId) {
  if (!isSupabaseConfigured() || !viewerId) return;
  try {
    await supabase.from("story_views").upsert(
      { story_id: storyId, viewer_id: viewerId, viewed_at: new Date().toISOString() },
      { onConflict: "story_id,viewer_id" }
    );
  } catch (e) {}
}

export async function fetchStoryViewers(storyId) {
  if (!isSupabaseConfigured()) {
    return [
      { viewer_id: "p1", viewer: { name: "Aisha", avatar_url: null }, viewed_at: new Date().toISOString() },
    ];
  }
  try {
    const { data, error } = await supabase
      .from("story_views")
      .select("viewed_at, viewer:viewer_id(id, name, username, avatar_url, verified)")
      .eq("story_id", storyId)
      .order("viewed_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (e) {
    return [];
  }
}

export async function reactToStory(storyId, userId, reaction, storyAuthorId = null) {
  if (!isSupabaseConfigured()) return true;
  try {
    await supabase.from("story_reactions").insert({ story_id: storyId, user_id: userId, reaction });

    if (storyAuthorId && storyAuthorId !== userId) {
      await createNotification({
        userId: storyAuthorId,
        actorId: userId,
        type: "story_reaction",
        title: "Story Reaction 🔥",
        body: `Reacted ${reaction} to your story.`,
        entityId: storyId,
        entityType: "story",
      });
    }
    return true;
  } catch (e) {
    return true;
  }
}

export async function deleteStory(storyId, authorId) {
  if (!isSupabaseConfigured()) return true;
  const { error } = await supabase.from("stories").delete().eq("id", storyId).eq("author_id", authorId);
  if (error) throw error;
  return true;
}
