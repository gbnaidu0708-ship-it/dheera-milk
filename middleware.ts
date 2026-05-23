import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request: { headers: request.headers } })
  const { pathname } = request.nextUrl

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string)                                  { return request.cookies.get(name)?.value },
        set(name: string, value: string, o: CookieOptions) { request.cookies.set({ name, value, ...o }); response.cookies.set({ name, value, ...o }) },
        remove(name: string, o: CookieOptions)             { request.cookies.set({ name, value: '', ...o }); response.cookies.set({ name, value: '', ...o }) },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()

  const isProtected  = pathname.startsWith('/dashboard') || pathname.startsWith('/admin')
  const isAuthPage   = pathname === '/auth'
  const isAdminRoute = pathname.startsWith('/admin')

  // Redirect unauthenticated from protected routes
  if (!session && isProtected) {
    return NextResponse.redirect(new URL('/auth', request.url))
  }

  // Resolve role once and route accordingly.
  let role: string | undefined
  if (session && (isAuthPage || isAdminRoute || pathname === '/dashboard')) {
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('auth_id', session.user.id)
      .single()
    role = profile?.role
  }

  // Authed user landing on /auth → bounce to the right home.
  if (session && isAuthPage) {
    return NextResponse.redirect(new URL(role === 'admin' ? '/admin' : '/dashboard', request.url))
  }

  // Admins shouldn't accidentally land on the customer home.
  if (session && pathname === '/dashboard' && role === 'admin') {
    return NextResponse.redirect(new URL('/admin', request.url))
  }

  // Admin gate for /admin/*
  if (session && isAdminRoute && role !== 'admin') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/auth'],
}
