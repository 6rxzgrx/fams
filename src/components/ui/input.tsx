import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex w-full min-w-0 rounded-md border border-border bg-surface px-3 py-2",
        "text-base placeholder:text-muted-foreground",
        "h-12 lg:h-10",
        "transition-colors duration-150 outline-none",
        "selection:bg-accent selection:text-accent-foreground",
        "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
        "focus-visible:border-accent focus-visible:ring-0",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "aria-invalid:border-danger",
        "dark:bg-muted dark:border-transparent dark:focus-visible:border-accent",
        className,
      )}
      {...props}
    />
  )
}

export { Input }
