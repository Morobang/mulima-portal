import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import PortalShell from '@/components/portal/PortalShell'
import type { NavSection } from '@/components/portal/Sidebar'

const studentNav: NavSection[] = [
  {
    section: 'My School',
    items: [
      { label: 'Dashboard',       href: '/student',            icon: '🏠' },
      { label: 'Timetable',       href: '/student/timetable',  icon: '📅' },
      { label: 'Marks & Reports', href: '/student/marks',      icon: '📊' },
      { label: 'Attendance',      href: '/student/attendance',  icon: '✅' },
      { label: 'Homework',        href: '/student/homework',    icon: '📝', badge: 3 },
    ],
  },
  {
    section: 'School Life',
    items: [
      { label: 'Notices',         href: '/student/notices',    icon: '📢', badge: 2 },
      { label: 'School Calendar', href: '/student/calendar',   icon: '📆' },
      { label: 'Library',         href: '/student/library',    icon: '📚' },
      { label: 'Wellbeing',       href: '/student/wellbeing',  icon: '💚' },
      { label: 'School Rules',    href: '/student/rules',      icon: '📋' },
      { label: 'Messages',        href: '/student/messages',   icon: '💬', badge: 1 },
    ],
  },
]

function getInitials(name: string) {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createServerSupabaseClient()

  // Get session
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  // Get profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', session.user.id)
    .single()

  if (!profile || profile.role !== 'student') redirect('/login')

  return (
    <PortalShell
      userFullName={profile.full_name}
      userRole={profile.role}
      initials={getInitials(profile.full_name)}
      navigation={studentNav}
    >
      {children}
    </PortalShell>
  )
}