import { withSentryConfig } from '@sentry/nextjs';
// next.config.ts - force cache bust 2
import type { NextConfig } from "next";

// Hybrid approach: Static generation for public content, dynamic for admin
// Use NEXT_STATIC_EXPORT=true for full static export (public sites only)
const isFullStaticExport = process.env.NEXT_STATIC_EXPORT === 'true';

const nextConfig: NextConfig = {
  // Only use full static export when explicitly requested
  ...(isFullStaticExport && {
    output: 'export',
    trailingSlash: true,
    images: { unoptimized: true },
    // Custom build ID for static generation
    async generateBuildId() {
      return `static-${Date.now()}`;
    }
  }),
  
  // Enable image optimization for regular deployments
  ...(!isFullStaticExport && {
    images: {
      formats: ['image/webp', 'image/avif'],
      deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
      imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    },
  }),

  // Handle common redirect patterns
  async redirects() {
    return [
      // American to British spelling redirects (from Google Search Console 404s)
      {
        source: '/case-study/goldman-portfolio-optimization',
        destination: '/case-study/goldman-portfolio-optimisation',
        permanent: true,
      },
      {
        source: '/case-study/volkswagen-traffic-optimization',
        destination: '/case-study/volkswagen-traffic-optimisation',
        permanent: true,
      },
      // Removed page redirect
      {
        source: '/quantum-stack',
        destination: '/',
        permanent: true,
      },
      // Legal page URL variations
      {
        source: '/terms-of-service',
        destination: '/terms',
        permanent: true,
      },
      {
        source: '/privacy-policy',
        destination: '/privacy',
        permanent: true,
      },
      // Old/test blog posts redirect to blog root
      {
        source: '/blog/blog-slug',
        destination: '/blog',
        permanent: true,
      },
      {
        source: '/blog/welcome-to-openqase',
        destination: '/blog',
        permanent: true,
      },
    ];
  },
  
  // Simple optimizations only
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons', 'framer-motion'],
  },
  
  // Bundle analyzer (run with ANALYZE=true npm run build)
  ...(process.env.ANALYZE === 'true' && {
    webpack: (config: any) => {
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          reportFilename: '../analyze/client.html',
          openAnalyzer: true,
        })
      );
      return config;
    },
  }),

  pageExtensions: ['ts', 'tsx', 'js', 'jsx'],
  // Enable TypeScript checking during build
  typescript: {
    ignoreBuildErrors: false,
  },
  
  // Security Headers
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: '/(.*)',
        headers: [
          // Content Security Policy
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.googletagmanager.com https://js.sentry-cdn.com https://vercel.live https://va.vercel-scripts.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https:",
              "connect-src 'self' https://*.supabase.co https://*.supabase.com https://o4507902208450560.ingest.us.sentry.io wss://*.supabase.co https://vitals.vercel-insights.com",
              "worker-src 'self' blob:",
              "frame-src 'self' https://vercel.live",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
          // HTTP Strict Transport Security
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          // Prevent MIME type sniffing
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          // Prevent clickjacking
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          // XSS Protection
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          // Referrer Policy
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          // Permissions Policy (formerly Feature Policy)
          {
            key: 'Permissions-Policy',
            value: [
              'camera=()',
              'microphone=()',
              'geolocation=()',
              'interest-cohort=()',
            ].join(', '),
          },
        ],
      },
    ];
  },
};

// Single Sentry configuration (using the correct org)
export default withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options
  org: "openqase-9y",
  project: "openqase",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  tunnelRoute: "/monitoring",

  // Webpack-specific configuration
  webpack: {
    // Automatically tree-shake Sentry logger statements to reduce bundle size
    treeshake: {
      removeDebugLogging: true,
    },
    // Enables automatic instrumentation of Vercel Cron Monitors
    // See: https://docs.sentry.io/product/crons/
    automaticVercelMonitors: true,
  },
});