'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export interface NavItem {
  label: string
  href: string
  icon: string
  badge?: number
}

export interface NavSection {
  section: string
  items: NavItem[]
}

interface SidebarProps {
  navigation: NavSection[]
  userFullName: string
  userRole: string
  initials: string
}

export default function Sidebar({ navigation, userFullName, userRole, initials }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="portal-sidebar">

      {/* User card */}
      <div style={{
        padding: '16px',
        borderBottom: '1px solid var(--gray-border)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '38px', height: '38px',
            background: 'var(--blue)',
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '13px', fontWeight: 600, color: '#fff',
            flexShrink: 0,
          }}>
            {initials}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{
              fontSize: '13px', fontWeight: 600,
              color: 'var(--navy)', lineHeight: 1.2,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {userFullName}
            </div>
            <div style={{
              fontSize: '11px', color: 'var(--gray-mid)',
              textTransform: 'capitalize',
            }}>
              {userRole}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        {navigation.map(group => (
          <div key={group.section}>
            <div className="nav-section-label">{group.section}</div>
            {group.items.map(item => {
              const isActive = pathname === item.href ||
                (item.href !== `/${userRole}` && pathname.startsWith(item.href))

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`nav-item ${isActive ? 'active' : ''}`}
                >
                  <span style={{ fontSize: '15px', width: '18px', flexShrink: 0 }}>
                    {item.icon}
                  </span>
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {item.badge ? (
                    <span style={{
                      background: '#ef4444', color: '#fff',
                      fontSize: '10px', fontWeight: 600,
                      borderRadius: '999px',
                      padding: '1px 6px',
                      flexShrink: 0,
                    }}>
                      {item.badge}
                    </span>
                  ) : null}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* Bottom — version */}
      <div style={{
        padding: '12px 16px',
        borderTop: '1px solid var(--gray-border)',
        flexShrink: 0,
      }}>
        <div style={{ fontSize: '11px', color: 'var(--gray-mid)' }}>
          Mulima Portal · Term 2, 2025
        </div>
      </div>
    </aside>
  )
}