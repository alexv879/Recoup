/**
 * Next.js Configuration with Vercel Optimizations
 * Implements 2025 best practices for Vercel deployment
 * Per IMPROVEMENTS_SUMMARY.md lines 94-104
 */

/** @type {import('next').NextConfig} */
const nextConfig = {
    // Acknowledge webpack config - using webpack instead of turbopack
    turbopack: {},

    // Experimental features
    experimental: {
        // Enable server actions for forms
        serverActions: {
            bodySizeLimit: '25mb', // For voice file uploads
        },
    },

    // Image optimization
    images: {
        formats: ['image/avif', 'image/webp'],
        minimumCacheTTL: 60,
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'firebasestorage.googleapis.com',
            },
            {
                protocol: 'https',
                hostname: '**.clerk.com',
            },
        ],
    },

    // Headers for security and performance
    async headers() {
        return [
            {
                source: '/(.*)',
                headers: [
                    {
                        key: 'X-DNS-Prefetch-Control',
                        value: 'on'
                    },
                    {
                        key: 'X-Frame-Options',
                        value: 'SAMEORIGIN'
                    },
                    {
                        key: 'X-Content-Type-Options',
                        value: 'nosniff'
                    },
                    {
                        key: 'Referrer-Policy',
                        value: 'strict-origin-when-cross-origin'
                    },
                ],
            },
            // Cache static assets
            {
                source: '/static/:path*',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=31536000, immutable',
                    },
                ],
            },
        ];
    },

    // Optimize bundle
    webpack: (config, { isServer }) => {
        // Optimize for production
        if (!isServer) {
            config.optimization = {
                ...config.optimization,
                splitChunks: {
                    chunks: 'all',
                    cacheGroups: {
                        default: false,
                        vendors: false,
                        // Vendor chunk for node_modules
                        vendor: {
                            name: 'vendor',
                            chunks: 'all',
                            test: /node_modules/,
                            priority: 20,
                        },
                        // Separate chunk for large libraries
                        firebase: {
                            name: 'firebase',
                            test: /[\\/]node_modules[\\/](firebase|@firebase)[\\/]/,
                            priority: 30,
                        },
                        clerk: {
                            name: 'clerk',
                            test: /[\\/]node_modules[\\/]@clerk[\\/]/,
                            priority: 30,
                        },
                        // Common chunk for shared code
                        common: {
                            name: 'common',
                            minChunks: 2,
                            priority: 10,
                            reuseExistingChunk: true,
                            enforce: true,
                        },
                    },
                },
            };
        }

        return config;
    },

    // Redirects
    async redirects() {
        return [
            {
                source: '/home',
                destination: '/dashboard',
                permanent: true,
            },
        ];
    },

    // Rewrites for API proxying (if needed)
    async rewrites() {
        return [
            // Example: Proxy to Python services in development
            // In production, use environment variables
        ];
    },

    // Production optimizations
    productionBrowserSourceMaps: false, // Disable source maps in production for security
    poweredByHeader: false, // Remove X-Powered-By header
    compress: true, // Enable gzip compression

    // Standalone output for Docker (optional)
    // output: 'standalone',
};

module.exports = nextConfig;
