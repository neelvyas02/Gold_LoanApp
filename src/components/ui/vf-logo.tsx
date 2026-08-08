import React from "react";

interface VFLogoProps {
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
  variant?: "full" | "icon" | "auto";
  animated?: boolean;
  className?: string;
}

export function VFLogo({
  size = "md",
  variant = "auto",
  animated = true,
  className = "",
}: VFLogoProps) {
  // Determine if we should render icon-only or full logo
  const isIconOnly =
    variant === "icon" || (variant === "auto" && (size === "sm" || size === "md"));

  // Sizing definitions adhering strictly to spec:
  // Desktop: complete logo ~300-380px wide (icon 150-190px)
  // Tablet: complete logo ~240-300px wide
  // Mobile: complete logo ~180-240px wide
  const fullSizeClasses = {
    sm: "w-[140px]",
    md: "w-[180px] sm:w-[200px]",
    lg: "w-[220px] sm:w-[260px]",
    xl: "w-[240px] sm:w-[280px] md:w-[320px]",
    "2xl": "w-[220px] sm:w-[280px] md:w-[340px] lg:w-[360px]",
  };

  const iconSizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-16 h-16",
    xl: "w-24 h-24",
    "2xl": "w-36 h-36 md:w-44 md:h-44",
  };

  const sizeClass = isIconOnly ? iconSizeClasses[size] : fullSizeClasses[size];
  const svgPath = isIconOnly
    ? "/assets/logo/vyas-finance-icon.svg"
    : "/assets/logo/vyas-finance-logo.svg";

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${
        animated ? "animate-in fade-in slide-in-from-bottom-2 duration-700 ease-out" : ""
      } ${className}`}
    >
      <div className="relative group cursor-pointer transition-transform duration-300 ease-out hover:scale-[1.02]">
        {/* Extremely subtle gold aura highlight on desktop hover */}
        <div
          className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, rgba(245, 208, 97, 0.18) 0%, rgba(212, 175, 55, 0.05) 60%, rgba(0, 0, 0, 0) 80%)",
            filter: "blur(12px)",
            transform: "scale(1.15)",
          }}
        />

        {/* Scalable High-Precision SVG Logo Asset */}
        <img
          src={svgPath}
          alt="Vyas Finance Logo"
          className={`${sizeClass} h-auto object-contain relative z-10 transition-filter duration-300 filter drop-shadow-[0_4px_12px_rgba(212,175,55,0.25)] group-hover:drop-shadow-[0_6px_18px_rgba(245,208,97,0.4)]`}
          loading="eager"
        />
      </div>
    </div>
  );
}
