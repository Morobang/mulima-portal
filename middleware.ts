import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            req.cookies.set(name, value)
            res.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()
  const path = req.nextUrl.pathname

  // ── Not logged in → send to login ───────────────────────
  const protectedPrefixes = ['/student', '/parent', '/teacher', '/admin']
  const isProtected = protectedPrefixes.some(p => path.startsWith(p))

  if (isProtected && !session) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // ── Already logged in → don't show login page again ─────
  if (session && path === '/login') {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    const roleRoutes: Record<string, string> = {
      student: '/student',
      parent:  '/parent',
      teacher: '/teacher',
      admin:   '/admin',
    }

    const destination = roleRoutes[profile?.role ?? ''] ?? '/'
    return NextResponse.redirect(new URL(destination, req.url))
  }

  // ── Wrong role accessing wrong section ───────────────────
  if (session && isProtected) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    const role = profile?.role ?? ''

    const roleRoutes: Record<string, string> = {
      student: '/student',
      parent:  '/parent',
      teacher: '/teacher',
      admin:   '/admin',
    }

    const allowedPrefix = roleRoutes[role]

    if (allowedPrefix && !path.startsWith(allowedPrefix)) {
      return NextResponse.redirect(new URL(allowedPrefix, req.url))
    }
  }

  return res
}

export const config = {
  matcher: [
    '/student/:path*',
    '/parent/:path*',
    '/teacher/:path*',
    '/admin/:path*',
    '/login',
  ],
}