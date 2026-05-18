'use client'

type Slice = { label: string; amount: number; color: string }

type Props = {
  slices: Slice[]
  size?: number
  centerLabel?: string
  centerValue?: string
}

export function CategoryDonut({ slices, size = 160, centerLabel, centerValue }: Props) {
  const total = slices.reduce((sum, s) => sum + s.amount, 0)
  const r = size / 2 - 8
  const cx = size / 2
  const cy = size / 2

  if (total <= 0) {
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Donut pengeluaran kategori">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--border)" strokeWidth={2} strokeDasharray="3 5" />
        <text
          x={cx}
          y={cy + 4}
          textAnchor="middle"
          fontSize={11}
          fontWeight={600}
          fill="var(--muted-foreground)"
          fontFamily="var(--font-sans)"
        >
          Belum ada
        </text>
      </svg>
    )
  }

  const startAngle = -Math.PI / 2
  const paths = slices.reduce<{ acc: { d: string; color: string }[]; angle: number }>(
    ({ acc, angle }, s) => {
      const frac = s.amount / total
      const next = angle + frac * Math.PI * 2
      const large = frac > 0.5 ? 1 : 0
      const x0 = cx + Math.cos(angle) * r
      const y0 = cy + Math.sin(angle) * r
      const x1 = cx + Math.cos(next) * r
      const y1 = cy + Math.sin(next) * r
      const d =
        frac >= 0.999
          ? `M ${cx - r} ${cy} A ${r} ${r} 0 1 1 ${cx + r} ${cy} A ${r} ${r} 0 1 1 ${cx - r} ${cy} Z`
          : `M ${cx} ${cy} L ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1} Z`
      return { acc: [...acc, { d, color: s.color }], angle: next }
    },
    { acc: [], angle: startAngle },
  ).acc

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Donut pengeluaran kategori">
      {paths.map((p, i) => (
        <path key={i} d={p.d} fill={p.color} />
      ))}
      <circle cx={cx} cy={cy} r={r * 0.62} fill="var(--surface)" />
      {centerLabel && (
        <text
          x={cx}
          y={cy - 4}
          textAnchor="middle"
          fontSize={10.5}
          fontWeight={600}
          fill="var(--muted-foreground)"
          fontFamily="var(--font-sans)"
          letterSpacing="0.08em"
        >
          {centerLabel}
        </text>
      )}
      {centerValue && (
        <text
          x={cx}
          y={cy + 16}
          textAnchor="middle"
          fontSize={16}
          fontWeight={700}
          fill="var(--foreground)"
          fontFamily="var(--font-sans)"
          letterSpacing="-0.02em"
        >
          {centerValue}
        </text>
      )}
    </svg>
  )
}
