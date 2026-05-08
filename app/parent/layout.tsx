import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import PortalShell from '@/components/portal/PortalShell'
import type { NavSection } from '@/components/portal/Sidebar'
import {
  Home, BarChart3, ClipboardCheck, FileText,
  CreditCard, Megaphone, CalendarDays,
  MessageSquare, Phone, Bus,
} from 'lucide-react'

const parentNav: NavSection[] = [
  {
    section: 'My Child',
    items: [
      { label: 'Overview',          href: '/parent',              icon: Home },
      { label: 'Academic Progress', href: '/parent/progress',     icon: BarChart3 },
      { label: 'Attendance',        href: '/parent/attendance',   icon: ClipboardCheck },
      { label: 'Report Card',       href: '/parent/report',       icon: FileText },
    ],
  },
  {
    section: 'School',
    items: [
      { label: 'School Fees',       href: '/parent/fees',         icon: CreditCard },
      { label: 'Notices & News',    href: '/parent/notices',      icon: Megaphone, badge: 3 },
      { label: 'School Calendar',   href: '/parent/calendar',     icon: CalendarDays },
      { label: 'Message Teacher',   href: '/parent/messages',     icon: MessageSquare },
      { label: 'Contact School',    href: '/parent/contact',      icon: Phone },
      { label: 'Transport Auth.',   href: '/parent/transport',    icon: Bus },
    ],
  },
]

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

export default async function ParentLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', session.user.id)
    .single()

  if (!profile || profile.role !== 'parent') redirect('/login')

  return (
    <PortalShell
      userFullName={profile.full_name}
      userRole={profile.role}
      initials={getInitials(profile.full_name)}
      navigation={parentNav}
    >
      {children}
    </PortalShell>
  )
}
