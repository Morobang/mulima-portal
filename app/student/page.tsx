import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { AlertTriangle, XCircle, MessageSquare } from 'lucide-react'

// ── HELPERS ───────────────────────────────────────────────
function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function formatDate() {
  return new Date().toLocaleDateString('en-ZA', {
    weekday: 'long', day: 'numeric',
    month: 'long', year: 'numeric',
  })
}

// ── DATA FETCHING ─────────────────────────────────────────
async function getStudentDashboardData(userId: string) {
  const supabase = await createServerSupabaseClient()

  // Get learner record
  const { data: learner, error: learnerError } = await supabase
    .from('learners')
    .select('id, full_name, grade, class_group, student_no')
    .eq('user_id', userId)
    .maybeSingle()  // 👈 Returns null instead of throwing error

  if (learnerError || !learner) return null

  // Today's day name
  const today = new Date().toLocaleDateString('en-ZA', { weekday: 'long' })

  // Today's timetable
  const { data: todayClasses } = await supabase
    .from('timetable')
    .select(`
      period, room, start_time, end_time,
      subjects ( name ),
      staff ( full_name )
    `)
    .eq('grade', learner.grade)
    .eq('class_group', learner.class_group)
    .eq('day', today)
    .order('period', { ascending: true })

  // Latest marks (last 5 assessments)
  const { data: recentMarks } = await supabase
    .from('marks')
    .select(`
      score,
      assessments ( name, max_score, date, type,
        subjects ( name )
      )
    `)
    .eq('learner_id', learner.id)
    .order('submitted_at', { ascending: false })
    .limit(5)

  // Attendance this term
  const { data: attendance } = await supabase
    .from('attendance')
    .select('status, date')
    .eq('learner_id', learner.id)

  // Homework pending
  const { data: homework } = await supabase
    .from('homework')
    .select(`id, description, due_date, subjects ( name )`)
    .eq('grade', learner.grade)
    .eq('class_group', learner.class_group)
    .gte('due_date', new Date().toISOString().split('T')[0])
    .order('due_date', { ascending: true })
    .limit(4)

  // Unread notices
  const { data: notices } = await supabase
    .from('notices')
    .select('id, title, category, created_at')
    .in('audience', ['all', 'students'])
    .order('created_at', { ascending: false })
    .limit(4)

  // Unread messages
  const { count: unreadMessages } = await supabase
    .from('messages')
    .select('id', { count: 'exact', head: true })
    .eq('to_user_id', userId)
    .eq('read', false)

  return {
    learner,
    todayClasses: todayClasses ?? [],
    recentMarks: recentMarks ?? [],
    attendance: attendance ?? [],
    homework: homework ?? [],
    notices: notices ?? [],
    unreadMessages: unreadMessages ?? 0,
  }
}

// ── UTILS ─────────────────────────────────────────────────
function calcAttendanceRate(attendance: { status: string }[]) {
  if (!attendance.length) return 0
  const present = attendance.filter(a => a.status === 'present' || a.status === 'late').length
  return Math.round((present / attendance.length) * 100)
}

function calcAverage(marks: any[]) {
  if (!marks.length) return 0
  const total = marks.reduce((sum, m) => {
    const pct = (m.score / m.assessments.max_score) * 100
    return sum + pct
  }, 0)
  return Math.round(total / marks.length)
}

function getSymbol(pct: number) {
  if (pct >= 80) return { label: 'A', color: 'var(--success)' }
  if (pct >= 70) return { label: 'B', color: 'var(--blue)' }
  if (pct >= 60) return { label: 'C', color: 'var(--blue)' }
  if (pct >= 50) return { label: 'D', color: 'var(--warning)' }
  if (pct >= 40) return { label: 'E', color: 'var(--warning)' }
  return { label: 'F', color: 'var(--danger)' }
}

function getDueBadge(dueDate: string) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(dueDate)
  due.setHours(0, 0, 0, 0)
  const diff = Math.round((due.getTime() - today.getTime()) / 86400000)

  if (diff === 0) return { label: 'Due today', color: 'var(--danger)', bg: 'var(--danger-bg)' }
  if (diff === 1) return { label: 'Due tomorrow', color: 'var(--warning)', bg: 'var(--warning-bg)' }
  if (diff <= 3) return { label: `Due in ${diff} days`, color: 'var(--warning)', bg: 'var(--warning-bg)' }
  return { label: due.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' }), color: 'var(--gray-mid)', bg: 'var(--gray-light)' }
}

const categoryColors: Record<string, string> = {
  urgent:   'var(--danger)',
  academic: 'var(--blue)',
  finance:  'var(--warning)',
  sport:    'var(--success)',
  general:  'var(--gray-mid)',
  events:   '#7c3aed',
  culture:  '#0891b2',
}

// ── PAGE ──────────────────────────────────────────────────
export default async function StudentDashboard() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const data = await getStudentDashboardData(user.id)

  if (!data) {
    return (
      <div style={{ padding: '48px', textAlign: 'center' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: '64px', height: '64px',
          background: 'var(--warning-bg)', borderRadius: '50%',
          marginBottom: '16px',
        }}>
          <AlertTriangle size={28} strokeWidth={1.5} style={{ color: 'var(--warning)' }} />
        </div>
        <h2 style={{ color: 'var(--navy)', fontSize: '18px', marginBottom: '8px' }}>
          Learner profile not found
        </h2>
        <p style={{ color: 'var(--gray-mid)', fontSize: '14px', maxWidth: '360px', margin: '0 auto 24px', lineHeight: 1.6 }}>
          Your student record has not been linked to this account yet.
          Please contact the school administration office.
        </p>
        <p style={{ color: 'var(--gray-mid)', fontSize: '13px' }}>
          Admin email: <strong>mafela@telkomsa.net</strong> · Tel: <strong>015 975 1089</strong>
        </p>
      </div>
    )
  }

  const { learner, todayClasses, recentMarks, attendance, homework, notices, unreadMessages } = data
  const attendanceRate = calcAttendanceRate(attendance)
  const avgMark = calcAverage(recentMarks)
  const absentDays = attendance.filter(a => a.status === 'absent').length
  const nextHomework = homework[0]

  return (
    <div className="fade-in">

      {/* Page header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 className="page-title">
          {getGreeting()}, {learner.full_name.split(' ')[0]} 👋
        </h1>
        <p className="page-subtitle">
          {formatDate()} · {learner.grade} {learner.class_group} · Student No. {learner.student_no}
        </p>
      </div>

      {/* Alerts */}
      {attendanceRate < 90 && (
        <div className="alert alert-warning" style={{ marginBottom: '20px' }}>
          <AlertTriangle size={15} strokeWidth={2} style={{ flexShrink: 0 }} />
          <span>
            Your attendance is <strong>{attendanceRate}%</strong> — below the required 90%.
            Please speak to your class teacher.
          </span>
        </div>
      )}
      {avgMark < 50 && recentMarks.length > 0 && (
        <div className="alert alert-danger" style={{ marginBottom: '20px' }}>
          <XCircle size={15} strokeWidth={2} style={{ flexShrink: 0 }} />
          <span>
            Your current average is <strong>{avgMark}%</strong> — below the pass mark.
            Please see your subject teachers for support.
          </span>
        </div>
      )}
      {unreadMessages > 0 && (
        <div className="alert alert-info" style={{ marginBottom: '20px' }}>
          <MessageSquare size={15} strokeWidth={2} style={{ flexShrink: 0 }} />
          <span>
            You have <strong>{unreadMessages}</strong> unread message{unreadMessages > 1 ? 's' : ''}.{' '}
            <Link href="/student/messages" style={{ color: 'var(--blue)', fontWeight: 500 }}>
              View messages →
            </Link>
          </span>
        </div>
      )}

      {/* Stat cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '14px',
        marginBottom: '28px',
      }}>
        <div className="stat-card stat-card-blue">
          <div className="stat-label">Attendance</div>
          <div className="stat-value">{attendanceRate}%</div>
          <div className="stat-sub">
            {attendanceRate >= 90
              ? '✓ Above minimum'
              : '⚠ Below 90% target'}
          </div>
        </div>
        <div className={`stat-card ${avgMark >= 50 ? 'stat-card-green' : 'stat-card-red'}`}>
          <div className="stat-label">Average mark</div>
          <div className="stat-value">{avgMark > 0 ? `${avgMark}%` : '—'}</div>
          <div className="stat-sub">All subjects</div>
        </div>
        <div className="stat-card stat-card-amber">
          <div className="stat-label">Days absent</div>
          <div className="stat-value">{absentDays}</div>
          <div className="stat-sub">This term</div>
        </div>
        <div className="stat-card stat-card-navy">
          <div className="stat-label">Next due</div>
          <div className="stat-value" style={{ fontSize: '16px', paddingTop: '4px' }}>
            {nextHomework
              ? (nextHomework.subjects as any)?.name?.split(' ')[0] ?? 'Homework'
              : '—'}
          </div>
          <div className="stat-sub">
            {nextHomework
              ? getDueBadge(nextHomework.due_date).label
              : 'No pending homework'}
          </div>
        </div>
      </div>

      {/* Main two-column grid */}
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
            <Link href="/student/timetable" className="section-link">
              Full timetable →
            </Link>
          </div>

          {todayClasses.length === 0 ? (
            <div className="card" style={{ padding: '24px', textAlign: 'center', color: 'var(--gray-mid)', fontSize: '14px' }}>
              No classes scheduled today
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {todayClasses.map((cls: any) => (
                <div
                  key={cls.period}
                  className="card"
                  style={{
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                  }}
                >
                  {/* Time */}
                  <div style={{
                    background: 'var(--blue-pale)',
                    borderRadius: '8px',
                    padding: '6px 10px',
                    textAlign: 'center',
                    flexShrink: 0,
                    minWidth: '68px',
                  }}>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--blue)' }}>
                      {cls.start_time}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--gray-mid)' }}>
                      {cls.end_time}
                    </div>
                  </div>

                  {/* Subject info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: '13.5px', fontWeight: 600,
                      color: 'var(--navy)', marginBottom: '2px',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {(cls.subjects as any)?.name ?? 'Unknown subject'}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--gray-mid)' }}>
                      {(cls.staff as any)?.full_name ?? '—'} · Room {cls.room}
                    </div>
                  </div>

                  {/* Period badge */}
                  <div style={{
                    fontSize: '11px', color: 'var(--gray-mid)',
                    flexShrink: 0,
                  }}>
                    P{cls.period}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent marks */}
        <div>
          <div className="section-header">
            <span className="section-title">Recent marks</span>
            <Link href="/student/marks" className="section-link">
              All marks →
            </Link>
          </div>

          {recentMarks.length === 0 ? (
            <div className="card" style={{ padding: '24px', textAlign: 'center', color: 'var(--gray-mid)', fontSize: '14px' }}>
              No marks recorded yet
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Assessment</th>
                  <th>Mark</th>
                  <th>Symbol</th>
                </tr>
              </thead>
              <tbody>
                {recentMarks.map((m: any, i: number) => {
                  const pct = Math.round((m.score / m.assessments.max_score) * 100)
                  const sym = getSymbol(pct)
                  return (
                    <tr key={i}>
                      <td style={{ fontWeight: 500 }}>
                        {(m.assessments.subjects as any)?.name?.split(' ')[0] ?? '—'}
                      </td>
                      <td style={{ color: 'var(--gray-mid)', fontSize: '12.5px' }}>
                        {m.assessments.name}
                      </td>
                      <td style={{ fontWeight: 500 }}>
                        {m.score}/{m.assessments.max_score}
                        <span style={{ color: 'var(--gray-mid)', fontSize: '11px', marginLeft: '4px' }}>
                          ({pct}%)
                        </span>
                      </td>
                      <td>
                        <span className="badge" style={{
                          background: `${sym.color}18`,
                          color: sym.color,
                        }}>
                          {sym.label}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Second row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '20px',
      }}>

        {/* Homework due */}
        <div>
          <div className="section-header">
            <span className="section-title">Homework due</span>
            <Link href="/student/homework" className="section-link">
              All homework →
            </Link>
          </div>

          {homework.length === 0 ? (
            <div className="card" style={{ padding: '24px', textAlign: 'center', color: 'var(--gray-mid)', fontSize: '14px' }}>
              🎉 No pending homework
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {homework.map((hw: any) => {
                const due = getDueBadge(hw.due_date)
                return (
                  <div
                    key={hw.id}
                    className="card"
                    style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: '13px', fontWeight: 600,
                        color: 'var(--blue)', marginBottom: '2px',
                      }}>
                        {(hw.subjects as any)?.name ?? 'Unknown'}
                      </div>
                      <div style={{
                        fontSize: '12.5px', color: 'var(--gray-mid)',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {hw.description}
                      </div>
                    </div>
                    <span className="badge" style={{
                      background: due.bg,
                      color: due.color,
                      flexShrink: 0,
                      fontSize: '11px',
                    }}>
                      {due.label}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Notices */}
        <div>
          <div className="section-header">
            <span className="section-title">Latest notices</span>
            <Link href="/student/notices" className="section-link">
              All notices →
            </Link>
          </div>

          {notices.length === 0 ? (
            <div className="card" style={{ padding: '24px', textAlign: 'center', color: 'var(--gray-mid)', fontSize: '14px' }}>
              No recent notices
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {notices.map((notice: any) => (
                <div key={notice.id} className="notice-card">
                  <div
                    className="notice-dot"
                    style={{ background: categoryColors[notice.category] ?? 'var(--gray-mid)' }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="notice-title" style={{
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {notice.title}
                    </div>
                    <div className="notice-meta">
                      {new Date(notice.created_at).toLocaleDateString('en-ZA', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}
                      {' · '}
                      <span style={{
                        textTransform: 'capitalize',
                        color: categoryColors[notice.category] ?? 'var(--gray-mid)',
                      }}>
                        {notice.category}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}