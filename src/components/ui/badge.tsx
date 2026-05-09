import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary/10 text-primary hover:bg-primary/20",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive/10 text-destructive hover:bg-destructive/20",
        outline: "text-foreground",
        success: "border-transparent bg-success/10 text-success",
        warning: "border-transparent bg-warning/10 text-warning",
        live: "border-transparent bg-destructive/10 text-destructive animate-pulse",
        scheduled: "border-transparent bg-primary/10 text-primary",
        completed: "border-transparent bg-muted text-muted-foreground",
        a1: "border-transparent bg-level-a1/10 text-level-a1",
        a2: "border-transparent bg-level-a2/10 text-level-a2",
        b1: "border-transparent bg-level-b1/10 text-level-b1",
        b2: "border-transparent bg-level-b2/10 text-level-b2",
        c1: "border-transparent bg-level-c1/10 text-level-c1",
        c2: "border-transparent bg-level-c2/10 text-level-c2",
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
