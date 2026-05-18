import { forwardRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface GarageBadgeProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  showNotification?: boolean;
}

const GarageBadge = forwardRef<HTMLButtonElement, GarageBadgeProps>(
  ({ showNotification, className, onClick, ...rest }, ref) => {
    const { user, profile } = useAuth();

    const initial = user
      ? profile?.display_name?.charAt(0).toUpperCase() ||
        user.email?.charAt(0).toUpperCase() ||
        "R"
      : "?";

    return (
      <button
        ref={ref}
        type="button"
        onClick={onClick}
        aria-label={user ? "Mon garage" : "Se connecter"}
        className={cn(
          "relative inline-flex items-center gap-2 rounded-xl px-2 py-1.5 sm:px-2.5",
          "transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]",
          "min-h-[44px] max-w-[110px]",
          className
        )}
        style={{
          background: "linear-gradient(135deg, #161616 0%, #0d0d0d 100%)",
          border: "1px solid rgba(74,124,89,0.4)",
          boxShadow:
            "0 4px 14px rgba(0,0,0,0.25), 0 0 0 1px rgba(74,124,89,0.08) inset",
        }}
        {...rest}
      >
        <span
          className="flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold flex-shrink-0"
          style={{
            background: user
              ? "linear-gradient(135deg, #4A7C59 0%, #3A6449 100%)"
              : "rgba(255,255,255,0.08)",
            color: "white",
            fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}
        >
          {initial}
        </span>

        <span className="flex flex-col items-start leading-none gap-0.5">
          <span
            className="text-[8px] uppercase tracking-[0.15em] text-white/55"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Mon
          </span>
          <span
            className="text-[13px] uppercase text-white"
            style={{
              fontFamily: "'Anton', sans-serif",
              letterSpacing: "0.05em",
              lineHeight: 1,
            }}
          >
            Garage
          </span>
        </span>

        {showNotification && (
          <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
            <span
              className="absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping"
              style={{ backgroundColor: "#FF6600" }}
            />
            <span
              className="relative inline-flex h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: "#FF6600" }}
            />
          </span>
        )}
      </button>
    );
  }
);

GarageBadge.displayName = "GarageBadge";

export default GarageBadge;
