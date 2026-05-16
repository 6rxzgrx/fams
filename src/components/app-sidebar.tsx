'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import {
  Home,
  ArrowLeftRight,
  Briefcase,
  Wallet,
  FileText,
  Bell,
  Settings,
  LogOut,
  Sparkles,
  PieChart,
  BarChart3,
  CalendarRange,
  CalendarDays,
  Wrench,
  FileLock,
  StickyNote,
  Users,
  Plug,
  Shield,
  Boxes,
  ChevronRight,
  ChevronsUpDown,
  Target,
  SlidersHorizontal,
  type LucideIcon,
} from 'lucide-react'

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from '@/components/ui/sidebar'

type NavChild = { href: string; label: string }
type NavItem =
  | { kind: 'link';     href: string; label: string; icon: LucideIcon }
  | { kind: 'group';    label: string; icon: LucideIcon; items: NavChild[] }

const NAV: NavItem[] = [
  { kind: 'link', href: '/home', label: 'Beranda', icon: Home },
  {
    kind: 'group',
    label: 'Keuangan',
    icon: Wallet,
    items: [
      { href: '/finance/dashboard',    label: 'Ringkasan' },
      { href: '/finance/transactions', label: 'Transaksi' },
      { href: '/finance/anggaran',     label: 'Anggaran' },
      { href: '/finance/aset',         label: 'Aset' },
      { href: '/finance/bills',        label: 'Tagihan' },
      { href: '/finance/reports',      label: 'Laporan' },
    ],
  },
  {
    kind: 'group',
    label: 'Kalender',
    icon: CalendarRange,
    items: [
      { href: '/calendar',           label: 'Tampilan' },
      { href: '/calendar/events',    label: 'Acara' },
      { href: '/calendar/reminders', label: 'Pengingat' },
    ],
  },
  {
    kind: 'group',
    label: 'Lainnya',
    icon: Boxes,
    items: [
      { href: '/other/maintenance', label: 'Perawatan' },
      { href: '/other/vault',       label: 'Brankas Dokumen' },
      { href: '/other/notes',       label: 'Catatan' },
    ],
  },
  {
    kind: 'group',
    label: 'Pengaturan',
    icon: Settings,
    items: [
      { href: '/settings',                label: 'Umum' },
      { href: '/settings/finance-setup',  label: 'Finance Setup' },
      { href: '/settings/members',        label: 'Anggota' },
      { href: '/settings/notifications',  label: 'Notifikasi' },
      { href: '/settings/integrations',   label: 'Integrasi' },
      { href: '/settings/audit-log',      label: 'Riwayat Aktivitas' },
    ],
  },
]

// Icons used inside the collapsible sub-menus (kept for visual continuity).
const SUB_ICONS: Record<string, LucideIcon> = {
  '/finance/dashboard':    PieChart,
  '/finance/transactions': ArrowLeftRight,
  '/finance/anggaran':     Target,
  '/finance/aset':         Briefcase,
  '/finance/bills':        FileText,
  '/finance/reports':      BarChart3,
  '/calendar':             CalendarRange,
  '/calendar/events':      CalendarDays,
  '/calendar/reminders':   Bell,
  '/other/maintenance':    Wrench,
  '/other/vault':          FileLock,
  '/other/notes':          StickyNote,
  '/settings':             Settings,
  '/settings/finance-setup': SlidersHorizontal,
  '/settings/members':     Users,
  '/settings/notifications': Bell,
  '/settings/integrations':  Plug,
  '/settings/audit-log':     Shield,
}

function isExactActive(pathname: string, href: string) {
  if (href === '/home') return pathname === '/home'
  if (href === '/settings') return pathname === '/settings'
  if (href === '/calendar') return pathname === '/calendar'
  return pathname === href || pathname.startsWith(href + '/')
}

function BrandHeader() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton size="lg" asChild>
          <Link href="/home">
            <div className="flex aspect-square size-8 items-center justify-center rounded-md bg-accent text-accent-foreground">
              <Sparkles className="size-4" strokeWidth={2.5} aria-hidden="true" />
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold tracking-tight">FAMS</span>
              <span className="truncate text-xs text-muted-foreground">Keuangan keluarga</span>
            </div>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

function NavUser() {
  const { isMobile } = useSidebar()
  const { data: session } = useSession()
  const name = session?.user?.name ?? 'Keluarga'
  const email = session?.user?.email ?? ''
  const image = session?.user?.image ?? undefined
  const initial = name[0]?.toUpperCase() ?? '?'

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                {image && <AvatarImage src={image} alt={name} />}
                <AvatarFallback className="rounded-lg">{initial}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{name}</span>
                <span className="truncate text-xs text-muted-foreground">{email}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? 'bottom' : 'right'}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  {image && <AvatarImage src={image} alt={name} />}
                  <AvatarFallback className="rounded-lg">{initial}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{name}</span>
                  <span className="truncate text-xs text-muted-foreground">{email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings">
                <Settings />
                Pengaturan
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => signOut({ callbackUrl: '/sign-in' })}>
              <LogOut />
              Keluar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <BrandHeader />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {NAV.map((item) => {
              if (item.kind === 'link') {
                const active = isExactActive(pathname, item.href)
                const Icon = item.icon
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild tooltip={item.label} isActive={active}>
                      <Link href={item.href} aria-current={active ? 'page' : undefined}>
                        <Icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              }

              const ParentIcon = item.icon
              const childActive = item.items.some((c) => isExactActive(pathname, c.href))
              return (
                <Collapsible
                  key={item.label}
                  asChild
                  defaultOpen={childActive}
                  className="group/collapsible"
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton tooltip={item.label} isActive={childActive}>
                        <ParentIcon />
                        <span>{item.label}</span>
                        <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.items.map((sub) => {
                          const SubIcon = SUB_ICONS[sub.href]
                          const subActive = isExactActive(pathname, sub.href)
                          return (
                            <SidebarMenuSubItem key={sub.href}>
                              <SidebarMenuSubButton asChild isActive={subActive}>
                                <Link
                                  href={sub.href}
                                  aria-current={subActive ? 'page' : undefined}
                                >
                                  {SubIcon && <SubIcon />}
                                  <span>{sub.label}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          )
                        })}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              )
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}
