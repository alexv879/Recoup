/** @type {import('next').NextConfig} */
const nextConfig = {
    // Disable Turbopack for this build to use webpack config
    experimental: {
        turbo: false,
    },
};

module.exports = nextConfig;