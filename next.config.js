const { withSentryConfig } = require('@sentry/nextjs');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Ottimizzazioni immagini
  images: {
    domains: ['localhost'],
  },
  
  // Experimental features per performance
  experimental: {
    optimizeCss: true,
  },
  
  // Headers di sicurezza
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          // Permessi per webcam e audio
          {
            key: 'Permissions-Policy',
            value: 'camera=(*), microphone=(*)',
          },
        ],
      },
    ];
  },
  
  // Webpack config per TensorFlow e MediaPipe
  webpack: (config, { isServer }) => {
    // Fix per TensorFlow.js
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
};

// Configurazione Sentry
module.exports = withSentryConfig(
  nextConfig,
  {
    // Configurazione organizzazione Sentry
    org: "padu76-9j",
    project: "flexcoach-monitoring",
    
    // Auth token per upload source maps (viene da env)
    authToken: process.env.SENTRY_AUTH_TOKEN,
    
    // Opzioni generali
    silent: true, // Non mostrare log Sentry durante build
    
    // Source maps
    widenClientFileUpload: true,
    hideSourceMaps: true, // Nasconde source maps in produzione
    disableLogger: true, // Disabilita Sentry logger in produzione
    
    // Tunneling per evitare ad-blockers
    tunnelRoute: "/monitoring",
    
    // Auto-instrumentazione
    autoInstrumentServerFunctions: true,
    autoInstrumentMiddleware: true,
  },
  {
    // Upload options
    transpileClientSDK: true,
    
    // Tree shaking
    disableServerWebpackPlugin: false,
    disableClientWebpackPlugin: false,
    
    // Release tracking
    automaticVercelMonitors: true,
  }
);