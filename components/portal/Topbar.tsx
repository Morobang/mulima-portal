'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { User, Settings, HelpCircle, LogOut } from 'lucide-react'

interface TopbarProps {
  userFullName: string
  userRole: string
  initials: string
}

export default function Topbar({ userFullName, userRole, initials }: TopbarProps) {
  const router = useRouter()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)

  async function handleSignOut() {
    setSigningOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const roleLabels: Record<string, string> = {
    student: 'Student Portal',
    parent:  'Parent Portal',
    teacher: 'Teacher Portal',
    admin:   'Administration',
  }

  const menuItems = [
    { Icon: User,        label: 'My profile',    href: `/${userRole}/profile` },
    { Icon: Settings,    label: 'Settings',      href: `/${userRole}/settings` },
    { Icon: HelpCircle,  label: 'Help & support', href: '/contact' },
  ]

  return (
    <header style={{
      height: 'var(--topbar-h)',
      background: 'var(--navy)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 20px',
      flexShrink: 0,
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      position: 'relative',
      zIndex: 50,
    }}>

      {/* Left — logo + role */}
      <Link href="/" style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        textDecoration: 'none', flexShrink: 0,
      }}>
        <div style={{
          width: '34px', height: '34px',
          background: 'var(--blue)',
          borderRadius: '8px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 700, fontSize: '12px', color: '#fff',
          flexShrink: 0,
        }}>
          MS
        </div>
        <div>
          <div style={{ color: '#fff', fontSize: '13.5px', fontWeight: 600, lineHeight: 1.2 }}>
            Mulima Secondary School
          </div>
          <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '10.5px' }}>
            {roleLabels[userRole] ?? 'Portal'}
          </div>
        </div>
      </Link>

      {/* Right — notifications + avatar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>

        {/* Notification bell */}
        <button style={{
          background: 'none', border: 'none',
          color: 'rgba(255,255,255,0.6)',
          cursor: 'pointer', padding: '8px',
          borderRadius: '8px', position: 'relative',
          transition: 'background 0.15s',
        }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'none')}
        >
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
            <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 00-5-5.917V4a1 1 0 00-2 0v1.083A6 6 0 006 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <div style={{
            position: 'absolute', top: '6px', right: '6px',
            width: '7px', height: '7px',
            background: '#ef4444', borderRadius: '50%',
            border: '1.5px solid var(--navy)',
          }} />
        </button>

        {/* Avatar + dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '10px',
              padding: '5px 10px 5px 6px',
              cursor: 'pointer',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.12)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.07)')}
          >
            <div style={{
              width: '28px', height: '28px',
              background: 'var(--blue)',
              borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '11px', fontWeight: 600, color: '#fff',
              flexShrink: 0,
            }}>
              {initials}
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ color: '#fff', fontSize: '12.5px', fontWeight: 500, lineHeight: 1.2 }}>
                {userFullName}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '10.5px', textTransform: 'capitalize' }}>
                {userRole}
              </div>
            </div>
            <svg
              width="14" height="14" fill="none" stroke="rgba(255,255,255,0.5)"
              strokeWidth="2" viewBox="0 0 24 24"
              style={{ transition: 'transform 0.2s', transform: dropdownOpen ? 'rotate(180deg)' : 'none' }}
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>

          {/* Dropdown */}
          {dropdownOpen && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 8px)', right: 0,
              background: '#fff',
              borderRadius: '12px',
              boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
              border: '1px solid var(--gray-border)',
              minWidth: '200px',
              overflow: 'hidden',
              zIndex: 100,
            }}>
              {/* User info */}
              <div style={{
                padding: '14px 16px',
                borderBottom: '1px solid var(--gray-border)',
                background: 'var(--gray-light)',
              }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--navy)' }}>
                  {userFullName}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--gray-mid)', textTransform: 'capitalize' }}>
                  {roleLabels[userRole]}
                </div>
              </div>

              {/* Menu items */}
              {menuItems.map(({ Icon, label, href }) => (
                <Link
                  key={label}
                  href={href}
                  onClick={() => setDropdownOpen(false)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '10px 16px',
                    fontSize: '13.5px', color: 'var(--gray-dark)',
                    textDecoration: 'none',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--blue-pale)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <Icon size={15} strokeWidth={1.8} style={{ color: 'var(--gray-mid)', flexShrink: 0 }} />
                  <span>{label}</span>
                </Link>
              ))}

              {/* Sign out */}
              <div style={{ borderTop: '1px solid var(--gray-border)' }}>
                <button
                  onClick={handleSignOut}
                  disabled={signingOut}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '10px 16px',
                    fontSize: '13.5px', color: 'var(--danger)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    transition: 'background 0.1s', textAlign: 'left',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--danger-bg)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <LogOut size={15} strokeWidth={1.8} style={{ flexShrink: 0 }} />
                  <span>{signingOut ? 'Signing out...' : 'Sign out'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Close dropdown when clicking outside */}
      {dropdownOpen && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 40 }}
          onClick={() => setDropdownOpen(false)}
        />
      )}
    </header>
  )
}
