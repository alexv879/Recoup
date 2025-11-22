const { withSentryConfig } = require('@sentry/nextjs');

/** @type {import('next').NextConfig} */
const nextConfig = {
    // Enable system TLS certificates for Turbopack (fixes Google Fonts issue)
    experimental: {
        turbopackUseSystemTlsCerts: true,
    },

    // Production source maps for Sentry error tracking
    productionBrowserSourceMaps: true,
};

// Sentry options for webpack plugin
const sentryWebpackPluginOptions = {
    // Auth token for uploading source maps
    authToken: process.env.SENTRY_AUTH_TOKEN,

    // Organization and project from Sentry dashboard
    org: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT,

    // Only upload source maps in production
    silent: process.env.NODE_ENV !== 'production',

    // Disable during development
    dryRun: process.env.NODE_ENV !== 'production',
};

// Wrap config with Sentry
// Only apply Sentry wrapper if credentials are available
module.exports =
    process.env.SENTRY_ORG && process.env.SENTRY_PROJECT
        ? withSentryConfig(nextConfig, sentryWebpackPluginOptions)
        : nextConfig;
