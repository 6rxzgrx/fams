import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import type { HTMLAttributes } from 'react'

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1 text-[12px] font-semibold leading-none',
  {
    variants: {
      variant: {
        default:   'bg-accent text-accent-foreground',
        secondary: 'bg-muted text-foreground',
        success:   'bg-success-soft text-success',
        warning:   'bg-warning-soft text-warning',
        danger:    'bg-danger-soft text-danger',
        info:      'bg-info-soft text-info',
        outline:   'border border-border-strong text-foreground',
      },
    },
    defaultVariants: { variant: 'default' },
  }
)

interface BadgeProps extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
