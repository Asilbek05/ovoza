import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl font-semibold transition-[background,color,box-shadow,transform] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        primary: "bg-primary text-white hover:bg-primary-deep shadow-cta",
        plain: "bg-primary text-white hover:bg-primary-deep",
        soft: "bg-primary-soft text-primary-deep hover:bg-primary-mid/40",
        ink: "bg-ink text-white hover:bg-ink-2",
        "on-dark": "bg-white/10 text-white ring-1 ring-white/20 hover:bg-white/15",
        outline: "border border-line bg-surface text-ink hover:border-primary-mid hover:bg-surface",
        ghost: "text-ink-2 hover:bg-primary-soft hover:text-primary-deep",
        accent: "bg-accent text-ink hover:bg-accent-deep",
        danger: "bg-danger text-white hover:bg-danger-ink",
        "danger-soft": "bg-danger-soft text-danger-ink hover:bg-danger-soft/70",
        success: "bg-success text-white hover:bg-success-ink",
        link: "text-primary underline-offset-4 hover:underline px-0",
      },
      size: {
        sm: "h-9 px-4 text-sm",
        md: "h-11 px-5 text-sm",
        lg: "h-13 rounded-2xl px-6 text-base",
        icon: "size-11",
        "icon-sm": "size-9",
      },
    },
    defaultVariants: { variant: "plain", size: "md" },
  },
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, asChild, ...props }, ref) => {
  const Comp = asChild ? Slot : "button";
  return <Comp ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
});
Button.displayName = "Button";
