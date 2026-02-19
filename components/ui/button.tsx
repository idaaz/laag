import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-lg text-[15px] font-medium transition-[transform,background-color,box-shadow,color,border-color] duration-[200ms] ease-[var(--ease-soft)] motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-0 disabled:pointer-events-none disabled:opacity-45 active:scale-[0.97]",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-sm border border-primary hover:bg-primary/90 hover:shadow-md",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm border border-destructive hover:bg-destructive/90",
        outline:
          "border border-input bg-background shadow-sm hover:bg-secondary hover:text-foreground",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 border border-transparent",
        ghost: "hover:bg-secondary hover:text-foreground",
        link: "text-primary underline-offset-4 hover:underline"
      },
      size: {
        default: "h-10 px-4",
        sm: "h-9 px-3 text-sm",
        lg: "h-11 px-6 text-base",
        icon: "h-10 w-10"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> { }

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
