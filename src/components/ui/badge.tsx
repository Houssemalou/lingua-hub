import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        success: "border-transparent bg-success text-success-foreground",
        warning: "border-transparent bg-warning text-warning-foreground",
        live: "border-transparent bg-destructive/20 text-destructive animate-pulse",
        scheduled: "border-transparent bg-primary/20 text-primary",
        completed: "border-transparent bg-muted text-muted-foreground",
        a1: "border-transparent bg-level-a1/20 text-level-a1",
        a2: "border-transparent bg-level-a2/20 text-level-a2",
        b1: "border-transparent bg-level-b1/20 text-level-b1",
        b2: "border-transparent bg-level-b2/20 text-level-b2",
        c1: "border-transparent bg-level-c1/20 text-level-c1",
        c2: "border-transparent bg-level-c2/20 text-level-c2",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
