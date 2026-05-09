import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import {
  TrendingUp, CreditCard, CalendarCheck, Bell,
  AlertTriangle, CheckCircle2, ChevronRight,
  BookOpen, Clock, User, Mail
} from 'lucide-react'

// ── DATA ──────────────────────────────────────────────────
async function getParentDashboardData(userId: string) {
  const supabase = await createServerSupabaseClient()

  // Get parent record
  const { data: parent } = await supabase
    .from('parents')
    .select('id, full_name')
    .eq('user_id', userId)
    .single()

  if (!parent) return null

  // Get linked learners
  const { data: links } = await supabase
    .from('parent_learner')
    .select('learner_id')
    .eq('parent_id', parent.id)

  if (!links || links.length === 0) return { parent, learner: null, data: null }

  // For now use first linked learner
  const learnerId = links[0].learner_id

  const { data: learner } = await supabase
    .from('learners')
    .select('id, full_name, grade, class_group, student_no')
    .eq('id', learnerId)
    .single()

  if (!learner) return { parent, learner: null, data: null }

  // Marks
  type Mark = {
    score: number
    submitted_at: string
    assessments: { name: string; max_score: number; date: string; subjects: { name: string } | null } | null
  }
  const { data: rawMarks } = await supabase
    .from('marks')
    .select(`
      score, submitted_at,
      assessments (
        name, max_score, date,
        subjects ( name )
      )
    `)
    .eq('learner_id', learnerId)
    .order('submitted_at', { ascending: false })
    .limit(5)
  const marks = (rawMarks ?? []) as unknown as Mark[]

  // Attendance
  const { data: attendance } = await supabase
    .from('attendance')
    .select('status, date')
    .eq('learner_id', learnerId)

  // Fees
  const { data: fees } = await supabase
    .from('fees')
    .select('id, description, amount, paid, due_date, status, term')
    .eq('learner_id', learnerId)
    .order('due_date', { ascending: true })

  // Notices for parents
  const { data: notices } = await supabase
    .from('notices')
    .select('id, title, category, created_at')
    .in('audience', ['all', 'parents'])
    .order('created_at', { ascending: false })
    .limit(4)

  // Unread messages
  const { count: unreadMessages } = await supabase
    .from('messages')
    .select('id', { count: 'exact', head: true })
    .eq('to_user_id', userId)
    .eq('read', false)

  // Homework pending
  const { data: homework } = await supabase
    .from('homework')
    .select('id, description, due_date, subjects ( name )')
    .eq('grade', learner.grade)
    .eq('class_group', learner.class_group)
    .gte('due_date', new Date().toISOString().split('T')[0])
    .order('due_date', { ascending: true })
    .limit(3)

  return {
    parent,
    learner,
    data: {
      marks:          marks ?? [],
      attendance:     attendance ?? [],
      fees:           fees ?? [],
      notices:        notices ?? [],
      unreadMessages: unreadMessages ?? 0,
      homework:       homework ?? [],
    },
  }
}

// ── UTILS ─────────────────────────────────────────────────
function calcAttendanceRate(attendance: { status: string }[]) {
  if (!attendance.length) return 0
  const present = attendance.filter(
    a => a.status === 'present' || a.status === 'late'
  ).length
  return Math.round((present / attendance.length) * 100)
}

function calcAvgMark(marks: any[]) {
  if (!marks.length) return 0
  const total = marks.reduce((sum, m) => {
    return sum + Math.round((m.score / m.assessments.max_score) * 100)
  }, 0)
  return Math.round(total / marks.length)
}

function calcFeesBalance(fees: any[]) {
  return fees.reduce((sum, f) => sum + (f.amount - f.paid), 0)
}

function formatCurrency(amount: number) {
  return `R ${amount.toLocaleString('en-ZA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-ZA', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

function getDueBadge(dueDate: string) {
  const diff = Math.round(
    (new Date(dueDate).setHours(0,0,0,0) - new Date().setHours(0,0,0,0))
    / 86400000
  )
  if (diff < 0)   return { label: 'Overdue',         color: 'var(--danger)',  bg: 'var(--danger-bg)' }
  if (diff === 0) return { label: 'Due today',        color: 'var(--danger)',  bg: 'var(--danger-bg)' }
  if (diff <= 7)  return { label: `Due in ${diff}d`,  color: 'var(--warning)', bg: 'var(--warning-bg)' }
  return {
    label: formatDate(dueDate),
    color: 'var(--gray-mid)', bg: 'var(--gray-light)',
  }
}

function getMarkPct(score: number, max: number) {
  return Math.round((score / max) * 100)
}

function getMarkColour(pct: number) {
  if (pct >= 70) return 'var(--success)'
  if (pct >= 50) return 'var(--blue)'
  if (pct >= 40) return 'var(--warning)'
  return 'var(--danger)'
}

function getSymbol(pct: number) {
  if (pct >= 80) return 'A'
  if (pct >= 70) return 'B'
  if (pct >= 60) return 'C'
  if (pct >= 50) return 'D'
  if (pct >= 40) return 'E'
  return 'F'
}

const CATEGORY_DOTS: Record<string, string> = {
  urgent:   '#ef4444',
  academic: '#3b82f6',
  finance:  '#f59e0b',
  sport:    '#10b981',
  events:   '#8b5cf6',
  culture:  '#06b6d4',
  general:  '#9ca3af',
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

// ── PAGE ──────────────────────────────────────────────────
export default async function ParentDashboard() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const result = await getParentDashboardData(user.id)
  if (!result) redirect('/login')

  const { parent, learner, data } = result

  if (!learner || !data) {
    return (
      <div className="fade-in">
        <div className="card" style={{ padding: '48px', textAlign: 'center' }}>
          <User size={40} color="var(--gray-mid)"
            style={{ margin: '0 auto 12px' }} />
          <div style={{ fontSize: '15px', fontWeight: 500, color: 'var(--navy)', marginBottom: '6px' }}>
            No learner linked to your account
          </div>
          <div style={{ fontSize: '13.5px', color: 'var(--gray-mid)' }}>
            Please contact the school admin office to link your child to your account.
          </div>
        </div>
      </div>
    )
  }

  const { marks, attendance, fees, notices, unreadMessages, homework } = data

  const attendanceRate = calcAttendanceRate(attendance)
  const avgMark        = calcAvgMark(marks)
  const feesBalance    = calcFeesBalance(fees)
  const absentDays     = attendance.filter(a => a.status === 'absent').length
  const overdueFiles   = fees.filter(f => {
    const due = new Date(f.due_date)
    return due < new Date() && f.status !== 'paid'
  })
  const atRiskSubjects = marks.filter(m => {
    return m.assessments != null && getMarkPct(m.score, m.assessments.max_score) < 40
  })

  return (
    <div className="fade-in">

      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 className="page-title">
          {getGreeting()}, {parent.full_name.split(' ')[0]} 👋
        </h1>
        <p className="page-subtitle">
          Viewing: <strong>{learner.full_name}</strong> ·{' '}
          {learner.grade} {learner.class_group} ·
          Student No. {learner.student_no}
        </p>
      </div>

      {/* Alerts */}
      {atRiskSubjects.length > 0 && (
        <div className="alert alert-danger" style={{ marginBottom: '14px' }}>
          <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
          <span>
            <strong>{learner.full_name.split(' ')[0]} is below pass mark</strong> in{' '}
            {atRiskSubjects.length} subject{atRiskSubjects.length > 1 ? 's' : ''}.
            Please contact the relevant educator immediately.
          </span>
        </div>
      )}
      {attendanceRate < 90 && attendance.length > 0 && (
        <div className="alert alert-warning" style={{ marginBottom: '14px' }}>
          <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
          <span>
            <strong>Attendance is {attendanceRate}%</strong> — below the required 90%.
            Please ensure {learner.full_name.split(' ')[0]} attends school regularly.
          </span>
        </div>
      )}
      {overdueFiles && overdueFiles.length > 0 && (
        <div className="alert alert-warning" style={{ marginBottom: '14px' }}>
          <CreditCard size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
          <span>
            <strong>{overdueFiles.length} overdue fee item{overdueFiles.length > 1 ? 's' : ''}.</strong>{' '}
            <Link href="/parent/fees" style={{ color: 'var(--blue)', fontWeight: 500 }}>
              View fees →
            </Link>
          </span>
        </div>
      )}
      {unreadMessages > 0 && (
        <div className="alert alert-info" style={{ marginBottom: '14px' }}>
          <Mail size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
          <span>
            You have <strong>{unreadMessages} unread message{unreadMessages > 1 ? 's' : ''}</strong>{' '}
            from the school.{' '}
            <Link href="/parent/messages" style={{ color: 'var(--blue)', fontWeight: 500 }}>
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
        <div className={`stat-card ${
          attendanceRate >= 90 ? 'stat-card-green'
          : attendanceRate >= 80 ? 'stat-card-amber'
          : 'stat-card-red'
        }`}>
          <div className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <CalendarCheck size={12} /> Attendance
          </div>
          <div className="stat-value">{attendance.length ? `${attendanceRate}%` : '—'}</div>
          <div className="stat-sub">
            {absentDays} day{absentDays !== 1 ? 's' : ''} absent this term
          </div>
        </div>

        <div className={`stat-card ${
          avgMark >= 60 ? 'stat-card-green'
          : avgMark >= 40 ? 'stat-card-blue'
          : 'stat-card-red'
        }`}>
          <div className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <TrendingUp size={12} /> Average mark
          </div>
          <div className="stat-value">{avgMark > 0 ? `${avgMark}%` : '—'}</div>
          <div className="stat-sub">Across all subjects</div>
        </div>

        <div className={`stat-card ${feesBalance > 0 ? 'stat-card-red' : 'stat-card-green'}`}>
          <div className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <CreditCard size={12} /> Fees balance
          </div>
          <div className="stat-value" style={{ fontSize: '18px' }}>
            {feesBalance > 0 ? formatCurrency(feesBalance) : 'Paid up'}
          </div>
          <div className="stat-sub">
            {feesBalance > 0 ? 'Outstanding balance' : 'No balance due'}
          </div>
        </div>

        <div className={`stat-card ${unreadMessages > 0 ? 'stat-card-blue' : 'stat-card-navy'}`}>
          <div className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Bell size={12} /> Messages
          </div>
          <div className="stat-value">{unreadMessages}</div>
          <div className="stat-sub">
            {unreadMessages === 0 ? 'No unread messages' : 'Unread from school'}
          </div>
        </div>
      </div>

      {/* Main grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '20px',
        marginBottom: '20px',
      }}>

        {/* Recent marks */}
        <div>
          <div className="section-header">
            <span className="section-title">Recent marks</span>
            <Link href="/parent/progress" className="section-link">
              Full report →
            </Link>
          </div>

          {marks.length === 0 ? (
            <div className="card" style={{
              padding: '28px', textAlign: 'center',
              color: 'var(--gray-mid)', fontSize: '13.5px',
            }}>
              No marks recorded yet
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {marks.map((m: any, i: number) => {
                const pct = getMarkPct(m.score, m.assessments.max_score)
                const col = getMarkColour(pct)
                const sym = getSymbol(pct)
                return (
                  <div key={i} className="card" style={{
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                  }}>
                    {/* Symbol circle */}
                    <div style={{
                      width: '38px', height: '38px',
                      borderRadius: '50%',
                      background: `${col}18`,
                      border: `1.5px solid ${col}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700, fontSize: '14px',
                      color: col, flexShrink: 0,
                    }}>
                      {sym}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: '13px', fontWeight: 600,
                        color: 'var(--navy)',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {m.assessments.subjects?.name ?? '—'}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--gray-mid)' }}>
                        {m.assessments.name} · {formatDate(m.assessments.date)}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{
                        fontSize: '14px', fontWeight: 700, color: col,
                      }}>
                        {pct}%
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--gray-mid)' }}>
                        {m.score}/{m.assessments.max_score}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Fees summary */}
        <div>
          <div className="section-header">
            <span className="section-title">Fees summary</span>
            <Link href="/parent/fees" className="section-link">
              Pay & manage →
            </Link>
          </div>

          <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
            {fees.length === 0 ? (
              <div style={{
                padding: '28px', textAlign: 'center',
                color: 'var(--gray-mid)', fontSize: '13.5px',
              }}>
                No fee records found
              </div>
            ) : (
              <>
                {fees.map((fee: any, i: number) => {
                  const balance = fee.amount - fee.paid
                  const due = getDueBadge(fee.due_date)
                  return (
                    <div
                      key={fee.id}
                      style={{
                        padding: '12px 16px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '12px',
                        borderBottom: i < fees.length - 1
                          ? '1px solid var(--gray-border)' : 'none',
                        background: fee.status === 'paid'
                          ? 'var(--success-bg)' : '#fff',
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: '13px', fontWeight: 500,
                          color: 'var(--navy)',
                          overflow: 'hidden', textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}>
                          {fee.description}
                        </div>
                        <div style={{
                          fontSize: '11.5px', color: 'var(--gray-mid)',
                          marginTop: '2px',
                        }}>
                          {fee.status === 'paid'
                            ? '✓ Paid in full'
                            : `Balance: ${formatCurrency(balance)}`}
                        </div>
                      </div>

                      {fee.status === 'paid' ? (
                        <CheckCircle2 size={18} color="var(--success)" />
                      ) : (
                        <span className="badge" style={{
                          background: due.bg, color: due.color,
                          fontSize: '11px', flexShrink: 0,
                        }}>
                          {due.label}
                        </span>
                      )}
                    </div>
                  )
                })}

                {/* Total balance row */}
                <div style={{
                  padding: '12px 16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: feesBalance > 0 ? 'var(--danger-bg)' : 'var(--success-bg)',
                  borderTop: '2px solid var(--gray-border)',
                }}>
                  <span style={{ fontWeight: 700, fontSize: '13.5px', color: 'var(--navy)' }}>
                    Total outstanding
                  </span>
                  <span style={{
                    fontWeight: 700, fontSize: '15px',
                    color: feesBalance > 0 ? 'var(--danger)' : 'var(--success)',
                  }}>
                    {feesBalance > 0 ? formatCurrency(feesBalance) : 'R 0.00'}
                  </span>
                </div>

                {feesBalance > 0 && (
                  <div style={{ padding: '12px 16px', borderTop: '1px solid var(--gray-border)' }}>
                    <Link href="/parent/fees" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                      <CreditCard size={14} />
                      Pay now
                    </Link>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Second row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '20px',
      }}>

        {/* Upcoming homework */}
        <div>
          <div className="section-header">
            <span className="section-title">
              {learner.full_name.split(' ')[0]}&apos;s homework
            </span>
            <Link href="/parent/progress" className="section-link">
              View progress →
            </Link>
          </div>

          {homework.length === 0 ? (
            <div className="card" style={{
              padding: '28px', textAlign: 'center',
              color: 'var(--gray-mid)', fontSize: '13.5px',
            }}>
              <CheckCircle2 size={28} color="var(--success)"
                style={{ margin: '0 auto 8px' }} />
              No pending homework
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {homework.map((hw: any) => {
                const due = getDueBadge(hw.due_date)
                return (
                  <div key={hw.id} className="card" style={{
                    padding: '12px 16px',
                    display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', gap: '12px',
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: '12.5px', fontWeight: 600,
                        color: 'var(--blue)', marginBottom: '2px',
                      }}>
                        {hw.subjects?.name ?? 'Unknown'}
                      </div>
                      <div style={{
                        fontSize: '12px', color: 'var(--gray-mid)',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {hw.description}
                      </div>
                    </div>
                    <span className="badge" style={{
                      background: due.bg, color: due.color,
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

        {/* Notices */}
        <div>
          <div className="section-header">
            <span className="section-title">School notices</span>
            <Link href="/parent/notices" className="section-link">
              All notices →
            </Link>
          </div>

          {notices.length === 0 ? (
            <div className="card" style={{
              padding: '28px', textAlign: 'center',
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
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {notice.title}
                    </div>
                    <div className="notice-meta">
                      {formatDate(notice.created_at)} ·{' '}
                      <span style={{
                        textTransform: 'capitalize',
                        color: CATEGORY_DOTS[notice.category] ?? 'var(--gray-mid)',
                      }}>
                        {notice.category}
                      </span>
                    </div>
                  </div>
                  <ChevronRight size={14} color="var(--gray-mid)" style={{ flexShrink: 0 }} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}