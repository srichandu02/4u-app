import React from "react";
import { Gamepad2, Check, X } from "lucide-react";

export function InChatGameCard({ inviteData, onAccept, onDecline }) {
  const { title = "Tic Tac Toe", icon = "🎮" } = inviteData || {};

  return (
    <div className="rounded-2xl p-4 bg-gradient-to-r from-[#252152] to-[#2E2966] border border-[#FF6B4A] shadow-lg flex flex-col gap-2 max-w-xs my-1">
      <div className="flex items-center gap-2">
        <span className="text-2xl">{icon}</span>
        <div>
          <span className="f-body text-xs font-semibold text-[#FFB84D] block">Game Challenge</span>
          <h4 className="f-display font-bold text-sm text-[#F5F3FF]">{title}</h4>
        </div>
      </div>

      <p className="f-body text-[11px] text-[#A6A1CC]">
        Your match invited you to play a multiplayer match!
      </p>

      <div className="flex gap-2 mt-1">
        <button
          onClick={onDecline}
          className="flex-1 py-1.5 px-3 rounded-full text-xs font-semibold bg-[#1B1A3B] text-[#A6A1CC] flex items-center justify-center gap-1"
        >
          <X size={12} /> Decline
        </button>
        <button
          onClick={onAccept}
          className="flex-1 py-1.5 px-3 rounded-full text-xs font-bold bg-[#FF6B4A] text-[#100F26] flex items-center justify-center gap-1"
        >
          <Check size={12} /> Accept
        </button>
      </div>
    </div>
  );
}
