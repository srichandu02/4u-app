import React from "react";

export function Card({ children, className = "", style = {}, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`rounded-3xl p-5 bg-[#252152] border border-[#38316E] shadow-sm transition-all ${onClick ? "cursor-pointer active:scale-[0.99]" : ""} ${className}`}
      style={style}
    >
      {children}
    </div>
  );
}
