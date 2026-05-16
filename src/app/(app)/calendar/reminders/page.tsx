'use client'

import { useState } from 'react'
import { Bell, Plus, Calendar, Check, Pencil, Trash2, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import { format, isPast, isToday, isTomorrow } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { Resolver } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/sections/empty-state'
import { ListSkeleton } from '@/components/sections/loading-state'
import { ErrorState } from '@/components/sections/error-state'
import { cn } from '@/lib/utils'
import { PageContainer } from '@/components/layout/page-container'
import {
  useReminders,
  useCreateReminder,
  useUpdateReminder,
  useDeleteReminder,
} from '@/hooks/use-reminders'
import {
  CreateReminderSchema,
  UpdateReminderSchema,
  type Reminder,
  type CreateReminderInput,
  type UpdateReminderInput,
} from '@/domain/types'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const RECURRENCE_LABELS: Record<string, string> = {
  none: 'Sekali',
  daily: 'Harian',
  weekly: 'Mingguan',
  monthly: 'Bulanan',
  yearly: 'Tahunan',
}

function formatDueAt(dueAt: string): string {
  const date = new Date(dueAt)
  if (isToday(date)) return `Hari ini · ${format(date, 'HH:mm')}`
  if (isTomorrow(date)) return `Besok · ${format(date, 'HH:mm')}`
  return format(date, "EEEE, d MMM yyyy · HH:mm", { locale: idLocale })
}

function dueStatus(dueAt: string, isDone: boolean): 'done' | 'overdue' | 'today' | 'upcoming' {
  if (isDone) return 'done'
  const date = new Date(dueAt)
  if (isPast(date) && !isToday(date)) return 'overdue'
  if (isToday(date)) return 'today'
  return 'upcoming'
}

// ─── Reminder Form ────────────────────────────────────────────────────────────

type ReminderFormProps = {
  defaultValues?: Partial<CreateReminderInput>
  onSubmit: (data: CreateReminderInput) => void
  submitting: boolean
  submitLabel: string
}

function ReminderForm({ defaultValues, onSubmit, submitting, submitLabel }: ReminderFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateReminderInput>({
    resolver: zodResolver(CreateReminderSchema) as Resolver<CreateReminderInput>,
    defaultValues: {
      title: '',
      description: '',
      due_at: '',
      recurrence: 'none',
      push_to_calendar: true,
      ...defaultValues,
    },
  })

  const pushToCalendar = watch('push_to_calendar')

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="r-title">Judul</Label>
        <Input id="r-title" placeholder="Bayar listrik, Ulang tahun Ayah…" {...register('title')} />
        {errors.title && <p className="text-[12px] text-danger">{errors.title.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="r-due">Waktu</Label>
        <Input id="r-due" type="datetime-local" {...register('due_at')} />
        {errors.due_at && <p className="text-[12px] text-danger">{errors.due_at.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="r-recurrence">Pengulangan</Label>
        <select
          id="r-recurrence"
          {...register('recurrence')}
          className="flex h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="none">Sekali saja</option>
          <option value="daily">Setiap hari</option>
          <option value="weekly">Setiap minggu</option>
          <option value="monthly">Setiap bulan</option>
          <option value="yearly">Setiap tahun</option>
        </select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="r-desc">Deskripsi (opsional)</Label>
        <Textarea id="r-desc" rows={2} placeholder="Catatan tambahan…" {...register('description')} />
      </div>

      <label className="flex cursor-pointer items-center gap-3">
        <input
          type="checkbox"
          checked={pushToCalendar}
          onChange={(e) => setValue('push_to_calendar', e.target.checked)}
          className="size-4 rounded accent-primary"
        />
        <span className="text-sm">
          Sinkron ke Google Calendar
          <span className="ml-1 text-muted-foreground text-xs">(butuh GOOGLE_CALENDAR_ID)</span>
        </span>
      </label>

      <Button type="submit" variant="accent" className="w-full" disabled={submitting}>
        {submitting ? 'Menyimpan…' : submitLabel}
      </Button>
    </form>
  )
}

// ─── Edit Form (includes is_done toggle) ──────────────────────────────────────

type EditFormProps = {
  reminder: Reminder
  onSubmit: (data: UpdateReminderInput) => void
  submitting: boolean
}

function EditForm({ reminder, onSubmit, submitting }: EditFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<UpdateReminderInput>({
    resolver: zodResolver(UpdateReminderSchema) as Resolver<UpdateReminderInput>,
    defaultValues: {
      title: reminder.title,
      description: reminder.description,
      due_at: reminder.due_at.slice(0, 16), // trim seconds
      recurrence: reminder.recurrence,
      is_done: reminder.is_done === 'true',
      push_to_calendar: true,
    },
  })

  const isDone = watch('is_done')
  const pushToCalendar = watch('push_to_calendar')

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="e-title">Judul</Label>
        <Input id="e-title" {...register('title')} />
        {errors.title && <p className="text-[12px] text-danger">{errors.title.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="e-due">Waktu</Label>
        <Input id="e-due" type="datetime-local" {...register('due_at')} />
        {errors.due_at && <p className="text-[12px] text-danger">{errors.due_at.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="e-recurrence">Pengulangan</Label>
        <select
          id="e-recurrence"
          {...register('recurrence')}
          className="flex h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="none">Sekali saja</option>
          <option value="daily">Setiap hari</option>
          <option value="weekly">Setiap minggu</option>
          <option value="monthly">Setiap bulan</option>
          <option value="yearly">Setiap tahun</option>
        </select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="e-desc">Deskripsi</Label>
        <Textarea id="e-desc" rows={2} {...register('description')} />
      </div>

      <label className="flex cursor-pointer items-center gap-3">
        <input
          type="checkbox"
          checked={isDone ?? false}
          onChange={(e) => setValue('is_done', e.target.checked)}
          className="size-4 rounded accent-primary"
        />
        <span className="text-sm">Tandai selesai</span>
      </label>

      <label className="flex cursor-pointer items-center gap-3">
        <input
          type="checkbox"
          checked={pushToCalendar}
          onChange={(e) => setValue('push_to_calendar', e.target.checked)}
          className="size-4 rounded accent-primary"
        />
        <span className="text-sm text-muted-foreground text-xs">Perbarui di Google Calendar</span>
      </label>

      <Button type="submit" variant="accent" className="w-full" disabled={submitting}>
        {submitting ? 'Menyimpan…' : 'Simpan perubahan'}
      </Button>
    </form>
  )
}

// ─── Reminder Item ────────────────────────────────────────────────────────────

type ReminderItemProps = {
  reminder: Reminder
  onEdit: () => void
  onToggleDone: () => void
  toggling: boolean
}

function ReminderItem({ reminder, onEdit, onToggleDone, toggling }: ReminderItemProps) {
  const isDone = reminder.is_done === 'true'
  const status = dueStatus(reminder.due_at, isDone)

  const statusColor = {
    done: 'text-muted-foreground',
    overdue: 'text-danger',
    today: 'text-amber-600 dark:text-amber-400',
    upcoming: 'text-foreground',
  }[status]

  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-xl border border-border bg-surface-elevated px-4 py-3',
        isDone && 'opacity-60',
      )}
    >
      {/* Done toggle */}
      <button
        type="button"
        onClick={onToggleDone}
        disabled={toggling}
        aria-label={isDone ? 'Tandai belum selesai' : 'Tandai selesai'}
        className={cn(
          'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
          isDone
            ? 'border-success bg-success text-white'
            : 'border-border hover:border-primary',
        )}
      >
        {isDone && <Check className="size-3" strokeWidth={3} />}
      </button>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <p className={cn('text-sm font-medium leading-tight', isDone && 'line-through')}>
          {reminder.title}
        </p>
        {reminder.description && (
          <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">{reminder.description}</p>
        )}
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <span className={cn('text-[11px] font-medium', statusColor)}>
            {formatDueAt(reminder.due_at)}
          </span>
          {reminder.recurrence !== 'none' && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              <RotateCcw className="mr-1 size-2.5" />
              {RECURRENCE_LABELS[reminder.recurrence]}
            </Badge>
          )}
          {reminder.calendar_event_id && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 text-blue-600 dark:text-blue-400">
              <Calendar className="mr-1 size-2.5" />
              Kalender
            </Badge>
          )}
          {status === 'overdue' && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 text-danger">
              Terlambat
            </Badge>
          )}
        </div>
      </div>

      {/* Edit */}
      <button
        type="button"
        onClick={onEdit}
        aria-label="Edit pengingat"
        className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <Pencil className="size-4" />
      </button>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RemindersPage() {
  const { reminders, isLoading, error, mutate } = useReminders()
  const { trigger: createReminder, isMutating: creating } = useCreateReminder()
  const { trigger: updateReminder, isMutating: updating } = useUpdateReminder()
  const { trigger: deleteReminder, isMutating: deleting } = useDeleteReminder()

  const [addOpen, setAddOpen] = useState(false)
  const [editReminder, setEditReminder] = useState<Reminder | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const upcoming = reminders.filter((r) => r.is_done !== 'true')
  const done = reminders.filter((r) => r.is_done === 'true')

  async function handleCreate(data: CreateReminderInput) {
    const res = await createReminder(data)
    if (!res.ok) { toast.error(res.error); return }
    toast.success('Pengingat disimpan.')
    setAddOpen(false)
    mutate()
  }

  async function handleUpdate(data: UpdateReminderInput) {
    if (!editReminder) return
    const res = await updateReminder({ id: editReminder.id, data })
    if (!res.ok) { toast.error(res.error); return }
    toast.success('Pengingat diperbarui.')
    setEditReminder(null)
    mutate()
  }

  async function handleDelete() {
    if (!editReminder) return
    const res = await deleteReminder(editReminder.id)
    if (!res.ok) { toast.error(res.error); return }
    toast.success('Dihapus.')
    setEditReminder(null)
    mutate()
  }

  async function handleToggleDone(reminder: Reminder) {
    setTogglingId(reminder.id)
    const isDone = reminder.is_done === 'true'
    const res = await updateReminder({
      id: reminder.id,
      data: { is_done: !isDone, push_to_calendar: false },
    })
    setTogglingId(null)
    if (!res.ok) { toast.error(res.error); return }
    mutate()
  }

  return (
    <PageContainer bleed>
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70 lg:static lg:bg-transparent lg:backdrop-blur-none">
        <div className="flex items-center justify-between px-5 py-4 lg:px-0 lg:py-0 lg:pb-8">
          <div>
            <h1 className="text-[22px] font-semibold leading-tight tracking-tight lg:text-[28px]">
              Pengingat
            </h1>
            <p className="hidden text-[13px] text-muted-foreground lg:block">
              Jadwal dan pengingat keluarga, sinkron ke Google Calendar.
            </p>
          </div>
          <Button
            variant="accent"
            onClick={() => setAddOpen(true)}
            aria-label="Tambah pengingat"
            size="icon"
            className="size-10 rounded-pill"
          >
            <Plus className="size-5" strokeWidth={2.5} />
          </Button>
        </div>
      </header>

      <div className="px-5 pb-28 lg:px-0">
        {isLoading && <ListSkeleton count={4} />}
        {error && <ErrorState message={error} onRetry={() => mutate()} />}

        {!isLoading && !error && reminders.length === 0 && (
          <EmptyState
            icon={Bell}
            title="Belum ada pengingat"
            description="Tambah pengingat untuk tagihan, ulang tahun, atau acara keluarga."
            action={
              <Button variant="accent" onClick={() => setAddOpen(true)}>
                <Plus className="mr-2 size-4" />
                Tambah pengingat
              </Button>
            }
          />
        )}

        {!isLoading && !error && upcoming.length > 0 && (
          <section className="space-y-2.5">
            <p className="text-eyebrow px-0.5 text-muted-foreground">Akan datang</p>
            {upcoming.map((r) => (
              <ReminderItem
                key={r.id}
                reminder={r}
                onEdit={() => setEditReminder(r)}
                onToggleDone={() => handleToggleDone(r)}
                toggling={togglingId === r.id}
              />
            ))}
          </section>
        )}

        {!isLoading && !error && done.length > 0 && (
          <section className={cn('space-y-2.5', upcoming.length > 0 && 'mt-6')}>
            <p className="text-eyebrow px-0.5 text-muted-foreground">Selesai</p>
            {done.map((r) => (
              <ReminderItem
                key={r.id}
                reminder={r}
                onEdit={() => setEditReminder(r)}
                onToggleDone={() => handleToggleDone(r)}
                toggling={togglingId === r.id}
              />
            ))}
          </section>
        )}
      </div>

      {/* Add Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah pengingat</DialogTitle>
          </DialogHeader>
          <ReminderForm
            onSubmit={handleCreate}
            submitting={creating}
            submitLabel="Simpan pengingat"
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editReminder} onOpenChange={(o) => !o && setEditReminder(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit pengingat</DialogTitle>
          </DialogHeader>
          {editReminder && (
            <EditForm
              reminder={editReminder}
              onSubmit={handleUpdate}
              submitting={updating}
            />
          )}
          <Button
            variant="destructive"
            className="w-full"
            onClick={handleDelete}
            disabled={deleting}
          >
            <Trash2 className="mr-2 size-4" />
            {deleting ? 'Menghapus…' : 'Hapus pengingat'}
          </Button>
        </DialogContent>
      </Dialog>
    </PageContainer>
  )
}
