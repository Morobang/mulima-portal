import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { CalendarDays, Clock, MapPin, User, BookOpen, Info } from 'lucide-react'

// ── DATA ──────────────────────────────────────────────────
async function getTimetableData(userId: string) {
  const supabase = await createServerSupabaseClient()

  const { data: learner } = await supabase
    .from('learners')
    .select('id, full_name, grade, class_group')
    .eq('user_id', userId)
    .single()

  if (!learner) return null

  const { data: slots } = await supabase
    .from('timetable')
    .select(`
      id, day, period, room, start_time, end_time,
      subjects ( name, code ),
      staff ( full_name )
    `)
    .eq('grade', learner.grade)
    .eq('class_group', learner.class_group)
    .order('period', { ascending: true })

  return { learner, slots: slots ?? [] }
}

// ── CONSTANTS ─────────────────────────────────────────────
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

const PERIODS = [
  { period: 1, label: 'Period 1', start: '07:30', end: '08:20' },
  { period: 2, label: 'Period 2', start: '08:20', end: '09:10' },
  { period: 3, label: 'Break',    start: '09:10', end: '09:30', isBreak: true },
  { period: 4, label: 'Period 3', start: '09:30', end: '10:20' },
  { period: 5, label: 'Period 4', start: '10:20', end: '11:10' },
  { period: 6, label: 'Period 5', start: '11:10', end: '12:00' },
  { period: 7, label: 'Lunch',    start: '12:00', end: '12:45', isBreak: true },
  { period: 8, label: 'Period 6', start: '12:45', end: '13:35' },
]

// Colour per subject — cycles through palette
const SUBJECT_COLOURS = [
  { bg: '#DBEAFE', text: '#1e3a5f', border: '#93c5fd' }, // blue
  { bg: '#D1FAE5', text: '#065f46', border: '#6ee7b7' }, // green
  { bg: '#FEF3C7', text: '#78350f', border: '#fcd34d' }, // amber
  { bg: '#FEE2E2', text: '#7f1d1d', border: '#fca5a5' }, // red
  { bg: '#EDE9FE', text: '#4c1d95', border: '#c4b5fd' }, // purple
  { bg: '#FFEDD5', text: '#7c2d12', border: '#fdba74' }, // orange
  { bg: '#CFFAFE', text: '#164e63', border: '#67e8f9' }, // cyan
  { bg: '#FCE7F3', text: '#831843', border: '#f9a8d4' }, // pink
]

function getSubjectColour(subjectName: string) {
  // Deterministic colour based on subject name
  let hash = 0
  for (let i = 0; i < subjectName.length; i++) {
    hash = subjectName.charCodeAt(i) + ((hash << 5) - hash)
  }
  return SUBJECT_COLOURS[Math.abs(hash) % SUBJECT_COLOURS.length]
}

function getTodayName() {
  return new Date().toLocaleDateString('en-ZA', { weekday: 'long' })
}

// ── PAGE ──────────────────────────────────────────────────
export default async function TimetablePage() {
  const supabase = await createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const data = await getTimetableData(session.user.id)
  if (!data) redirect('/login')

  const { learner, slots } = data
  const today = getTodayName()

  // Build lookup: day → period → slot
  const lookup: Record<string, Record<number, any>> = {}
  DAYS.forEach(d => { lookup[d] = {} })
  slots.forEach(s => {
    if (lookup[s.day]) lookup[s.day][s.period] = s
  })

  // Build today's list separately
  const todaySlots = slots
    .filter(s => s.day === today)
    .sort((a, b) => a.period - b.period)

  return (
    <div className="fade-in">

      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 className="page-title">My Timetable</h1>
        <p className="page-subtitle">
          {learner.grade} {learner.class_group} · Term 2, 2025
        </p>
      </div>

      {/* Today's summary strip */}
      <div className="card" style={{ padding: '20px', marginBottom: '24px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          marginBottom: '16px',
        }}>
          <CalendarDays size={16} color="var(--blue)" />
          <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--navy)' }}>
            Today — {today}
          </span>
          {!DAYS.includes(today) && (
            <span className="badge badge-gray" style={{ marginLeft: '4px' }}>
              Weekend
            </span>
          )}
        </div>

        {!DAYS.includes(today) ? (
          <p style={{ color: 'var(--gray-mid)', fontSize: '13.5px' }}>
            No classes today. Enjoy your weekend! 🎉
          </p>
        ) : todaySlots.length === 0 ? (
          <p style={{ color: 'var(--gray-mid)', fontSize: '13.5px' }}>
            No classes found for today.
          </p>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: '10px',
          }}>
            {todaySlots.map((slot: any) => {
              const subjectName = slot.subjects?.name ?? 'Unknown'
              const col = getSubjectColour(subjectName)
              return (
                <div
                  key={slot.id}
                  style={{
                    background: col.bg,
                    border: `1px solid ${col.border}`,
                    borderRadius: '10px',
                    padding: '12px 14px',
                  }}
                >
                  <div style={{
                    fontSize: '12px', fontWeight: 600,
                    color: col.text, marginBottom: '6px',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {subjectName}
                  </div>
                  <div style={{
                    display: 'flex', flexDirection: 'column', gap: '3px',
                  }}>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '5px',
                      fontSize: '11.5px', color: col.text, opacity: 0.8,
                    }}>
                      <Clock size={11} />
                      {slot.start_time} – {slot.end_time}
                    </div>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '5px',
                      fontSize: '11.5px', color: col.text, opacity: 0.8,
                    }}>
                      <MapPin size={11} />
                      Room {slot.room}
                    </div>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '5px',
                      fontSize: '11.5px', color: col.text, opacity: 0.8,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      <User size={11} />
                      {slot.staff?.full_name ?? '—'}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Full weekly grid — desktop */}
      <div className="card" style={{ padding: '20px', marginBottom: '20px', overflowX: 'auto' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          marginBottom: '16px',
        }}>
          <BookOpen size={16} color="var(--blue)" />
          <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--navy)' }}>
            Full weekly timetable
          </span>
        </div>

        <div style={{ minWidth: '640px' }}>
          {/* Grid header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '90px repeat(5, 1fr)',
            gap: '4px',
            marginBottom: '4px',
          }}>
            <div />
            {DAYS.map(day => (
              <div
                key={day}
                style={{
                  background: day === today ? 'var(--blue)' : 'var(--navy)',
                  color: '#fff',
                  borderRadius: '8px',
                  padding: '8px 6px',
                  textAlign: 'center',
                  fontSize: '12px',
                  fontWeight: 600,
                }}
              >
                {day.slice(0, 3)}
                {day === today && (
                  <div style={{ fontSize: '9px', opacity: 0.8, marginTop: '2px' }}>
                    Today
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Rows */}
          {PERIODS.map(row => (
            <div
              key={row.period}
              style={{
                display: 'grid',
                gridTemplateColumns: '90px repeat(5, 1fr)',
                gap: '4px',
                marginBottom: '4px',
              }}
            >
              {/* Time label */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                padding: '4px 8px',
                background: 'var(--gray-light)',
                borderRadius: '7px',
              }}>
                <div style={{
                  fontSize: '10px', fontWeight: 600,
                  color: 'var(--gray-mid)', marginBottom: '2px',
                }}>
                  {row.label}
                </div>
                <div style={{ fontSize: '9.5px', color: 'var(--gray-mid)' }}>
                  {row.start}–{row.end}
                </div>
              </div>

              {/* Break row */}
              {row.isBreak ? (
                DAYS.map(day => (
                  <div
                    key={day}
                    style={{
                      background: 'var(--gray-light)',
                      borderRadius: '7px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '10px',
                      color: 'var(--gray-mid)',
                      fontStyle: 'italic',
                      padding: '6px',
                    }}
                  >
                    {row.label}
                  </div>
                ))
              ) : (
                // Subject cells — period numbers in timetable skip break rows
                // Map display period row to actual db period number
                DAYS.map(day => {
                  // Actual db period: rows 1,2 = p1,p2 | rows 4,5,6,8 = p3,p4,p5,p6
                  const dbPeriod = row.period <= 2 ? row.period
                    : row.period <= 6 ? row.period - 1
                    : row.period - 2

                  const slot = lookup[day]?.[dbPeriod]
                  const subjectName = slot?.subjects?.name ?? null
                  const col = subjectName ? getSubjectColour(subjectName) : null

                  return (
                    <div
                      key={day}
                      style={{
                        background: col ? col.bg : 'transparent',
                        border: col ? `1px solid ${col.border}` : '1px solid var(--gray-border)',
                        borderRadius: '7px',
                        padding: '6px 8px',
                        minHeight: '52px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                      }}
                    >
                      {slot ? (
                        <>
                          <div style={{
                            fontSize: '11px', fontWeight: 600,
                            color: col!.text, lineHeight: 1.3,
                            marginBottom: '3px',
                          }}>
                            {subjectName?.split(' ')[0]}
                          </div>
                          <div style={{
                            fontSize: '10px', color: col!.text,
                            opacity: 0.75, lineHeight: 1.3,
                          }}>
                            {slot.room}
                          </div>
                        </>
                      ) : (
                        <div style={{
                          fontSize: '10px',
                          color: 'var(--gray-mid)',
                          textAlign: 'center',
                        }}>
                          —
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Subject colour key */}
      {slots.length > 0 && (
        <div className="card" style={{ padding: '16px 20px', marginBottom: '20px' }}>
          <div style={{
            fontSize: '12px', fontWeight: 600, color: 'var(--navy)',
            marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px',
          }}>
            <BookOpen size={13} color="var(--blue)" />
            Subject key
          </div>
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: '8px',
          }}>
            {[...new Map(slots.map(s => [
              s.subjects?.name,
              { name: s.subjects?.name ?? '—', teacher: s.staff?.full_name ?? '—' }
            ])).values()].map(subject => {
              const col = getSubjectColour(subject.name)
              return (
                <div
                  key={subject.name}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    background: col.bg,
                    border: `1px solid ${col.border}`,
                    borderRadius: '8px',
                    padding: '6px 12px',
                  }}
                >
                  <div style={{
                    width: '8px', height: '8px',
                    borderRadius: '50%',
                    background: col.text,
                    opacity: 0.7,
                    flexShrink: 0,
                  }} />
                  <div>
                    <div style={{
                      fontSize: '12px', fontWeight: 600, color: col.text,
                    }}>
                      {subject.name}
                    </div>
                    <div style={{
                      fontSize: '10.5px', color: col.text, opacity: 0.75,
                    }}>
                      {subject.teacher}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {slots.length === 0 && (
        <div className="card" style={{
          padding: '48px', textAlign: 'center', color: 'var(--gray-mid)',
        }}>
          <CalendarDays
            size={40}
            color="var(--gray-mid)"
            style={{ margin: '0 auto 12px' }}
          />
          <div style={{ fontSize: '15px', fontWeight: 500, marginBottom: '6px' }}>
            No timetable found
          </div>
          <div style={{ fontSize: '13.5px' }}>
            Your timetable will appear here once it has been set up by the school.
          </div>
        </div>
      )}

      {/* Info note */}
      <div className="alert alert-info" style={{ marginTop: '8px' }}>
        <Info size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
        <span>
          Timetable changes are managed by the school administration.
          If you notice an error, please report it to your class teacher
          or the admin office.
        </span>
      </div>
    </div>
  )
}