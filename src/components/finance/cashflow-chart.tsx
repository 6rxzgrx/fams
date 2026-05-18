'use client'

type Props = {
  series: number[]
  height?: number
  className?: string
}

export function CashflowChart({ series, height = 160, className }: Props) {
  const w = 800
  const h = height
  const padding = 8

  if (series.length < 2) {
    return (
      <div
        className={className}
        style={{ height }}
        aria-hidden="true"
      />
    )
  }

  const max = Math.max(...series)
  const min = Math.min(...series)
  const range = max - min || 1

  const pts = series.map((v, i) => {
    const x = (i / (series.length - 1)) * w
    const y = h - padding - ((v - min) / range) * (h - padding * 2)
    return [x, y] as const
  })

  let path = `M ${pts[0][0]} ${pts[0][1]}`
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1]
    const [x1, y1] = pts[i]
    const cx = (x0 + x1) / 2
    path += ` C ${cx} ${y0}, ${cx} ${y1}, ${x1} ${y1}`
  }
  const area = `${path} L ${w} ${h} L 0 ${h} Z`
  const gradId = `cf-grad-${height}`

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      className={className}
      style={{ display: 'block', height, width: '100%' }}
      role="img"
      aria-label="Grafik arus kas 30 hari"
    >
      <defs>
        <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--foreground)" stopOpacity="0.14" />
          <stop offset="100%" stopColor="var(--foreground)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradId})`} />
      <path
        d={path}
        fill="none"
        stroke="var(--foreground)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
