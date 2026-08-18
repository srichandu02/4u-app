import { supabase, isSupabaseConfigured } from "../supabaseClient";

export const CANDIDATE_PROFILES = [
  {
    id: "p1",
    name: "Aisha",
    username: "aisha_vibes",
    age: 24,
    city: "Mumbai",
    bio: "Rooftop playlists and last-minute train tickets 🎧✨",
    interests: ["Music", "Travel", "Gaming"],
    hobbies: ["Photography", "Hiking"],
    favorite_games: ["Tic Tac Toe", "Trivia"],
    verified: true,
    avatar_url: null,
  },
  {
    id: "p2",
    name: "Rohan",
    username: "rohan_builds",
    age: 27,
    city: "Bengaluru",
    bio: "Building cool tech products by day, RPG raiding by night 🚀🎮",
    interests: ["Tech", "Gaming", "Anime"],
    hobbies: ["Coding", "Board Games"],
    favorite_games: ["Connect Four", "Trivia"],
    verified: false,
    avatar_url: null,
  },
  {
    id: "p3",
    name: "Meera",
    username: "meera_art",
    age: 22,
    city: "Delhi",
    bio: "Sketchbook always half full. Coffee lover 🎨☕",
    interests: ["Art", "Books", "Music"],
    hobbies: ["Painting", "Reading"],
    favorite_games: ["Emoji Guess", "Would You Rather"],
    verified: true,
    avatar_url: null,
  },
  {
    id: "p4",
    name: "Kabir",
    username: "kabir_fits",
    age: 26,
    city: "Pune",
    bio: "Gym at 6am, biryani by 9pm. Balance is key 💪🍛",
    interests: ["Fitness", "Foodie", "Travel"],
    hobbies: ["Calisthenics", "Cooking"],
    favorite_games: ["Rock Paper Scissors", "Truth or Dare"],
    verified: false,
    avatar_url: null,
  },
  {
    id: "p5",
    name: "Zara",
    username: "zara_cinema",
    age: 23,
    city: "Hyderabad",
    bio: "Will debate you on the best anime plot twists ever 🎬🍿",
    interests: ["Movies", "Anime", "Gaming"],
    hobbies: ["Movie Reviews", "Gaming"],
    favorite_games: ["Trivia", "Emoji Guess"],
    verified: true,
    avatar_url: null,
  },
  {
    id: "p6",
    name: "Dev",
    username: "dev_synths",
    age: 25,
    city: "Chennai",
    bio: "Analog synths, indie side projects, strong filter coffee 🎹☕",
    interests: ["Music", "Tech", "Books"],
    hobbies: ["Music Production", "Blogging"],
    favorite_games: ["Connect Four", "Tic Tac Toe"],
    verified: false,
    avatar_url: null,
  },
];

/**
 * Calculates a deterministic compatibility score (0 to 100%) between two users.
 * Modular architecture prepared for replacement with an ML model in the future.
 */
export function calculateCompatibilityScore(userA, userB) {
  if (!userA || !userB) return { totalScore: 75, reasons: ["Shared Social Interests"] };

  let score = 50; // base score
  const reasons = [];

  // 1. Shared Interests (+12 each, max 36)
  const sharedInterests = (userA.interests || []).filter((i) => (userB.interests || []).includes(i));
  if (sharedInterests.length > 0) {
    score += Math.min(36, sharedInterests.length * 12);
    reasons.push(`Shared Interests: ${sharedInterests.join(", ")}`);
  }

  // 2. Shared Gaming Preferences (+10 each, max 20)
  const sharedGames = (userA.favorite_games || []).filter((g) => (userB.favorite_games || []).includes(g));
  if (sharedGames.length > 0) {
    score += Math.min(20, sharedGames.length * 10);
    reasons.push(`Both love ${sharedGames[0]}`);
  }

  // 3. Location / City match (+10)
  if (userA.city && userB.city && userA.city.toLowerCase() === userB.city.toLowerCase()) {
    score += 10;
    reasons.push(`Same City: ${userA.city}`);
  }

  // 4. Age proximity (+8)
  if (userA.age && userB.age && Math.abs(userA.age - userB.age) <= 3) {
    score += 8;
    reasons.push("Similar Age Group");
  }

  const finalScore = Math.min(99, Math.max(60, score));
  return {
    totalScore: finalScore,
    reasons: reasons.length ? reasons : ["High General Compatibility"],
  };
}

export async function fetchDiscoveryDeck(currentUserId, selectedInterests = []) {
  if (!isSupabaseConfigured()) {
    let pool = CANDIDATE_PROFILES.filter((p) => p.id !== currentUserId);
    if (selectedInterests.length > 0) {
      pool = pool.filter((p) => p.interests.some((tag) => selectedInterests.includes(tag)));
    }
    return (pool.length ? pool : CANDIDATE_PROFILES).map((p) => {
      const comp = calculateCompatibilityScore({ id: currentUserId, interests: selectedInterests }, p);
      return { ...p, compatibility: comp };
    });
  }

  try {
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("*")
      .neq("id", currentUserId)
      .limit(30);

    if (error || !profiles || profiles.length === 0) {
      return CANDIDATE_PROFILES.map((p) => ({
        ...p,
        compatibility: calculateCompatibilityScore({ id: currentUserId, interests: selectedInterests }, p),
      }));
    }

    return profiles.map((p) => ({
      ...p,
      interests: p.interests || [],
      favorite_games: p.favorite_games || [],
      compatibility: calculateCompatibilityScore({ id: currentUserId, interests: selectedInterests }, p),
    }));
  } catch (e) {
    return CANDIDATE_PROFILES.map((p) => ({
      ...p,
      compatibility: calculateCompatibilityScore({ id: currentUserId, interests: selectedInterests }, p),
    }));
  }
}

export async function recordDiscoveryAction(userId, targetId, action) {
  if (!isSupabaseConfigured()) return;
  try {
    await supabase
      .from("discovery_history")
      .insert({ user_id: userId, target_id: targetId, action })
      .select();
  } catch (e) {}
}
