import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

// Design system streetwear premium — noir/blanc tranché (Aimé Leon Dore / Patagonia).
// Vert/orange retirés des CTA, conservés UNIQUEMENT en accents signaux
// (badges, pastilles stock, dots pulse, glow GarageRiderCard).
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:bg-gray-200 disabled:text-gray-400 disabled:opacity-60 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 transition-all duration-200",
  {
    variants: {
      variant: {
        // PRIMAIRE — noir profond #1A1A1A (= bg-carbon)
        default:
          "bg-carbon text-white hover:bg-black shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98]",
        // DESTRUCTIF — inchangé (rouge)
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm hover:shadow-md active:scale-[0.98]",
        // SECONDAIRE — blanc bord noir, invert au hover
        outline:
          "bg-white text-carbon border-2 border-carbon hover:bg-carbon hover:text-white hover:scale-[1.02] active:scale-[0.98]",
        // Secondary token shadcn — keep neutral for badge-like usage
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-md",
        // GHOST — transparent + hover bg-gray-50 (icon buttons, cancel actions)
        ghost:
          "bg-transparent text-carbon hover:bg-gray-50 rounded-md",
        // TERTIAIRE / LINK — underline, decoration-2 au hover
        link:
          "bg-transparent text-carbon underline decoration-1 underline-offset-4 hover:decoration-2 hover:text-black rounded-none p-0 h-auto",
        // CTA legacy — alias de default pour rétrocompat (anciennement sage green)
        cta:
          "bg-carbon text-white hover:bg-black shadow-md hover:shadow-[0_8px_30px_rgba(0,0,0,0.4)] hover:scale-105 active:scale-[0.98]",
      },
      size: {
        default: "h-11 px-6 py-3",
        sm: "h-9 px-3 rounded-md",
        lg: "h-12 px-8",
        icon: "h-10 w-10 rounded-md",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
