'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { Mail, AlertTriangle } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail]     = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent]       = useState(false)
  const [error, setError]     = useState('')

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    if (error) {
      setError('Something went wrong. Please try again or contact the school.')
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  return (
    <div>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '36px' }}>
        <div style={{
          width: '56px', height: '56px',
          background: 'var(--blue)', borderRadius: '16px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 700, fontSize: '18px', color: '#fff',
          margin: '0 auto 16px',
          boxShadow: '0 8px 24px rgba(30,95,158,0.4)',
        }}>
          MS
        </div>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '22px', fontWeight: 700,
          color: '#fff', marginBottom: '6px',
        }}>
          Reset your password
        </h1>
        <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.55)' }}>
          We will send a reset link to your email
        </p>
      </div>

      {/* Card */}
      <div style={{
        background: '#fff', borderRadius: '20px',
        padding: '36px', boxShadow: '0 24px 64px rgba(0,0,0,0.2)',
      }}>
        {sent ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '72px', height: '72px',
              background: 'var(--blue-pale)', borderRadius: '50%',
              margin: '0 auto 16px',
            }}>
              <Mail size={32} strokeWidth={1.5} style={{ color: 'var(--blue)' }} />
            </div>
            <h2 style={{ color: 'var(--navy)', marginBottom: '10px', fontSize: '18px' }}>
              Check your email
            </h2>
            <p style={{ color: 'var(--gray-mid)', fontSize: '14px', lineHeight: 1.7 }}>
              We sent a password reset link to <strong>{email}</strong>.
              Click the link in the email to set a new password.
            </p>
            <Link
              href="/login"
              className="btn btn-primary"
              style={{ marginTop: '24px', width: '100%', justifyContent: 'center' }}
            >
              Back to sign in
            </Link>
          </div>
        ) : (
          <form onSubmit={handleReset}>
            {error && (
              <div className="alert alert-danger" style={{ marginBottom: '20px' }}>
                <AlertTriangle size={14} strokeWidth={2} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}
            <div style={{ marginBottom: '20px' }}>
              <label className="label" htmlFor="email">Your school email address</label>
              <input
                id="email"
                type="email"
                className="input"
                placeholder="you@mulima.edu.za"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ width: '100%', padding: '13px', fontSize: '15px', borderRadius: '10px' }}
            >
              {loading ? 'Sending...' : 'Send reset link'}
            </button>
          </form>
        )}
      </div>

      <div style={{ textAlign: 'center', marginTop: '24px' }}>
        <Link href="/login" style={{ color: 'rgba(255,255,255,0.55)', textDecoration: 'none', fontSize: '13.5px' }}>
          ← Back to sign in
        </Link>
      </div>
    </div>
  )
}
