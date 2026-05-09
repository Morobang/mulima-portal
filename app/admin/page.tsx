import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import {
  Users, GraduationCap, TrendingUp, CreditCard,
  AlertTriangle, CheckCircle2, Clock, Bell,
  BookOpen, ClipboardList, Building2, ChevronRight,
  UserCheck, Package, Wrench, Info, BarChart3
} from 'lucide-react'

// ── DATA ──────────────────────────────────────────────────
async function getAdminDashboardData() {
  const supabase = await createServerSupabaseClient()

  // Enrolment
  const { count: totalLearners } = await supabase
    .from('learners')
    .select('id', { count: 'exact', head: true })

  const { count: totalStaff } = await supabase
    .from('staff')
    .select('id', { count: 'exact', head: true })

  // Learners by grade
  const { data: learners } = await supabase
    .from('learners')
    .select('grade')

  const gradeBreakdown: Record<string, number> = {}
  learners?.forEach(l => {
    gradeBreakdown[l.grade] = (gradeBreakdown[l.grade] ?? 0) + 1
  })

  // Today's attendance
  const todayDate = new Date().toISOString().split('T')[0]
  const { data: todayAttendance } = await supabase
    .from('attendance')
    .select('status')
    .eq('date', todayDate)

  const presentToday = todayAttendance?.filter(
    a => a.status === 'present' || a.status === 'late'
  ).length ?? 0
  const attendanceRate = todayAttendance && todayAttendance.length > 0
    ? Math.round((presentToday / todayAttendance.length) * 100)
    : null

  // Fees
  const { data: fees } = await supabase
    .from('fees')
    .select('amount, paid, status, due_date')

  const totalCharged  = fees?.reduce((s, f) => s + f.amount, 0) ?? 0
  const totalPaid     = fees?.reduce((s, f) => s + f.paid, 0) ?? 0
  const totalBalance  = totalCharged - totalPaid
  const collectionPct = totalCharged > 0
    ? Math.round((totalPaid / totalCharged) * 100) : 0

  const overdueCount = fees?.filter(f => {
    const diff = new Date(f.due_date) < new Date()
    return diff && f.status !== 'paid'
  }).length ?? 0

  // At-risk learners — below 40% average
  const { data: allMarks } = await supabase
    .from('marks')
    .select('learner_id, score, assessments ( max_score )')

  const learnerAvgs: Record<string, { total: number; count: number }> = {}
  allMarks?.forEach((m: any) => {
    if (!learnerAvgs[m.learner_id]) {
      learnerAvgs[m.learner_id] = { total: 0, count: 0 }
    }
    const pct = (m.score / m.assessments.max_score) * 100
    learnerAvgs[m.learner_id].total += pct
    learnerAvgs[m.learner_id].count += 1
  })

  const atRiskLearners = Object.entries(learnerAvgs).filter(([, v]) => {
    return (v.total / v.count) < 40
  }).length

  // Report comments progress
  const { data: allComments } = await supabase
    .from('report_comments')
    .select('status')

  const commentsDone = allComments?.filter(
    c => c.status === 'submitted' || c.status === 'approved'
  ).length ?? 0
  const commentsTotal = allComments?.length ?? 0
  const commentsPct   = commentsTotal > 0
    ? Math.round((commentsDone / commentsTotal) * 100) : 0

  // Notices
  const { data: notices } = await supabase
    .from('notices')
    .select('id, title, category, audience, created_at')
    .order('created_at', { ascending: false })
    .limit(5)

  // Maintenance requests
  const { data: maintenance } = await supabase
    .from('maintenance_requests')
    .select('id, description, location, priority, status, created_at')
    .in('status', ['not_started', 'in_progress'])
    .order('created_at', { ascending: false })
    .limit(4)

  // Inventory items needing attention
  const { data: inventory } = await supabase
    .from('inventory')
    .select('id, name, condition, category')
    .in('condition', ['poor', 'needs_repair'])
    .limit(4)

  // Staff on leave
  const { data: onLeave } = await supabase
    .from('leave_applications')
    .select('id, staff ( full_name ), type, date_from, date_to')
    .eq('status', 'approved')
    .gte('date_to', todayDate)
    .limit(4)

  return {
    totalLearners:  totalLearners ?? 0,
    totalStaff:     totalStaff ?? 0,
    gradeBreakdown,
    attendanceRate,
    totalAttendanceRecords: todayAttendance?.length ?? 0,
    totalCharged,
    totalPaid,
    totalBalance,
    collectionPct,
    overdueCount,
    atRiskLearners,
    commentsDone,
    commentsTotal,
    commentsPct,
    notices:     notices ?? [],
    maintenance: maintenance ?? [],
    inventory:   inventory ?? [],
    onLeave:     onLeave ?? [],
  }
}

// ── UTILS ─────────────────────────────────────────────────
function formatCurrency(amount: number) {
  return `R ${amount.toLocaleString('en-ZA', {
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  })}`
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-ZA', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

function getPriorityStyle(priority: string) {
  const map: Record<string, { color: string; bg: string }> = {
    urgent: { color: 'var(--danger)',  bg: 'var(--danger-bg)' },
    high:   { color: 'var(--danger)',  bg: 'var(--danger-bg)' },
    medium: { color: 'var(--warning)', bg: 'var(--warning-bg)' },
    low:    { color: 'var(--gray-mid)', bg: 'var(--gray-light)' },
  }
  return map[priority] ?? map.low
}

function getMaintenanceStatus(status: string) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    not_started: { label: 'Not started', color: 'var(--danger)',  bg: 'var(--danger-bg)' },
    in_progress: { label: 'In progress', color: 'var(--warning)', bg: 'var(--warning-bg)' },
    completed:   { label: 'Completed',   color: 'var(--success)', bg: 'var(--success-bg)' },
  }
  return map[status] ?? map.not_started
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

const GRADES = [
  'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12',
]

// ── PAGE ──────────────────────────────────────────────────
export default async function AdminDashboard() {
  const supabase = await createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  // Verify admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', session.user.id)
    .single()

  if (!profile || profile.role !== 'admin') redirect('/login')

  const data = await getAdminDashboardData()

  const {
    totalLearners, totalStaff, gradeBreakdown,
    attendanceRate, totalAttendanceRecords,
    totalCharged, totalPaid, totalBalance, collectionPct, overdueCount,
    atRiskLearners, commentsDone, commentsTotal, commentsPct,
    notices, maintenance, inventory, onLeave,
  } = data

  const firstName = profile.full_name.split(' ').pop() ?? profile.full_name

  return (
    <div className="fade-in">

      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 className="page-title">
          Principal&apos;s Dashboard
        </h1>
        <p className="page-subtitle">
          {profile.full_name} · Mulima Secondary School ·{' '}
          {new Date().toLocaleDateString('en-ZA', {
            weekday: 'long', day: 'numeric',
            month: 'long', year: 'numeric',
          })}
        </p>
      </div>

      {/* Critical alerts */}
      {atRiskLearners > 0 && (
        <div className="alert alert-danger" style={{ marginBottom: '12px' }}>
          <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
          <span>
            <strong>{atRiskLearners} learner{atRiskLearners > 1 ? 's' : ''} at risk</strong> —
            below 40% average. Intervention required before mid-year exams.{' '}
            <Link href="/admin/at-risk" style={{ color: 'var(--blue)', fontWeight: 500 }}>
              View at-risk learners →
            </Link>
          </span>
        </div>
      )}
      {overdueCount > 0 && (
        <div className="alert alert-warning" style={{ marginBottom: '12px' }}>
          <CreditCard size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
          <span>
            <strong>{overdueCount} overdue fee item{overdueCount > 1 ? 's' : ''}.</strong>{' '}
            Outstanding balance: <strong>{formatCurrency(totalBalance)}</strong>.{' '}
            <Link href="/admin/fees" style={{ color: 'var(--blue)', fontWeight: 500 }}>
              Manage fees →
            </Link>
          </span>
        </div>
      )}
      {commentsPct < 80 && commentsTotal > 0 && (
        <div className="alert alert-warning" style={{ marginBottom: '12px' }}>
          <ClipboardList size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
          <span>
            <strong>Report comments {commentsPct}% complete.</strong>{' '}
            {commentsTotal - commentsDone} outstanding. Deadline: 6 June 2025.{' '}
            <Link href="/admin/analytics" style={{ color: 'var(--blue)', fontWeight: 500 }}>
              View progress →
            </Link>
          </span>
        </div>
      )}

      {/* Main stat cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '14px',
        marginBottom: '28px',
      }}>
        <div className="stat-card stat-card-navy">
          <div className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <GraduationCap size={12} /> Learners
          </div>
          <div className="stat-value">{totalLearners}</div>
          <div className="stat-sub">Enrolled this term</div>
        </div>

        <div className="stat-card stat-card-blue">
          <div className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <UserCheck size={12} /> Staff
          </div>
          <div className="stat-value">{totalStaff}</div>
          <div className="stat-sub">Active educators</div>
        </div>

        <div className={`stat-card ${
          attendanceRate === null ? 'stat-card-navy'
          : attendanceRate >= 90 ? 'stat-card-green'
          : attendanceRate >= 75 ? 'stat-card-amber'
          : 'stat-card-red'
        }`}>
          <div className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <CheckCircle2 size={12} /> Attendance today
          </div>
          <div className="stat-value">
            {attendanceRate !== null ? `${attendanceRate}%` : '—'}
          </div>
          <div className="stat-sub">
            {totalAttendanceRecords > 0
              ? `${totalAttendanceRecords} records`
              : 'No records yet'}
          </div>
        </div>

        <div className={`stat-card ${
          collectionPct >= 90 ? 'stat-card-green'
          : collectionPct >= 70 ? 'stat-card-amber'
          : 'stat-card-red'
        }`}>
          <div className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <CreditCard size={12} /> Fee collection
          </div>
          <div className="stat-value">{collectionPct}%</div>
          <div className="stat-sub">{formatCurrency(totalBalance)} outstanding</div>
        </div>

        <div className={`stat-card ${
          atRiskLearners === 0 ? 'stat-card-green' : 'stat-card-red'
        }`}>
          <div className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <AlertTriangle size={12} /> At risk
          </div>
          <div className="stat-value">{atRiskLearners}</div>
          <div className="stat-sub">
            {atRiskLearners === 0 ? 'No learners at risk' : 'Learners below 40%'}
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
          <div className="stat-sub">{commentsDone}/{commentsTotal} comments</div>
        </div>
      </div>

      {/* Quick navigation */}
      <div style={{ marginBottom: '28px' }}>
        <div className="section-header" style={{ marginBottom: '12px' }}>
          <span className="section-title">Quick navigation</span>
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
          gap: '10px',
        }}>
          {[
            { label: 'Enrolment',      href: '/admin/enrolment',  icon: GraduationCap, color: 'var(--blue)' },
            { label: 'Staff',          href: '/admin/staff',       icon: UserCheck,     color: 'var(--navy)' },
            { label: 'Analytics',      href: '/admin/analytics',   icon: BarChart3,     color: 'var(--success)' },
            { label: 'At-risk',        href: '/admin/at-risk',     icon: AlertTriangle, color: 'var(--danger)', urgent: atRiskLearners > 0 },
            { label: 'Fee management', href: '/admin/fees',        icon: CreditCard,    color: 'var(--warning)', urgent: overdueCount > 0 },
            { label: 'Post notice',    href: '/admin/notices',     icon: Bell,          color: '#7c3aed' },
            { label: 'Timetable',      href: '/admin/timetable',   icon: Clock,         color: 'var(--blue)' },
            { label: 'Inventory',      href: '/admin/inventory',   icon: Package,       color: 'var(--navy)' },
            { label: 'Facilities',     href: '/admin/facilities',  icon: Wrench,        color: 'var(--warning)', urgent: maintenance.length > 0 },
            { label: 'SGB',            href: '/admin/sgb',         icon: Building2,     color: 'var(--navy)' },
          ].map(item => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
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
                  border: (item as any).urgent
                    ? '1.5px solid var(--warning)'
                    : '1px solid var(--gray-border)',
                }}
              >
                {(item as any).urgent && (
                  <div style={{
                    position: 'absolute', top: '8px', right: '8px',
                    width: '8px', height: '8px',
                    borderRadius: '50%', background: 'var(--warning)',
                  }} />
                )}
                <div style={{
                  width: '44px', height: '44px',
                  borderRadius: '12px',
                  background: `${item.color}18`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon size={20} color={item.color} />
                </div>
                <span style={{
                  fontSize: '12.5px', fontWeight: 500, color: 'var(--navy)',
                }}>
                  {item.label}
                </span>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Main grid row 1 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '20px',
        marginBottom: '20px',
      }}>

        {/* Enrolment by grade */}
        <div>
          <div className="section-header">
            <span className="section-title">Enrolment by grade</span>
            <Link href="/admin/enrolment" className="section-link">
              Manage →
            </Link>
          </div>

          <div className="card" style={{ padding: '20px' }}>
            {GRADES.map(grade => {
              const count = gradeBreakdown[grade] ?? 0
              const pct   = totalLearners > 0
                ? Math.round((count / totalLearners) * 100) : 0
              return (
                <div key={grade} className="progress-row">
                  <div className="progress-label" style={{
                    fontWeight: 500, color: 'var(--navy)',
                    width: '80px',
                  }}>
                    {grade.replace('Grade ', 'Gr ')}
                  </div>
                  <div className="progress-track">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${pct}%`,
                        background: 'var(--blue)',
                      }}
                    />
                  </div>
                  <div className="progress-value">{count}</div>
                </div>
              )
            })}

            <div style={{
              marginTop: '14px',
              paddingTop: '12px',
              borderTop: '1px solid var(--gray-border)',
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '13px',
            }}>
              <span style={{ color: 'var(--gray-mid)' }}>Total enrolled</span>
              <span style={{ fontWeight: 700, color: 'var(--navy)' }}>
                {totalLearners} learners
              </span>
            </div>
          </div>
        </div>

        {/* Fee collection */}
        <div>
          <div className="section-header">
            <span className="section-title">Fee collection</span>
            <Link href="/admin/fees" className="section-link">
              Manage →
            </Link>
          </div>

          <div className="card" style={{ padding: '20px' }}>
            {/* Progress bar */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                marginBottom: '8px',
              }}>
                <span style={{ fontSize: '12.5px', color: 'var(--gray-mid)' }}>
                  Collection rate
                </span>
                <span style={{
                  fontWeight: 700, fontSize: '14px',
                  color: collectionPct >= 80
                    ? 'var(--success)' : 'var(--warning)',
                }}>
                  {collectionPct}%
                </span>
              </div>
              <div style={{
                height: '10px', background: 'var(--gray-light)',
                borderRadius: '99px', overflow: 'hidden',
              }}>
                <div style={{
                  width: `${collectionPct}%`,
                  height: '100%',
                  borderRadius: '99px',
                  background: collectionPct >= 80
                    ? 'var(--success)' : 'var(--warning)',
                  transition: 'width 0.6s ease',
                }} />
              </div>
            </div>

            {/* Breakdown */}
            {[
              { label: 'Total billed',    value: formatCurrency(totalCharged), color: 'var(--navy)' },
              { label: 'Collected',       value: formatCurrency(totalPaid),    color: 'var(--success)' },
              { label: 'Outstanding',     value: formatCurrency(totalBalance), color: totalBalance > 0 ? 'var(--danger)' : 'var(--success)' },
              { label: 'Overdue items',   value: `${overdueCount} items`,      color: overdueCount > 0 ? 'var(--danger)' : 'var(--success)' },
            ].map(item => (
              <div
                key={item.label}
                style={{
                  display: 'flex', justifyContent: 'space-between',
                  padding: '8px 0',
                  borderBottom: '1px solid var(--gray-border)',
                  fontSize: '13px',
                }}
              >
                <span style={{ color: 'var(--gray-mid)' }}>{item.label}</span>
                <span style={{ fontWeight: 600, color: item.color }}>
                  {item.value}
                </span>
              </div>
            ))}

            <div style={{ marginTop: '14px' }}>
              <Link href="/admin/fees" className="btn btn-outline btn-sm"
                style={{ width: '100%', justifyContent: 'center' }}>
                <CreditCard size={13} />
                Send fee reminders
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main grid row 2 */}
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
            <Link href="/admin/analytics" className="section-link">
              Full view →
            </Link>
          </div>

          <div className="card" style={{ padding: '20px' }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              marginBottom: '8px',
            }}>
              <span style={{ fontSize: '12.5px', color: 'var(--gray-mid)' }}>
                {commentsDone} of {commentsTotal} submitted
              </span>
              <span style={{
                fontWeight: 700,
                color: commentsPct >= 80 ? 'var(--success)'
                  : commentsPct >= 50 ? 'var(--warning)'
                  : 'var(--danger)',
              }}>
                {commentsPct}%
              </span>
            </div>
            <div style={{
              height: '10px', background: 'var(--gray-light)',
              borderRadius: '99px', overflow: 'hidden',
              marginBottom: '16px',
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

            <div style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              fontSize: '12px', color: 'var(--gray-mid)',
            }}>
              <Clock size={12} />
              Report deadline: <strong style={{ color: 'var(--navy)' }}>
                6 June 2025
              </strong>
            </div>

            {commentsPct < 100 && (
              <div className="alert alert-warning" style={{ marginTop: '14px' }}>
                <AlertTriangle size={13} style={{ flexShrink: 0 }} />
                <span style={{ fontSize: '12px' }}>
                  {commentsTotal - commentsDone} comments still outstanding.
                  Follow up with HODs immediately.
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Maintenance requests */}
        <div>
          <div className="section-header">
            <span className="section-title">Open maintenance requests</span>
            <Link href="/admin/facilities" className="section-link">
              View all →
            </Link>
          </div>

          {maintenance.length === 0 ? (
            <div className="card" style={{
              padding: '28px', textAlign: 'center',
              color: 'var(--gray-mid)', fontSize: '13.5px',
            }}>
              <CheckCircle2 size={28} color="var(--success)"
                style={{ margin: '0 auto 8px' }} />
              No open maintenance requests
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {maintenance.map((item: any) => {
                const pri = getPriorityStyle(item.priority)
                const sts = getMaintenanceStatus(item.status)
                return (
                  <div
                    key={item.id}
                    className="card"
                    style={{
                      padding: '12px 16px',
                      borderLeft: `4px solid ${pri.color}`,
                    }}
                  >
                    <div style={{
                      display: 'flex', justifyContent: 'space-between',
                      alignItems: 'flex-start', gap: '10px',
                      marginBottom: '6px',
                    }}>
                      <div>
                        <div style={{
                          fontSize: '13px', fontWeight: 600,
                          color: 'var(--navy)', marginBottom: '2px',
                        }}>
                          {item.description}
                        </div>
                        <div style={{
                          fontSize: '12px', color: 'var(--gray-mid)',
                          display: 'flex', alignItems: 'center', gap: '5px',
                        }}>
                          <Building2 size={11} />
                          {item.location}
                        </div>
                      </div>
                      <div style={{
                        display: 'flex', flexDirection: 'column',
                        gap: '4px', alignItems: 'flex-end',
                      }}>
                        <span className="badge" style={{
                          background: pri.bg, color: pri.color,
                          fontSize: '10.5px', textTransform: 'capitalize',
                        }}>
                          {item.priority}
                        </span>
                        <span className="badge" style={{
                          background: sts.bg, color: sts.color,
                          fontSize: '10.5px',
                        }}>
                          {sts.label}
                        </span>
                      </div>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--gray-mid)' }}>
                      Logged {formatDate(item.created_at)}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Row 3 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '20px',
        marginBottom: '20px',
      }}>

        {/* Recent notices */}
        <div>
          <div className="section-header">
            <span className="section-title">Recent notices</span>
            <Link href="/admin/notices" className="section-link">
              Post notice →
            </Link>
          </div>

          {notices.length === 0 ? (
            <div className="card" style={{
              padding: '28px', textAlign: 'center',
              color: 'var(--gray-mid)', fontSize: '13.5px',
            }}>
              No notices posted yet
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
                      {formatDate(notice.created_at)} ·{' '}
                      <span style={{ textTransform: 'capitalize' }}>
                        {notice.audience}
                      </span>
                    </div>
                  </div>
                  <ChevronRight size={14} color="var(--gray-mid)"
                    style={{ flexShrink: 0 }} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Inventory needing attention */}
        <div>
          <div className="section-header">
            <span className="section-title">Inventory alerts</span>
            <Link href="/admin/inventory" className="section-link">
              View all →
            </Link>
          </div>

          {inventory.length === 0 ? (
            <div className="card" style={{
              padding: '28px', textAlign: 'center',
              color: 'var(--gray-mid)', fontSize: '13.5px',
            }}>
              <CheckCircle2 size={28} color="var(--success)"
                style={{ margin: '0 auto 8px' }} />
              All inventory in good condition
            </div>
          ) : (
            <div className="card" style={{ overflow: 'hidden' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Category</th>
                    <th>Condition</th>
                  </tr>
                </thead>
                <tbody>
                  {inventory.map((item: any) => (
                    <tr key={item.id}>
                      <td style={{ fontWeight: 500, color: 'var(--navy)' }}>
                        {item.name}
                      </td>
                      <td style={{
                        fontSize: '12px', color: 'var(--gray-mid)',
                        textTransform: 'capitalize',
                      }}>
                        {item.category}
                      </td>
                      <td>
                        <span className="badge badge-red"
                          style={{ fontSize: '11px', textTransform: 'capitalize' }}>
                          {item.condition.replace('_', ' ')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="alert alert-info">
        <Info size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
        <span>
          This dashboard updates in real time from the school database.
          For SIAS reports or DOE submissions, go to{' '}
          <Link href="/admin/analytics"
            style={{ color: 'var(--blue)', fontWeight: 500 }}>
            Reports &amp; Analytics
          </Link>.
        </span>
      </div>
    </div>
  )
}