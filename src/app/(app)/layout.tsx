import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { AppSidebar } from '@/components/app-sidebar'
import { BottomNav } from '@/components/nav/bottom-nav'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect('/sign-in')

  return (
    <SidebarProvider defaultOpen>
      <AppSidebar className="hidden lg:flex" />
      <SidebarInset className="bg-background">
        <main className="flex-1 pb-nav pt-safe lg:pb-10 lg:pt-0">{children}</main>
      </SidebarInset>
      <BottomNav />
    </SidebarProvider>
  )
}
