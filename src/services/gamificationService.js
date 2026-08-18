import { supabase, isSupabaseConfigured } from "../supabaseClient";
import { createNotification } from "./notificationService";

export const DAILY_MISSIONS = [
  { id: "daily_login", title: "Daily Check-in", description: "Log in to 4U today", targetCount: 1, xpReward: 20, coinReward: 10, icon: "📅" },
  { id: "make_post", title: "Share an Update", description: "Create 1 post or story", targetCount: 1, xpReward: 30, coinReward: 15, icon: "📝" },
  { id: "like_posts", title: "Show Some Love", description: "Like 3 posts from friends", targetCount: 3, xpReward: 25, coinReward: 10, icon: "❤️" },
  { id: "play_game", title: "Game Time", description: "Play 1 game in the Games Hub", targetCount: 1, xpReward: 40, coinReward: 20, icon: "🎮" },
];

export const ACHIEVEMENTS_LIST = [
  { id: "first_friend", title: "First Connection", description: "Connect with your first friend", icon: "🤝", xp: 50, coins: 20 },
  { id: "first_post", title: "Social Spark", description: "Share your first post", icon: "📝", xp: 50, coins: 20 },
  { id: "game_master", title: "Game Champion", description: "Win 5 multiplayer game matches", icon: "🏆", xp: 100, coins: 50 },
  { id: "streak_7", title: "Week Warrior", description: "Maintain a 7-day streak", icon: "🔥", xp: 150, coins: 60 },
  { id: "popular_creator", title: "Spotlight Star", description: "Receive 50 likes across posts", icon: "⭐", xp: 200, coins: 100 },
];

export function calculateLevel(xp) {
  return Math.floor(1 + (xp || 0) / 200);
}

export function getXpForNextLevel(xp) {
  const currentLvl = calculateLevel(xp);
  const nextLvlXp = currentLvl * 200;
  const currentLvlXp = (currentLvl - 1) * 200;
  const progressInLevel = (xp || 0) - currentLvlXp;
  return {
    currentLvl,
    nextLvlXp,
    progressInLevel,
    percentage: Math.min(100, Math.floor((progressInLevel / 200) * 100)),
  };
}

export async function addXpAndCoins(userId, xpAmount, coinAmount) {
  if (!userId) return;
  if (!isSupabaseConfigured()) {
    try {
      const raw = localStorage.getItem(`4u_mock_profile_${userId}`);
      const curr = raw ? JSON.parse(raw) : { xp: 120, coins: 240, level: 1 };
      const newXp = (curr.xp || 120) + xpAmount;
      const newCoins = (curr.coins || 240) + coinAmount;
      const newLvl = calculateLevel(newXp);
      const updated = { ...curr, xp: newXp, coins: newCoins, level: newLvl };
      localStorage.setItem(`4u_mock_profile_${userId}`, JSON.stringify(updated));
      return updated;
    } catch (e) {
      return { xp: xpAmount, coins: coinAmount };
    }
  }

  try {
    await supabase.rpc("award_xp_and_coins", {
      p_user_id: userId,
      p_xp: xpAmount,
      p_coins: coinAmount,
    });
  } catch (e) {
    // Fallback direct update if RPC is missing
    try {
      const { data: profile } = await supabase.from("profiles").select("xp, coins").eq("id", userId).single();
      if (profile) {
        const newXp = (profile.xp || 0) + xpAmount;
        const newCoins = (profile.coins || 0) + coinAmount;
        const newLvl = calculateLevel(newXp);
        await supabase.from("profiles").update({ xp: newXp, coins: newCoins, level: newLvl }).eq("id", userId);
      }
    } catch (err) {
      console.warn("XP update fallback error:", err);
    }
  }
}

export const awardXpAndCoins = addXpAndCoins;

export async function claimMissionReward(userId, missionId) {
  const mission = DAILY_MISSIONS.find((m) => m.id === missionId);
  if (!mission) return { success: false };

  await addXpAndCoins(userId, mission.xpReward, mission.coinReward);

  await createNotification({
    userId,
    type: "achievement",
    title: "Mission Completed! ✨",
    body: `You completed "${mission.title}" and received +${mission.xpReward} XP and +${mission.coinReward} Coins.`,
  });

  return { success: true, xp: mission.xpReward, coins: mission.coinReward };
}

export async function unlockAchievement(userId, achievementId) {
  const achievement = ACHIEVEMENTS_LIST.find((a) => a.id === achievementId);
  if (!achievement) return;

  if (isSupabaseConfigured()) {
    try {
      await supabase.from("user_achievements").insert({ user_id: userId, achievement_id: achievementId });
    } catch (e) {}
  }

  await addXpAndCoins(userId, achievement.xp, achievement.coins);

  await createNotification({
    userId,
    type: "achievement",
    title: `Achievement Unlocked: ${achievement.title} ${achievement.icon}`,
    body: `${achievement.description} (+${achievement.xp} XP, +${achievement.coins} Coins)`,
  });
}
