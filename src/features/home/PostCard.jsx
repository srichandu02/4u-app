import React, { useState } from "react";
import { Heart, MessageCircle, Share2, Bookmark, BadgeCheck, MoreHorizontal, Trash2, Flag, EyeOff } from "lucide-react";
import { Avatar } from "../../components/ui/Avatar";
import { togglePostLike, togglePostSave, fetchPostComments, addPostComment, deletePost } from "../../services/postService";
import { fileReport } from "../../matchmaking";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";

function formatRelativeTime(dateStr) {
  if (!dateStr) return "now";
  const now = Date.now();
  const created = new Date(dateStr).getTime();
  const diffSec = Math.floor((now - created) / 1000);

  if (diffSec < 60) return "just now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  return `${Math.floor(diffSec / 86400)}d ago`;
}

export function PostCard({ post, currentUserId, onDelete, showToast }) {
  const [liked, setLiked] = useState(post.is_liked || false);
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  const [saved, setSaved] = useState(post.is_saved || false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentsCount, setCommentsCount] = useState(post.comments_count || 0);
  const [commentDraft, setCommentDraft] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [animatingLike, setAnimatingLike] = useState(false);

  const author = post.author || {};
  const isAuthor = currentUserId && (post.author_id === currentUserId || author.id === currentUserId);
  const mediaList = post.media || [];

  const handleLike = async () => {
    const nextLiked = !liked;
    setLiked(nextLiked);
    setLikesCount((prev) => (nextLiked ? prev + 1 : Math.max(0, prev - 1)));
    if (nextLiked) {
      setAnimatingLike(true);
      setTimeout(() => setAnimatingLike(false), 400);
    }
    await togglePostLike(post.id, currentUserId, author.id);
  };

  const handleSave = async () => {
    const nextSaved = !saved;
    setSaved(nextSaved);
    showToast(nextSaved ? "Post saved to bookmarks" : "Post removed from bookmarks");
    await togglePostSave(post.id, currentUserId);
  };

  const handleToggleComments = async () => {
    if (!commentsOpen) {
      const data = await fetchPostComments(post.id);
      setComments(data);
    }
    setCommentsOpen(!commentsOpen);
  };

  const handleAddComment = async () => {
    if (!commentDraft.trim()) return;
    const text = commentDraft.trim();
    setCommentDraft("");
    setCommentsCount((prev) => prev + 1);

    const newComment = await addPostComment(post.id, currentUserId, text, author.id);
    if (newComment) {
      setComments((prev) => [...prev, newComment]);
    }
  };

  const handleDelete = async () => {
    try {
      await deletePost(post.id, currentUserId);
      showToast("Post deleted");
      if (onDelete) onDelete(post.id);
    } catch (e) {
      showToast("Failed to delete post");
    } finally {
      setConfirmDeleteOpen(false);
    }
  };

  const handleReport = async () => {
    setMenuOpen(false);
    await fileReport(currentUserId, author.id, "feed_post", "Inappropriate feed post content");
    showToast("Post reported to moderation team");
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: "4U Post", text: post.content, url: window.location.href }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      showToast("Link copied to clipboard");
    }
  };

  return (
    <div className="rounded-3xl p-4 bg-[#1C1A3A] border border-[#363168] mb-4 flex flex-col gap-3 transition-all hover:border-[#4A4488]">
      {/* Header */}
      <div className="flex items-center justify-between relative">
        <div className="flex items-center gap-3">
          <Avatar name={author.name} src={author.avatar_url} size={42} />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="f-display font-bold text-sm text-[#F5F3FF]">
                {author.name || "4U Member"}{author.age ? `, ${author.age}` : ""}
              </span>
              {author.verified && <BadgeCheck size={16} className="text-[#FF5E3A]" />}
            </div>
            <p className="f-body text-xs text-[#A6A1CC]">
              {author.city ? `${author.city} · ` : ""}{formatRelativeTime(post.created_at)}
            </p>
          </div>
        </div>

        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="text-[#A6A1CC] hover:text-[#F5F3FF] p-2 rounded-full hover:bg-[#26234D] cursor-pointer"
          >
            <MoreHorizontal size={18} />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-10 w-44 bg-[#26234D] border border-[#363168] rounded-2xl p-1.5 shadow-2xl z-30 pop-in">
              {isAuthor ? (
                <button
                  onClick={() => { setMenuOpen(false); setConfirmDeleteOpen(true); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 rounded-xl cursor-pointer"
                >
                  <Trash2 size={14} /> Delete Post
                </button>
              ) : (
                <>
                  <button
                    onClick={handleReport}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#F5F3FF] hover:bg-[#363168] rounded-xl cursor-pointer"
                  >
                    <Flag size={14} /> Report Post
                  </button>
                  <button
                    onClick={() => { setMenuOpen(false); showToast("Post hidden from your feed"); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#A6A1CC] hover:bg-[#363168] rounded-xl cursor-pointer"
                  >
                    <EyeOff size={14} /> Hide Post
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <p className="f-body text-sm text-[#F5F3FF] leading-relaxed whitespace-pre-line">
        {post.content}
      </p>

      {/* Media Carousel / Attachments */}
      {mediaList.length > 0 && (
        <div className="rounded-2xl overflow-hidden border border-[#363168] bg-black/40">
          {mediaList[0].media_type === "video" || mediaList[0].url?.includes(".mp4") ? (
            <video
              src={mediaList[0].url}
              controls
              className="w-full max-h-96 object-contain"
            />
          ) : (
            <img
              src={mediaList[0].url}
              alt="Post media"
              className="w-full max-h-96 object-cover"
              loading="lazy"
            />
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between border-t border-[#363168] pt-3 text-[#A6A1CC] f-body text-xs">
        <button
          onClick={handleLike}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all cursor-pointer ${
            liked ? "text-[#FF5E3A] bg-[#7A3222]/30" : "hover:bg-[#26234D]"
          } ${animatingLike ? "like-burst" : ""}`}
        >
          <Heart size={18} fill={liked ? "#FF5E3A" : "none"} stroke={liked ? "#FF5E3A" : "currentColor"} />
          <span className="font-semibold">{likesCount}</span>
        </button>

        <button
          onClick={handleToggleComments}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-[#26234D] transition-colors cursor-pointer"
        >
          <MessageCircle size={18} />
          <span className="font-semibold">{commentsCount}</span>
        </button>

        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-[#26234D] transition-colors cursor-pointer"
        >
          <Share2 size={18} />
        </button>

        <button
          onClick={handleSave}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors cursor-pointer ${
            saved ? "text-[#FFAB38]" : "hover:bg-[#26234D]"
          }`}
        >
          <Bookmark size={18} fill={saved ? "#FFAB38" : "none"} stroke={saved ? "#FFAB38" : "currentColor"} />
        </button>
      </div>

      {/* Comments Drawer */}
      {commentsOpen && (
        <div className="border-t border-[#363168] pt-3 flex flex-col gap-2.5 pop-in">
          <div className="flex flex-col gap-2 max-h-52 overflow-y-auto no-scrollbar pr-1">
            {comments.length === 0 ? (
              <p className="text-xs text-[#A6A1CC] italic text-center py-2">No comments yet. Start the conversation!</p>
            ) : (
              comments.map((c) => (
                <div key={c.id} className="flex items-start gap-2.5 bg-[#13122A]/80 p-2.5 rounded-2xl border border-[#363168]/50">
                  <Avatar name={c.author?.name || "User"} src={c.author?.avatar_url} size={28} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="f-body text-xs font-semibold text-[#FFAB38]">
                        {c.author?.name || "Friend"}
                      </span>
                      {c.author?.verified && <BadgeCheck size={13} className="text-[#FF5E3A]" />}
                    </div>
                    <p className="f-body text-xs text-[#F5F3FF] mt-0.5">{c.content}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="flex items-center gap-2 mt-1">
            <input
              value={commentDraft}
              onChange={(e) => setCommentDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
              placeholder="Write a comment…"
              className="flex-1 bg-[#13122A] text-xs text-[#F5F3FF] px-4 py-2.5 rounded-full outline-none border border-[#363168] focus:border-[#FF5E3A]"
            />
            <button
              onClick={handleAddComment}
              disabled={!commentDraft.trim()}
              className="px-4 py-2.5 bg-[#FF5E3A] hover:bg-[#FF7555] text-[#0B0A1A] rounded-full text-xs font-bold disabled:opacity-40 cursor-pointer shadow-md"
            >
              Post
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Post"
        message="Are you sure you want to delete this post? This cannot be undone."
        confirmLabel="Delete"
        isDestructive
      />
    </div>
  );
}
