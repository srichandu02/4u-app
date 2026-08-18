import React, { useState, useEffect, useRef } from "react";
import { X, Send, Eye, Trash2, Heart, Sparkles } from "lucide-react";
import { Avatar } from "../../components/ui/Avatar";
import { markStoryViewed, fetchStoryViewers, deleteStory } from "../../services/storyService";

export function StoryViewerModal({ story, currentUserId, onClose, onReact, onReply, showToast }) {
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [viewersOpen, setViewersOpen] = useState(false);
  const [viewers, setViewers] = useState([]);
  const timerRef = useRef(null);

  const author = story.author || {};
  const isOwner = currentUserId && (story.author_id === currentUserId || author.id === currentUserId);

  useEffect(() => {
    if (!story) return;
    setProgress(0);
    // Mark viewed
    if (currentUserId && !isOwner) {
      markStoryViewed(story.id, currentUserId);
    }
  }, [story, currentUserId, isOwner]);

  useEffect(() => {
    if (isPaused || viewersOpen) {
      clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timerRef.current);
          onClose();
          return 100;
        }
        return prev + 1.5;
      });
    }, 75);

    return () => clearInterval(timerRef.current);
  }, [isPaused, viewersOpen, onClose]);

  const handleOpenViewers = async () => {
    setViewersOpen(true);
    const list = await fetchStoryViewers(story.id);
    setViewers(list);
  };

  const handleDelete = async () => {
    await deleteStory(story.id, currentUserId);
    showToast("Story deleted");
    onClose();
  };

  const handleSendReply = () => {
    if (!replyText.trim()) return;
    if (onReply) {
      onReply(author.id || story.author_id, `Replying to your story: "${replyText.trim()}"`);
      showToast("Reply sent! 💌");
    }
    setReplyText("");
    onClose();
  };

  if (!story) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 pop-in p-0 sm:p-4">
      <div
        className="relative w-full sm:max-w-sm h-full sm:h-[84vh] sm:rounded-3xl overflow-hidden flex flex-col justify-between p-5 bg-[#0B0A1A] select-none"
        onMouseDown={() => setIsPaused(true)}
        onMouseUp={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        {/* Story Background / Media */}
        {story.media_type === "image" && story.media_url ? (
          <img
            src={story.media_url}
            alt="Story content"
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div
            className="absolute inset-0 flex items-center justify-center p-8 text-center"
            style={{ background: story.background_gradient || "linear-gradient(135deg, #FF5E3A, #FFAB38)" }}
          >
            <p className="f-display font-extrabold text-2xl text-[#0B0A1A] leading-snug drop-shadow-sm">
              {story.text_content}
            </p>
          </div>
        )}

        {/* Top Gradient Overlay */}
        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/80 to-transparent pointer-events-none" />

        {/* Top Controls & Progress */}
        <div className="relative z-10 flex flex-col gap-3">
          <div className="w-full h-1 bg-white/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-white transition-all duration-75 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar name={author.name} src={author.avatar_url} size={40} ring />
              <div>
                <span className="f-display font-bold text-sm text-white drop-shadow-md block">
                  {author.name || "4U Creator"}
                </span>
                <span className="text-[10px] text-white/70">
                  {new Date(story.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isOwner && (
                <button
                  onClick={handleDelete}
                  className="p-2 rounded-full bg-black/50 text-white/80 hover:text-red-400 hover:bg-black/80 cursor-pointer"
                  title="Delete Story"
                >
                  <Trash2 size={18} />
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 rounded-full bg-black/50 text-white hover:bg-black/80 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Text Overlay for Image Stories */}
        {story.media_type === "image" && story.text_content && (
          <div className="relative z-10 bg-black/60 backdrop-blur-md p-4 rounded-2xl border border-white/10 max-h-32 overflow-y-auto">
            <p className="f-body text-sm text-white leading-relaxed">{story.text_content}</p>
          </div>
        )}

        {/* Bottom Reaction & Controls Row */}
        <div className="relative z-10 flex flex-col gap-2">
          {isOwner ? (
            <button
              onClick={handleOpenViewers}
              className="flex items-center justify-center gap-2 py-3 bg-black/60 backdrop-blur-md rounded-full text-white text-xs font-semibold border border-white/20 hover:bg-black/80 cursor-pointer"
            >
              <Eye size={16} /> Viewers List
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <input
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendReply()}
                placeholder="Reply to story…"
                className="flex-1 bg-black/60 backdrop-blur-md text-white text-xs px-4 py-3 rounded-full outline-none border border-white/20 focus:border-[#FF5E3A]"
              />
              {replyText.trim() ? (
                <button
                  onClick={handleSendReply}
                  className="p-3 rounded-full bg-[#FF5E3A] text-[#0B0A1A] cursor-pointer"
                >
                  <Send size={16} />
                </button>
              ) : (
                ["❤️", "🔥", "😂", "👏"].map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => {
                      onReact(emoji);
                      showToast(`Reacted ${emoji}`);
                    }}
                    className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-lg active:scale-125 transition-transform cursor-pointer border border-white/10"
                  >
                    {emoji}
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Viewer List Drawer */}
        {viewersOpen && (
          <div className="absolute inset-x-0 bottom-0 max-h-[60%] bg-[#13122A] rounded-t-3xl p-5 border-t border-[#363168] z-30 slide-up flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h4 className="f-display font-bold text-sm text-[#F5F3FF] flex items-center gap-2">
                <Eye size={16} className="text-[#FF5E3A]" /> Story Viewers ({viewers.length})
              </h4>
              <button onClick={() => setViewersOpen(false)} className="text-[#A6A1CC] hover:text-white">
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col gap-2.5">
              {viewers.length === 0 ? (
                <p className="text-xs text-[#A6A1CC] text-center py-4">No views recorded yet.</p>
              ) : (
                viewers.map((v, i) => (
                  <div key={i} className="flex items-center gap-3 p-2 rounded-2xl bg-[#1C1A3A]">
                    <Avatar name={v.viewer?.name || "Viewer"} src={v.viewer?.avatar_url} size={32} />
                    <span className="f-body text-xs font-semibold text-[#F5F3FF]">
                      {v.viewer?.name || "User"}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
