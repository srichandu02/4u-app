import React from "react";

export function Avatar({ name = "4U", src = null, size = 44, ring = false, online = false }) {
  const initials = (name || "4U").slice(0, 2).toUpperCase();

  return (
    <div className="relative inline-block flex-shrink-0">
      {src ? (
        <img
          src={src}
          alt={name}
          className="rounded-full object-cover"
          style={{
            width: size,
            height: size,
            boxShadow: ring ? "0 0 0 2px #100F26, 0 0 0 4px #FF6B4A" : "none",
          }}
        />
      ) : (
        <div
          className="flex items-center justify-center rounded-full f-display font-bold select-none"
          style={{
            width: size,
            height: size,
            background: "linear-gradient(135deg, #FF6B4A, #FFB84D)",
            color: "#100F26",
            fontSize: size * 0.36,
            boxShadow: ring ? "0 0 0 2px #100F26, 0 0 0 4px #FF6B4A" : "none",
          }}
        >
          {initials}
        </div>
      )}
      {online && (
        <span
          className="absolute bottom-0 right-0 rounded-full border-2 border-[#100F26]"
          style={{
            width: Math.max(10, size * 0.28),
            height: Math.max(10, size * 0.28),
            backgroundColor: "#10B981",
          }}
        />
      )}
    </div>
  );
}
