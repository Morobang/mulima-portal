import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { Send, Inbox, Info, Mail } from 'lucide-react'
import { MessageRow } from './MessageRow'

// ── DATA ──────────────────────────────────────────────────
async function getMessagesData(userId: string) {
  const supabase = await createServerSupabaseClient()

  // Inbox — messages sent TO this user
  const { data: inbox } = await supabase
    .from('messages')
    .select(`
      id, subject, body, read, created_at,
      from_profile:profiles!messages_from_user_id_fkey (
        full_name, role
      )
    `)
    .eq('to_user_id', userId)
    .order('created_at', { ascending: false })

  // Sent — messages sent BY this user
  const { data: sent } = await supabase
    .from('messages')
    .select(`
      id, subject, body, read, created_at,
      to_profile:profiles!messages_to_user_id_fkey (
        full_name, role
      )
    `)
    .eq('from_user_id', userId)
    .order('created_at', { ascending: false })

  // Who can the student message? Teachers and admin
  const { data: recipients } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .in('role', ['teacher', 'admin'])
    .order('full_name', { ascending: true })

  return {
    inbox:      inbox ?? [],
    sent:       sent ?? [],
    recipients: recipients ?? [],
  }
}

// ── UTILS ─────────────────────────────────────────────────
function getRoleLabel(role: string) {
  const map: Record<string, string> = {
    teacher: 'Educator',
    admin:   'Administration',
    student: 'Student',
    parent:  'Parent',
  }
  return map[role] ?? role
}

// ── COMPOSE FORM ──────────────────────────────────────────
function ComposeForm({ recipients }: { recipients: any[] }) {
  return (
    <div className="card" style={{ padding: '20px' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        marginBottom: '18px',
      }}>
        <Send size={16} color="var(--blue)" />
        <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--navy)' }}>
          New message
        </span>
      </div>

      <form action="#" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Recipient */}
        <div>
          <label className="label">To</label>
          <select className="input" style={{ cursor: 'pointer' }}>
            <option value="">Select recipient...</option>
            {recipients.map(r => (
              <option key={r.id} value={r.id}>
                {r.full_name} ({getRoleLabel(r.role)})
              </option>
            ))}
          </select>
        </div>

        {/* Subject */}
        <div>
          <label className="label">Subject</label>
          <input
            type="text"
            className="input"
            placeholder="e.g. Question about my marks"
          />
        </div>

        {/* Body */}
        <div>
          <label className="label">Message</label>
          <textarea
            className="input"
            rows={5}
            placeholder="Type your message here..."
            style={{ resize: 'vertical', minHeight: '100px' }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button type="submit" className="btn btn-primary">
            <Send size={14} />
            Send message
          </button>
        </div>
      </form>

      <div className="alert alert-info" style={{ marginTop: '16px' }}>
        <Info size={14} style={{ flexShrink: 0, marginTop: '1px' }} />
        <span style={{ fontSize: '12.5px' }}>
          Messages are only visible to you and the recipient.
          For urgent matters please contact the school office directly.
        </span>
      </div>
    </div>
  )
}

// ── PAGE ──────────────────────────────────────────────────
export default async function MessagesPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { inbox, sent, recipients } = await getMessagesData(user.id)

  const unreadCount = inbox.filter(m => !m.read).length

  return (
    <div className="fade-in">

      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 className="page-title">Messages</h1>
        <p className="page-subtitle">
          Internal school messaging · Term 2, 2026
        </p>
      </div>

      {/* Stat cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: '14px',
        marginBottom: '28px',
      }}>
        <div className={`stat-card ${unreadCount > 0 ? 'stat-card-blue' : 'stat-card-green'}`}>
          <div className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Mail size={12} /> Unread
          </div>
          <div className="stat-value">{unreadCount}</div>
          <div className="stat-sub">
            {unreadCount === 0 ? 'All caught up' : 'New messages'}
          </div>
        </div>
        <div className="stat-card stat-card-navy">
          <div className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Inbox size={12} /> Inbox
          </div>
          <div className="stat-value">{inbox.length}</div>
          <div className="stat-sub">Total received</div>
        </div>
        <div className="stat-card stat-card-amber">
          <div className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Send size={12} /> Sent
          </div>
          <div className="stat-value">{sent.length}</div>
          <div className="stat-sub">Total sent</div>
        </div>
      </div>

      {/* Unread alert */}
      {unreadCount > 0 && (
        <div className="alert alert-info" style={{ marginBottom: '24px' }}>
          <Mail size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
          <span>
            You have <strong>{unreadCount} unread message{unreadCount > 1 ? 's' : ''}</strong>.
            Please read and respond where needed.
          </span>
        </div>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '24px',
        alignItems: 'start',
      }}>

        {/* Left — inbox + sent */}
        <div>
          {/* Inbox */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              marginBottom: '12px',
            }}>
              <Inbox size={15} color="var(--blue)" />
              <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--navy)' }}>
                Inbox
                {unreadCount > 0 && (
                  <span style={{
                    marginLeft: '8px',
                    background: 'var(--blue)', color: '#fff',
                    fontSize: '11px', fontWeight: 600,
                    borderRadius: '999px', padding: '1px 7px',
                  }}>
                    {unreadCount} new
                  </span>
                )}
              </span>
            </div>

            {inbox.length === 0 ? (
              <div className="card" style={{
                padding: '32px', textAlign: 'center', color: 'var(--gray-mid)',
              }}>
                <Inbox size={32} color="var(--gray-mid)"
                  style={{ margin: '0 auto 10px' }} />
                <div style={{ fontSize: '13.5px' }}>Your inbox is empty</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {inbox.map(msg => (
                  <MessageRow key={msg.id} message={msg} type="inbox" />
                ))}
              </div>
            )}
          </div>

          {/* Sent */}
          {sent.length > 0 && (
            <div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                marginBottom: '12px',
              }}>
                <Send size={15} color="var(--gray-mid)" />
                <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--navy)' }}>
                  Sent ({sent.length})
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {sent.map(msg => (
                  <MessageRow key={msg.id} message={msg} type="sent" />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right — compose */}
        <div>
          <ComposeForm recipients={recipients} />
        </div>
      </div>
    </div>
  )
}