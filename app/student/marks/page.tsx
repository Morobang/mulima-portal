import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { AlertTriangle, BarChart3 } from 'lucide-react'

// ── DATA ──────────────────────────────────────────────────
async function getMarksData(userId: string) {
  const supabase = await createServerSupabaseClient()

  const { data: learner } = await supabase
    .from('learners')
    .select('id, full_name, grade, class_group')
    .eq('user_id', userId)
    .maybeSingle()

  if (!learner) return null

  const { data: marks } = await supabase
    .from('marks')
    .select(`
      score, submitted_at,
      assessments (
        id, name, type, max_score, date, term,
        subjects ( name, code )
      )
    `)
    .eq('learner_id', learner.id)
    .order('submitted_at', { ascending: false })

  return { learner, marks: marks ?? [] }
}

// ── UTILS ─────────────────────────────────────────────────
function pct(score: number, max: number) {
  return Math.round((score / max) * 100)
}

function getSymbol(p: number) {
  if (p >= 80) return { label: 'A', color: 'var(--success)',  bg: 'var(--success-bg)' }
  if (p >= 70) return { label: 'B', color: 'var(--blue)',     bg: 'var(--info-bg)' }
  if (p >= 60) return { label: 'C', color: 'var(--blue)',     bg: 'var(--info-bg)' }
  if (p >= 50) return { label: 'D', color: 'var(--warning)',  bg: 'var(--warning-bg)' }
  if (p >= 40) return { label: 'E', color: 'var(--warning)',  bg: 'var(--warning-bg)' }
  return            { label: 'F', color: 'var(--danger)',   bg: 'var(--danger-bg)' }
}

function getBarColor(p: number) {
  if (p >= 70) return 'var(--success)'
  if (p >= 50) return 'var(--blue)'
  if (p >= 40) return 'var(--warning)'
  return 'var(--danger)'
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-ZA', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

function typeLabel(type: string) {
  const map: Record<string, string> = {
    test:       'Test',
    exam:       'Exam',
    practical:  'Practical',
    assignment: 'Assignment',
    project:    'Project',
  }
  return map[type] ?? type
}

function groupBySubject(marks: any[]) {
  const map: Record<string, { subjectName: string; assessments: any[] }> = {}

  marks.forEach(m => {
    const subjectName = m.assessments?.subjects?.name ?? 'Unknown'
    const code = m.assessments?.subjects?.code ?? subjectName

    if (!map[code]) {
      map[code] = { subjectName, assessments: [] }
    }
    map[code].assessments.push(m)
  })

  return Object.entries(map).map(([code, val]) => {
    const total = val.assessments.reduce((sum, m) => {
      return sum + pct(m.score, m.assessments.max_score)
    }, 0)
    const avg = Math.round(total / val.assessments.length)
    return { code, ...val, avg }
  }).sort((a, b) => b.avg - a.avg)
}

// ── PAGE ──────────────────────────────────────────────────
export default async function MarksPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const data = await getMarksData(user.id)
  if (!data) {
    return (
      <div style={{ padding: '48px', textAlign: 'center' }}>
        <AlertTriangle size={28} strokeWidth={1.5} style={{ color: 'var(--warning)', marginBottom: '12px' }} />
        <h2 style={{ color: 'var(--navy)', marginBottom: '8px' }}>Learner profile not found</h2>
        <p style={{ color: 'var(--gray-mid)', marginBottom: '4px' }}>
          Your student record has not been linked to this account yet.
        </p>
        <p style={{ color: 'var(--gray-mid)', fontSize: '13.5px' }}>
          Please contact the school office to resolve this.
          <br />Admin: mafela@telkomsa.net · 015 975 1089
        </p>
      </div>
    )
  }

  const { learner, marks } = data
  const subjects = groupBySubject(marks)

  const overallAvg = subjects.length
    ? Math.round(subjects.reduce((s, sub) => s + sub.avg, 0) / subjects.length)
    : 0

  const passing    = subjects.filter(s => s.avg >= 40).length
  const atRisk     = subjects.filter(s => s.avg < 40 && s.avg > 0).length
  const overallSym = getSymbol(overallAvg)

  return (
    <div className="fade-in">

      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 className="page-title">Marks &amp; Reports</h1>
        <p className="page-subtitle">
          {learner.grade} {learner.class_group} · Term 2, 2026
        </p>
      </div>

      {/* Alerts */}
      {atRisk > 0 && (
        <div className="alert alert-danger" style={{ marginBottom: '20px' }}>
          <AlertTriangle size={15} strokeWidth={2} style={{ flexShrink: 0 }} />
          <span>
            <strong>{atRisk} subject{atRisk > 1 ? 's' : ''} below pass mark.</strong>{' '}
            Please speak to the relevant educator immediately for support.
          </span>
        </div>
      )}

      {/* Summary stat cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: '14px',
        marginBottom: '28px',
      }}>
        <div className="stat-card stat-card-blue">
          <div className="stat-label">Overall average</div>
          <div className="stat-value" style={{ color: overallSym.color }}>
            {overallAvg > 0 ? `${overallAvg}%` : '—'}
          </div>
          <div className="stat-sub">Symbol: {overallSym.label}</div>
        </div>
        <div className="stat-card stat-card-navy">
          <div className="stat-label">Subjects</div>
          <div className="stat-value">{subjects.length}</div>
          <div className="stat-sub">Enrolled this term</div>
        </div>
        <div className="stat-card stat-card-green">
          <div className="stat-label">Passing</div>
          <div className="stat-value">{passing}</div>
          <div className="stat-sub">40% and above</div>
        </div>
        <div className={`stat-card ${atRisk > 0 ? 'stat-card-red' : 'stat-card-green'}`}>
          <div className="stat-label">At risk</div>
          <div className="stat-value">{atRisk}</div>
          <div className="stat-sub">Below 40%</div>
        </div>
        <div className="stat-card stat-card-amber">
          <div className="stat-label">Assessments</div>
          <div className="stat-value">{marks.length}</div>
          <div className="stat-sub">Recorded this term</div>
        </div>
      </div>

      {/* Subject overview — progress bars */}
      <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
        <div className="section-header" style={{ marginBottom: '20px' }}>
          <span className="section-title">Subject overview</span>
        </div>

        {subjects.length === 0 ? (
          <p style={{ color: 'var(--gray-mid)', fontSize: '14px' }}>
            No marks have been entered yet.
          </p>
        ) : (
          subjects.map(sub => {
            const sym = getSymbol(sub.avg)
            return (
              <div key={sub.code} className="progress-row">
                <div className="progress-label" style={{ fontWeight: 500, color: 'var(--navy)' }}>
                  {sub.subjectName.split(' ')[0]}
                </div>
                <div className="progress-track">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${sub.avg}%`,
                      background: getBarColor(sub.avg),
                    }}
                  />
                </div>
                <div className="progress-value">{sub.avg}%</div>
                <span className="badge" style={{
                  background: sym.bg,
                  color: sym.color,
                  marginLeft: '8px',
                  minWidth: '28px',
                  justifyContent: 'center',
                }}>
                  {sym.label}
                </span>
              </div>
            )
          })
        )}
      </div>

      {/* Per-subject assessment breakdown */}
      {subjects.map(sub => (
        <div key={sub.code} style={{ marginBottom: '20px' }}>

          {/* Subject heading */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '10px',
            padding: '10px 16px',
            background: 'var(--navy)',
            borderRadius: '10px',
          }}>
            <span style={{ color: '#fff', fontWeight: 600, fontSize: '14px' }}>
              {sub.subjectName}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}>
                Average: {sub.avg}%
              </span>
              <span className="badge" style={{
                background: getSymbol(sub.avg).bg,
                color: getSymbol(sub.avg).color,
              }}>
                {getSymbol(sub.avg).label}
              </span>
            </div>
          </div>

          {/* Assessments table */}
          <table className="data-table">
            <thead>
              <tr>
                <th>Assessment</th>
                <th>Type</th>
                <th>Date</th>
                <th>Score</th>
                <th>Percentage</th>
                <th>Symbol</th>
              </tr>
            </thead>
            <tbody>
              {sub.assessments.map((m: any, i: number) => {
                const p = pct(m.score, m.assessments.max_score)
                const sym = getSymbol(p)
                return (
                  <tr key={i}>
                    <td style={{ fontWeight: 500, color: 'var(--navy)' }}>
                      {m.assessments.name}
                    </td>
                    <td>
                      <span className="badge badge-gray">
                        {typeLabel(m.assessments.type)}
                      </span>
                    </td>
                    <td style={{ color: 'var(--gray-mid)', fontSize: '12.5px' }}>
                      {formatDate(m.assessments.date)}
                    </td>
                    <td style={{ fontWeight: 500 }}>
                      {m.score} / {m.assessments.max_score}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                          width: '60px', height: '5px',
                          background: 'var(--gray-light)',
                          borderRadius: '99px', overflow: 'hidden',
                        }}>
                          <div style={{
                            width: `${p}%`, height: '100%',
                            background: getBarColor(p),
                            borderRadius: '99px',
                          }} />
                        </div>
                        <span style={{ fontSize: '12.5px', fontWeight: 500 }}>{p}%</span>
                      </div>
                    </td>
                    <td>
                      <span className="badge" style={{
                        background: sym.bg,
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
        </div>
      ))}

      {/* Empty state */}
      {marks.length === 0 && (
        <div className="card" style={{
          padding: '48px', textAlign: 'center',
          color: 'var(--gray-mid)',
        }}>
          <div style={{
            display: 'flex', justifyContent: 'center', marginBottom: '12px',
            color: 'var(--gray-border)',
          }}>
            <BarChart3 size={40} strokeWidth={1.2} />
          </div>
          <div style={{ fontSize: '15px', fontWeight: 500, marginBottom: '6px', color: 'var(--navy)' }}>
            No marks yet
          </div>
          <div style={{ fontSize: '13.5px' }}>
            Your marks will appear here once your teachers enter them.
          </div>
        </div>
      )}

      {/* Download prompt */}
      {marks.length > 0 && (
        <div className="card" style={{
          padding: '16px 20px', marginTop: '8px',
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', flexWrap: 'wrap', gap: '12px',
        }}>
          <div>
            <div style={{ fontWeight: 500, color: 'var(--navy)', fontSize: '14px' }}>
              Formal report card
            </div>
            <div style={{ fontSize: '12.5px', color: 'var(--gray-mid)' }}>
              Term 2 reports will be published on 6 June 2026.
            </div>
          </div>
          <Link href="/student/report" className="btn btn-primary btn-sm">
            View report card
          </Link>
        </div>
      )}
    </div>
  )
}
