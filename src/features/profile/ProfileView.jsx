import React, { useState, useEffect } from "react";
import {
  BadgeCheck, Flame, Sparkles, Trophy, Settings, LogOut, Camera, UserCheck, Shield, Lock,
  Globe, Users, Image as ImageIcon, Gift, CheckCircle
} from "lucide-react";
import confetti from "canvas-confetti";
import { Avatar } from "../../components/ui/Avatar";
import { Chip } from "../../components/ui/Chip";
import { Tabs } from "../../components/ui/Tabs";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { getXpForNextLevel, ACHIEVEMENTS_LIST, awardXpAndCoins } from "../../services/gamificationService";
import { updateProfile } from "../../services/profileService";
import { uploadFile } from "../../services/storageService";
import { fetchFeedPosts } from "../../services/feedService";
import { fetchFriends } from "../../services/friendService";
import { soundFX } from "../../services/soundEffects";
import { PostCard } from "../home/PostCard";

const ALL_INTERESTS = ["Music", "Movies", "Gaming", "Travel", "Fitness", "Art", "Books", "Foodie", "Tech", "Anime"];

export function ProfileView({ user, onSignOut, onDeleteAccount, showToast }) {
  const [profile, setProfile] = useState(user || {});
  const [activeTab, setActiveTab] = useState("posts");
  const [editing, setEditing] = useState(false);
  const [privacyModalOpen, setPrivacyModalOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const [dailyClaimed, setDailyClaimed] = useState(false);

  // Edit drafts
  const [nameDraft, setNameDraft] = useState(profile.name || "");
  const [usernameDraft, setUsernameDraft] = useState(profile.username || "");
  const [bioDraft, setBioDraft] = useState(profile.bio || "");
  const [cityDraft, setCityDraft] = useState(profile.city || "");
  const [myInterests, setMyInterests] = useState(profile.interests || ["Music", "Gaming", "Tech"]);

  // Privacy settings
  const [privacy, setPrivacy] = useState(profile.privacy_settings || {
    profile_visibility: "public",
    who_can_message: "everyone",
    who_can_call: "everyone",
  });

  // User content
  const [userPosts, setUserPosts] = useState([]);
  const [friends, setFriends] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(false);

  const xpStats = getXpForNextLevel(profile.xp || 120);

  useEffect(() => {
    if (user?.id) {
      setLoadingPosts(true);
      fetchFeedPosts({ filter: "user", currentUserId: user.id })
        .then(setUserPosts)
        .finally(() => setLoadingPosts(false));

      fetchFriends(user.id).then(setFriends);
    }
  }, [user]);

  const handleClaimDailyReward = async () => {
    if (dailyClaimed) return;
    setDailyClaimed(true);
    soundFX.playLevelUp();
    confetti({ particleCount: 90, spread: 75, origin: { y: 0.6 } });

    const newCoins = (profile.coins || 240) + 50;
    const newXp = (profile.xp || 120) + 25;
    const newStreak = (profile.streak || 1) + 1;

    setProfile((prev) => ({ ...prev, coins: newCoins, xp: newXp, streak: newStreak }));
    if (profile.id) {
      await awardXpAndCoins(profile.id, 25, 50);
      await updateProfile(profile.id, { streak: newStreak });
    }
    showToast("Daily Bonus Claimed! +50 Coins & +25 XP 🎁");
  };

  const handleSaveProfile = async () => {
    const updates = {
      name: nameDraft.trim() || profile.name,
      username: usernameDraft.trim() || profile.username,
      bio: bioDraft.trim(),
      city: cityDraft.trim(),
      interests: myInterests,
    };

    const updated = await updateProfile(profile.id, updates);
    setProfile((prev) => ({ ...prev, ...updates, ...(updated || {}) }));
    setEditing(false);
    showToast("Profile updated successfully! ✨");
  };

  const handleSavePrivacy = async () => {
    await updateProfile(profile.id, { privacy_settings: privacy });
    setProfile((prev) => ({ ...prev, privacy_settings: privacy }));
    setPrivacyModalOpen(false);
    showToast("Privacy settings updated 🔒");
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const url = await uploadFile("avatars", file, "avatar");
      if (url) {
        await updateProfile(profile.id, { avatar_url: url });
        setProfile((prev) => ({ ...prev, avatar_url: url }));
        showToast("Profile avatar updated! 📸");
      }
    } catch (err) {
      showToast("Avatar upload failed");
    }
  };

  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const url = await uploadFile("covers", file, "cover");
      if (url) {
        await updateProfile(profile.id, { cover_url: url });
        setProfile((prev) => ({ ...prev, cover_url: url }));
        showToast("Cover photo updated! 🌄");
      }
    } catch (err) {
      showToast("Cover upload failed");
    }
  };

  const toggleInterest = (tag) => {
    setMyInterests((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 pb-24 pt-2 no-scrollbar">
      {/* Cover Banner */}
      <div className="relative w-full h-36 rounded-3xl overflow-hidden shadow-xl mb-14 border border-[#363168]">
        {profile.cover_url ? (
          <img src={profile.cover_url} alt="Cover" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-[#FF5E3A] via-[#8B5CF6] to-[#06B6D4]" />
        )}

        <div className="absolute inset-0 bg-black/25" />

        {/* Change Cover Button */}
        <label className="absolute top-3 left-3 px-3 py-1.5 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-sm text-white text-[11px] font-medium flex items-center gap-1.5 cursor-pointer transition-colors border border-white/20">
          <ImageIcon size={13} /> Change Cover
          <input type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
        </label>

        {/* Settings & Privacy Buttons */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5">
          <button
            onClick={() => setPrivacyModalOpen(true)}
            className="p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors border border-white/20 cursor-pointer"
            title="Privacy Settings"
          >
            <Shield size={16} />
          </button>
          <button
            onClick={() => {
              setNameDraft(profile.name || "");
              setUsernameDraft(profile.username || "");
              setBioDraft(profile.bio || "");
              setCityDraft(profile.city || "");
              setMyInterests(profile.interests || []);
              setEditing(true);
            }}
            className="p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors border border-white/20 cursor-pointer"
            title="Edit Profile"
          >
            <Settings size={16} />
          </button>
        </div>

        {/* Overlapping Avatar */}
        <div className="absolute -bottom-10 left-5 flex items-end gap-3 z-10">
          <div className="relative group">
            <Avatar name={profile.name || "You"} src={profile.avatar_url} size={84} ring />
            <label className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
              <Camera size={22} />
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            </label>
          </div>
        </div>
      </div>

      {/* Profile Details */}
      <div className="px-2 mb-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="f-display font-extrabold text-xl text-[#F5F3FF]">
                {profile.name || "4U Member"}{profile.age ? `, ${profile.age}` : ""}
              </h2>
              {profile.verified && <BadgeCheck size={18} className="text-[#FF5E3A]" />}
            </div>
            <p className="f-body text-xs text-[#A6A1CC]">
              @{profile.username || "creator"} · {profile.city || "Earth"}
            </p>
          </div>

          {/* Level Badge */}
          <div className="flex flex-col items-end">
            <span className="px-3 py-1 rounded-full bg-[#FF5E3A]/20 border border-[#FF5E3A]/40 f-mono text-xs font-bold text-[#FFAB38]">
              Lvl {xpStats.currentLvl}
            </span>
            <span className="f-body text-[10px] text-[#A6A1CC] mt-1 font-mono">{profile.xp || 120} XP</span>
          </div>
        </div>

        <p className="f-body text-sm text-[#F5F3FF] mt-3 leading-relaxed">
          {profile.bio || "Welcome to my 4U profile! Tap connect to chat or play a game."}
        </p>

        {/* XP Progress Bar */}
        <div className="mt-4 bg-[#1C1A3A] p-3 rounded-2xl border border-[#363168] shadow-sm">
          <div className="flex justify-between text-xs f-body text-[#A6A1CC] mb-1.5">
            <span>Level {xpStats.currentLvl} Next Reward</span>
            <span className="font-mono text-[#FFAB38] font-bold">{xpStats.percentage}%</span>
          </div>
          <div className="h-2 bg-[#0B0A1A] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#FF5E3A] to-[#FFAB38] transition-all duration-500"
              style={{ width: `${xpStats.percentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Social Stats Counters */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {[
          { label: "Friends", val: friends.length || profile.friends_count || 0 },
          { label: "Followers", val: profile.followers_count || 0 },
          { label: "Streak", val: `${profile.streak || 1}🔥` },
          { label: "Coins", val: `${profile.coins || 240}🪙` },
        ].map((stat, i) => (
          <div key={i} className="bg-[#1C1A3A] border border-[#363168] rounded-2xl p-2.5 flex flex-col items-center shadow-sm">
            <span className="f-mono font-bold text-sm text-[#FFAB38]">{stat.val}</span>
            <span className="f-body text-[10px] text-[#A6A1CC] mt-0.5">{stat.label}</span>
          </div>
        ))}
      </div>

      {/* Daily Reward Claim Chest */}
      <div className="mb-5 p-4 rounded-3xl bg-gradient-to-r from-[#FF5E3A]/15 via-[#8B5CF6]/15 to-[#FFAB38]/15 border border-[#363168] flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#FF5E3A]/20 border border-[#FF5E3A]/40 flex items-center justify-center text-2xl">
            🎁
          </div>
          <div>
            <h4 className="f-display font-bold text-xs text-[#F5F3FF]">Daily Streak Bonus</h4>
            <p className="f-body text-[10px] text-[#A6A1CC]">+50 Coins & +25 XP reward</p>
          </div>
        </div>

        <button
          onClick={handleClaimDailyReward}
          disabled={dailyClaimed}
          className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer shadow-md ${
            dailyClaimed
              ? "bg-[#26234D] text-[#10B981] border border-[#10B981]/30 cursor-default"
              : "bg-[#FF5E3A] hover:bg-[#FF7555] text-[#0B0A1A] active:scale-95"
          }`}
        >
          {dailyClaimed ? "Claimed ✓" : "Claim Now"}
        </button>
      </div>

      {/* Profile Navigation Tabs */}
      <Tabs
        tabs={[
          { id: "posts", label: "Posts" },
          { id: "friends", label: `Friends (${friends.length})` },
          { id: "about", label: "About & Badges" },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {/* Tab Content */}
      <div className="py-4">
        {activeTab === "posts" && (
          <div>
            {loadingPosts ? (
              <p className="text-xs text-[#A6A1CC] text-center py-6">Loading posts…</p>
            ) : userPosts.length === 0 ? (
              <div className="bg-[#1C1A3A] p-6 rounded-3xl border border-[#363168] text-center text-xs text-[#A6A1CC] f-body">
                No posts published yet. Use the Create (+) button to publish your first update!
              </div>
            ) : (
              userPosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  currentUserId={profile.id}
                  onDelete={(id) => setUserPosts((prev) => prev.filter((p) => p.id !== id))}
                  showToast={showToast}
                />
              ))
            )}
          </div>
        )}

        {activeTab === "friends" && (
          <div className="flex flex-col gap-2">
            {friends.length === 0 ? (
              <div className="bg-[#1C1A3A] p-6 rounded-3xl border border-[#363168] text-center text-xs text-[#A6A1CC]">
                No confirmed friends yet. Discover active creators to connect!
              </div>
            ) : (
              friends.map((f) => (
                <div key={f.id} className="flex items-center justify-between p-3.5 bg-[#1C1A3A] rounded-2xl border border-[#363168]">
                  <div className="flex items-center gap-3">
                    <Avatar name={f.name} src={f.avatar_url} size={40} />
                    <div>
                      <span className="f-display font-bold text-sm text-[#F5F3FF] block">{f.name}</span>
                      <span className="f-body text-[11px] text-[#A6A1CC]">@{f.username || "user"}</span>
                    </div>
                  </div>
                  <span className="text-xs text-[#10B981] f-body flex items-center gap-1 font-semibold">
                    <UserCheck size={14} /> Friend
                  </span>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "about" && (
          <div className="flex flex-col gap-4">
            <div className="bg-[#1C1A3A] p-4 rounded-3xl border border-[#363168]">
              <p className="f-body text-xs text-[#A6A1CC] mb-2.5 font-semibold">Passions & Interests</p>
              <div className="flex flex-wrap gap-2">
                {(profile.interests || ["Music", "Gaming", "Tech"]).map((tag) => (
                  <span key={tag} className="px-3 py-1 rounded-full text-xs bg-[#26234D] text-[#F5F3FF] border border-[#363168]">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-[#1C1A3A] p-4 rounded-3xl border border-[#363168]">
              <p className="f-body text-xs text-[#A6A1CC] mb-3 font-semibold">Achievements Showcase</p>
              <div className="grid grid-cols-2 gap-2.5">
                {ACHIEVEMENTS_LIST.slice(0, 4).map((ach) => (
                  <div key={ach.id} className="p-3 bg-[#13122A] rounded-2xl border border-[#363168] flex items-center gap-3">
                    <span className="text-2xl">{ach.icon}</span>
                    <div>
                      <p className="f-body text-xs font-bold text-[#F5F3FF]">{ach.title}</p>
                      <p className="f-body text-[10px] text-[#A6A1CC]">+{ach.xp} XP</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Account Settings & Sign Out */}
      <div className="border-t border-[#363168] pt-5 mt-4 flex flex-col gap-2.5">
        <Button onClick={() => setConfirmSignOut(true)} variant="secondary" fullWidth icon={LogOut}>
          Sign Out
        </Button>
        <button
          onClick={() => setConfirmDelete(true)}
          className="text-xs text-red-400 hover:text-red-300 text-center py-2 cursor-pointer font-medium"
        >
          Delete My Account Permanently
        </button>
      </div>

      {/* Edit Profile Modal */}
      <Modal isOpen={editing} onClose={() => setEditing(false)} title="Edit Profile">
        <div className="flex flex-col gap-3.5">
          <div>
            <label className="f-body text-xs text-[#A6A1CC] block mb-1">Display Name</label>
            <input
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              className="w-full bg-[#26234D] border border-[#363168] text-sm text-[#F5F3FF] p-3 rounded-2xl outline-none focus:border-[#FF5E3A]"
            />
          </div>

          <div>
            <label className="f-body text-xs text-[#A6A1CC] block mb-1">Username</label>
            <input
              value={usernameDraft}
              onChange={(e) => setUsernameDraft(e.target.value)}
              className="w-full bg-[#26234D] border border-[#363168] text-sm text-[#F5F3FF] p-3 rounded-2xl outline-none focus:border-[#FF5E3A]"
            />
          </div>

          <div>
            <label className="f-body text-xs text-[#A6A1CC] block mb-1">City</label>
            <input
              value={cityDraft}
              onChange={(e) => setCityDraft(e.target.value)}
              className="w-full bg-[#26234D] border border-[#363168] text-sm text-[#F5F3FF] p-3 rounded-2xl outline-none focus:border-[#FF5E3A]"
            />
          </div>

          <div>
            <label className="f-body text-xs text-[#A6A1CC] block mb-1">Bio</label>
            <textarea
              value={bioDraft}
              onChange={(e) => setBioDraft(e.target.value)}
              className="w-full bg-[#26234D] border border-[#363168] text-sm text-[#F5F3FF] p-3 rounded-2xl outline-none h-20 resize-none focus:border-[#FF5E3A]"
            />
          </div>

          <div>
            <label className="f-body text-xs text-[#A6A1CC] block mb-1.5">Manage Interests</label>
            <div className="flex flex-wrap gap-1.5">
              {ALL_INTERESTS.map((t) => (
                <Chip key={t} active={myInterests.includes(t)} onClick={() => toggleInterest(t)}>
                  {t}
                </Chip>
              ))}
            </div>
          </div>

          <Button onClick={handleSaveProfile} variant="primary" fullWidth className="mt-3">
            Save Changes
          </Button>
        </div>
      </Modal>

      {/* Privacy Settings Modal */}
      <Modal isOpen={privacyModalOpen} onClose={() => setPrivacyModalOpen(false)} title="Privacy Settings">
        <div className="flex flex-col gap-4">
          <div>
            <label className="f-body text-xs text-[#A6A1CC] block mb-1.5">Profile Visibility</label>
            <select
              value={privacy.profile_visibility}
              onChange={(e) => setPrivacy((p) => ({ ...p, profile_visibility: e.target.value }))}
              className="w-full bg-[#26234D] border border-[#363168] text-sm text-[#F5F3FF] p-3 rounded-2xl outline-none"
            >
              <option value="public">Public (Everyone can discover)</option>
              <option value="friends">Friends Only</option>
              <option value="private">Private</option>
            </select>
          </div>

          <div>
            <label className="f-body text-xs text-[#A6A1CC] block mb-1.5">Who can direct message you</label>
            <select
              value={privacy.who_can_message}
              onChange={(e) => setPrivacy((p) => ({ ...p, who_can_message: e.target.value }))}
              className="w-full bg-[#26234D] border border-[#363168] text-sm text-[#F5F3FF] p-3 rounded-2xl outline-none"
            >
              <option value="everyone">Everyone</option>
              <option value="friends">Friends Only</option>
              <option value="nobody">Nobody</option>
            </select>
          </div>

          <div>
            <label className="f-body text-xs text-[#A6A1CC] block mb-1.5">Who can call you</label>
            <select
              value={privacy.who_can_call}
              onChange={(e) => setPrivacy((p) => ({ ...p, who_can_call: e.target.value }))}
              className="w-full bg-[#26234D] border border-[#363168] text-sm text-[#F5F3FF] p-3 rounded-2xl outline-none"
            >
              <option value="everyone">Everyone</option>
              <option value="friends">Friends Only</option>
              <option value="nobody">Nobody</option>
            </select>
          </div>

          <Button onClick={handleSavePrivacy} variant="primary" fullWidth className="mt-2">
            Save Privacy Settings
          </Button>
        </div>
      </Modal>

      {/* Sign Out Confirmation */}
      <ConfirmDialog
        isOpen={confirmSignOut}
        onClose={() => setConfirmSignOut(false)}
        onConfirm={onSignOut}
        title="Sign Out"
        message="Are you sure you want to sign out of 4U?"
        confirmLabel="Sign Out"
      />

      {/* Delete Account Confirmation */}
      <ConfirmDialog
        isOpen={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={onDeleteAccount}
        title="Delete Account"
        message="Are you sure you want to permanently delete your 4U account and data? This action cannot be undone."
        confirmLabel="Delete Permanently"
        isDestructive
      />
    </div>
  );
}
