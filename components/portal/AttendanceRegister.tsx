'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import {
  CheckCircle2, XCircle, Clock, Save,
  Users, AlertTriangle, ChevronDown, Check
} from 'lucide-react'

type AttendanceStatus = 'present' | 'absent' | 'late'

interface Learner {
  id: string
  full_name: string
  student_no: string
}

interface AttendanceRegisterProps {
  learners: Learner[]
  classGroup: string
  grade: string
  date: string
  teacherId: string
  existingRecords: Record<string, AttendanceStatus>
}

export default function AttendanceRegister({
  learners,
  classGroup,
  grade,
  date,
  teacherId,
  existingRecords,
}: AttendanceRegisterProps) {
  const [statuses, setStatuses] = useState<Record<string, AttendanceStatus>>(
    () => {
      const initial: Record<string, AttendanceStatus> = {}
      learners.forEach(l => {
        initial[l.id] = existingRecords[l.id] ?? 'present'
      })
      return initial
    }
  )
  const [reasons, setReasons]   = useState<Record<string, string>>({})
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)
  const [error, setError]       = useState('')

  const presentCount = Object.values(statuses).filter(s => s === 'present').length
  const absentCount  = Object.values(statuses).filter(s => s === 'absent').length
  const lateCount    = Object.values(statuses).filter(s => s === 'late').length

  function setStatus(learnerId: string, status: AttendanceStatus) {
    setSaved(false)
    setStatuses(prev => ({ ...prev, [learnerId]: status }))
  }

  function setReason(learnerId: string, reason: string) {
    setReasons(prev => ({ ...prev, [learnerId]: reason }))
  }

  function markAllPresent() {
    setSaved(false)
    const all: Record<string, AttendanceStatus> = {}
    learners.forEach(l => { all[l.id] = 'present' })
    setStatuses(all)
  }

  async function handleSubmit() {
    setSaving(true)
    setError('')

    const supabase = createClient()

    const records = learners.map(l => ({
      learner_id:      l.id,
      teacher_id:      teacherId,
      date,
      period:          1,
      status:          statuses[l.id],
      reason:          reasons[l.id] ?? null,
      note_submitted:  false,
    }))

    // Upsert — update if already exists, insert if not
    const { error: upsertError } = await supabase
      .from('attendance')
      .upsert(records, {
        onConflict: 'learner_id,date,period',
      })

    if (upsertError) {
      setError('Failed to save attendance. Please try again.')
      setSaving(false)
      return
    }

    setSaved(true)
    setSaving(false)
  }

  const statusConfig = {
    present: {
      label: 'Present',
      color: 'var(--success)',
      bg:    'var(--success-bg)',
      border:'#6ee7b7',
      icon:  CheckCircle2,
    },
    absent: {
      label: 'Absent',
      color: 'var(--danger)',
      bg:    'var(--danger-bg)',
      border:'#fca5a5',
      icon:  XCircle,
    },
    late: {
      label: 'Late',
      color: 'var(--warning)',
      bg:    'var(--warning-bg)',
      border:'#fcd34d',
      icon:  Clock,
    },
  }

  return (
    <div>
      {/* Summary bar */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
        gap: '12px',
        marginBottom: '20px',
      }}>
        <div className="stat-card stat-card-navy">
          <div className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Users size={12} /> Total
          </div>
          <div className="stat-value">{learners.length}</div>
          <div className="stat-sub">Learners</div>
        </div>
        <div className="stat-card stat-card-green">
          <div className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <CheckCircle2 size={12} /> Present
          </div>
          <div className="stat-value">{presentCount}</div>
          <div className="stat-sub">
            {Math.round((presentCount / learners.length) * 100)}%
          </div>
        </div>
        <div className="stat-card stat-card-red">
          <div className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <XCircle size={12} /> Absent
          </div>
          <div className="stat-value">{absentCount}</div>
          <div className="stat-sub">
            {Math.round((absentCount / learners.length) * 100)}%
          </div>
        </div>
        <div className="stat-card stat-card-amber">
          <div className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Clock size={12} /> Late
          </div>
          <div className="stat-value">{lateCount}</div>
          <div className="stat-sub">
            {Math.round((lateCount / learners.length) * 100)}%
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '14px',
        flexWrap: 'wrap',
        gap: '10px',
      }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={markAllPresent}
            className="btn btn-outline btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <CheckCircle2 size={13} color="var(--success)" />
            Mark all present
          </button>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {saved && (
            <span style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              fontSize: '13px', color: 'var(--success)', fontWeight: 500,
            }}>
              <Check size={14} /> Saved successfully
            </span>
          )}
          {error && (
            <span style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              fontSize: '13px', color: 'var(--danger)',
            }}>
              <AlertTriangle size={14} /> {error}
            </span>
          )}
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="btn btn-primary btn-sm"
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? (
              <>
                <div style={{
                  width: '13px', height: '13px',
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTopColor: '#fff',
                  borderRadius: '50%',
                  animation: 'spin 0.7s linear infinite',
                }} />
                Saving...
              </>
            ) : (
              <>
                <Save size={13} />
                Submit attendance
              </>
            )}
          </button>
        </div>
      </div>

      {/* Learner list */}
      <div className="card" style={{ overflow: 'hidden' }}>
        {learners.map((learner, index) => {
          const status = statuses[learner.id]
          const cfg    = statusConfig[status]
          const Icon   = cfg.icon
          const showReason = status === 'absent' || status === 'late'

          return (
            <div
              key={learner.id}
              style={{
                padding: '14px 18px',
                borderBottom: index < learners.length - 1
                  ? '1px solid var(--gray-border)' : 'none',
                background: status === 'absent'
                  ? 'rgba(185,28,28,0.02)'
                  : status === 'late'
                  ? 'rgba(201,146,14,0.02)'
                  : '#fff',
                transition: 'background 0.1s',
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                flexWrap: 'wrap',
              }}>
                {/* Number */}
                <div style={{
                  width: '28px', height: '28px',
                  borderRadius: '50%',
                  background: 'var(--gray-light)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '12px', fontWeight: 600, color: 'var(--gray-mid)',
                  flexShrink: 0,
                }}>
                  {index + 1}
                </div>

                {/* Name + student no */}
                <div style={{ flex: 1, minWidth: '140px' }}>
                  <div style={{
                    fontSize: '13.5px', fontWeight: 600, color: 'var(--navy)',
                    marginBottom: '2px',
                  }}>
                    {learner.full_name}
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--gray-mid)' }}>
                    {learner.student_no}
                  </div>
                </div>

                {/* Status buttons */}
                <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                  {(['present', 'absent', 'late'] as AttendanceStatus[]).map(s => {
                    const c   = statusConfig[s]
                    const Ic  = c.icon
                    const sel = status === s
                    return (
                      <button
                        key={s}
                        onClick={() => setStatus(learner.id, s)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '5px',
                          padding: '6px 12px',
                          borderRadius: '8px',
                          border: sel ? `1.5px solid ${c.border}` : '1.5px solid var(--gray-border)',
                          background: sel ? c.bg : '#fff',
                          color: sel ? c.color : 'var(--gray-mid)',
                          fontSize: '12px', fontWeight: sel ? 600 : 400,
                          cursor: 'pointer',
                          transition: 'all 0.12s',
                        }}
                      >
                        <Ic size={13} />
                        {c.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Reason input for absent/late */}
              {showReason && (
                <div style={{ marginTop: '10px', paddingLeft: '42px' }}>
                  <input
                    type="text"
                    className="input"
                    placeholder={
                      status === 'absent'
                        ? 'Reason for absence (optional)...'
                        : 'Reason for late arrival (optional)...'
                    }
                    value={reasons[learner.id] ?? ''}
                    onChange={e => setReason(learner.id, e.target.value)}
                    style={{ fontSize: '12.5px', padding: '7px 12px' }}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Bottom submit */}
      <div style={{
        display: 'flex', justifyContent: 'flex-end',
        marginTop: '16px', gap: '10px', alignItems: 'center',
      }}>
        {saved && (
          <span style={{
            display: 'flex', alignItems: 'center', gap: '5px',
            fontSize: '13px', color: 'var(--success)', fontWeight: 500,
          }}>
            <Check size={14} /> Saved successfully
          </span>
        )}
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="btn btn-primary"
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? 'Saving...' : (
            <>
              <Save size={14} />
              Submit attendance for {grade} {classGroup}
            </>
          )}
        </button>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}