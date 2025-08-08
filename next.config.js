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
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ]
  },
  
  // Redirects se necessari
  async redirects() {
    return []
  },
  
  // Webpack config per ottimizzazioni
  webpack: (config, { isServer }) => {
    // Ignora warning per moduli opzionali
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    }
    
    return config
  },
}

module.exports = nextConfig