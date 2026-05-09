import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import {
  Bell, AlertTriangle, BookOpen, DollarSign,
  Trophy, Calendar, Palette, Megaphone, Info, Search
} from 'lucide-react'

// ── DATA ──────────────────────────────────────────────────
async function getNoticesData() {
  const supabase = await createServerSupabaseClient()

  const { data: notices } = await supabase
    .from('notices')
    .select('id, title, body, audience, category, created_at')
    .in('audience', ['all', 'students'])
    .order('created_at', { ascending: false })

  return notices ?? []
}

// ── UTILS ─────────────────────────────────────────────────
const CATEGORIES = [
  { key: 'all',      label: 'All notices',  icon: Bell },
  { key: 'urgent',   label: 'Urgent',       icon: AlertTriangle },
  { key: 'academic', label: 'Academic',     icon: BookOpen },
  { key: 'finance',  label: 'Finance',      icon: DollarSign },
  { key: 'sport',    label: 'Sport',        icon: Trophy },
  { key: 'events',   label: 'Events',       icon: Calendar },
  { key: 'culture',  label: 'Culture',      icon: Palette },
  { key: 'general',  label: 'General',      icon: Megaphone },
]

const CATEGORY_STYLES: Record<string, {
  color: string; bg: string; border: string; dot: string
}> = {
  urgent:   { color: '#7f1d1d', bg: '#fee2e2', border: '#fca5a5', dot: '#ef4444' },
  academic: { color: '#1e3a5f', bg: '#dbeafe', border: '#93c5fd', dot: '#3b82f6' },
  finance:  { color: '#78350f', bg: '#fef3c7', border: '#fcd34d', dot: '#f59e0b' },
  sport:    { color: '#065f46', bg: '#d1fae5', border: '#6ee7b7', dot: '#10b981' },
  events:   { color: '#4c1d95', bg: '#ede9fe', border: '#c4b5fd', dot: '#8b5cf6' },
  culture:  { color: '#164e63', bg: '#cffafe', border: '#67e8f9', dot: '#06b6d4' },
  general:  { color: '#374151', bg: '#f3f4f6', border: '#d1d5db', dot: '#9ca3af' },
}

function getCategoryStyle(category: string) {
  return CATEGORY_STYLES[category] ?? CATEGORY_STYLES.general
}

function formatDate(iso: string) {
  const date = new Date(iso)
  const now = new Date()
  const diff = Math.floor((now.getTime() - date.getTime()) / 86400000)

  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  if (diff < 7)  return `${diff} days ago`
  return date.toLocaleDateString('en-ZA', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

function getCategoryIcon(category: string) {
  const found = CATEGORIES.find(c => c.key === category)
  return found?.icon ?? Megaphone
}

// ── PAGE ──────────────────────────────────────────────────
export default async function NoticesPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const notices = await getNoticesData()

  const urgentCount  = notices.filter(n => n.category === 'urgent').length
  const recentCount  = notices.filter(n => {
    const diff = (Date.now() - new Date(n.created_at).getTime()) / 86400000
    return diff <= 7
  }).length

  // Group by category for counts
  const categoryCounts: Record<string, number> = { all: notices.length }
  notices.forEach(n => {
    categoryCounts[n.category] = (categoryCounts[n.category] ?? 0) + 1
  })

  return (
    <div className="fade-in">

      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 className="page-title">Notices &amp; Announcements</h1>
        <p className="page-subtitle">
          All school notices relevant to you · Term 2, 2025
        </p>
      </div>

      {/* Urgent alert */}
      {urgentCount > 0 && (
        <div className="alert alert-danger" style={{ marginBottom: '20px' }}>
          <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
          <span>
            <strong>{urgentCount} urgent notice{urgentCount > 1 ? 's' : ''}.</strong>{' '}
            Please read {urgentCount > 1 ? 'them' : 'it'} carefully and take action if required.
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
        <div className="stat-card stat-card-navy">
          <div className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Bell size={12} /> Total notices
          </div>
          <div className="stat-value">{notices.length}</div>
          <div className="stat-sub">This term</div>
        </div>
        <div className={`stat-card ${urgentCount > 0 ? 'stat-card-red' : 'stat-card-green'}`}>
          <div className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <AlertTriangle size={12} /> Urgent
          </div>
          <div className="stat-value">{urgentCount}</div>
          <div className="stat-sub">
            {urgentCount === 0 ? 'None right now' : 'Requires attention'}
          </div>
        </div>
        <div className="stat-card stat-card-blue">
          <div className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Calendar size={12} /> This week
          </div>
          <div className="stat-value">{recentCount}</div>
          <div className="stat-sub">Posted in last 7 days</div>
        </div>
      </div>

      {/* Category filter pills — client interaction via URL would need
          a client component; for now render all grouped by category */}

      {/* Notices — urgent first, then rest */}
      {notices.length === 0 ? (
        <div className="card" style={{
          padding: '56px', textAlign: 'center', color: 'var(--gray-mid)',
        }}>
          <Bell size={40} color="var(--gray-mid)" style={{ margin: '0 auto 12px' }} />
          <div style={{
            fontSize: '15px', fontWeight: 500,
            color: 'var(--navy)', marginBottom: '6px',
          }}>
            No notices yet
          </div>
          <div style={{ fontSize: '13.5px' }}>
            School notices will appear here when posted by administration.
          </div>
        </div>
      ) : (
        <div>
          {/* Render urgent notices first */}
          {urgentCount > 0 && (
            <div style={{ marginBottom: '28px' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                marginBottom: '12px',
              }}>
                <AlertTriangle size={15} color="var(--danger)" />
                <span style={{
                  fontWeight: 600, fontSize: '14px',
                  color: 'var(--danger)',
                }}>
                  Urgent notices
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {notices
                  .filter(n => n.category === 'urgent')
                  .map(notice => (
                    <NoticeCard key={notice.id} notice={notice} />
                  ))}
              </div>
            </div>
          )}

          {/* All other categories */}
          {CATEGORIES.filter(c => c.key !== 'all' && c.key !== 'urgent').map(cat => {
            const catNotices = notices.filter(n => n.category === cat.key)
            if (catNotices.length === 0) return null
            const Icon = cat.icon
            const style = getCategoryStyle(cat.key)

            return (
              <div key={cat.key} style={{ marginBottom: '28px' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  marginBottom: '12px',
                }}>
                  <Icon size={15} color={style.dot} />
                  <span style={{
                    fontWeight: 600, fontSize: '14px', color: 'var(--navy)',
                  }}>
                    {cat.label}
                    <span style={{
                      marginLeft: '8px',
                      fontSize: '12px', fontWeight: 400,
                      color: 'var(--gray-mid)',
                    }}>
                      ({catNotices.length})
                    </span>
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {catNotices.map(notice => (
                    <NoticeCard key={notice.id} notice={notice} />
                  ))}
                </div>
              </div>
            )
          })}

          {/* General last */}
          {(() => {
            const general = notices.filter(n => n.category === 'general')
            if (general.length === 0) return null
            return (
              <div style={{ marginBottom: '28px' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  marginBottom: '12px',
                }}>
                  <Megaphone size={15} color="var(--gray-mid)" />
                  <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--navy)' }}>
                    General
                    <span style={{
                      marginLeft: '8px', fontSize: '12px',
                      fontWeight: 400, color: 'var(--gray-mid)',
                    }}>
                      ({general.length})
                    </span>
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {general.map(notice => (
                    <NoticeCard key={notice.id} notice={notice} />
                  ))}
                </div>
              </div>
            )
          })()}
        </div>
      )}

      {/* Info */}
      <div className="alert alert-info" style={{ marginTop: '8px' }}>
        <Info size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
        <span>
          Notices are posted by school administration and educators.
          For urgent matters, contact the school office directly on
          015 000 1234.
        </span>
      </div>
    </div>
  )
}

// ── NOTICE CARD COMPONENT ─────────────────────────────────
function NoticeCard({ notice }: { notice: any }) {
  const style  = getCategoryStyle(notice.category)
  const Icon   = getCategoryIcon(notice.category)
  const isNew  = (Date.now() - new Date(notice.created_at).getTime()) / 86400000 <= 2

  return (
    <div
      className="card"
      style={{
        padding: '0',
        overflow: 'hidden',
        borderLeft: `4px solid ${style.dot}`,
      }}
    >
      {/* Header */}
      <div style={{
        padding: '14px 18px 12px',
        display: 'flex',
        gap: '14px',
        alignItems: 'flex-start',
      }}>
        {/* Icon circle */}
        <div style={{
          width: '38px', height: '38px',
          borderRadius: '10px',
          background: style.bg,
          border: `1px solid ${style.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
          marginTop: '2px',
        }}>
          <Icon size={16} color={style.dot} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Title row */}
          <div style={{
            display: 'flex', alignItems: 'flex-start',
            justifyContent: 'space-between', gap: '12px',
            marginBottom: '6px',
          }}>
            <h3 style={{
              fontSize: '14px', fontWeight: 600,
              color: 'var(--navy)', lineHeight: 1.3,
            }}>
              {notice.title}
            </h3>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              flexShrink: 0,
            }}>
              {isNew && (
                <span className="badge" style={{
                  background: 'var(--success-bg)',
                  color: 'var(--success)',
                  fontSize: '10px',
                }}>
                  New
                </span>
              )}
              <span className="badge" style={{
                background: style.bg,
                color: style.color,
                fontSize: '10.5px',
                textTransform: 'capitalize',
              }}>
                {notice.category}
              </span>
            </div>
          </div>

          {/* Body */}
          <p style={{
            fontSize: '13.5px',
            color: 'var(--gray-mid)',
            lineHeight: 1.65,
          }}>
            {notice.body}
          </p>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        padding: '8px 18px',
        borderTop: '1px solid var(--gray-border)',
        background: 'var(--gray-light)',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
      }}>
        <Calendar size={12} color="var(--gray-mid)" />
        <span style={{ fontSize: '12px', color: 'var(--gray-mid)' }}>
          {formatDate(notice.created_at)}
        </span>
      </div>
    </div>
  )
}