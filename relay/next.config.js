/**
 * [SECURITY FIX] Next.js Configuration with Security Hardening
 *
 * Security Features:
 * - Content Security Policy (CSP)
 * - HSTS (HTTP Strict Transport Security)
 * - X-Frame-Options (Clickjacking protection)
 * - X-Content-Type-Options (MIME sniffing protection)
 * - X-XSS-Protection
 * - Referrer-Policy
 * - Permissions-Policy
 * - CORS configuration
 * - Request body size limits
 *
 * SECURITY AUDIT FIX: HIGH-3, HIGH-4, HIGH-8
 * Issues: No CORS configuration, No CSP, No request size limits
 * Fix: Comprehensive security headers and configuration
 */

/** @type {import('next').NextConfig} */
const nextConfig = {
  // [SECURITY FIX] Enable React strict mode
  reactStrictMode: true,

  // [SECURITY FIX] Disable X-Powered-By header
  poweredByHeader: false,

  // [SECURITY FIX] Security headers
  async headers() {
    return [
      {
        // Apply to all routes
        source: '/:path*',
        headers: [
          // [SECURITY FIX] Content Security Policy
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://clerk.com https://clerk.dev https://js.stripe.com https://www.googletagmanager.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: https: blob:",
              "connect-src 'self' https://clerk.com https://clerk.dev https://api.stripe.com https://api.sendgrid.com https://api.twilio.com https://api.openai.com https://firestore.googleapis.com https://storage.googleapis.com",
              "frame-src 'self' https://clerk.com https://clerk.dev https://js.stripe.com",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "upgrade-insecure-requests",
            ].join('; '),
          },

          // [SECURITY FIX] HTTP Strict Transport Security (HSTS)
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },

          // [SECURITY FIX] Prevent clickjacking
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },

          // [SECURITY FIX] Prevent MIME sniffing
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },

          // [SECURITY FIX] XSS Protection (legacy browsers)
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },

          // [SECURITY FIX] Referrer Policy
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },

          // [SECURITY FIX] Permissions Policy
          {
            key: 'Permissions-Policy',
            value: [
              'camera=()',
              'microphone=()',
              'geolocation=()',
              'payment=(self)',
              'usb=()',
              'magnetometer=()',
              'accelerometer=()',
              'gyroscope=()',
            ].join(', '),
          },
        ],
      },

      // [SECURITY FIX] API routes specific headers
      {
        source: '/api/:path*',
        headers: [
          // Prevent caching of API responses
          {
            key: 'Cache-Control',
            value: 'no-store, max-age=0',
          },

          // CORS headers (allow specific origins)
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization, X-Requested-With, X-CSRF-Token',
          },
          {
            key: 'Access-Control-Allow-Credentials',
            value: 'true',
          },
          {
            key: 'Access-Control-Max-Age',
            value: '86400', // 24 hours
          },
        ],
      },

      // [SECURITY FIX] Webhook routes (different CORS policy)
      {
        source: '/api/webhook/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*', // Webhooks come from external services
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'POST, OPTIONS',
          },
        ],
      },
    ];
  },

  // [SECURITY FIX] Request body size limits
  serverRuntimeConfig: {
    // Max request body size: 1MB (prevents DoS)
    maxRequestBodySize: '1mb',
  },

  // [SECURITY FIX] Image optimization security
  images: {
    domains: [
      'lh3.googleusercontent.com', // Google avatars
      'img.clerk.com', // Clerk avatars
      'storage.googleapis.com', // Firebase Storage
    ],
    // Prevent image optimization DoS
    minimumCacheTTL: 60,
    formats: ['image/webp'],
  },

  // [SECURITY FIX] Webpack configuration
  webpack: (config, { isServer }) => {
    // Security improvements
    if (!isServer) {
      // Don't bundle server-only modules in client bundle
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      };
    }

    return config;
  },

  // [SECURITY FIX] Experimental features
  experimental: {
    // Enable server actions with validation
    serverActions: {
      bodySizeLimit: '1mb',
    },
  },

  // [SECURITY FIX] Redirects for security
  async redirects() {
    return [
      // Force HTTPS in production
      ...(process.env.NODE_ENV === 'production'
        ? [
            {
              source: '/:path*',
              has: [
                {
                  type: 'header',
                  key: 'x-forwarded-proto',
                  value: 'http',
                },
              ],
              destination: 'https://:path*',
              permanent: true,
            },
          ]
        : []),
    ];
  },
};

module.exports = nextConfig;
