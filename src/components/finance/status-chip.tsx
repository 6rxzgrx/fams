import { CheckCircle2, Clock, AlertTriangle, Circle } from 'lucide-react'
import type { ComponentType, SVGProps } from 'react'
import { Badge } from '@/components/ui/badge'

type Status = 'paid' | 'unpaid' | 'overdue' | 'due-soon'

const CONFIG: Record<
  Status,
  {
    label: string
    variant: 'success' | 'secondary' | 'danger' | 'warning'
    Icon: ComponentType<SVGProps<SVGSVGElement>>
  }
> = {
  paid:       { label: 'Lunas',              variant: 'success',   Icon: CheckCircle2 },
  unpaid:     { label: 'Belum Bayar',        variant: 'secondary', Icon: Circle },
  'due-soon': { label: 'Segera Jatuh Tempo', variant: 'warning',   Icon: Clock },
  overdue:    { label: 'Terlambat',          variant: 'danger',    Icon: AlertTriangle },
}

export function StatusChip({ status }: { status: Status }) {
  const { label, variant, Icon } = CONFIG[status]
  return (
    <Badge variant={variant} aria-label={label}>
      <Icon className="size-3.5" strokeWidth={1.75} aria-hidden="true" />
      {label}
    </Badge>
  )
}
