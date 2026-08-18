import React from "react";
import { Button } from "./Button";

export function EmptyState({
  icon: Icon = null,
  title = "Nothing here yet",
  description = "Check back later or try exploring other sections.",
  actionLabel = null,
  onAction = null,
  className = "",
}) {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center select-none ${className}`}>
      {Icon && (
        <div className="w-16 h-16 rounded-3xl bg-[#26234D] border border-[#363168] flex items-center justify-center text-[#FF5E3A] mb-4 shadow-lg pop-in">
          <Icon size={30} strokeWidth={1.75} />
        </div>
      )}
      <h3 className="f-display font-bold text-base text-[#F5F3FF] mb-1.5">{title}</h3>
      <p className="f-body text-xs text-[#A6A1CC] max-w-xs leading-relaxed mb-5">{description}</p>
      {actionLabel && onAction && (
        <Button variant="primary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
