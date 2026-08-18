import React, { useEffect } from "react";
import { X } from "lucide-react";

export function BottomSheet({ isOpen, onClose, title, children, maxHeight = "max-h-[85vh]" }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm fade-in">
      <div
        className="fixed inset-0"
        onClick={onClose}
      />
      <div
        className={`relative z-10 w-full sm:max-w-lg bg-[#1C1A3A] border border-[#363168] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col ${maxHeight} slide-up overflow-hidden`}
      >
        {/* Drag handle on mobile */}
        <div className="flex sm:hidden justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-[#4A4488]" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#363168]">
          <h2 className="f-display font-bold text-lg text-[#F5F3FF] tracking-tight">{title}</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-[#A6A1CC] hover:text-[#F5F3FF] hover:bg-[#26234D] transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 no-scrollbar pb-safe">
          {children}
        </div>
      </div>
    </div>
  );
}
