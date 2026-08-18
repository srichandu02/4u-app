import React, { useEffect } from "react";
import { X } from "lucide-react";

export function Modal({ isOpen, onClose, title, children, maxWidth = "max-w-md" }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm pop-in">
      <div
        className={`w-full ${maxWidth} rounded-3xl bg-[#1B1A3B] border border-[#38316E] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#38316E]">
          <h2 className="f-display font-bold text-lg text-[#F5F3FF]">{title}</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-[#A6A1CC] hover:text-[#F5F3FF] hover:bg-[#2E2966] transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}
