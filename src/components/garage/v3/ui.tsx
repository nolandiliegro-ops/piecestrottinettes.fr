/** Briques partagées du garage v3 (25/10/2026). */
import type { ReactNode } from "react";

export const UNB = "'Unbounded', sans-serif";
export const FONT = "'Plus Jakarta Sans', sans-serif";
export const CARBON = "#1A1A1A";
export const GREEN = "#4A7C59";
export const SOFT = "#8FBF9C";
export const PAPER = "#FAFAF8";
export const LINE = "#E2DCD0";
export const MUTED = "#6B7280";
export const cut = (c: number) => `polygon(0 0, calc(100% - ${c}px) 0, 100% ${c}px, 100% 100%, ${c}px 100%, 0 calc(100% - ${c}px))`;

/** Titre d'écran posé sur le wallpaper. */
export const ScreenTitle = ({ kicker, title, children }: { kicker: string; title: ReactNode; children?: ReactNode }) => (
  <header className="mb-5">
    <p className="text-sm font-bold uppercase tracking-[0.14em]" style={{ fontFamily: FONT, color: SOFT, textShadow: "0 1px 8px rgba(0,0,0,0.5)" }}>{kicker}</p>
    <h1 className="mt-1 text-[30px] lg:text-[44px] uppercase leading-[0.95] text-white" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", letterSpacing: "-0.03em", textShadow: "0 2px 18px rgba(0,0,0,0.45)" }}>{title}</h1>
    {children && <p className="mt-2 max-w-xl text-base text-white/90" style={{ fontFamily: FONT, textShadow: "0 1px 10px rgba(0,0,0,0.5)" }}>{children}</p>}
  </header>
);

/** Panneau papier à coin coupé. */
export const Box = ({ children, className = "", pad = "p-4 lg:p-5", id }: { children: ReactNode; className?: string; pad?: string; id?: string }) => (
  <section id={id} className={`${pad} ${className}`} style={{ background: PAPER, clipPath: cut(14), fontFamily: FONT }}>{children}</section>
);

export const BoxTitle = ({ children, right }: { children: ReactNode; right?: ReactNode }) => (
  <div className="flex items-baseline justify-between gap-3">
    <h2 className="text-base uppercase leading-tight" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", color: CARBON, letterSpacing: "-0.01em" }}>{children}</h2>
    {right}
  </div>
);
