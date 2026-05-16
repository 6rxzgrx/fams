'use client'

import { Sun, Moon, Monitor } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTheme, type Theme } from './theme-provider'

const OPTIONS: { value: Theme; label: string; Icon: typeof Sun }[] = [
  { value: 'light',  label: 'Terang', Icon: Sun },
  { value: 'system', label: 'Sistem', Icon: Monitor },
  { value: 'dark',   label: 'Gelap',  Icon: Moon },
]

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <div
      role="radiogroup"
      aria-label="Pilih mode tampilan"
      className="inline-flex items-center gap-1 rounded-pill bg-muted p-1"
    >
      {OPTIONS.map(({ value, label, Icon }) => {
        const active = theme === value
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={label}
            onClick={() => setTheme(value)}
            className={cn(
              'inline-flex h-9 min-w-9 items-center justify-center rounded-pill px-3',
              'text-sm font-semibold cursor-pointer',
              'transition-[background-color,color] duration-200 ease-out',
              active
                ? 'bg-accent text-accent-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Icon className="size-4" strokeWidth={2} aria-hidden="true" />
          </button>
        )
      })}
    </div>
  )
}
