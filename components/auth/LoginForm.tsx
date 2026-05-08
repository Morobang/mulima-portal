'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

export default function LoginForm() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [showPass, setShowPass] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()

    // 1. Sign in with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError || !authData.user) {
      setError('Incorrect email or password. Please try again.')
      setLoading(false)
      return
    }

    // 2. Fetch the user's role from profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', authData.user.id)
      .single()

    if (profileError || !profile) {
      setError('Account not set up correctly. Please contact the school admin.')
      setLoading(false)
      return
    }

    // 3. Redirect based on role
    const roleRoutes: Record<string, string> = {
      student: '/student',
      parent:  '/parent',
      teacher: '/teacher',
      admin:   '/admin',
    }

    const destination = roleRoutes[profile.role] ?? '/'
    window.location.href = destination
  }

  return (
    <div>
      {/* School logo header */}
      <div style={{ textAlign: 'center', marginBottom: '36px' }}>
        <Link href="/" style={{ textDecoration: 'none', display: 'inline-block' }}>
          <div style={{
            width: '56px', height: '56px',
            background: 'var(--blue)',
            borderRadius: '16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: '18px', color: '#fff',
            margin: '0 auto 16px',
            boxShadow: '0 8px 24px rgba(30,95,158,0.4)',
          }}>
            MS
          </div>
        </Link>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '24px', fontWeight: 700,
          color: '#fff', marginBottom: '6px',
        }}>
          Mulima Secondary School
        </h1>
        <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.55)' }}>
          Sign in to access your portal
        </p>
      </div>

      {/* Card */}
      <div style={{
        background: '#fff',
        borderRadius: '20px',
        padding: '36px',
        boxShadow: '0 24px 64px rgba(0,0,0,0.2)',
      }}>

        {/* Error alert */}
        {error && (
          <div className="alert alert-danger" style={{ marginBottom: '20px' }}>
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin}>

          {/* Email */}
          <div style={{ marginBottom: '18px' }}>
            <label className="label" htmlFor="email">
              Email address
            </label>
            <input
              id="email"
              type="email"
              className="input"
              placeholder="you@mulima.edu.za"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: '10px' }}>
            <label className="label" htmlFor="password">
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="password"
                type={showPass ? 'text' : 'password'}
                className="input"
                placeholder="Enter your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                style={{ paddingRight: '44px' }}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                style={{
                  position: 'absolute', right: '12px', top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none', border: 'none',
                  cursor: 'pointer', color: 'var(--gray-mid)',
                  fontSize: '16px', padding: '4px',
                }}
                aria-label="Toggle password visibility"
              >
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {/* Forgot password */}
          <div style={{ textAlign: 'right', marginBottom: '24px' }}>
            <Link
              href="/forgot-password"
              style={{
                fontSize: '13px', color: 'var(--blue)',
                textDecoration: 'none', fontWeight: 500,
              }}
            >
              Forgot your password?
            </Link>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{
              width: '100%',
              padding: '13px',
              fontSize: '15px',
              borderRadius: '10px',
              opacity: loading ? 0.7 : 1,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                <span style={{
                  width: '16px', height: '16px',
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTopColor: '#fff',
                  borderRadius: '50%',
                  display: 'inline-block',
                  animation: 'spin 0.7s linear infinite',
                }} />
                Signing in...
              </span>
            ) : (
              'Sign in to portal'
            )}
          </button>
        </form>

        {/* Divider */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '12px',
          margin: '24px 0',
        }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--gray-border)' }} />
          <span style={{ fontSize: '12px', color: 'var(--gray-mid)' }}>need help?</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--gray-border)' }} />
        </div>

        {/* Help text */}
        <div style={{
          background: 'var(--blue-pale)',
          borderRadius: '10px',
          padding: '14px 16px',
          fontSize: '13px',
          color: 'var(--gray-dark)',
          lineHeight: 1.6,
        }}>
          <strong style={{ color: 'var(--navy)' }}>First time signing in?</strong><br />
          Your login credentials are provided by the school admin office.
          Contact us at <span style={{ color: 'var(--blue)' }}>admin@mulima.edu.za</span> or
          call <span style={{ color: 'var(--blue)' }}>015 000 1234</span>.
        </div>
      </div>

      {/* Back to site */}
      <div style={{ textAlign: 'center', marginTop: '24px' }}>
        <Link
          href="/"
          style={{
            color: 'rgba(255,255,255,0.55)',
            textDecoration: 'none',
            fontSize: '13.5px',
            transition: 'color 0.15s',
          }}
        >
          ← Back to school website
        </Link>
      </div>

      {/* Spinner keyframe */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}