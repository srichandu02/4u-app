import React from "react";
import { Plus } from "lucide-react";
import { Avatar } from "../../components/ui/Avatar";

export function StoriesBar({ stories = [], onSelectStory, onCreateStory }) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-3 pt-1 -mx-1 px-1 no-scrollbar">
      {/* Create Story Button */}
      <button
        onClick={onCreateStory}
        className="flex flex-col items-center gap-1.5 flex-shrink-0 cursor-pointer group"
      >
        <div className="relative w-14 h-14 rounded-full bg-[#2E2966] border-2 border-dashed border-[#FF6B4A] flex items-center justify-center group-hover:scale-105 transition-transform">
          <Plus size={24} className="text-[#FF6B4A]" />
        </div>
        <span className="f-body text-[11px] font-medium text-[#A6A1CC]">Your Story</span>
      </button>

      {/* Story Bubbles */}
      {stories.map((story) => {
        const author = story.author || {};
        return (
          <button
            key={story.id}
            onClick={() => onSelectStory(story)}
            className="flex flex-col items-center gap-1.5 flex-shrink-0 cursor-pointer group"
          >
            <Avatar
              name={author.name}
              src={author.avatar_url}
              size={56}
              ring={!story.viewed}
            />
            <span className="f-body text-[11px] font-medium text-[#F5F3FF] truncate max-w-[60px]">
              {author.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}
