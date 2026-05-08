import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import PortalShell from '@/components/portal/PortalShell'
import type { NavSection } from '@/components/portal/Sidebar'

const parentNav: NavSection[] = [
  {
    section: 'My Child',
    items: [
      { label: 'Overview',          href: '/parent',              icon: '🏠' },
      { label: 'Academic Progress', href: '/parent/progress',     icon: '📊' },
      { label: 'Attendance',        href: '/parent/attendance',   icon: '✅' },
      { label: 'Report Card',       href: '/parent/report',       icon: '📄' },
    ],
  },
  {
    section: 'School',
    items: [
      { label: 'School Fees',       href: '/parent/fees',         icon: '💳' },
      { label: 'Notices & News',    href: '/parent/notices',      icon: '📢', badge: 3 },
      { label: 'School Calendar',   href: '/parent/calendar',     icon: '📆' },
      { label: 'Message Teacher',   href: '/parent/messages',     icon: '💬' },
      { label: 'Contact School',    href: '/parent/contact',      icon: '📞' },
      { label: 'Transport Auth.',   href: '/parent/transport',    icon: '🚌' },
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