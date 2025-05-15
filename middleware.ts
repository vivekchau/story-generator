import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request })
  const returnUrl = request.cookies.get('returnUrl')?.value

  // If user is authenticated and there's a returnUrl, redirect to it
  if (token && returnUrl) {
    const response = NextResponse.redirect(new URL(returnUrl, request.url))
    response.cookies.delete('returnUrl')
    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/api/auth/:path*']
} 