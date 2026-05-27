'use client'

import { Bell, AlertTriangle, CalendarClock } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { usePushSubscription } from '@/hooks/use-push-subscription'
import { useNotificationLog } from '@/hooks/use-notification-log'
import type { NotificationLog } from '@/domain/types'

function NotificationItem({ item }: { item: NotificationLog }) {
  const Icon = item.type === 'bill_due' ? AlertTriangle : CalendarClock
  const iconColor = item.type === 'bill_due' ? 'text-amber-500' : 'text-blue-500'

  return (
    <div className="flex items-start gap-3 rounded-lg border p-3">
      <div className={`mt-0.5 shrink-0 ${iconColor}`}>
        <Icon size={18} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium leading-tight">{item.title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{item.body}</p>
        <p className="mt-1 text-[11px] text-muted-foreground/60">
          {formatDistanceToNow(new Date(item.sent_at), { addSuffix: true, locale: localeId })}
        </p>
      </div>
    </div>
  )
}

export default function NotificationsFeedPage() {
  const { isSupported, isSubscribed, isLoading: subLoading, subscribe, unsubscribe } = usePushSubscription()
  const { logs, isLoading: logsLoading } = useNotificationLog()

  return (
    <div className="space-y-4 pb-24">
      <div>
        <h1 className="text-[20px] font-semibold leading-tight tracking-tight lg:text-[24px]">
          Notifikasi
        </h1>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Pengingat aktif dan tagihan mendatang.
        </p>
      </div>

      {isSupported && (
        <div className="flex items-center justify-between rounded-lg border p-3">
          <div>
            <p className="text-sm font-medium">
              {isSubscribed ? 'Notifikasi Aktif' : 'Aktifkan Notifikasi'}
            </p>
            <p className="text-xs text-muted-foreground">
              {isSubscribed
                ? 'Kamu akan menerima notifikasi di perangkat ini.'
                : 'Izinkan notifikasi untuk tagihan dan pengingat.'}
            </p>
          </div>
          <Button
            variant={isSubscribed ? 'outline' : 'default'}
            size="sm"
            disabled={subLoading}
            onClick={isSubscribed ? unsubscribe : subscribe}
          >
            {subLoading ? '...' : isSubscribed ? 'Nonaktifkan' : 'Aktifkan'}
          </Button>
        </div>
      )}

      <div className="space-y-2">
        {logsLoading && (
          <div className="py-8 text-center text-sm text-muted-foreground">Memuat...</div>
        )}

        {!logsLoading && logs.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <Bell size={32} className="text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">Belum ada notifikasi.</p>
          </div>
        )}

        {logs.map((item) => (
          <NotificationItem key={item.id} item={item} />
        ))}
      </div>
    </div>
  )
}
