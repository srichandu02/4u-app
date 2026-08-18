import React, { useState, useEffect } from "react";
import { Sparkles, Plus, RefreshCw, Flame, Users, TrendingUp } from "lucide-react";
import { StoriesBar } from "../stories/StoriesBar";
import { StoryViewerModal } from "../stories/StoryViewerModal";
import { PostCard } from "./PostCard";
import { CreatePostModal } from "../create/CreatePostModal";
import { fetchFeedPosts } from "../../services/feedService";
import { fetchActiveStories, reactToStory } from "../../services/storyService";
import { Skeleton } from "../../components/ui/Skeleton";
import { EmptyState } from "../../components/ui/EmptyState";

export function HomeFeed({ currentUser, onOpenCreate, onOpenProfile, showToast }) {
  const [posts, setPosts] = useState([]);
  const [stories, setStories] = useState([]);
  const [selectedStory, setSelectedStory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [feedFilter, setFeedFilter] = useState("all"); // 'all' | 'following' | 'trending'

  const loadFeedData = async () => {
    setLoading(true);
    try {
      const [feedData, storiesData] = await Promise.all([
        fetchFeedPosts({ filter: feedFilter, currentUserId: currentUser?.id }),
        fetchActiveStories(currentUser?.id),
      ]);
      setPosts(feedData);
      setStories(storiesData);
    } catch (e) {
      console.warn("Feed load error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeedData();
  }, [feedFilter, currentUser]);

  const handlePostDeleted = (postId) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 pb-24 pt-3 no-scrollbar">
      {/* Welcome Banner */}
      <div className="flex items-center justify-between bg-gradient-to-r from-[#1C1A3A] via-[#26234D] to-[#1C1A3A] p-4 rounded-3xl border border-[#363168] mb-4 shadow-lg">
        <div>
          <h2 className="f-display font-extrabold text-base text-[#F5F3FF]">
            Welcome back, {currentUser?.name || "Explorer"} 👋
          </h2>
          <p className="f-body text-xs text-[#A6A1CC] mt-0.5">
            Discover real people, live rooms & friends around you.
          </p>
        </div>
        <div className="flex items-center gap-1 bg-[#0B0A1A] px-3.5 py-1.5 rounded-full border border-[#FF5E3A]/40 shadow-inner">
          <Flame size={15} className="text-[#FF5E3A]" />
          <span className="f-mono text-xs font-bold text-[#FFAB38]">{currentUser?.streak || 1}d</span>
        </div>
      </div>

      {/* Stories Bar */}
      <div className="mb-4">
        <StoriesBar
          stories={stories}
          onSelectStory={(s) => setSelectedStory(s)}
          onCreateStory={() => setCreateModalOpen(true)}
        />
      </div>

      {/* Feed Filters */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-1.5 bg-[#13122A] p-1 rounded-full border border-[#363168]">
          {[
            { id: "all", label: "For You", icon: Sparkles },
            { id: "following", label: "Following", icon: Users },
            { id: "trending", label: "Trending", icon: TrendingUp },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = feedFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setFeedFilter(tab.id)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold f-body transition-all cursor-pointer ${
                  active
                    ? "bg-[#FF5E3A] text-[#0B0A1A] shadow-md"
                    : "text-[#A6A1CC] hover:text-[#F5F3FF]"
                }`}
              >
                <Icon size={13} />
                {tab.label}
              </button>
            );
          })}
        </div>

        <button
          onClick={loadFeedData}
          className="p-2 rounded-full bg-[#1C1A3A] border border-[#363168] text-[#A6A1CC] hover:text-[#F5F3FF] transition-colors cursor-pointer"
          title="Refresh Feed"
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Posts List */}
      {loading ? (
        <div className="flex flex-col gap-4">
          <div className="p-4 rounded-3xl bg-[#1C1A3A] border border-[#363168] flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-full" />
              <div className="flex flex-col gap-1.5 flex-1">
                <Skeleton className="w-32 h-3.5" />
                <Skeleton className="w-20 h-2.5" />
              </div>
            </div>
            <Skeleton className="w-full h-16 rounded-2xl" />
            <Skeleton className="w-full h-44 rounded-2xl" />
          </div>
          <div className="p-4 rounded-3xl bg-[#1C1A3A] border border-[#363168] flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-full" />
              <div className="flex flex-col gap-1.5 flex-1">
                <Skeleton className="w-28 h-3.5" />
                <Skeleton className="w-16 h-2.5" />
              </div>
            </div>
            <Skeleton className="w-full h-20 rounded-2xl" />
          </div>
        </div>
      ) : posts.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title={feedFilter === "following" ? "No posts from following yet" : "No posts found"}
          description={
            feedFilter === "following"
              ? "Follow creators in the Discover tab to see their latest photos, updates, and thoughts here."
              : "Be the first to share an update with the 4U community!"
          }
          actionLabel="Create Post"
          onAction={() => setCreateModalOpen(true)}
        />
      ) : (
        posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            currentUserId={currentUser?.id}
            onDelete={handlePostDeleted}
            showToast={showToast}
          />
        ))
      )}

      {/* Floating Create Button */}
      <button
        onClick={() => setCreateModalOpen(true)}
        className="fixed right-6 bottom-20 z-30 w-14 h-14 rounded-full bg-gradient-to-r from-[#FF5E3A] to-[#FFAB38] text-[#0B0A1A] flex items-center justify-center shadow-2xl active:scale-95 transition-transform cursor-pointer border-2 border-[#0B0A1A]"
        aria-label="Create Post"
      >
        <Plus size={26} strokeWidth={2.5} />
      </button>

      {/* Create Modal */}
      <CreatePostModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        currentUserId={currentUser?.id}
        onPostCreated={(newPost) => setPosts((prev) => [newPost, ...prev])}
        showToast={showToast}
      />

      {/* Story Viewer Modal */}
      {selectedStory && (
        <StoryViewerModal
          story={selectedStory}
          onClose={() => setSelectedStory(null)}
          onReact={(emoji) => reactToStory(selectedStory.id, currentUser?.id, emoji, selectedStory.author_id)}
          showToast={showToast}
        />
      )}
    </div>
  );
}
