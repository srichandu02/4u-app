import React from "react";

export function Toast({ text }) {
  if (!text) return null;
  return (
    <div className="pop-in fixed left-1/2 -translate-x-1/2 bottom-20 px-5 py-2.5 rounded-full text-xs font-semibold f-body z-50 shadow-xl bg-[#F5F3FF] text-[#100F26] pointer-events-none flex items-center gap-2 border border-white/20">
      <span>✨</span>
      <span>{text}</span>
    </div>
  );
}
