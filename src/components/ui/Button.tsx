"use client";

import { ButtonHTMLAttributes, ReactNode } from "react";
import { clsx } from "@/lib/utils/clsx";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "md" | "lg";
  locked?: boolean;
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  locked = false,
  className,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      disabled={disabled || locked}
      className={clsx(
        "relative inline-flex items-center justify-center gap-2 rounded-xl font-body font-semibold tracking-tight transition-all duration-200 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40",
        size === "md" ? "px-5 py-3 text-sm" : "px-8 py-4 text-base",
        variant === "primary" &&
          "bg-gradient-to-b from-ember-bright to-ember text-white shadow-[0_4px_0_theme(colors.ember.dim),0_10px_24px_rgba(200,75,54,0.35)] hover:brightness-110 active:shadow-[0_1px_0_theme(colors.ember.dim)] active:translate-y-[3px]",
        variant === "secondary" &&
          "bg-void-raised text-parchment border border-void-line hover:border-gold/50 hover:bg-void-panel",
        variant === "ghost" && "text-parchment/70 hover:text-parchment hover:bg-white/5",
        variant === "danger" && "bg-void-raised text-ember-bright border border-ember-dim hover:bg-ember-dim/20",
        className
      )}
      {...rest}
    >
      {children}
      {locked && (
        <span className="ml-1 rounded-full bg-void/60 px-2 py-0.5 text-[10px] font-medium text-gold/80">
          Próximamente
        </span>
      )}
    </button>
  );
}
