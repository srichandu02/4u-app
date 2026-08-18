import React from "react";

export function Button({
  children,
  onClick,
  variant = "primary", // primary | secondary | outline | ghost | danger
  size = "md", // sm | md | lg
  disabled = false,
  fullWidth = false,
  className = "",
  type = "button",
  icon: Icon = null,
}) {
  const baseStyle = "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-200 outline-none active:scale-[0.98] select-none";

  const variants = {
    primary: "bg-[#FF6B4A] text-[#100F26] hover:bg-[#FFB84D] shadow-md",
    secondary: "bg-[#2E2966] text-[#F5F3FF] hover:bg-[#38316E]",
    outline: "bg-transparent border border-[#38316E] text-[#A6A1CC] hover:text-[#F5F3FF] hover:border-[#FF6B4A]",
    ghost: "bg-transparent text-[#A6A1CC] hover:text-[#F5F3FF]",
    danger: "bg-[#E2453B] text-[#F5F3FF] hover:bg-red-600",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2.5 text-sm",
    lg: "px-6 py-3.5 text-base",
  };

  const widthStyle = fullWidth ? "w-full" : "";
  const disabledStyle = disabled ? "opacity-50 pointer-events-none cursor-not-allowed" : "cursor-pointer";

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${widthStyle} ${disabledStyle} ${className}`}
    >
      {Icon && <Icon size={size === "sm" ? 14 : size === "lg" ? 20 : 16} />}
      {children}
    </button>
  );
}
