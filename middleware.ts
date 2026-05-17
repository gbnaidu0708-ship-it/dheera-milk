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

  // Redirect authenticated away from auth page
  if (session && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Admin gate
  if (session && isAdminRoute) {
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('auth_id', session.user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return response
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/auth'],
}
