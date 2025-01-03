import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline"
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = "default", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset",
          {
            "bg-gray-50 text-gray-600 ring-gray-500/10": variant === "secondary",
            "bg-red-50 text-red-700 ring-red-600/10": variant === "destructive",
            "bg-white text-gray-900 ring-gray-200": variant === "outline",
            "bg-primary text-primary-foreground ring-primary/10": variant === "default",
          },
          className
        )}
        {...props}
      />
    )
  }
)
Badge.displayName = "Badge"

export { Badge } 