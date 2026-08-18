import React from "react";

export function Skeleton({ className = "", style = {} }) {
  return (
    <div
      className={`skeleton-shimmer rounded-xl ${className}`}
      style={style}
    />
  );
}
