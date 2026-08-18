import React, { useState, useRef } from "react";
import { Image, Video, Globe, Users, Lock, Sparkles, Mic, Hash, X } from "lucide-react";
import { BottomSheet } from "../../components/ui/BottomSheet";
import { Button } from "../../components/ui/Button";
import { compressImage, uploadFile } from "../../services/storageService";
import { createPost } from "../../services/feedService";
import { createStory } from "../../services/storyService";
import { createLiveRoom } from "../../services/roomService";

const STORY_GRADIENTS = [
  "linear-gradient(135deg, #FF5E3A, #FFAB38)",
  "linear-gradient(135deg, #8B5CF6, #EC4899)",
  "linear-gradient(135deg, #06B6D4, #3B82F6)",
  "linear-gradient(135deg, #10B981, #06B6D4)",
  "linear-gradient(135deg, #F43F5E, #FB923C)",
];

const POPULAR_TAGS = ["gaming", "music", "tech", "anime", "fitness", "art", "vibes"];

export function CreatePostModal({ isOpen, onClose, currentUserId, onPostCreated, onRoomCreated, showToast }) {
  const [activeTab, setActiveTab] = useState("post"); // 'post' | 'story' | 'room'
  const [content, setContent] = useState("");
  const [audience, setAudience] = useState("public");
  const [selectedGradient, setSelectedGradient] = useState(STORY_GRADIENTS[0]);
  const [roomTag, setRoomTag] = useState("Music");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [publishing, setPublishing] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const newFiles = [];
    const newUrls = [];

    for (const file of files.slice(0, 4)) {
      if (file.type.startsWith("image/")) {
        const compressed = await compressImage(file);
        newFiles.push(compressed);
        newUrls.push(URL.createObjectURL(compressed));
      } else {
        newFiles.push(file);
        newUrls.push(URL.createObjectURL(file));
      }
    }

    setSelectedFiles((prev) => [...prev, ...newFiles].slice(0, 4));
    setPreviewUrls((prev) => [...prev, ...newUrls].slice(0, 4));
  };

  const removeFile = (idx) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== idx));
    setPreviewUrls((prev) => prev.filter((_, i) => i !== idx));
  };

  const insertTag = (tag) => {
    setContent((prev) => (prev ? `${prev} #${tag} ` : `#${tag} `));
  };

  const handlePublish = async () => {
    if (activeTab === "room") {
      if (!content.trim()) {
        showToast("Please enter a room title");
        return;
      }
      setPublishing(true);
      try {
        const newRoom = await createLiveRoom(currentUserId, content.trim(), roomTag);
        showToast("Live Room created! 🎙️");
        if (onRoomCreated) onRoomCreated(newRoom);
        resetAndClose();
      } catch (e) {
        showToast("Failed to create room");
      } finally {
        setPublishing(false);
      }
      return;
    }

    if (!content.trim() && selectedFiles.length === 0) {
      showToast("Please add text or select media");
      return;
    }

    setPublishing(true);
    try {
      const uploadedUrls = [];
      for (const file of selectedFiles) {
        const url = await uploadFile(activeTab === "post" ? "post-media" : "stories", file, "creations");
        if (url) uploadedUrls.push(url);
      }

      if (activeTab === "post") {
        const newPost = await createPost({
          authorId: currentUserId,
          content: content.trim(),
          mediaUrls: uploadedUrls,
          audience,
        });
        showToast("Post published! ✨");
        if (onPostCreated) onPostCreated(newPost);
      } else {
        await createStory({
          authorId: currentUserId,
          mediaType: uploadedUrls.length > 0 ? "image" : "text",
          mediaUrl: uploadedUrls[0] || null,
          textContent: content.trim(),
          backgroundGradient: selectedGradient,
        });
        showToast("Story shared! 🌟");
      }

      resetAndClose();
    } catch (e) {
      showToast("Publishing failed, please try again");
    } finally {
      setPublishing(false);
    }
  };

  const resetAndClose = () => {
    setContent("");
    setSelectedFiles([]);
    setPreviewUrls([]);
    onClose();
  };

  const getTitle = () => {
    if (activeTab === "post") return "Create Post";
    if (activeTab === "story") return "Add to Story";
    return "Start Live Room";
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={resetAndClose} title={getTitle()}>
      <div className="flex flex-col gap-4">
        {/* Type Switcher */}
        <div className="flex p-1 bg-[#13122A] rounded-full border border-[#363168]">
          {[
            { id: "post", label: "Post" },
            { id: "story", label: "Story" },
            { id: "room", label: "Audio Room" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 text-xs font-semibold rounded-full transition-all cursor-pointer ${
                activeTab === tab.id
                  ? "bg-[#FF5E3A] text-[#0B0A1A] shadow-md"
                  : "text-[#A6A1CC] hover:text-[#F5F3FF]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Story Gradient Picker (Only for Story without media) */}
        {activeTab === "story" && previewUrls.length === 0 && (
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            <span className="text-xs text-[#A6A1CC] font-medium flex-shrink-0">Gradient:</span>
            {STORY_GRADIENTS.map((g, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedGradient(g)}
                className={`w-7 h-7 rounded-full flex-shrink-0 border-2 transition-transform cursor-pointer ${
                  selectedGradient === g ? "scale-110 border-white shadow-lg" : "border-transparent opacity-70"
                }`}
                style={{ background: g }}
              />
            ))}
          </div>
        )}

        {/* Room Tag Picker (Only for Room) */}
        {activeTab === "room" && (
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            <span className="text-xs text-[#A6A1CC] font-medium flex-shrink-0">Topic:</span>
            {["Music", "Tech", "Gaming", "Social", "Anime", "Cinema"].map((tag) => (
              <button
                key={tag}
                onClick={() => setRoomTag(tag)}
                className={`px-3 py-1 rounded-full text-xs font-medium border cursor-pointer ${
                  roomTag === tag
                    ? "bg-[#FF5E3A] text-[#0B0A1A] border-[#FF5E3A]"
                    : "bg-[#26234D] text-[#A6A1CC] border-[#363168]"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        )}

        {/* Textarea / Composer */}
        <div
          className="relative rounded-2xl p-4 transition-colors border border-[#363168]"
          style={{
            background: activeTab === "story" && previewUrls.length === 0 ? selectedGradient : "#1C1A3A",
          }}
        >
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={ activeTab === "room" ? 80 : 500 }
            placeholder={
              activeTab === "post"
                ? "What's happening? Share thoughts, questions, clips…"
                : activeTab === "story"
                ? "Type your 24h story update…"
                : "Room topic (e.g., Chill Friday Beats & Chat)"
            }
            className={`w-full ${
              activeTab === "room" ? "h-16" : "h-28"
            } bg-transparent outline-none resize-none f-body text-sm ${
              activeTab === "story" && previewUrls.length === 0 ? "text-white placeholder-white/70 font-semibold" : "text-[#F5F3FF]"
            }`}
          />
          <div className="flex justify-end text-[10px] text-[#A6A1CC] font-mono">
            {content.length}/{activeTab === "room" ? 80 : 500}
          </div>
        </div>

        {/* Quick Hashtag Chips (For Posts) */}
        {activeTab === "post" && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] text-[#A6A1CC] flex items-center gap-1 font-medium">
              <Hash size={12} /> Tags:
            </span>
            {POPULAR_TAGS.map((tag) => (
              <button
                key={tag}
                onClick={() => insertTag(tag)}
                className="px-2 py-0.5 rounded-full text-[11px] bg-[#26234D] hover:bg-[#363168] text-[#A6A1CC] hover:text-[#F5F3FF] border border-[#363168] cursor-pointer"
              >
                #{tag}
              </button>
            ))}
          </div>
        )}

        {/* Media Preview Grid */}
        {previewUrls.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {previewUrls.map((url, idx) => (
              <div key={idx} className="relative rounded-2xl overflow-hidden aspect-video border border-[#363168] bg-black">
                <img src={url} alt="Media preview" className="w-full h-full object-cover" />
                <button
                  onClick={() => removeFile(idx)}
                  className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/70 text-white flex items-center justify-center cursor-pointer hover:bg-red-500"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Post Audience Selector */}
        {activeTab === "post" && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#A6A1CC] font-medium">Audience:</span>
            {[
              { id: "public", label: "Public", icon: Globe },
              { id: "friends", label: "Friends", icon: Users },
              { id: "only_me", label: "Only Me", icon: Lock },
            ].map((aud) => {
              const Icon = aud.icon;
              const selected = audience === aud.id;
              return (
                <button
                  key={aud.id}
                  onClick={() => setAudience(aud.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border cursor-pointer transition-colors ${
                    selected
                      ? "bg-[#FF5E3A] text-[#0B0A1A] border-[#FF5E3A]"
                      : "bg-[#26234D] text-[#A6A1CC] border-[#363168]"
                  }`}
                >
                  <Icon size={12} />
                  {aud.label}
                </button>
              );
            })}
          </div>
        )}

        {/* Action Footer */}
        <div className="flex items-center justify-between border-t border-[#363168] pt-3">
          {activeTab !== "room" ? (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 text-xs font-medium text-[#FFAB38] hover:text-[#FF5E3A] p-2 rounded-xl hover:bg-[#26234D] cursor-pointer"
            >
              <Image size={18} />
              <span>Add Media ({previewUrls.length}/4)</span>
            </button>
          ) : (
            <div className="flex items-center gap-2 text-xs text-[#10B981]">
              <Mic size={16} /> Live audio broadcast
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*"
            className="hidden"
            onChange={handleFileSelect}
          />

          <Button
            onClick={handlePublish}
            disabled={publishing}
            icon={Sparkles}
            variant="primary"
          >
            {publishing ? "Publishing…" : activeTab === "room" ? "Go Live" : "Share"}
          </Button>
        </div>
      </div>
    </BottomSheet>
  );
}
