/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // Ottimizzazioni per MediaPipe
  webpack: (config, { isServer }) => {
    // Gestione WASM files per MediaPipe
    config.module.rules.push({
      test: /\.wasm$/,
      type: 'webassembly/async',
    });

    // Fallback per moduli Node.js nel browser
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };
    }

    return config;
  },

  // Headers per sicurezza e performance
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=self, microphone=(), geolocation=(), interest-cohort=()'
          }
        ],
      },
      {
        // Cache per file MediaPipe
        source: '/models/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31556952, immutable'
          }
        ],
      },
    ];
  },

  // Rewrites per CDN MediaPipe
  async rewrites() {
    return [
      {
        source: '/mediapipe/:path*',
        destination: 'https://cdn.jsdelivr.net/npm/@mediapipe/:path*'
      }
    ];
  },

  // Compressione immagini
  images: {
    domains: ['firebasestorage.googleapis.com', 'cdn.jsdelivr.net'],
    formats: ['image/avif', 'image/webp'],
  },

  // Experimental features per performance
  experimental: {
    // optimizeCss: true, // Rimosso temporaneamente - causa errori in build
  },

  // Transpile MediaPipe packages
  transpilePackages: ['@mediapipe/tasks-vision'],
};

module.exports = nextConfig;