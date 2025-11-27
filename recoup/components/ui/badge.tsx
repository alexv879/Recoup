import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[#0078D4] text-white [a&]:hover:bg-[#106EBE]",
        secondary:
          "border-transparent bg-[#208094] text-white [a&]:hover:bg-[#1A6B7D]",
        destructive:
          "border-transparent bg-[#DC2626] text-white [a&]:hover:bg-[#991B1B] focus-visible:ring-destructive/20",
        outline:
          "text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        success:
          "border-[#22C55E]/20 bg-[#F0FDF4] text-[#166534] [a&]:hover:bg-[#DCFCE7]",
        warning:
          "border-[#F59E0B]/20 bg-[#FFFBEB] text-[#92400E] [a&]:hover:bg-[#FEF3C7]",
        danger:
          "border-[#DC2626]/20 bg-[#FEF2F2] text-[#991B1B] [a&]:hover:bg-[#FEE2E2]",
        neutral:
          "border-[#9CA3AF]/20 bg-[#F9FAFB] text-[#374151] [a&]:hover:bg-[#F3F4F6]",
        info:
          "border-[#0891B2]/20 bg-[#ECFEFF] text-[#164E63] [a&]:hover:bg-[#CFFAFE]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
