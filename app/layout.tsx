import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'FlexCoach - AI-Powered Fitness Trainer',
  description: 'Feedback in tempo reale e correzione della forma per allenamenti perfetti. Ricevi feedback istantaneo sulla tua tecnica di squat, panca piana e stacco usando AI avanzata.',
  keywords: ['fitness', 'AI', 'rilevamento posturale', 'allenamento', 'correzione forma', 'personal trainer', 'esercizi'],
  authors: [{ name: 'FlexCoach Team' }],
  creator: 'FlexCoach',
  publisher: 'FlexCoach',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://flexcoach.vercel.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'FlexCoach - AI-Powered Fitness Trainer',
    description: 'Ricevi feedback in tempo reale sulla forma del tuo allenamento con rilevamento posturale AI',
    url: 'https://flexcoach.vercel.app',
    siteName: 'FlexCoach',
    locale: 'it_IT',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FlexCoach - AI-Powered Fitness Trainer',
    description: 'Ricevi feedback in tempo reale sulla forma del tuo allenamento con rilevamento posturale AI',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="it" suppressHydrationWarning>
      <head>
        {/* Preconnect to external domains for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* Theme color */}
        <meta name="theme-color" content="#2563eb" />
        <meta name="msapplication-TileColor" content="#2563eb" />
        
        {/* Viewport for mobile optimization */}
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
      </head>
      <body className={`${inter.className} antialiased bg-gray-50 text-gray-900`}>
        {/* Skip to main content for accessibility */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary-600 text-white px-4 py-2 rounded-md z-50"
        >
          Vai al contenuto principale
        </a>
        
        {/* Main application */}
        <div className="min-h-screen flex flex-col">
          {/* Header semplificato senza navigation */}
          <header className="bg-white shadow-sm border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                <div className="flex items-center">
                  <span className="text-2xl font-bold text-primary-600">
                    FlexCoach
                  </span>
                </div>
                
                {/* Placeholder per menu futuro */}
                <nav className="hidden md:flex items-center space-x-4">
                  <span className="text-sm text-gray-500">
                    Menu presto disponibile
                  </span>
                </nav>
                
                {/* Mobile menu placeholder */}
                <div className="md:hidden">
                  <span className="text-sm text-gray-500">
                    🚧
                  </span>
                </div>
              </div>
            </div>
          </header>

          {/* Main content */}
          <main id="main-content" className="flex-1">
            {children}
          </main>

          {/* Footer */}
          <footer className="bg-gray-800 text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="text-center">
                <p className="text-gray-400">
                  © {new Date().getFullYear()} FlexCoach. Tutti i diritti riservati.
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Allenamento fitness AI con correzione della forma in tempo reale
                </p>
                <p className="text-xs text-yellow-400 mt-4">
                  🚧 Sito in costruzione - Funzionalità in arrivo presto!
                </p>
              </div>
            </div>
          </footer>
        </div>
        
        {/* Development indicator */}
        {process.env.NODE_ENV === 'development' && (
          <div className="fixed bottom-4 right-4 bg-yellow-500 text-black px-3 py-1 rounded text-xs font-mono">
            DEV
          </div>
        )}
      </body>
    </html>
  )
}