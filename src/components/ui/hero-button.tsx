import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface HeroButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline";
  size?: "default" | "lg" | "xl";
}

const HeroButton = forwardRef<HTMLButtonElement, HeroButtonProps>(
  ({ className, variant = "primary", size = "default", ...props }, ref) => {
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center rounded-xl font-semibold transition-spring focus:outline-none focus:ring-4 focus:ring-primary/20 disabled:opacity-50 disabled:pointer-events-none",
          {
            "gradient-sunrise text-white shadow-warm hover:shadow-glow hover:scale-105": variant === "primary",
            "bg-secondary text-secondary-foreground shadow-card hover:bg-secondary/90 hover:shadow-warm hover:scale-105": variant === "secondary",
            "border-2 border-primary text-primary bg-background/80 backdrop-blur-sm hover:bg-primary hover:text-primary-foreground hover:shadow-warm hover:scale-105": variant === "outline",
          },
          {
            "h-12 px-6 text-base": size === "default",
            "h-14 px-8 text-lg": size === "lg", 
            "h-16 px-10 text-xl": size === "xl",
          },
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

HeroButton.displayName = "HeroButton";

export { HeroButton };