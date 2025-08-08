import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://0cbaa5575ad5cecd2f6737cd5dc5c3f@o4509808916168704.ingest.de.sentry.io/4509808922722384",
  
  // Traccia il 100% degli errori in produzione, 10% in dev
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 1.0 : 0.1,
  
  // Session Replay - registra video della sessione quando c'è un errore
  replaysOnErrorSampleRate: 1.0, // 100% quando c'è errore
  replaysSessionSampleRate: 0.1, // 10% sessioni normali
  
  // Ambiente
  environment: process.env.NODE_ENV,
  
  // Integrations
  integrations: [
    new Sentry.Replay({
      maskAllText: false, // Non mascherare testo (utile per debug)
      blockAllMedia: false, // Non bloccare media (vogliamo vedere video webcam)
      maskAllInputs: true, // Maschera password e input sensibili
      
      // Opzioni privacy
      privacy: {
        maskTextFn: (text, element) => {
          // Maschera solo elementi con classe "sensitive"
          if (element?.classList?.contains('sensitive')) {
            return '[REDACTED]';
          }
          return text;
        },
      },
    }),
    
    // Browser Tracing per performance
    new Sentry.BrowserTracing({
      // Traccia navigazione e fetch
      routingInstrumentation: Sentry.nextRouterInstrumentation,
      
      // Traccia specificamente le chiamate AI
      tracePropagationTargets: [
        'localhost',
        /^https:\/\/cdn\.jsdelivr\.net/, // TensorFlow CDN
        /^https:\/\/.*\.tensorflow\.org/,
        /^\/api/,
      ],
    }),
  ],
  
  // Performance Monitoring
  profilesSampleRate: 1.0, // Profiling performance
  
  // Filtra errori non importanti
  ignoreErrors: [
    // Errori browser comuni
    'ResizeObserver loop limit exceeded',
    'ResizeObserver loop completed with undelivered notifications',
    'Non-Error promise rejection captured',
    
    // Errori di rete non critici
    /Failed to fetch/,
    /NetworkError/,
    /Load failed/,
  ],
  
  // Before send - personalizza prima di inviare
  beforeSend(event, hint) {
    // Log in console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Sentry Event:', event);
      console.error('Error:', hint.originalException || hint.syntheticException);
    }
    
    // Aggiungi context FlexCoach
    if (event.contexts) {
      event.contexts.flexcoach = {
        version: '1.0.0',
        feature: window.location.pathname.includes('/exercises') ? 'exercise' : 
                 window.location.pathname.includes('/trainer') ? 'trainer' : 
                 window.location.pathname.includes('/dashboard') ? 'dashboard' : 'other',
      };
    }
    
    // Non inviare errori in localhost (opzionale)
    if (window.location.hostname === 'localhost') {
      return null; // Commenta questa riga se vuoi errori anche in dev
    }
    
    return event;
  },
  
  // Tags globali
  initialScope: {
    tags: {
      app: 'flexcoach',
      component: 'client',
    },
    user: {
      // Popolato dinamicamente quando user fa login
    },
  },
  
  // Debug mode (solo in dev)
  debug: process.env.NODE_ENV === 'development',
});