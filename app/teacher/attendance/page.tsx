import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import AttendanceRegister from '@/components/portal/AttendanceRegister'
import {
  CalendarDays, Info, CheckCircle2, Clock
} from 'lucide-react'

// ── DATA ──────────────────────────────────────────────────
async function getAttendanceData(userId: string) {
  const supabase = await createServerSupabaseClient()

  const { data: staff } = await supabase
    .from('staff')
    .select('id, full_name, subjects')
    .eq('user_id', userId)
    .single()

  if (!staff) return null

  // Get unique classes this teacher teaches
  const { data: slots } = await supabase
    .from('timetable')
    .select('grade, class_group')
    .eq('teacher_id', staff.id)

  const uniqueClasses = slots
    ? [...new Map(
        slots.map(s => [`${s.grade}-${s.class_group}`, s])
      ).values()]
    : []

  // Default to first class
  const selectedClass = uniqueClasses[0]

  if (!selectedClass) return { staff, classes: [], learners: [], existingRecords: {} }

  // Get learners for selected class
  const { data: learners } = await supabase
    .from('learners')
    .select('id, full_name, student_no')
    .eq('grade', selectedClass.grade)
    .eq('class_group', selectedClass.class_group)
    .order('full_name', { ascending: true })

  // Get today's existing attendance for this teacher
  const todayDate = new Date().toISOString().split('T')[0]

  const { data: existing } = await supabase
    .from('attendance')
    .select('learner_id, status')
    .eq('teacher_id', staff.id)
    .eq('date', todayDate)

  const existingRecords: Record<string, 'present' | 'absent' | 'late'> = {}
  existing?.forEach(r => {
    existingRecords[r.learner_id] = r.status as 'present' | 'absent' | 'late'
  })

  // Attendance history — last 5 days
  const fiveDaysAgo = new Date()
  fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5)

  const { data: history } = await supabase
    .from('attendance')
    .select('date, status, learner_id')
    .eq('teacher_id', staff.id)
    .gte('date', fiveDaysAgo.toISOString().split('T')[0])
    .order('date', { ascending: false })

  return {
    staff,
    classes: uniqueClasses,
    selectedClass,
    learners: learners ?? [],
    existingRecords,
    history: history ?? [],
    todayDate,
  }
}

// ── UTILS ─────────────────────────────────────────────────
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-ZA', {
    weekday: 'long', day: 'numeric', month: 'long',
  })
}

function formatDateShort(iso: string) {
  return new Date(iso).toLocaleDateString('en-ZA', {
    weekday: 'short', day: 'numeric', month: 'short',
  })
}

// ── PAGE ──────────────────────────────────────────────────
export default async function AttendancePage() {
  const supabase = await createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const data = await getAttendanceData(session.user.id)
  if (!data) redirect('/login')

  const { staff, classes, selectedClass, learners, existingRecords, history, todayDate } = data

  const alreadySubmitted = Object.keys(existingRecords).length > 0

  // Group history by date
  const historyByDate: Record<string, typeof history> = {}
  history.forEach(r => {
    if (!historyByDate[r.date]) historyByDate[r.date] = []
    historyByDate[r.date].push(r)
  })

  return (
    <div className="fade-in">

      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 className="page-title">Attendance Register</h1>
        <p className="page-subtitle">
          {formatDate(todayDate)} · {staff.full_name}
        </p>
      </div>

      {/* Already submitted banner */}
      {alreadySubmitted && (
        <div className="alert alert-success" style={{ marginBottom: '20px' }}>
          <CheckCircle2 size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
          <span>
            <strong>Attendance already submitted for today.</strong>{' '}
            You can update individual records below if needed.
          </span>
        </div>
      )}

      {/* Class selector */}
      {classes.length > 1 && (
        <div className="card" style={{ padding: '16px 20px', marginBottom: '20px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            flexWrap: 'wrap',
          }}>
            <span style={{
              fontSize: '13px', fontWeight: 500, color: 'var(--navy)',
            }}>
              Select class:
            </span>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {classes.map((cls: any, i: number) => (
                <button
                  key={i}
                  className={i === 0 ? 'btn btn-primary btn-sm' : 'btn btn-outline btn-sm'}
                  style={{ fontSize: '12.5px' }}
                >
                  {cls.grade} {cls.class_group}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Register heading */}
      {selectedClass && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          marginBottom: '16px',
          padding: '14px 18px',
          background: 'var(--navy)',
          borderRadius: '12px',
        }}>
          <CalendarDays size={18} color="rgba(255,255,255,0.7)" />
          <div>
            <div style={{ color: '#fff', fontWeight: 600, fontSize: '14px' }}>
              {selectedClass.grade} {selectedClass.class_group} — Daily attendance
            </div>
            <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '12px' }}>
              {formatDate(todayDate)} · {learners.length} learners
            </div>
          </div>
        </div>
      )}

      {/* No learners state */}
      {learners.length === 0 ? (
        <div className="card" style={{
          padding: '48px', textAlign: 'center', color: 'var(--gray-mid)',
        }}>
          <CalendarDays size={40} color="var(--gray-mid)"
            style={{ margin: '0 auto 12px' }} />
          <div style={{
            fontSize: '15px', fontWeight: 500,
            color: 'var(--navy)', marginBottom: '6px',
          }}>
            No learners found
          </div>
          <div style={{ fontSize: '13.5px' }}>
            No learners are enrolled in this class yet.
            Contact the admin office to resolve this.
          </div>
        </div>
      ) : (
        /* The interactive client component */
        <AttendanceRegister
          learners={learners}
          classGroup={selectedClass?.class_group ?? ''}
          grade={selectedClass?.grade ?? ''}
          date={todayDate}
          teacherId={staff.id}
          existingRecords={existingRecords}
        />
      )}

      {/* Attendance history */}
      {Object.keys(historyByDate).length > 0 && (
        <div style={{ marginTop: '32px' }}>
          <div className="section-header" style={{ marginBottom: '14px' }}>
            <span className="section-title">Recent history</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {Object.entries(historyByDate)
              .sort(([a], [b]) => b.localeCompare(a))
              .map(([date, records]) => {
                const present = records.filter(r => r.status === 'present').length
                const absent  = records.filter(r => r.status === 'absent').length
                const late    = records.filter(r => r.status === 'late').length
                const total   = records.length
                const rate    = total > 0 ? Math.round((present + late) / total * 100) : 0

                return (
                  <div
                    key={date}
                    className="card"
                    style={{
                      padding: '14px 18px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      flexWrap: 'wrap',
                    }}
                  >
                    <div style={{ minWidth: '130px' }}>
                      <div style={{
                        fontSize: '13px', fontWeight: 600, color: 'var(--navy)',
                      }}>
                        {formatDateShort(date)}
                      </div>
                      <div style={{ fontSize: '11.5px', color: 'var(--gray-mid)' }}>
                        {total} records
                      </div>
                    </div>

                    <div style={{
                      flex: 1, display: 'flex', gap: '12px',
                      flexWrap: 'wrap',
                    }}>
                      <span style={{
                        display: 'flex', alignItems: 'center', gap: '5px',
                        fontSize: '12.5px', color: 'var(--success)',
                      }}>
                        <CheckCircle2 size={13} /> {present} present
                      </span>
                      <span style={{
                        display: 'flex', alignItems: 'center', gap: '5px',
                        fontSize: '12.5px', color: 'var(--danger)',
                      }}>
                        <CheckCircle2 size={13} /> {absent} absent
                      </span>
                      {late > 0 && (
                        <span style={{
                          display: 'flex', alignItems: 'center', gap: '5px',
                          fontSize: '12.5px', color: 'var(--warning)',
                        }}>
                          <Clock size={13} /> {late} late
                        </span>
                      )}
                    </div>

                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '8px',
                    }}>
                      <div style={{
                        width: '80px', height: '6px',
                        background: 'var(--gray-light)',
                        borderRadius: '99px', overflow: 'hidden',
                      }}>
                        <div style={{
                          width: `${rate}%`, height: '100%',
                          background: rate >= 90
                            ? 'var(--success)'
                            : rate >= 75
                            ? 'var(--warning)'
                            : 'var(--danger)',
                          borderRadius: '99px',
                        }} />
                      </div>
                      <span style={{
                        fontSize: '12px', fontWeight: 600,
                        color: rate >= 90
                          ? 'var(--success)'
                          : rate >= 75
                          ? 'var(--warning)'
                          : 'var(--danger)',
                      }}>
                        {rate}%
                      </span>
                    </div>
                  </div>
                )
              })}
          </div>
        </div>
      )}

      {/* Info */}
      <div className="alert alert-info" style={{ marginTop: '24px' }}>
        <Info size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
        <span>
          Attendance must be submitted within 15 minutes of the period
          starting. Parents are automatically notified when their child
          is marked absent. If you need to correct a previous entry,
          contact the admin office.
        </span>
      </div>
    </div>
  )
}