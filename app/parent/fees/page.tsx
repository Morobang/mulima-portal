import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import {
  CreditCard, CheckCircle2, AlertTriangle,
  Clock, Download, Info, Receipt,
  TrendingUp, DollarSign, Calendar
} from 'lucide-react'

// ── DATA ──────────────────────────────────────────────────
async function getFeesData(userId: string) {
  const supabase = await createServerSupabaseClient()

  const { data: parent } = await supabase
    .from('parents')
    .select('id, full_name')
    .eq('user_id', userId)
    .single()

  if (!parent) return null

  const { data: links } = await supabase
    .from('parent_learner')
    .select('learner_id')
    .eq('parent_id', parent.id)

  if (!links || links.length === 0) return null

  const learnerId = links[0].learner_id

  const { data: learner } = await supabase
    .from('learners')
    .select('id, full_name, grade, class_group, student_no')
    .eq('id', learnerId)
    .single()

  if (!learner) return null

  const { data: fees } = await supabase
    .from('fees')
    .select('*')
    .eq('learner_id', learnerId)
    .order('due_date', { ascending: true })

  return { parent, learner, fees: fees ?? [] }
}

// ── UTILS ─────────────────────────────────────────────────
function formatCurrency(amount: number) {
  return `R ${amount.toLocaleString('en-ZA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-ZA', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

function formatDateShort(iso: string) {
  return new Date(iso).toLocaleDateString('en-ZA', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

function getDaysUntilDue(dueDate: string) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(dueDate)
  due.setHours(0, 0, 0, 0)
  return Math.round((due.getTime() - today.getTime()) / 86400000)
}

function getStatusInfo(fee: any) {
  if (fee.status === 'paid') {
    return {
      label: 'Paid',
      color: 'var(--success)',
      bg: 'var(--success-bg)',
      icon: 'check',
    }
  }
  const diff = getDaysUntilDue(fee.due_date)
  if (diff < 0) {
    return {
      label: 'Overdue',
      color: 'var(--danger)',
      bg: 'var(--danger-bg)',
      icon: 'overdue',
    }
  }
  if (fee.status === 'partial') {
    return {
      label: 'Partial',
      color: 'var(--warning)',
      bg: 'var(--warning-bg)',
      icon: 'partial',
    }
  }
  return {
    label: 'Unpaid',
    color: 'var(--danger)',
    bg: 'var(--danger-bg)',
    icon: 'unpaid',
  }
}

function getTermLabel(term: number) {
  return `Term ${term}`
}

// Group fees by term
function groupByTerm(fees: any[]) {
  const map: Record<number, any[]> = {}
  fees.forEach(f => {
    const t = f.term ?? 0
    if (!map[t]) map[t] = []
    map[t].push(f)
  })
  return Object.entries(map)
    .sort(([a], [b]) => Number(b) - Number(a))
    .map(([term, items]) => ({ term: Number(term), items }))
}

// ── PAGE ──────────────────────────────────────────────────
export default async function FeesPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const result = await getFeesData(session.user.id)
  if (!result) redirect('/login')

  const { parent, learner, fees } = result

  // Summary calculations
  const totalCharged  = fees.reduce((s, f) => s + f.amount, 0)
  const totalPaid     = fees.reduce((s, f) => s + f.paid, 0)
  const totalBalance  = totalCharged - totalPaid
  const overdueFees   = fees.filter(f => {
    const diff = getDaysUntilDue(f.due_date)
    return diff < 0 && f.status !== 'paid'
  })
  const paidFees      = fees.filter(f => f.status === 'paid')
  const pendingFees   = fees.filter(f => f.status !== 'paid')
  const collectionPct = totalCharged > 0
    ? Math.round((totalPaid / totalCharged) * 100)
    : 0

  const termGroups = groupByTerm(fees)

  return (
    <div className="fade-in">

      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 className="page-title">School Fees</h1>
        <p className="page-subtitle">
          {learner.full_name} · {learner.grade} {learner.class_group} ·
          Student No. {learner.student_no} · {new Date().getFullYear()}
        </p>
      </div>

      {/* Alerts */}
      {overdueFees.length > 0 && (
        <div className="alert alert-danger" style={{ marginBottom: '14px' }}>
          <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
          <span>
            <strong>{overdueFees.length} overdue fee item{overdueFees.length > 1 ? 's' : ''}.</strong>{' '}
            Outstanding fees may affect your child&apos;s access to school services.
            Please settle immediately or contact the admin office to arrange a payment plan.
          </span>
        </div>
      )}
      {totalBalance === 0 && fees.length > 0 && (
        <div className="alert alert-success" style={{ marginBottom: '14px' }}>
          <CheckCircle2 size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
          <span>
            <strong>All fees are paid up.</strong>{' '}
            Thank you for keeping your account up to date.
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
        <div className="stat-card stat-card-navy">
          <div className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Receipt size={12} /> Total charged
          </div>
          <div className="stat-value" style={{ fontSize: '18px' }}>
            {formatCurrency(totalCharged)}
          </div>
          <div className="stat-sub">This year</div>
        </div>

        <div className="stat-card stat-card-green">
          <div className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <CheckCircle2 size={12} /> Total paid
          </div>
          <div className="stat-value" style={{ fontSize: '18px' }}>
            {formatCurrency(totalPaid)}
          </div>
          <div className="stat-sub">{paidFees.length} item{paidFees.length !== 1 ? 's' : ''} settled</div>
        </div>

        <div className={`stat-card ${totalBalance > 0 ? 'stat-card-red' : 'stat-card-green'}`}>
          <div className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <DollarSign size={12} /> Outstanding
          </div>
          <div className="stat-value" style={{ fontSize: '18px' }}>
            {totalBalance > 0 ? formatCurrency(totalBalance) : 'R 0.00'}
          </div>
          <div className="stat-sub">
            {totalBalance > 0
              ? `${pendingFees.length} item${pendingFees.length !== 1 ? 's' : ''} pending`
              : 'Fully paid up'}
          </div>
        </div>

        <div className={`stat-card ${
          collectionPct >= 100 ? 'stat-card-green'
          : collectionPct >= 50 ? 'stat-card-amber'
          : 'stat-card-red'
        }`}>
          <div className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <TrendingUp size={12} /> Payment rate
          </div>
          <div className="stat-value">{collectionPct}%</div>
          <div className="stat-sub">Of total fees paid</div>
        </div>
      </div>

      {/* Payment rate bar */}
      <div className="card" style={{ padding: '20px', marginBottom: '24px' }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', marginBottom: '10px',
        }}>
          <span style={{ fontWeight: 600, fontSize: '13.5px', color: 'var(--navy)' }}>
            Payment progress
          </span>
          <span style={{
            fontWeight: 700, fontSize: '14px',
            color: collectionPct >= 100 ? 'var(--success)'
              : collectionPct >= 50 ? 'var(--warning)'
              : 'var(--danger)',
          }}>
            {formatCurrency(totalPaid)} of {formatCurrency(totalCharged)}
          </span>
        </div>
        <div style={{
          height: '10px', background: 'var(--gray-light)',
          borderRadius: '99px', overflow: 'hidden',
        }}>
          <div style={{
            width: `${Math.min(collectionPct, 100)}%`,
            height: '100%',
            borderRadius: '99px',
            background: collectionPct >= 100 ? 'var(--success)'
              : collectionPct >= 50 ? 'var(--warning)'
              : 'var(--danger)',
            transition: 'width 0.6s ease',
          }} />
        </div>
      </div>

      {/* Fee breakdown by term */}
      {termGroups.map(({ term, items }) => {
        const termTotal   = items.reduce((s, f) => s + f.amount, 0)
        const termPaid    = items.reduce((s, f) => s + f.paid, 0)
        const termBalance = termTotal - termPaid

        return (
          <div key={term} style={{ marginBottom: '24px' }}>

            {/* Term heading */}
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', marginBottom: '10px',
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '8px',
              }}>
                <Calendar size={15} color="var(--blue)" />
                <span style={{
                  fontWeight: 600, fontSize: '14px', color: 'var(--navy)',
                }}>
                  {term > 0 ? getTermLabel(term) : 'Other fees'}
                </span>
              </div>
              <div style={{ fontSize: '13px', color: 'var(--gray-mid)' }}>
                Balance:{' '}
                <strong style={{
                  color: termBalance > 0 ? 'var(--danger)' : 'var(--success)',
                }}>
                  {termBalance > 0 ? formatCurrency(termBalance) : 'Paid'}
                </strong>
              </div>
            </div>

            {/* Fee rows */}
            <div className="card" style={{ overflow: 'hidden' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Amount</th>
                    <th>Paid</th>
                    <th>Balance</th>
                    <th>Due date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((fee: any) => {
                    const balance   = fee.amount - fee.paid
                    const statusInfo = getStatusInfo(fee)
                    const diff       = getDaysUntilDue(fee.due_date)

                    return (
                      <tr key={fee.id}>
                        <td style={{ fontWeight: 500, color: 'var(--navy)' }}>
                          {fee.description}
                        </td>
                        <td>{formatCurrency(fee.amount)}</td>
                        <td style={{ color: 'var(--success)', fontWeight: 500 }}>
                          {formatCurrency(fee.paid)}
                        </td>
                        <td style={{
                          fontWeight: 600,
                          color: balance > 0 ? 'var(--danger)' : 'var(--success)',
                        }}>
                          {balance > 0 ? formatCurrency(balance) : '—'}
                        </td>
                        <td style={{ fontSize: '12.5px' }}>
                          <div style={{ color: 'var(--gray-dark)' }}>
                            {formatDateShort(fee.due_date)}
                          </div>
                          {fee.status !== 'paid' && diff < 0 && (
                            <div style={{
                              fontSize: '11px', color: 'var(--danger)',
                              fontWeight: 500,
                            }}>
                              {Math.abs(diff)} day{Math.abs(diff) !== 1 ? 's' : ''} overdue
                            </div>
                          )}
                          {fee.status !== 'paid' && diff >= 0 && diff <= 7 && (
                            <div style={{
                              fontSize: '11px', color: 'var(--warning)',
                              fontWeight: 500,
                            }}>
                              Due in {diff} day{diff !== 1 ? 's' : ''}
                            </div>
                          )}
                        </td>
                        <td>
                          <span className="badge" style={{
                            background: statusInfo.bg,
                            color: statusInfo.color,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}>
                            {statusInfo.icon === 'check' && <CheckCircle2 size={11} />}
                            {statusInfo.icon === 'overdue' && <AlertTriangle size={11} />}
                            {statusInfo.icon === 'partial' && <Clock size={11} />}
                            {statusInfo.label}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      })}

      {/* Empty state */}
      {fees.length === 0 && (
        <div className="card" style={{
          padding: '56px', textAlign: 'center', color: 'var(--gray-mid)',
        }}>
          <Receipt size={40} color="var(--gray-mid)"
            style={{ margin: '0 auto 12px' }} />
          <div style={{
            fontSize: '15px', fontWeight: 500,
            color: 'var(--navy)', marginBottom: '6px',
          }}>
            No fee records found
          </div>
          <div style={{ fontSize: '13.5px' }}>
            Fee records will appear here once they are loaded by the school.
          </div>
        </div>
      )}

      {/* Payment options */}
      {totalBalance > 0 && (
        <div className="card" style={{ padding: '24px', marginTop: '8px' }}>
          <div style={{
            fontWeight: 600, fontSize: '14px',
            color: 'var(--navy)', marginBottom: '6px',
          }}>
            How to pay
          </div>
          <div style={{
            fontSize: '13.5px', color: 'var(--gray-mid)',
            lineHeight: 1.7, marginBottom: '16px',
          }}>
            Pay via EFT to the school account below, or visit the admin office
            in person. Please use your child&apos;s student number as the
            payment reference so your payment is allocated correctly.
          </div>

          {/* Bank details */}
          <div style={{
            background: 'var(--blue-pale)',
            border: '1px solid var(--blue-light)',
            borderRadius: '10px',
            padding: '16px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '12px',
            marginBottom: '16px',
          }}>
            {[
              { label: 'Bank',       value: 'Standard Bank' },
              { label: 'Account name', value: 'Mulima Secondary School' },
              { label: 'Account no.', value: '000 123 4567' },
              { label: 'Branch code', value: '051 001' },
              { label: 'Reference',  value: learner.student_no },
            ].map(item => (
              <div key={item.label}>
                <div style={{
                  fontSize: '11px', fontWeight: 600,
                  color: 'var(--blue)', textTransform: 'uppercase',
                  letterSpacing: '0.05em', marginBottom: '3px',
                }}>
                  {item.label}
                </div>
                <div style={{
                  fontSize: '13.5px', fontWeight: 600, color: 'var(--navy)',
                }}>
                  {item.value}
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button className="btn btn-primary">
              <CreditCard size={14} />
              Pay by card online
            </button>
            <button className="btn btn-outline">
              <Download size={14} />
              Download statement
            </button>
          </div>
        </div>
      )}

      {/* Statement download for paid up */}
      {totalBalance === 0 && fees.length > 0 && (
        <div className="card" style={{
          padding: '16px 20px', marginTop: '8px',
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', flexWrap: 'wrap', gap: '12px',
        }}>
          <div>
            <div style={{
              fontWeight: 500, color: 'var(--navy)', fontSize: '14px',
            }}>
              Download fee statement
            </div>
            <div style={{ fontSize: '12.5px', color: 'var(--gray-mid)' }}>
              Official statement for {new Date().getFullYear()}
            </div>
          </div>
          <button className="btn btn-outline btn-sm">
            <Download size={13} />
            Download PDF
          </button>
        </div>
      )}

      {/* Info */}
      <div className="alert alert-info" style={{ marginTop: '20px' }}>
        <Info size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
        <span>
          For payment arrangements or queries, contact the school finance
          office at <strong>finance@mulima.edu.za</strong> or call{' '}
          <strong>015 000 1234</strong> during office hours
          (Mon–Fri, 07:00–16:00).
        </span>
      </div>
    </div>
  )
}