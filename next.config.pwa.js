/** @type {import('next-pwa').PWAConfig} */
// eslint-disable-next-line @typescript-eslint/no-require-imports
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  runtimeCaching: [
    {
      urlPattern: /^https?.*\.(png|jpg|jpeg|svg|gif|webp)$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'images',
        expiration: {
          maxEntries: 64,
          maxAgeSeconds: 30 * 24 * 60 * 60 // 30 days
        }
      }
    },
    {
      urlPattern: /^https?.*\.(js|css)$/,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'static-resources'
      }
    }
  ],
  publicExcludes: ['!noprecache/**/*'],
  buildExcludes: [/middleware-manifest\.json$/]
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Your existing Next.js config
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
}

module.exports = withPWA(nextConfig)