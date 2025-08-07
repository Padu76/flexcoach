import { initializeApp, getApps, FirebaseApp } from 'firebase/app'
import { getAuth, Auth } from 'firebase/auth'
import { getFirestore, Firestore } from 'firebase/firestore'
import { getAnalytics, Analytics } from 'firebase/analytics'
import type { FirebaseConfig } from '@/types'

// Configurazione Firebase dalle variabili d'ambiente
const firebaseConfig: FirebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
}

// Validate configuration
const validateConfig = (config: FirebaseConfig): void => {
  const requiredFields: (keyof FirebaseConfig)[] = [
    'apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'
  ]
  
  for (const field of requiredFields) {
    if (!config[field]) {
      throw new Error(`Firebase configuration missing: ${field}`)
    }
  }
}

// Inizializza Firebase
let app: FirebaseApp
let auth: Auth
let db: Firestore
let analytics: Analytics | null = null

// Funzione di inizializzazione sicura
const initializeFirebase = (): FirebaseApp => {
  try {
    validateConfig(firebaseConfig)
    
    // Controlla se Firebase è già inizializzato
    const existingApps = getApps()
    if (existingApps.length > 0) {
      console.log('Firebase already initialized')
      return existingApps[0] as FirebaseApp
    }
    
    // Inizializza nuova app
    const newApp = initializeApp(firebaseConfig)
    console.log('Firebase initialized successfully')
    return newApp
    
  } catch (error) {
    console.error('Firebase initialization error:', error)
    throw error
  }
}

// Inizializza Firebase
app = initializeFirebase()
auth = getAuth(app)
db = getFirestore(app)

// Analytics solo in produzione e nel browser
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
  try {
    analytics = getAnalytics(app)
    console.log('Firebase Analytics initialized')
  } catch (error) {
    console.warn('Firebase Analytics initialization failed:', error)
  }
}

// Configurazione Firestore
export const firestoreConfig = {
  // Configurazioni di cache e offline
  settings: {
    cacheSizeBytes: 40000000, // 40MB cache
  },
  
  // Collezioni principali
  collections: {
    users: 'users',
    workoutSessions: 'workoutSessions',
    exercises: 'exercises',
    userProgress: 'userProgress',
    feedback: 'feedback'
  }
}

// Helper per ottenere riferimenti alle collezioni
import { collection, CollectionReference, DocumentData } from 'firebase/firestore'

export const getCollection = (collectionName: string): CollectionReference<DocumentData> => {
  return collection(db, collectionName)
}

// Riferimenti specifici alle collezioni principali
export const collections = {
  users: getCollection(firestoreConfig.collections.users),
  workoutSessions: getCollection(firestoreConfig.collections.workoutSessions),
  exercises: getCollection(firestoreConfig.collections.exercises),
  userProgress: getCollection(firestoreConfig.collections.userProgress),
  feedback: getCollection(firestoreConfig.collections.feedback),
}

// Configurazione Auth
export const authConfig = {
  // Configurazioni di autenticazione
  persistence: 'local' as const,
  
  // Provider supportati
  providers: {
    google: {
      enabled: true,
      scopes: ['profile', 'email']
    },
    apple: {
      enabled: true,
      scopes: ['name', 'email']
    }
  }
}

// Esporta servizi Firebase
export { app, auth, db, analytics }

// Utility per verificare se Firebase è pronto
export const isFirebaseReady = (): boolean => {
  return !!(app && auth && db)
}

// Helper per errori Firebase
export const getFirebaseErrorMessage = (error: any): string => {
  if (!error?.code) return 'Errore sconosciuto'
  
  const errorMessages: Record<string, string> = {
    'auth/user-not-found': 'Utente non trovato',
    'auth/wrong-password': 'Password errata',
    'auth/email-already-in-use': 'Email già in uso',
    'auth/weak-password': 'Password troppo debole',
    'auth/invalid-email': 'Email non valida',
    'auth/too-many-requests': 'Troppi tentativi, riprova più tardi',
    'auth/network-request-failed': 'Errore di connessione',
    'firestore/permission-denied': 'Permessi insufficienti',
    'firestore/unavailable': 'Servizio temporaneamente non disponibile'
  }
  
  return errorMessages[error.code] || error.message || 'Errore sconosciuto'
}

// Debug info (solo in development)
if (process.env.NODE_ENV === 'development') {
  console.log('Firebase Configuration:', {
    projectId: firebaseConfig.projectId,
    authDomain: firebaseConfig.authDomain,
    hasAnalytics: !!analytics,
    collections: Object.keys(firestoreConfig.collections)
  })
}