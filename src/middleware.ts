import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// ============================================================
// 📅 MÊME DATE QUE DANS countdown/page.tsx
// Quand cette date est passée, le middleware laisse passer tout le monde.
// ============================================================
const TARGET_DATE = new Date(2026, 2, 16, 18, 0, 0) // 16 mars 2026 à 18h00

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Si la date est passée, ne rien bloquer
  if (new Date() >= TARGET_DATE) {
    return NextResponse.next()
  }

  // Routes autorisées même avant la date
  const allowedPrefixes = ['/admin', '/dashboard', '/countdown', '/api', '/_next', '/favicon.ico']
  const isAllowed = allowedPrefixes.some((prefix) => pathname.startsWith(prefix))

  if (isAllowed) {
    return NextResponse.next()
  }

  // Rediriger vers la page countdown
  const url = request.nextUrl.clone()
  url.pathname = '/countdown'
  return NextResponse.redirect(url)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
