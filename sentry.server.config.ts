import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://0cbaa5575ad5cecd2f6737cd5dc5c3f@o4509808916168704.ingest.de.sentry.io/4509808922722384",
  
  // Traccia il 100% degli errori server
  tracesSampleRate: 1.0,
  
  // Ambiente
  environment: process.env.NODE_ENV,
  
  // Profiling per performance
  profilesSampleRate: 1.0,
  
  // Integrations server-side
  integrations: [
    // Traccia query database (se usi Prisma/altro)
    new Sentry.Integrations.Prisma({ 
      client: true 
    }),
    
    // HTTP integration
    new Sentry.Integrations.Http({ 
      tracing: true 
    }),
  ],
  
  // Ignora alcuni errori
  ignoreErrors: [
    'ECONNREFUSED',
    'ENOTFOUND',
    'ETIMEDOUT',
  ],
  
  // Before send hook
  beforeSend(event, hint) {
    // Log errori critici
    if (event.level === 'error' || event.level === 'fatal') {
      console.error('[SENTRY SERVER ERROR]', {
        message: event.message,
        exception: hint.originalException,
        extra: event.extra,
      });
    }
    
    // Aggiungi metadata server
    if (event.contexts) {
      event.contexts.runtime = {
        name: 'node',
        version: process.version,
      };
      
      event.contexts.app = {
        app_name: 'flexcoach-api',
        app_version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
      };
    }
    
    return event;
  },
  
  // Tags globali server
  initialScope: {
    tags: {
      app: 'flexcoach',
      component: 'server',
      runtime: 'nodejs',
    },
  },
  
  // Debug (solo in dev)
  debug: process.env.NODE_ENV === 'development',
});