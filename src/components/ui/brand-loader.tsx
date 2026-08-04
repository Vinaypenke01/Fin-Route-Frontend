import React from "react";
import { Loader2 } from "lucide-react";

interface BrandLoaderProps {
  fullScreen?: boolean;
  message?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function BrandLoader({
  fullScreen = false,
  message = "Loading FinRoute...",
  className = "",
  size = "md",
}: BrandLoaderProps) {
  const logoSizes = {
    sm: "size-8",
    md: "size-12",
    lg: "size-16",
  };

  const spinnerSizes = {
    sm: "size-10",
    md: "size-16",
    lg: "size-20",
  };

  const content = (
    <div className={`flex flex-col items-center justify-center p-6 text-center space-y-4 animate-in fade-in duration-300 ${className}`}>
      <div className="relative flex items-center justify-center">
        {/* Glowing backdrop ring */}
        <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl animate-pulse" />
        
        {/* Animated outer ring */}
        <div className={`absolute border-2 border-primary/20 border-t-primary rounded-full animate-spin ${spinnerSizes[size]}`} />

        {/* Brand Icon / Logo */}
        <img
          src="/logo-removebg-preview (1).png"
          alt="FinRoute Logo"
          className={`relative object-contain transition-all animate-pulse ${logoSizes[size]}`}
          onError={(e) => {
            // Fallback to stylized SVG icon if image fails
            (e.target as HTMLElement).style.display = "none";
          }}
        />
      </div>

      {message && (
        <div className="space-y-1">
          <p className="text-xs font-bold font-display tracking-wide text-foreground animate-pulse">
            {message}
          </p>
          <p className="text-[10px] text-muted-foreground font-mono">
            FinRoute Financial ERP
          </p>
        </div>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-md">
        {content}
      </div>
    );
  }

  return content;
}
