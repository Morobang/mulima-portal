'use client'

import { useState } from 'react'
import Link from 'next/link'

const navLinks = [
  { label: 'Home',     href: '/' },
  { label: 'About',    href: '/about' },
  { label: 'Notices',  href: '/notices' },
  { label: 'Contact',  href: '/contact' },
]

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <nav style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 100,
      background: 'rgba(15, 45, 74, 0.97)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid rgba(255,255,255,0.08)',
    }}>
      <div className="container-school" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '68px',
      }}>

        {/* Logo */}
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            background: 'var(--blue)',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '14px',
            color: '#fff',
            letterSpacing: '-0.5px',
            flexShrink: 0,
          }}>
            MS
          </div>
          <div>
            <div style={{
              color: '#fff',
              fontWeight: 600,
              fontSize: '15px',
              lineHeight: '1.2',
            }}>
              Mulima Secondary School
            </div>
            <div style={{
              color: 'rgba(255,255,255,0.5)',
              fontSize: '11px',
            }}>
              Thohoyandou, Limpopo
            </div>
          </div>
        </Link>

        {/* Desktop nav links */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
        }} className="desktop-nav">
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              style={{
                color: 'rgba(255,255,255,0.75)',
                textDecoration: 'none',
                fontSize: '14px',
                padding: '8px 14px',
                borderRadius: '6px',
                transition: 'all 0.15s ease',
                fontWeight: 400,
              }}
              onMouseEnter={e => {
                (e.target as HTMLElement).style.color = '#fff'
                ;(e.target as HTMLElement).style.background = 'rgba(255,255,255,0.08)'
              }}
              onMouseLeave={e => {
                (e.target as HTMLElement).style.color = 'rgba(255,255,255,0.75)'
                ;(e.target as HTMLElement).style.background = 'transparent'
              }}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Login button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Link
            href="/login"
            className="btn btn-outline-white btn-sm"
            style={{ fontSize: '13.5px' }}
          >
            Sign in to portal
          </Link>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            style={{
              background: 'none',
              border: 'none',
              color: '#fff',
              cursor: 'pointer',
              padding: '6px',
              display: 'none',
            }}
            className="mobile-menu-btn"
            aria-label="Toggle menu"
          >
            {menuOpen ? (
              <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M6 18L18 6M6 6l12 12"/>
              </svg>
            ) : (
              <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M4 6h16M4 12h16M4 18h16"/>
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div style={{
          background: 'var(--navy)',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          padding: '12px 24px 20px',
        }}>
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              style={{
                display: 'block',
                color: 'rgba(255,255,255,0.8)',
                textDecoration: 'none',
                fontSize: '15px',
                padding: '12px 0',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/login"
            onClick={() => setMenuOpen(false)}
            style={{
              display: 'block',
              marginTop: '16px',
              textAlign: 'center',
              background: 'var(--blue)',
              color: '#fff',
              textDecoration: 'none',
              padding: '12px',
              borderRadius: '8px',
              fontWeight: 500,
              fontSize: '14px',
            }}
          >
            Sign in to portal
          </Link>
        </div>
      )}

      {/* Responsive styles */}
      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: block !important; }
        }
      `}</style>
    </nav>
  )
}