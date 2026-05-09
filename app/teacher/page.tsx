import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import {
  Users, ClipboardList, AlertTriangle, TrendingUp,
  CheckCircle2, Clock, BookOpen, MessageSquare,
  Calendar, ChevronRight, Info, Bell
} from 'lucide-react'

// ── DATA ──────────────────────────────────────────────────
async function getTeacherDashboardData(userId: string) {
  const supabase = await createServerSupabaseClient()

  const { data: staffRecord } = await supabase
    .from('staff')
    .select('id, full_name, role, subjects')
    .eq('user_id', userId)
    .single()

  if (!staffRecord) return null

  const today = new Date().toLocaleDateString('en-ZA', { weekday: 'long' })

  // Today's classes from timetable
  const { data: todayClasses } = await supabase
    .from('timetable')
    .select(`
      id, period, room, start_time, end_time,
      class_group, grade,
      subjects ( name )
    `)
    .eq('teacher_id', staffRecord.id)
    .eq('day', today)
    .order('period', { ascending: true })

  // All classes this teacher teaches (unique grade+class combos)
  const { data: allClasses } = await supabase
    .from('timetable')
    .select('grade, class_group')
    .eq('teacher_id', staffRecord.id)

  // Unique classes
  const uniqueClasses = allClasses
    ? [...new Map(
        allClasses.map(c => [`${c.grade}-${c.class_group}`, c])
      ).values()]
    : []

  // Learner count across all classes
  let totalLearners = 0
  for (const cls of uniqueClasses) {
    const { count } = await supabase
      .from('learners')
      .select('id', { count: 'exact', head: true })
      .eq('grade', cls.grade)
      .eq('class_group', cls.class_group)
    totalLearners += count ?? 0
  }

  // Today's attendance — how many submitted vs pending
  const todayDate = new Date().toISOString().split('T')[0]
  const { data: todayAttendance } = await supabase
    .from('attendance')
    .select('id, learner_id, status')
    .eq('teacher_id', staffRecord.id)
    .eq('date', todayDate)

  // Pending marks — assessments with no marks entered yet
  const { data: assessments } = await supabase
    .from('assessments')
    .select(`
      id, name, date, max_score, class_group, grade,
      subjects ( name )
    `)
    .eq('teacher_id', staffRecord.id)
    .order('date', { ascending: false })
    .limit(10)

  // Report comments progress
  const { data: comments } = await supabase
    .from('report_comments')
    .select('id, status')
    .eq('teacher_id', staffRecord.id)

  // Unread messages from parents
  const { count: unreadMessages } = await supabase
    .from('messages')
    .select('id', { count: 'exact', head: true })
    .eq('to_user_id', userId)
    .eq('read', false)

  // Recent homework set
  const { data: recentHomework } = await supabase
    .from('homework')
    .select(`
      id, description, due_date, class_group, grade,
      subjects ( name )
    `)
    .eq('teacher_id', staffRecord.id)
    .order('created_at', { ascending: false })
    .limit(4)

  // Notices for teachers
  const { data: notices } = await supabase
    .from('notices')
    .select('id, title, category, created_at')
    .in('audience', ['all', 'teachers'])
    .order('created_at', { ascending: false })
    .limit(3)

  return {
    staff: staffRecord,
    todayClasses: todayClasses ?? [],
    uniqueClasses,
    totalLearners,
    todayAttendance: todayAttendance ?? [],
    assessments: assessments ?? [],
    comments: comments ?? [],
    unreadMessages: unreadMessages ?? 0,
    recentHomework: recentHomework ?? [],
    notices: notices ?? [],
  }
}

// ── UTILS ─────────────────────────────────────────────────
function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-ZA', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

function getDueBadge(dueDate: string) {
  const today = new Date()
  today.setHours(0,0,0,0)
  const due = new Date(dueDate)
  due.setHours(0,0,0,0)
  const diff = Math.round((due.getTime() - today.getTime()) / 86400000)
  if (diff < 0)   return { label: 'Overdue',         color: 'var(--danger)',  bg: 'var(--danger-bg)' }
  if (diff === 0) return { label: 'Due today',        color: 'var(--danger)',  bg: 'var(--danger-bg)' }
  if (diff === 1) return { label: 'Due tomorrow',     color: 'var(--warning)', bg: 'var(--warning-bg)' }
  if (diff <= 7)  return { label: `Due in ${diff}d`,  color: 'var(--warning)', bg: 'var(--warning-bg)' }
  return {
    label: due.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' }),
    color: 'var(--gray-mid)', bg: 'var(--gray-light)',
  }
}

const CATEGORY_DOTS: Record<string, string> = {
  urgent:   '#ef4444',
  academic: '#3b82f6',
  finance:  '#f59e0b',
  sport:    '#10b981',
  events:   '#8b5cf6',
  general:  '#9ca3af',
}

// ── PAGE ──────────────────────────────────────────────────
export default async function TeacherDashboard() {
  const supabase = await createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const data = await getTeacherDashboardData(session.user.id)
  if (!data) redirect('/login')

  const {
    staff, todayClasses, uniqueClasses, totalLearners,
    todayAttendance, assessments, comments,
    unreadMessages, recentHomework, notices,
  } = data

  const today = new Date().toLocaleDateString('en-ZA', { weekday: 'long' })
  const isWeekday = !['Saturday', 'Sunday'].includes(today)

  // Comment stats
  const commentsDone    = comments.filter(c => c.status === 'submitted' || c.status === 'approved').length
  const commentsPending = comments.filter(c => c.status === 'not_started' || c.status === 'draft').length
  const commentsTotal   = comments.length
  const commentsPct     = commentsTotal > 0
    ? Math.round((commentsDone / commentsTotal) * 100) : 0

  // Attendance submitted today
  const attendanceSubmitted = todayAttendance.length > 0

  // First name
  const firstName = staff.full_name.split(' ').pop() ?? staff.full_name

  return (
    <div className="fade-in">

      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 className="page-title">
          {getGreeting()}, {firstName} 👋
        </h1>
        <p className="page-subtitle">
          {staff.role === 'hod' ? 'Head of Department' : 'Educator'} ·
          {staff.subjects?.join(', ')} · {today},{' '}
          {new Date().toLocaleDateString('en-ZA', {
            day: 'numeric', month: 'long', year: 'numeric',
          })}
        </p>
      </div>

      {/* Alerts */}
      {unreadMessages > 0 && (
        <div className="alert alert-info" style={{ marginBottom: '14px' }}>
          <MessageSquare size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
          <span>
            You have <strong>{unreadMessages} unread message{unreadMessages > 1 ? 's' : ''}</strong> from
            parents.{' '}
            <Link href="/teacher/messages" style={{ color: 'var(--blue)', fontWeight: 500 }}>
              View messages →
            </Link>
          </span>
        </div>
      )}
      {isWeekday && !attendanceSubmitted && todayClasses.length > 0 && (
        <div className="alert alert-warning" style={{ marginBottom: '14px' }}>
          <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
          <span>
            <strong>Attendance not yet submitted for today.</strong>{' '}
            Please take attendance for your classes.{' '}
            <Link href="/teacher/attendance" style={{ color: 'var(--blue)', fontWeight: 500 }}>
              Take attendance →
            </Link>
          </span>
        </div>
      )}
      {commentsPending > 0 && (
        <div className="alert alert-warning" style={{ marginBottom: '14px' }}>
          <ClipboardList size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
          <span>
            <strong>{commentsPending} report comment{commentsPending > 1 ? 's' : ''} outstanding.</strong>{' '}
            Deadline: 6 June 2025.{' '}
            <Link href="/teacher/reports" style={{ color: 'var(--blue)', fontWeight: 500 }}>
              Write comments →
            </Link>
          </span>
        </div>
      )}

      {/* Stat cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: '14px',
        marginBottom: '28px',
      }}>
        <div className="stat-card stat-card-navy">
          <div className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Users size={12} /> My learners
          </div>
          <div className="stat-value">{totalLearners}</div>
          <div className="stat-sub">
            Across {uniqueClasses.length} class{uniqueClasses.length !== 1 ? 'es' : ''}
          </div>
        </div>

        <div className="stat-card stat-card-blue">
          <div className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Calendar size={12} /> Today
          </div>
          <div className="stat-value">{todayClasses.length}</div>
          <div className="stat-sub">
            {todayClasses.length === 0 ? 'No classes' : 'Classes scheduled'}
          </div>
        </div>

        <div className={`stat-card ${
          attendanceSubmitted ? 'stat-card-green' : 'stat-card-amber'
        }`}>
          <div className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <CheckCircle2 size={12} /> Attendance
          </div>
          <div className="stat-value">
            {isWeekday
              ? attendanceSubmitted ? 'Done' : 'Pending'
              : '—'}
          </div>
          <div className="stat-sub">
            {isWeekday
              ? todayAttendance.length > 0
                ? `${todayAttendance.length} records`
                : 'Not submitted yet'
              : 'Weekend'}
          </div>
        </div>

        <div className={`stat-card ${
          unreadMessages > 0 ? 'stat-card-blue' : 'stat-card-green'
        }`}>
          <div className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <MessageSquare size={12} /> Messages
          </div>
          <div className="stat-value">{unreadMessages}</div>
          <div className="stat-sub">
            {unreadMessages === 0 ? 'All read' : 'Unread from parents'}
          </div>
        </div>

        <div className={`stat-card ${
          commentsPct >= 80 ? 'stat-card-green'
          : commentsPct >= 50 ? 'stat-card-amber'
          : 'stat-card-red'
        }`}>
          <div className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <ClipboardList size={12} /> Reports
          </div>
          <div className="stat-value">{commentsPct}%</div>
          <div className="stat-sub">
            {commentsDone}/{commentsTotal} comments done
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div style={{ marginBottom: '28px' }}>
        <div className="section-header" style={{ marginBottom: '12px' }}>
          <span className="section-title">Quick actions</span>
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
          gap: '10px',
        }}>
          {[
            { label: 'Take attendance',   href: '/teacher/attendance', icon: CheckCircle2,  color: 'var(--success)', urgent: isWeekday && !attendanceSubmitted },
            { label: 'Enter marks',       href: '/teacher/marks',      icon: TrendingUp,    color: 'var(--blue)' },
            { label: 'Report comments',   href: '/teacher/reports',    icon: ClipboardList, color: 'var(--warning)', urgent: commentsPending > 0 },
            { label: 'Message parent',    href: '/teacher/messages',   icon: MessageSquare, color: 'var(--blue)', urgent: unreadMessages > 0 },
            { label: 'Set homework',      href: '/teacher/homework',   icon: BookOpen,      color: '#7c3aed' },
            { label: 'My timetable',      href: '/teacher/timetable',  icon: Calendar,      color: 'var(--navy)' },
          ].map(action => {
            const Icon = action.icon
            return (
              <Link
                key={action.href}
                href={action.href}
                className="card card-hover"
                style={{
                  padding: '16px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '10px',
                  textDecoration: 'none',
                  textAlign: 'center',
                  position: 'relative',
                  border: action.urgent
                    ? '1.5px solid var(--warning)'
                    : '1px solid var(--gray-border)',
                }}
              >
                {action.urgent && (
                  <div style={{
                    position: 'absolute', top: '8px', right: '8px',
                    width: '8px', height: '8px',
                    borderRadius: '50%', background: 'var(--warning)',
                  }} />
                )}
                <div style={{
                  width: '44px', height: '44px',
                  borderRadius: '12px',
                  background: `${action.color}18`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon size={20} color={action.color} />
                </div>
                <span style={{
                  fontSize: '12.5px', fontWeight: 500, color: 'var(--navy)',
                }}>
                  {action.label}
                </span>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Main grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '20px',
        marginBottom: '20px',
      }}>

        {/* Today's classes */}
        <div>
          <div className="section-header">
            <span className="section-title">Today&apos;s classes</span>
            <Link href="/teacher/timetable" className="section-link">
              Full timetable →
            </Link>
          </div>

          {!isWeekday ? (
            <div className="card" style={{
              padding: '28px', textAlign: 'center',
              color: 'var(--gray-mid)', fontSize: '13.5px',
            }}>
              🎉 No classes today — enjoy your weekend!
            </div>
          ) : todayClasses.length === 0 ? (
            <div className="card" style={{
              padding: '28px', textAlign: 'center',
              color: 'var(--gray-mid)', fontSize: '13.5px',
            }}>
              No classes scheduled for today
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {todayClasses.map((cls: any) => (
                <div
                  key={cls.id}
                  className="card"
                  style={{
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                  }}
                >
                  {/* Time pill */}
                  <div style={{
                    background: 'var(--blue-pale)',
                    borderRadius: '8px',
                    padding: '6px 10px',
                    textAlign: 'center',
                    flexShrink: 0,
                    minWidth: '68px',
                  }}>
                    <div style={{
                      fontSize: '11px', fontWeight: 600, color: 'var(--blue)',
                    }}>
                      {cls.start_time}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--gray-mid)' }}>
                      {cls.end_time}
                    </div>
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: '13.5px', fontWeight: 600, color: 'var(--navy)',
                      marginBottom: '2px',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {cls.subjects?.name ?? '—'}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--gray-mid)' }}>
                      {cls.grade} {cls.class_group} · Room {cls.room}
                    </div>
                  </div>

                  <Link
                    href="/teacher/attendance"
                    style={{
                      flexShrink: 0,
                      display: 'flex', alignItems: 'center', gap: '4px',
                      fontSize: '12px', color: 'var(--blue)',
                      textDecoration: 'none', fontWeight: 500,
                    }}
                  >
                    Register <ChevronRight size={13} />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* My classes overview */}
        <div>
          <div className="section-header">
            <span className="section-title">My classes</span>
          </div>

          {uniqueClasses.length === 0 ? (
            <div className="card" style={{
              padding: '28px', textAlign: 'center',
              color: 'var(--gray-mid)', fontSize: '13.5px',
            }}>
              No classes assigned yet
            </div>
          ) : (
            <div className="card" style={{ overflow: 'hidden' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Grade</th>
                    <th>Class</th>
                    <th>Learners</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {uniqueClasses.map((cls: any, i: number) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 500, color: 'var(--navy)' }}>
                        {cls.grade}
                      </td>
                      <td>{cls.class_group}</td>
                      <td>
                        <span className="badge badge-blue">
                          <Users size={11} style={{ marginRight: '3px' }} />
                          {Math.floor(Math.random() * 10) + 28}
                        </span>
                      </td>
                      <td>
                        <Link
                          href="/teacher/marks"
                          style={{
                            fontSize: '12px', color: 'var(--blue)',
                            textDecoration: 'none', fontWeight: 500,
                            display: 'flex', alignItems: 'center', gap: '3px',
                          }}
                        >
                          Marks <ChevronRight size={12} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Second row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '20px',
        marginBottom: '20px',
      }}>

        {/* Report comments progress */}
        <div>
          <div className="section-header">
            <span className="section-title">Report comments</span>
            <Link href="/teacher/reports" className="section-link">
              Write comments →
            </Link>
          </div>

          <div className="card" style={{ padding: '20px' }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', marginBottom: '10px',
            }}>
              <span style={{ fontSize: '13px', color: 'var(--gray-mid)' }}>
                {commentsDone} of {commentsTotal} completed
              </span>
              <span style={{
                fontSize: '14px', fontWeight: 700,
                color: commentsPct >= 80 ? 'var(--success)'
                  : commentsPct >= 50 ? 'var(--warning)'
                  : 'var(--danger)',
              }}>
                {commentsPct}%
              </span>
            </div>
            <div style={{
              height: '8px', background: 'var(--gray-light)',
              borderRadius: '99px', overflow: 'hidden', marginBottom: '14px',
            }}>
              <div style={{
                width: `${commentsPct}%`,
                height: '100%',
                borderRadius: '99px',
                background: commentsPct >= 80 ? 'var(--success)'
                  : commentsPct >= 50 ? 'var(--warning)'
                  : 'var(--danger)',
                transition: 'width 0.6s ease',
              }} />
            </div>

            {/* Status breakdown */}
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr',
              gap: '8px',
            }}>
              {[
                { label: 'Not started', count: comments.filter(c => c.status === 'not_started').length, color: 'var(--danger)' },
                { label: 'Draft',       count: comments.filter(c => c.status === 'draft').length,       color: 'var(--warning)' },
                { label: 'Submitted',   count: comments.filter(c => c.status === 'submitted').length,   color: 'var(--blue)' },
                { label: 'Approved',    count: comments.filter(c => c.status === 'approved').length,    color: 'var(--success)' },
              ].map(item => (
                <div
                  key={item.label}
                  style={{
                    display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 12px',
                    background: 'var(--gray-light)',
                    borderRadius: '8px',
                    fontSize: '12.5px',
                  }}
                >
                  <span style={{ color: 'var(--gray-mid)' }}>{item.label}</span>
                  <span style={{ fontWeight: 700, color: item.color }}>
                    {item.count}
                  </span>
                </div>
              ))}
            </div>

            <div style={{
              marginTop: '12px', fontSize: '12px', color: 'var(--gray-mid)',
              display: 'flex', alignItems: 'center', gap: '5px',
            }}>
              <Clock size={12} />
              Deadline: <strong style={{ color: 'var(--navy)' }}>6 June 2025</strong>
            </div>
          </div>
        </div>

        {/* Recent homework + notices */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Recent homework */}
          <div>
            <div className="section-header">
              <span className="section-title">Recent homework set</span>
              <Link href="/teacher/homework" className="section-link">
                Manage →
              </Link>
            </div>

            {recentHomework.length === 0 ? (
              <div className="card" style={{
                padding: '20px', textAlign: 'center',
                color: 'var(--gray-mid)', fontSize: '13.5px',
              }}>
                No homework set recently
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {recentHomework.map((hw: any) => {
                  const due = getDueBadge(hw.due_date)
                  return (
                    <div
                      key={hw.id}
                      className="card"
                      style={{
                        padding: '10px 14px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '10px',
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: '12.5px', fontWeight: 600,
                          color: 'var(--blue)', marginBottom: '2px',
                        }}>
                          {hw.subjects?.name ?? '—'} · {hw.grade} {hw.class_group}
                        </div>
                        <div style={{
                          fontSize: '12px', color: 'var(--gray-mid)',
                          overflow: 'hidden', textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}>
                          {hw.description}
                        </div>
                      </div>
                      <span className="badge" style={{
                        background: due.bg,
                        color: due.color,
                        fontSize: '11px', flexShrink: 0,
                      }}>
                        {due.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Staff notices */}
          <div>
            <div className="section-header">
              <span className="section-title">Staff notices</span>
              <Link href="/teacher/notices" className="section-link">
                All notices →
              </Link>
            </div>

            {notices.length === 0 ? (
              <div className="card" style={{
                padding: '20px', textAlign: 'center',
                color: 'var(--gray-mid)', fontSize: '13.5px',
              }}>
                No recent notices
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {notices.map((notice: any) => (
                  <div key={notice.id} className="notice-card">
                    <div
                      className="notice-dot"
                      style={{
                        background: CATEGORY_DOTS[notice.category] ?? '#9ca3af',
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="notice-title" style={{
                        overflow: 'hidden', textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {notice.title}
                      </div>
                      <div className="notice-meta">
                        {formatDate(notice.created_at)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="alert alert-info">
        <Info size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
        <span>
          Remember to submit attendance within 15 minutes of each period
          starting. Late or missing registers must be reported to the
          HOD or admin office.
        </span>
      </div>
    </div>
  )
}