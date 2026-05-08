import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import PortalShell from '@/components/portal/PortalShell'
import type { NavSection } from '@/components/portal/Sidebar'
import {
  Home, Calendar, BarChart3, ClipboardCheck, PenLine,
  Megaphone, CalendarDays, BookMarked, Heart, ClipboardList, MessageSquare,
} from 'lucide-react'

const studentNav: NavSection[] = [
  {
    section: 'My School',
    items: [
      { label: 'Dashboard',       href: '/student',             icon: Home },
      { label: 'Timetable',       href: '/student/timetable',   icon: Calendar },
      { label: 'Marks & Reports', href: '/student/marks',       icon: BarChart3 },
      { label: 'Attendance',      href: '/student/attendance',  icon: ClipboardCheck },
      { label: 'Homework',        href: '/student/homework',    icon: PenLine, badge: 3 },
    ],
  },
  {
    section: 'School Life',
    items: [
      { label: 'Notices',         href: '/student/notices',    icon: Megaphone, badge: 2 },
      { label: 'School Calendar', href: '/student/calendar',   icon: CalendarDays },
      { label: 'Library',         href: '/student/library',    icon: BookMarked },
      { label: 'Wellbeing',       href: '/student/wellbeing',  icon: Heart },
      { label: 'School Rules',    href: '/student/rules',      icon: ClipboardList },
      { label: 'Messages',        href: '/student/messages',   icon: MessageSquare, badge: 1 },
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

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

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
