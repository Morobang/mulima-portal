import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import PortalShell from '@/components/portal/PortalShell'
import type { NavSection } from '@/components/portal/Sidebar'

const adminNav: NavSection[] = [
  {
    section: 'School Overview',
    items: [
      { label: 'Dashboard',         href: '/admin',               icon: '🏠' },
      { label: 'Enrolment',         href: '/admin/enrolment',     icon: '👥' },
      { label: 'Staff Management',  href: '/admin/staff',         icon: '👩‍🏫' },
    ],
  },
  {
    section: 'Academics',
    items: [
      { label: 'Timetable Admin',   href: '/admin/timetable',     icon: '📅' },
      { label: 'Analytics',         href: '/admin/analytics',     icon: '📈' },
      { label: 'At-Risk Learners',  href: '/admin/at-risk',       icon: '⚠️', badge: 3 },
    ],
  },
  {
    section: 'Operations',
    items: [
      { label: 'Fee Management',    href: '/admin/fees',          icon: '💳' },
      { label: 'Post Notices',      href: '/admin/notices',       icon: '📢' },
      { label: 'Parent Comms',      href: '/admin/comms',         icon: '💬' },
      { label: 'Inventory',         href: '/admin/inventory',     icon: '📦' },
      { label: 'Facilities',        href: '/admin/facilities',    icon: '🏫' },
      { label: 'SGB & Governance',  href: '/admin/sgb',           icon: '⚖️' },
    ],
  },
]

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', session.user.id)
    .single()

  if (!profile || profile.role !== 'admin') redirect('/login')

  return (
    <PortalShell
      userFullName={profile.full_name}
      userRole={profile.role}
      initials={getInitials(profile.full_name)}
      navigation={adminNav}
    >
      {children}
    </PortalShell>
  )
}