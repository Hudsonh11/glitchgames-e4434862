import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "group relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold font-body ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 uppercase tracking-wide overflow-hidden active:scale-95",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-[0_0_25px_hsl(var(--primary)/0.6)] hover:-translate-y-0.5 before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent before:-translate-x-full hover:before:translate-x-full before:transition-transform before:duration-500",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:shadow-[0_0_20px_hsl(var(--destructive)/0.5)] hover:-translate-y-0.5",
        outline: "border-2 border-border bg-transparent hover:bg-primary/10 hover:border-primary hover:text-primary hover:shadow-[0_0_15px_hsl(var(--primary)/0.3)] transition-all duration-300",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:shadow-[0_0_25px_hsl(var(--secondary)/0.6)] hover:-translate-y-0.5 before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent before:-translate-x-full hover:before:translate-x-full before:transition-transform before:duration-500",
        ghost: "hover:bg-muted hover:text-foreground hover:scale-105",
        link: "text-primary underline-offset-4 hover:underline hover:text-primary/80",
        gaming: "bg-gradient-to-r from-[hsl(var(--primary))] via-[hsl(var(--accent))] to-[hsl(var(--secondary))] text-primary-foreground font-display hover:shadow-[0_0_30px_hsl(var(--primary)/0.6),0_0_60px_hsl(var(--secondary)/0.4)] hover:-translate-y-1 animate-gradient-x before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/30 before:to-transparent before:-translate-x-full hover:before:translate-x-full before:transition-transform before:duration-700",
        gold: "bg-gradient-to-r from-[hsl(var(--warning))] via-amber-400 to-[hsl(var(--warning))] text-warning-foreground font-display hover:shadow-[0_0_30px_hsl(var(--warning)/0.6),0_0_60px_hsl(35,100%,50%,0.4)] hover:-translate-y-1 animate-shimmer before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/40 before:to-transparent before:-translate-x-full hover:before:translate-x-full before:transition-transform before:duration-500",
        success: "bg-success text-success-foreground hover:bg-success/90 hover:shadow-[0_0_20px_hsl(var(--success)/0.5)] hover:-translate-y-0.5",
        accent: "bg-accent text-accent-foreground hover:bg-accent/90 hover:shadow-[0_0_25px_hsl(var(--accent)/0.6)] hover:-translate-y-0.5 before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent before:-translate-x-full hover:before:translate-x-full before:transition-transform before:duration-500",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-12 rounded-lg px-8 text-base",
        xl: "h-14 rounded-xl px-10 text-lg",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
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
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
