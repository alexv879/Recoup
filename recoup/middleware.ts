/**
 * Clerk Authentication Middleware
 * Implements 2025 best practice pattern with clerkMiddleware and createRouteMatcher
 *
 * This middleware runs on Edge Runtime for <100ms auth checks
 * Per IMPROVEMENTS_SUMMARY.md lines 78-91
 */

import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// Define protected routes that require authentication
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/invoices(.*)',
  '/clients(.*)',
  '/api/dashboard(.*)',
  '/api/invoices(.*)',
  '/api/clients(.*)',
  '/api/voice(.*)',
  '/api/user(.*)',
]);

// Define admin routes
const isAdminRoute = createRouteMatcher([
  '/admin(.*)',
  '/api/admin(.*)',
]);

// Public routes that should be accessible without authentication
const isPublicRoute = createRouteMatcher([
  '/',
  '/pricing',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/confirmation(.*)',
  '/invoice/(.*)',
  '/api/webhooks(.*)',
  '/api/cron(.*)',
  '/api/health',
]);

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims } = await auth();

  // Allow public routes
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }

  // Protect admin routes - require specific role
  if (isAdminRoute(req)) {
    if (!userId) {
      return NextResponse.redirect(new URL('/sign-in', req.url));
    }

    // Check for admin role in session claims
    const isAdmin = (sessionClaims?.metadata as any)?.role === 'admin';
    if (!isAdmin) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    return NextResponse.next();
  }

  // Protect all other protected routes
  if (isProtectedRoute(req)) {
    if (!userId) {
      return NextResponse.redirect(new URL('/sign-in', req.url));
    }

    return NextResponse.next();
  }

  // Default: allow all other routes
  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     * - health check endpoints
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
