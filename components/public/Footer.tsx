'use client'

import Link from 'next/link'
import { MapPin, Phone, Mail, Clock } from 'lucide-react'

export default function Footer() {
  const year = new Date().getFullYear()

  const contactItems = [
    { Icon: MapPin,  text: 'Sio Likhade Village, Mulima, Makhado, 0817' },
    { Icon: Phone,   text: '015 975 1089' },
    { Icon: Mail,    text: 'mafela@telkomsa.net' },
    { Icon: Clock,   text: 'Mon–Fri · 07:30–16:00' },
  ]

  return (
    <footer style={{
      background: 'var(--navy)',
      color: 'rgba(255,255,255,0.7)',
      paddingTop: '56px',
      paddingBottom: '32px',
    }}>
      <div className="container-school">

        {/* Top grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '40px',
          paddingBottom: '40px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}>

          {/* Brand column */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <div style={{
                width: '36px', height: '36px',
                background: 'var(--blue)',
                borderRadius: '8px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: '13px', color: '#fff',
              }}>
                MS
              </div>
              <div>
                <div style={{ color: '#fff', fontWeight: 600, fontSize: '14px' }}>Mulima Secondary School</div>
                <div style={{ fontSize: '11px' }}>Est. 1997 · Makhado, Limpopo</div>
              </div>
            </div>
            <p style={{ fontSize: '13px', lineHeight: '1.7' }}>
              Committed to excellence in education and the holistic development of every learner in Limpopo Province.
            </p>
          </div>

          {/* Quick links */}
          <div>
            <div style={{ color: '#fff', fontWeight: 600, fontSize: '13px', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Quick links
            </div>
            {[
              { label: 'Home', href: '/' },
              { label: 'About the school', href: '/about' },
              { label: 'Notices & news', href: '/notices' },
              { label: 'Contact us', href: '/contact' },
              { label: 'Sign in to portal', href: '/login' },
            ].map(l => (
              <Link key={l.href} href={l.href} style={{
                display: 'block', color: 'rgba(255,255,255,0.65)',
                textDecoration: 'none', fontSize: '13px',
                padding: '4px 0', transition: 'color 0.15s',
              }}
                onMouseEnter={e => (e.target as HTMLElement).style.color = '#fff'}
                onMouseLeave={e => (e.target as HTMLElement).style.color = 'rgba(255,255,255,0.65)'}
              >
                {l.label}
              </Link>
            ))}
          </div>

          {/* Portal access */}
          <div>
            <div style={{ color: '#fff', fontWeight: 600, fontSize: '13px', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Portal access
            </div>
            {[
              { label: 'Student portal', href: '/login' },
              { label: 'Parent portal', href: '/login' },
              { label: 'Teacher portal', href: '/login' },
              { label: 'Administration', href: '/login' },
            ].map(l => (
              <Link key={l.label} href={l.href} style={{
                display: 'block', color: 'rgba(255,255,255,0.65)',
                textDecoration: 'none', fontSize: '13px',
                padding: '4px 0', transition: 'color 0.15s',
              }}
                onMouseEnter={e => (e.target as HTMLElement).style.color = '#fff'}
                onMouseLeave={e => (e.target as HTMLElement).style.color = 'rgba(255,255,255,0.65)'}
              >
                {l.label}
              </Link>
            ))}
          </div>

          {/* Contact */}
          <div>
            <div style={{ color: '#fff', fontWeight: 600, fontSize: '13px', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Contact
            </div>
            {contactItems.map(({ Icon, text }) => (
              <div key={text} style={{
                display: 'flex', gap: '8px', alignItems: 'flex-start',
                fontSize: '13px', marginBottom: '8px',
                color: 'rgba(255,255,255,0.65)',
              }}>
                <Icon size={14} strokeWidth={1.8} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: '24px',
          fontSize: '12px',
          flexWrap: 'wrap',
          gap: '8px',
        }}>
          <span>© {year} Mulima Secondary School. All rights reserved.</span>
          <span style={{ color: 'rgba(255,255,255,0.4)' }}>
            Excellence in Education · Limpopo Province
          </span>
        </div>
      </div>
    </footer>
  )
}
