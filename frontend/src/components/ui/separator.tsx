import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

const separatorVariants = cva("shrink-0 bg-border", {
  variants: {
    orientation: {
      horizontal: "h-[1px] w-full",
      vertical: "h-full w-[1px]",
    },
  },
  defaultVariants: {
    orientation: "horizontal",
  },
})

interface SeparatorProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof separatorVariants> {}

const Separator = React.forwardRef<HTMLDivElement, SeparatorProps>(
  ({ className, orientation, ...props }, ref) => (
    <div
      ref={ref}
      className={separatorVariants({ orientation, className })}
      role="separator"
      aria-orientation={orientation || "horizontal"}
      {...props}
    />
  )
)
Separator.displayName = "Separator"

export { Separator }
