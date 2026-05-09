'use client'

import { Mail, MailOpen } from 'lucide-react'

function getRoleLabel(role: string) {
  const map: Record<string, string> = {
    teacher: 'Educator',
    admin:   'Administration',
    student: 'Student',
    parent:  'Parent',
  }
  return map[role] ?? role
}

function getRoleColor(role: string) {
  const map: Record<string, { bg: string; color: string }> = {
    teacher: { bg: 'var(--warning-bg)', color: 'var(--warning)' },
    admin:   { bg: 'var(--info-bg)',    color: 'var(--blue)' },
    student: { bg: 'var(--success-bg)', color: 'var(--success)' },
    parent:  { bg: '#ede9fe',           color: '#7c3aed' },
  }
  return map[role] ?? { bg: 'var(--gray-light)', color: 'var(--gray-mid)' }
}

function formatDate(iso: string) {
  const date = new Date(iso)
  const now  = new Date()
  const diff = Math.floor((now.getTime() - date.getTime()) / 86400000)

  if (diff === 0) {
    return date.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })
  }
  if (diff === 1) return 'Yesterday'
  if (diff < 7)  return `${diff} days ago`
  return date.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })
}

export function MessageRow({
  message,
  type,
}: {
  message: any
  type: 'inbox' | 'sent'
}) {
  const profile  = type === 'inbox' ? message.from_profile : message.to_profile
  const isUnread = type === 'inbox' && !message.read
  const roleCol  = getRoleColor(profile?.role ?? '')

  return (
    <div
      className="card"
      style={{
        padding: '14px 18px',
        display: 'flex',
        gap: '14px',
        alignItems: 'flex-start',
        borderLeft: isUnread ? '4px solid var(--blue)' : '4px solid transparent',
        background: isUnread ? 'rgba(30,95,158,0.02)' : '#fff',
        cursor: 'pointer',
        transition: 'background 0.15s',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.background = 'var(--blue-pale)'
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.background =
          isUnread ? 'rgba(30,95,158,0.02)' : '#fff'
      }}
    >
      {/* Avatar */}
      <div style={{
        width: '40px', height: '40px',
        borderRadius: '50%',
        background: roleCol.bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
        fontSize: '14px', fontWeight: 600,
        color: roleCol.color,
      }}>
        {profile?.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() ?? '?'}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'flex-start', gap: '8px', marginBottom: '4px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
            <span style={{
              fontSize: '13.5px', fontWeight: isUnread ? 700 : 500,
              color: 'var(--navy)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {type === 'inbox'
                ? profile?.full_name ?? 'Unknown'
                : `To: ${profile?.full_name ?? 'Unknown'}`}
            </span>
            <span className="badge" style={{
              background: roleCol.bg,
              color: roleCol.color,
              fontSize: '10px', flexShrink: 0,
            }}>
              {getRoleLabel(profile?.role ?? '')}
            </span>
            {isUnread && (
              <div style={{
                width: '7px', height: '7px',
                borderRadius: '50%', background: 'var(--blue)',
                flexShrink: 0,
              }} />
            )}
          </div>
          <span style={{
            fontSize: '11.5px', color: 'var(--gray-mid)',
            flexShrink: 0, whiteSpace: 'nowrap',
          }}>
            {formatDate(message.created_at)}
          </span>
        </div>

        <div style={{
          fontSize: '13px', fontWeight: isUnread ? 600 : 400,
          color: isUnread ? 'var(--navy)' : 'var(--gray-dark)',
          marginBottom: '4px',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {message.subject}
        </div>

        <div style={{
          fontSize: '12.5px', color: 'var(--gray-mid)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {message.body}
        </div>
      </div>

      {/* Read/unread icon */}
      <div style={{ flexShrink: 0, marginTop: '2px' }}>
        {isUnread
          ? <Mail size={15} color="var(--blue)" />
          : <MailOpen size={15} color="var(--gray-mid)" />}
      </div>
    </div>
  )
}
