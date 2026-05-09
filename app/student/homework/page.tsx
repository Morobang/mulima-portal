import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import {
  BookOpen, CheckCircle2, Clock, AlertTriangle,
  Calendar, ChevronRight, Info, Inbox
} from 'lucide-react'

// ── DATA ──────────────────────────────────────────────────
async function getHomeworkData(userId: string) {
  const supabase = await createServerSupabaseClient()

  const { data: learner } = await supabase
    .from('learners')
    .select('id, full_name, grade, class_group')
    .eq('user_id', userId)
    .single()

  if (!learner) return null

  // All homework for this learner's grade and class
  const { data: homework } = await supabase
    .from('homework')
    .select(`
      id, description, due_date, created_at,
      subjects ( name, code ),
      staff ( full_name )
    `)
    .eq('grade', learner.grade)
    .eq('class_group', learner.class_group)
    .order('due_date', { ascending: true })

  // Submission status for each homework item
  const { data: submissions } = await supabase
    .from('homework_submissions')
    .select('homework_id, status, mark, submitted_at')
    .eq('learner_id', learner.id)

  return { learner, homework: homework ?? [], submissions: submissions ?? [] }
}

// ── UTILS ─────────────────────────────────────────────────
function getDaysUntilDue(dueDate: string) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(dueDate)
  due.setHours(0, 0, 0, 0)
  return Math.round((due.getTime() - today.getTime()) / 86400000)
}

function getDueBadge(dueDate: string) {
  const diff = getDaysUntilDue(dueDate)
  if (diff < 0)  return { label: 'Overdue',         color: 'var(--danger)',  bg: 'var(--danger-bg)',  icon: 'overdue' }
  if (diff === 0) return { label: 'Due today',       color: 'var(--danger)',  bg: 'var(--danger-bg)',  icon: 'today' }
  if (diff === 1) return { label: 'Due tomorrow',    color: 'var(--warning)', bg: 'var(--warning-bg)', icon: 'soon' }
  if (diff <= 3)  return { label: `Due in ${diff}d`, color: 'var(--warning)', bg: 'var(--warning-bg)', icon: 'soon' }
  return {
    label: new Date(dueDate).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' }),
    color: 'var(--gray-mid)', bg: 'var(--gray-light)', icon: 'future',
  }
}

function getStatusDisplay(status: string | undefined) {
  switch (status) {
    case 'submitted':
      return { label: 'Submitted',   color: 'var(--success)', bg: 'var(--success-bg)' }
    case 'in_progress':
      return { label: 'In progress', color: 'var(--blue)',    bg: 'var(--info-bg)' }
    default:
      return { label: 'Not started', color: 'var(--gray-mid)', bg: 'var(--gray-light)' }
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-ZA', {
    weekday: 'short', day: 'numeric', month: 'long',
  })
}

const SUBJECT_COLOURS: Record<string, { bg: string; text: string; dot: string }> = {}
const PALETTE = [
  { bg: '#DBEAFE', text: '#1e3a5f', dot: '#3b82f6' },
  { bg: '#D1FAE5', text: '#065f46', dot: '#10b981' },
  { bg: '#FEF3C7', text: '#78350f', dot: '#f59e0b' },
  { bg: '#FEE2E2', text: '#7f1d1d', dot: '#ef4444' },
  { bg: '#EDE9FE', text: '#4c1d95', dot: '#8b5cf6' },
  { bg: '#FFEDD5', text: '#7c2d12', dot: '#f97316' },
  { bg: '#CFFAFE', text: '#164e63', dot: '#06b6d4' },
]

function subjectColor(name: string) {
  if (!SUBJECT_COLOURS[name]) {
    let hash = 0
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash)
    }
    SUBJECT_COLOURS[name] = PALETTE[Math.abs(hash) % PALETTE.length]
  }
  return SUBJECT_COLOURS[name]
}

// ── SUBCOMPONENTS ─────────────────────────────────────────
function HomeworkCard({
  hw,
  submission,
}: {
  hw: any
  submission: any
}) {
  const due = getDueBadge(hw.due_date)
  const status = getStatusDisplay(submission?.status)
  const isSubmitted = submission?.status === 'submitted'
  const isOverdue = getDaysUntilDue(hw.due_date) < 0 && !isSubmitted
  const subjectName = hw.subjects?.name ?? 'Unknown subject'
  const col = subjectColor(subjectName)

  return (
    <div
      className="card"
      style={{
        padding: '0',
        overflow: 'hidden',
        borderLeft: `4px solid ${col.dot}`,
        opacity: isSubmitted ? 0.75 : 1,
      }}
    >
      {/* Card header */}
      <div style={{
        padding: '14px 16px 10px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: '12px',
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Subject chip */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '5px',
            background: col.bg,
            borderRadius: '6px',
            padding: '3px 10px',
            marginBottom: '8px',
          }}>
            <BookOpen size={11} color={col.text} />
            <span style={{ fontSize: '11.5px', fontWeight: 600, color: col.text }}>
              {subjectName}
            </span>
          </div>

          {/* Description */}
          <p style={{
            fontSize: '13.5px', fontWeight: 500,
            color: isSubmitted ? 'var(--gray-mid)' : 'var(--navy)',
            lineHeight: 1.4,
            textDecoration: isSubmitted ? 'line-through' : 'none',
          }}>
            {hw.description}
          </p>
        </div>

        {/* Status badge */}
        <span className="badge" style={{
          background: status.bg,
          color: status.color,
          flexShrink: 0,
          fontSize: '11px',
        }}>
          {status.label}
        </span>
      </div>

      {/* Card footer */}
      <div style={{
        padding: '8px 16px 12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '8px',
        borderTop: '1px solid var(--gray-border)',
        background: isOverdue ? 'var(--danger-bg)' : 'var(--gray-light)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {/* Due date */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '5px',
            fontSize: '12px',
            color: isOverdue ? 'var(--danger)' : 'var(--gray-mid)',
            fontWeight: isOverdue ? 600 : 400,
          }}>
            {isOverdue
              ? <AlertTriangle size={13} color="var(--danger)" />
              : <Calendar size={13} />}
            {isOverdue ? 'Overdue — ' : ''}{formatDate(hw.due_date)}
          </div>

          {/* Teacher */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '5px',
            fontSize: '12px', color: 'var(--gray-mid)',
          }}>
            <Clock size={12} />
            {hw.staff?.full_name ?? '—'}
          </div>
        </div>

        {/* Mark if submitted */}
        {isSubmitted && submission?.mark != null && (
          <span className="badge badge-green" style={{ fontSize: '11px' }}>
            Mark: {submission.mark}
          </span>
        )}

        {/* Due badge */}
        {!isSubmitted && (
          <span className="badge" style={{
            background: due.bg,
            color: due.color,
            fontSize: '11px',
          }}>
            {due.label}
          </span>
        )}
      </div>
    </div>
  )
}

// ── PAGE ──────────────────────────────────────────────────
export default async function HomeworkPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const data = await getHomeworkData(session.user.id)
  if (!data) redirect('/login')

  const { learner, homework, submissions } = data

  // Map submissions by homework_id for quick lookup
  const subMap: Record<string, any> = {}
  submissions.forEach(s => { subMap[s.homework_id] = s })

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Split into buckets
  const overdue = homework.filter(hw => {
    const due = new Date(hw.due_date)
    due.setHours(0, 0, 0, 0)
    return due < today && subMap[hw.id]?.status !== 'submitted'
  })

  const pending = homework.filter(hw => {
    const due = new Date(hw.due_date)
    due.setHours(0, 0, 0, 0)
    return due >= today && subMap[hw.id]?.status !== 'submitted'
  })

  const completed = homework.filter(hw =>
    subMap[hw.id]?.status === 'submitted'
  )

  const totalPending = overdue.length + pending.length

  return (
    <div className="fade-in">

      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 className="page-title">Homework &amp; Assignments</h1>
        <p className="page-subtitle">
          {learner.grade} {learner.class_group} · Term 2, 2025
        </p>
      </div>

      {/* Stat cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: '14px',
        marginBottom: '28px',
      }}>
        <div className={`stat-card ${overdue.length > 0 ? 'stat-card-red' : 'stat-card-amber'}`}>
          <div className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <AlertTriangle size={12} /> Overdue
          </div>
          <div className="stat-value">{overdue.length}</div>
          <div className="stat-sub">
            {overdue.length === 0 ? 'All caught up!' : 'Needs attention'}
          </div>
        </div>

        <div className="stat-card stat-card-blue">
          <div className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Clock size={12} /> Pending
          </div>
          <div className="stat-value">{pending.length}</div>
          <div className="stat-sub">Upcoming tasks</div>
        </div>

        <div className="stat-card stat-card-green">
          <div className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <CheckCircle2 size={12} /> Completed
          </div>
          <div className="stat-value">{completed.length}</div>
          <div className="stat-sub">Submitted this term</div>
        </div>

        <div className="stat-card stat-card-navy">
          <div className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <BookOpen size={12} /> Total
          </div>
          <div className="stat-value">{homework.length}</div>
          <div className="stat-sub">Assigned this term</div>
        </div>
      </div>

      {/* Overdue alert */}
      {overdue.length > 0 && (
        <div className="alert alert-danger" style={{ marginBottom: '24px' }}>
          <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
          <span>
            <strong>{overdue.length} overdue assignment{overdue.length > 1 ? 's' : ''}.</strong>{' '}
            Please speak to the relevant teacher as soon as possible to
            discuss late submission.
          </span>
        </div>
      )}

      {/* ── OVERDUE ── */}
      {overdue.length > 0 && (
        <div style={{ marginBottom: '28px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            marginBottom: '12px',
          }}>
            <AlertTriangle size={15} color="var(--danger)" />
            <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--danger)' }}>
              Overdue ({overdue.length})
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {overdue.map(hw => (
              <HomeworkCard key={hw.id} hw={hw} submission={subMap[hw.id]} />
            ))}
          </div>
        </div>
      )}

      {/* ── PENDING ── */}
      {pending.length > 0 && (
        <div style={{ marginBottom: '28px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            marginBottom: '12px',
          }}>
            <Clock size={15} color="var(--blue)" />
            <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--navy)' }}>
              Upcoming ({pending.length})
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {pending.map(hw => (
              <HomeworkCard key={hw.id} hw={hw} submission={subMap[hw.id]} />
            ))}
          </div>
        </div>
      )}

      {/* ── COMPLETED ── */}
      {completed.length > 0 && (
        <div style={{ marginBottom: '28px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            marginBottom: '12px',
          }}>
            <CheckCircle2 size={15} color="var(--success)" />
            <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--navy)' }}>
              Completed ({completed.length})
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {completed.map(hw => (
              <HomeworkCard key={hw.id} hw={hw} submission={subMap[hw.id]} />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {homework.length === 0 && (
        <div className="card" style={{
          padding: '56px', textAlign: 'center', color: 'var(--gray-mid)',
        }}>
          <Inbox size={40} color="var(--gray-mid)" style={{ margin: '0 auto 12px' }} />
          <div style={{ fontSize: '15px', fontWeight: 500, marginBottom: '6px', color: 'var(--navy)' }}>
            No homework assigned yet
          </div>
          <div style={{ fontSize: '13.5px' }}>
            Homework set by your teachers will appear here.
          </div>
        </div>
      )}

      {/* All done state */}
      {homework.length > 0 && totalPending === 0 && (
        <div className="card" style={{
          padding: '32px', textAlign: 'center',
          background: 'var(--success-bg)',
          border: '1px solid #6ee7b7',
        }}>
          <CheckCircle2
            size={36}
            color="var(--success)"
            style={{ margin: '0 auto 10px' }}
          />
          <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--success)', marginBottom: '4px' }}>
            All caught up!
          </div>
          <div style={{ fontSize: '13.5px', color: 'var(--gray-mid)' }}>
            You have no overdue or pending homework. Well done!
          </div>
        </div>
      )}

      {/* Info note */}
      <div className="alert alert-info" style={{ marginTop: '20px' }}>
        <Info size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
        <span>
          Submission status is updated by your teacher once they mark
          your work as received. If your status has not updated after
          submission, check with the relevant educator.
        </span>
      </div>
    </div>
  )
}