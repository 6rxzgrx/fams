'use client'

import { cva, type VariantProps } from 'class-variance-authority'
import { Slot } from '@radix-ui/react-slot'
import { cn } from '@/lib/utils'
import { forwardRef, type ButtonHTMLAttributes } from 'react'

const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2 whitespace-nowrap',
    'font-semibold cursor-pointer select-none',
    'transition-[transform,opacity,background-color,border-color] duration-150 ease-out',
    'active:scale-[0.97]',
    'focus-visible:outline-none',
    'disabled:pointer-events-none disabled:opacity-40',
    'aria-busy:cursor-wait',
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  ].join(' '),
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:opacity-90',
        accent: 'bg-accent text-accent-foreground hover:brightness-95',
        outline: 'bg-transparent text-foreground border border-border-strong hover:bg-muted',
        ghost: 'bg-transparent text-foreground hover:bg-muted',
        destructive: 'bg-danger-soft text-danger hover:brightness-110',
        link: 'text-accent underline-offset-4 hover:underline h-auto px-0',
        secondary: 'bg-muted text-foreground hover:bg-muted/80',
      },
      size: {
        default: 'h-12 px-5 text-[15px] rounded-md',
        sm: 'h-11 px-4 text-sm rounded-md',
        lg: 'h-14 px-6 text-base rounded-md',
        icon: 'size-11 rounded-md',
        'icon-sm': 'size-8 rounded-md',
        pill: 'h-12 px-6 rounded-pill text-[15px]',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        data-slot="button"
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
