import React from "react";

export function Chip({ active, onClick, children, className = "" }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-medium f-body flex-shrink-0 transition-colors cursor-pointer select-none ${className}`}
      style={{
        background: active ? "#FF6B4A" : "#2E2966",
        color: active ? "#100F26" : "#A6A1CC",
        border: `1px solid ${active ? "#FF6B4A" : "#38316E"}`,
      }}
    >
      {children}
    </button>
  );
}
