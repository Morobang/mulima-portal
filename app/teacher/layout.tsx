import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import PortalShell from '@/components/portal/PortalShell'
import type { NavSection } from '@/components/portal/Sidebar'
import {
  Home, ClipboardCheck, BarChart3, PenLine, BookOpen,
  MessageSquare, Megaphone, Calendar, Folder, CalendarClock,
} from 'lucide-react'

const teacherNav: NavSection[] = [
  {
    section: 'Classroom',
    items: [
      { label: 'Dashboard',          href: '/teacher',               icon: Home },
      { label: 'Attendance Register', href: '/teacher/attendance',   icon: ClipboardCheck },
      { label: 'Mark Register',      href: '/teacher/marks',         icon: BarChart3 },
      { label: 'Report Comments',    href: '/teacher/reports',       icon: PenLine },
      { label: 'Homework Tracker',   href: '/teacher/homework',      icon: BookOpen },
    ],
  },
  {
    section: 'Communication',
    items: [
      { label: 'Message Parents',    href: '/teacher/messages',      icon: MessageSquare, badge: 2 },
      { label: 'Notices',            href: '/teacher/notices',       icon: Megaphone },
    ],
  },
  {
    section: 'Resources',
    items: [
      { label: 'My Timetable',       href: '/teacher/timetable',     icon: Calendar },
      { label: 'Learning Resources', href: '/teacher/resources',     icon: Folder },
      { label: 'Leave & Admin',      href: '/teacher/leave',         icon: CalendarClock },
    ],
  },
]

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', session.user.id)
    .single()

  if (!profile || profile.role !== 'teacher') redirect('/login')

  return (
    <PortalShell
      userFullName={profile.full_name}
      userRole={profile.role}
      initials={getInitials(profile.full_name)}
      navigation={teacherNav}
    >
      {children}
    </PortalShell>
  )
}
