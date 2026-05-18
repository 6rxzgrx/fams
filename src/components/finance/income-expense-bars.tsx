'use client'

type Month = { m: string; inc: number; exp: number }

type Props = {
  months: Month[]
  height?: number
  className?: string
}

export function IncomeExpenseBars({ months, height = 200, className }: Props) {
  const w = 600
  const h = height
  const padTop = 24
  const padBot = 28
  const padX = 16

  if (!months.length) {
    return <div className={className} style={{ height }} aria-hidden="true" />
  }

  const max = Math.max(1, ...months.flatMap((m) => [m.inc, m.exp]))
  const groupW = (w - padX * 2) / months.length
  const gap = 4
  const barW = (groupW - gap * 3) / 2
  const lastIdx = months.length - 1

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      className={className}
      style={{ display: 'block', height, width: '100%' }}
      role="img"
      aria-label="Pemasukan vs pengeluaran 6 bulan"
    >
      {[0.25, 0.5, 0.75, 1].map((t, i) => (
        <line
          key={i}
          x1={padX}
          x2={w - padX}
          y1={padTop + (1 - t) * (h - padTop - padBot)}
          y2={padTop + (1 - t) * (h - padTop - padBot)}
          stroke="var(--border)"
          strokeDasharray="2 4"
        />
      ))}
      {months.map((m, i) => {
        const xStart = padX + i * groupW + gap
        const incH = (m.inc / max) * (h - padTop - padBot)
        const expH = (m.exp / max) * (h - padTop - padBot)
        const isLast = i === lastIdx
        return (
          <g key={i}>
            <rect
              x={xStart}
              y={h - padBot - incH}
              width={barW}
              height={Math.max(0, incH)}
              rx={4}
              fill="var(--success)"
              opacity={isLast ? 1 : 0.55}
            />
            <rect
              x={xStart + barW + gap}
              y={h - padBot - expH}
              width={barW}
              height={Math.max(0, expH)}
              rx={4}
              fill={isLast ? 'var(--foreground)' : 'var(--muted)'}
              stroke={isLast ? 'none' : 'var(--border-strong)'}
            />
            <text
              x={xStart + barW + gap / 2}
              y={h - 8}
              textAnchor="middle"
              fontSize="11"
              fontWeight={600}
              fill={isLast ? 'var(--foreground)' : 'var(--muted-foreground)'}
              fontFamily="var(--font-sans)"
            >
              {m.m}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
