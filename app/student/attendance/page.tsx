import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import {
  CalendarDays, CheckCircle2, XCircle,
  Clock, TrendingUp, AlertTriangle, Info
} from 'lucide-react'

// ── DATA ──────────────────────────────────────────────────
async function getAttendanceData(userId: string) {
  const supabase = await createServerSupabaseClient()

  const { data: learner } = await supabase
    .from('learners')
    .select('id, full_name, grade, class_group')
    .eq('user_id', userId)
    .maybeSingle()

  if (!learner) return null

  const { data: records } = await supabase
    .from('attendance')
    .select('date, status, reason, note_submitted')
    .eq('learner_id', learner.id)
    .order('date', { ascending: false })

  return { learner, records: records ?? [] }
}

// ── UTILS ─────────────────────────────────────────────────
function calcStats(records: any[]) {
  const present = records.filter(r => r.status === 'present').length
  const absent  = records.filter(r => r.status === 'absent').length
  const late    = records.filter(r => r.status === 'late').length
  const total   = records.length
  const rate    = total > 0 ? Math.round(((present + late) / total) * 100) : 0
  return { present, absent, late, total, rate }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-ZA', {
    weekday: 'short', day: 'numeric',
    month: 'long', year: 'numeric',
  })
}

// Build a full calendar month grid
function buildMonthGrid(year: number, month: number, records: any[]) {
  const recordMap: Record<string, string> = {}
  records.forEach(r => { recordMap[r.date] = r.status })

  const firstDay = new Date(year, month, 1).getDay() // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  // Pad start (Mon-based: shift Sun to end)
  const startPad = firstDay === 0 ? 6 : firstDay - 1

  const cells: { day: number | null; status: string | null; dateStr: string | null }[] = []

  for (let i = 0; i < startPad; i++) {
    cells.push({ day: null, status: null, dateStr: null })
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const mm = String(month + 1).padStart(2, '0')
    const dd = String(d).padStart(2, '0')
    const dateStr = `${year}-${mm}-${dd}`
    const dow = new Date(year, month, d).getDay()
    const isWeekend = dow === 0 || dow === 6
    cells.push({
      day: d,
      dateStr,
      status: isWeekend ? 'weekend' : (recordMap[dateStr] ?? null),
    })
  }
  return cells
}

// ── SUBCOMPONENTS ─────────────────────────────────────────
function CalendarGrid({ year, month, records }: {
  year: number; month: number; records: any[]
}) {
  const cells = buildMonthGrid(year, month, records)
  const monthName = new Date(year, month).toLocaleDateString('en-ZA', {
    month: 'long', year: 'numeric',
  })

  const dayHeaders = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  const statusStyle: Record<string, { bg: string; color: string; border: string }> = {
    present: { bg: 'var(--success-bg)',  color: 'var(--success)', border: '#6ee7b7' },
    absent:  { bg: 'var(--danger-bg)',   color: 'var(--danger)',  border: '#fca5a5' },
    late:    { bg: 'var(--warning-bg)',  color: 'var(--warning)', border: '#fcd34d' },
    weekend: { bg: 'var(--gray-light)',  color: 'var(--gray-mid)',border: 'transparent' },
  }

  return (
    <div className="card" style={{ padding: '20px', marginBottom: '20px' }}>
      <div style={{
        fontWeight: 600, color: 'var(--navy)',
        fontSize: '14px', marginBottom: '16px',
        display: 'flex', alignItems: 'center', gap: '8px',
      }}>
        <CalendarDays size={16} color="var(--blue)" />
        {monthName}
      </div>

      {/* Day headers */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '4px', marginBottom: '4px',
      }}>
        {dayHeaders.map(d => (
          <div key={d} style={{
            textAlign: 'center', fontSize: '10.5px',
            fontWeight: 600, color: 'var(--gray-mid)',
            padding: '4px 0',
          }}>
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px',
      }}>
        {cells.map((cell, i) => {
          if (!cell.day) {
            return <div key={`empty-${i}`} />
          }

          const st = cell.status ? statusStyle[cell.status] : null
          const isToday = cell.dateStr === new Date().toISOString().split('T')[0]

          return (
            <div
              key={cell.dateStr}
              title={cell.status ? `${cell.dateStr}: ${cell.status}` : undefined}
              style={{
                height: '34px',
                borderRadius: '7px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: isToday ? 700 : 400,
                background: st?.bg ?? 'transparent',
                color: st?.color ?? 'var(--gray-dark)',
                border: isToday
                  ? '2px solid var(--blue)'
                  : st?.border
                    ? `1px solid ${st.border}`
                    : '1px solid transparent',
                cursor: cell.status && cell.status !== 'weekend' ? 'pointer' : 'default',
              }}
            >
              {cell.day}
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div style={{
        display: 'flex', gap: '16px', marginTop: '14px',
        flexWrap: 'wrap', paddingTop: '12px',
        borderTop: '1px solid var(--gray-border)',
      }}>
        {[
          { label: 'Present', color: 'var(--success)',  bg: 'var(--success-bg)' },
          { label: 'Absent',  color: 'var(--danger)',   bg: 'var(--danger-bg)' },
          { label: 'Late',    color: 'var(--warning)',  bg: 'var(--warning-bg)' },
          { label: 'Weekend', color: 'var(--gray-mid)', bg: 'var(--gray-light)' },
        ].map(item => (
          <div key={item.label} style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            fontSize: '12px', color: 'var(--gray-mid)',
          }}>
            <div style={{
              width: '12px', height: '12px', borderRadius: '3px',
              background: item.bg, flexShrink: 0,
            }} />
            {item.label}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── PAGE ──────────────────────────────────────────────────
export default async function AttendancePage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const data = await getAttendanceData(user.id)

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

  const { learner, records } = data
  const stats = calcStats(records)

  // Show last 2 months
  const now   = new Date()
  const month0 = { year: now.getFullYear(), month: now.getMonth() }
  const prev   = new Date(now.getFullYear(), now.getMonth() - 1)
  const month1 = { year: prev.getFullYear(), month: prev.getMonth() }

  // Absences only, for the log
  const absences = records.filter(r => r.status === 'absent' || r.status === 'late')

  return (
    <div className="fade-in">

      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 className="page-title">Attendance</h1>
        <p className="page-subtitle">
          {learner.grade} {learner.class_group} · Term 2, 2026
        </p>
      </div>

      {/* Alerts */}
      {stats.rate < 80 && (
        <div className="alert alert-danger" style={{ marginBottom: '20px' }}>
          <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
          <span>
            <strong>Critical attendance level — {stats.rate}%.</strong>{' '}
            You are at serious risk of not being admitted to examinations.
            Please speak to the principal immediately.
          </span>
        </div>
      )}
      {stats.rate >= 80 && stats.rate < 90 && (
        <div className="alert alert-warning" style={{ marginBottom: '20px' }}>
          <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
          <span>
            <strong>Attendance warning — {stats.rate}%.</strong>{' '}
            The school minimum is 90%. Please improve your attendance
            to avoid being excluded from assessments.
          </span>
        </div>
      )}
      {stats.rate >= 90 && stats.total > 0 && (
        <div className="alert alert-success" style={{ marginBottom: '20px' }}>
          <CheckCircle2 size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
          <span>
            <strong>Good attendance — {stats.rate}%.</strong>{' '}
            You are above the required 90% minimum. Keep it up!
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
        <div className={`stat-card ${
          stats.rate >= 90 ? 'stat-card-green'
          : stats.rate >= 80 ? 'stat-card-amber'
          : 'stat-card-red'
        }`}>
          <div className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <TrendingUp size={12} /> Attendance rate
          </div>
          <div className="stat-value">{stats.total > 0 ? `${stats.rate}%` : '—'}</div>
          <div className="stat-sub">Target: 90% minimum</div>
        </div>

        <div className="stat-card stat-card-green">
          <div className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <CheckCircle2 size={12} /> Days present
          </div>
          <div className="stat-value">{stats.present}</div>
          <div className="stat-sub">Out of {stats.total} school days</div>
        </div>

        <div className="stat-card stat-card-red">
          <div className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <XCircle size={12} /> Days absent
          </div>
          <div className="stat-value">{stats.absent}</div>
          <div className="stat-sub">This term</div>
        </div>

        <div className="stat-card stat-card-amber">
          <div className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Clock size={12} /> Days late
          </div>
          <div className="stat-value">{stats.late}</div>
          <div className="stat-sub">This term</div>
        </div>
      </div>

      {/* Rate progress bar */}
      <div className="card" style={{ padding: '20px', marginBottom: '24px' }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', marginBottom: '10px',
        }}>
          <span style={{ fontWeight: 600, fontSize: '13.5px', color: 'var(--navy)' }}>
            Overall attendance rate
          </span>
          <span style={{
            fontWeight: 700, fontSize: '15px',
            color: stats.rate >= 90 ? 'var(--success)'
              : stats.rate >= 80 ? 'var(--warning)'
              : 'var(--danger)',
          }}>
            {stats.rate}%
          </span>
        </div>
        <div style={{
          height: '10px', background: 'var(--gray-light)',
          borderRadius: '99px', overflow: 'hidden',
          position: 'relative',
        }}>
          <div style={{
            width: `${stats.rate}%`,
            height: '100%',
            borderRadius: '99px',
            background: stats.rate >= 90 ? 'var(--success)'
              : stats.rate >= 80 ? 'var(--warning)'
              : 'var(--danger)',
            transition: 'width 0.6s ease',
          }} />
          {/* 90% marker */}
          <div style={{
            position: 'absolute', top: 0, bottom: 0,
            left: '90%', width: '2px',
            background: 'var(--navy)', opacity: 0.4,
          }} />
        </div>
        <div style={{
          display: 'flex', justifyContent: 'flex-end',
          marginTop: '6px', fontSize: '11px', color: 'var(--gray-mid)',
        }}>
          <span>90% minimum requirement</span>
        </div>
      </div>

      {/* Calendar grids */}
      <CalendarGrid
        year={month0.year}
        month={month0.month}
        records={records}
      />
      <CalendarGrid
        year={month1.year}
        month={month1.month}
        records={records}
      />

      {/* Absence & late log */}
      <div style={{ marginTop: '8px' }}>
        <div className="section-header" style={{ marginBottom: '12px' }}>
          <span className="section-title">Absence & late log</span>
        </div>

        {absences.length === 0 ? (
          <div className="card" style={{
            padding: '32px', textAlign: 'center',
            color: 'var(--gray-mid)', fontSize: '14px',
          }}>
            <CheckCircle2
              size={32}
              color="var(--success)"
              style={{ margin: '0 auto 10px' }}
            />
            No absences or late arrivals recorded this term.
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Status</th>
                <th>Reason</th>
                <th>Note submitted</th>
              </tr>
            </thead>
            <tbody>
              {absences.map((r: any, i: number) => (
                <tr key={i}>
                  <td style={{ fontWeight: 500, color: 'var(--navy)', whiteSpace: 'nowrap' }}>
                    {formatDate(r.date)}
                  </td>
                  <td>
                    {r.status === 'absent' ? (
                      <span className="badge badge-red" style={{
                        display: 'inline-flex', alignItems: 'center', gap: '4px',
                      }}>
                        <XCircle size={11} /> Absent
                      </span>
                    ) : (
                      <span className="badge badge-amber" style={{
                        display: 'inline-flex', alignItems: 'center', gap: '4px',
                      }}>
                        <Clock size={11} /> Late
                      </span>
                    )}
                  </td>
                  <td style={{ color: 'var(--gray-mid)', fontSize: '13px' }}>
                    {r.reason ?? <span style={{ fontStyle: 'italic' }}>No reason provided</span>}
                  </td>
                  <td>
                    {r.status === 'late' ? (
                      <span className="badge badge-gray">N/A</span>
                    ) : r.note_submitted ? (
                      <span className="badge badge-green" style={{
                        display: 'inline-flex', alignItems: 'center', gap: '4px',
                      }}>
                        <CheckCircle2 size={11} /> Submitted
                      </span>
                    ) : (
                      <span className="badge badge-red" style={{
                        display: 'inline-flex', alignItems: 'center', gap: '4px',
                      }}>
                        <XCircle size={11} /> Pending
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Info box */}
      <div className="alert alert-info" style={{ marginTop: '20px' }}>
        <Info size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
        <span>
          If you have a valid reason for an absence and have not yet submitted
          a note, please ask your parent or guardian to submit one through the
          Parent Portal or deliver it to the admin office.
        </span>
      </div>
    </div>
  )
}