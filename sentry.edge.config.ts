import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://0cbaa5575ad5cecd2f6737cd5dc5c3f@o4509808916168704.ingest.de.sentry.io/4509808922722384",
  
  // Traccia il 100% degli errori edge
  tracesSampleRate: 1.0,
  
  // Ambiente
  environment: process.env.NODE_ENV,
  
  // Tags per edge runtime
  initialScope: {
    tags: {
      app: 'flexcoach',
      component: 'edge',
      runtime: 'edge',
    },
  },
  
  // Debug mode
  debug: process.env.NODE_ENV === 'development',
});