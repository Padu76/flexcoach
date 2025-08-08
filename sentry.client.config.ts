import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://0cbaa5575ad5cecd2f6737cd5dc5c3f@o4509808916168704.ingest.de.sentry.io/4509808922722384",
  
  // Traccia il 100% degli errori in produzione, 10% in dev
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 1.0 : 0.1,
  
  // Registra video quando c'è errore (100% su errori, 10% sessioni normali)
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  
  // Ambiente
  environment: process.env.NODE_ENV,
  
  // Integrations
  integrations: [
    new Sentry.Replay({
      // Maschera testo sensibile
      maskAllText: false,
      maskAllInputs: true,
      
      // Non bloccare media per vedere video workout
      blockAllMedia: false,
    }),
  ],
  
  // Ignora alcuni errori comuni non critici
  ignoreErrors: [
    // Errori di rete
    'NetworkError',
    'Failed to fetch',
    
    // Errori browser extensions
    'chrome-extension://',
    'moz-extension://',
    
    // Errori ResizeObserver comuni in React
    'ResizeObserver loop limit exceeded',
    'ResizeObserver loop completed with undelivered notifications',
    
    // Errori comuni non critici
    'Non-Error promise rejection captured',
  ],
  
  // Filtra transazioni per performance
  tracesSampler: (samplingContext) => {
    // Sempre traccia errori
    if (samplingContext.parentSampled === true) {
      return 1.0;
    }
    
    // Traccia meno le route statiche
    if (samplingContext.location?.pathname === '/') {
      return 0.1;
    }
    
    // Traccia di più le route critiche
    if (samplingContext.location?.pathname?.includes('/exercises')) {
      return 1.0;
    }
    
    // Default
    return 0.5;
  },
  
  // Before send per filtrare/modificare eventi
  beforeSend(event, hint) {
    // In development, logga su console
    if (process.env.NODE_ENV === 'development') {
      console.error('Sentry Event:', event);
      console.error('Error:', hint.originalException || hint.syntheticException);
    }
    
    // Filtra errori di permission denied per webcam (comuni)
    if (event.exception?.values?.[0]?.value?.includes('Permission denied')) {
      return null; // Non inviare a Sentry
    }
    
    return event;
  },
});