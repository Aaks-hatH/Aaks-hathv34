import * as React from "react"
import { cn } from "@/lib/utils"

const Button = React.forwardRef(({ className, variant, size, ...props }, ref) => {
  return (
    <button
      ref={ref}
      className={cn("inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none disabled:opacity-50 h-10 px-4 py-2 bg-cyan-600 text-white hover:bg-cyan-700", className)}
      {...props}
    />
  )
})
Button.displayName = "Button"
export { Button }