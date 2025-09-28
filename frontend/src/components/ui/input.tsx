import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-12 w-full rounded-lg border border-input bg-vault-surface px-4 py-3 text-sm text-vault-text-primary placeholder:text-vault-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vault-purple focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-300 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
