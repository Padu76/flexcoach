// Utils barrel export and general utilities
export * from './angleCalculations'
export * from './exerciseAnalysis'

// Utility functions

/**
 * Combina classi CSS in modo sicuro
 */
export const cn = (...classes: (string | undefined | null | false)[]): string => {
  return classes.filter(Boolean).join(' ')
}

/**
 * Formatta il tempo in millisecondi in formato leggibile
 */
export const formatDuration = (ms: number): string => {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`
  }
  return `${seconds}s`
}

/**
 * Formatta una data in formato locale italiano
 */
export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('it-IT', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

/**
 * Debounce function per limitare le chiamate frequenti
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

/**
 * Throttle function per limitare la frequenza di esecuzione
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean = false
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

/**
 * Genera un ID univoco
 */
export const generateId = (): string => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

/**
 * Controlla se il dispositivo è mobile
 */
export const isMobile = (): boolean => {
  if (typeof window === 'undefined') return false
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

/**
 * Controlla se il browser supporta getUserMedia
 */
export const supportsCamera = (): boolean => {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
}

/**
 * Controlla se il browser supporta WebAssembly (per MediaPipe)
 */
export const supportsWebAssembly = (): boolean => {
  return typeof WebAssembly === 'object' && typeof WebAssembly.instantiate === 'function'
}

/**
 * Sleep function per introdurre delay
 */
export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Clamp di un valore tra min e max
 */
export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max)
}

/**
 * Interpola linearmente tra due valori
 */
export const lerp = (start: number, end: number, factor: number): number => {
  return start + (end - start) * clamp(factor, 0, 1)
}

/**
 * Converte gradi in radianti
 */
export const toRadians = (degrees: number): number => {
  return degrees * (Math.PI / 180)
}

/**
 * Converte radianti in gradi
 */
export const toDegrees = (radians: number): number => {
  return radians * (180 / Math.PI)
}

/**
 * Arrotonda un numero a un numero specifico di decimali
 */
export const roundTo = (value: number, decimals: number): number => {
  const factor = Math.pow(10, decimals)
  return Math.round(value * factor) / factor
}

/**
 * Calcola la media di un array di numeri
 */
export const average = (numbers: number[]): number => {
  if (numbers.length === 0) return 0
  return numbers.reduce((sum, num) => sum + num, 0) / numbers.length
}

/**
 * Trova il valore mediano in un array di numeri
 */
export const median = (numbers: number[]): number => {
  if (numbers.length === 0) return 0
  
  const sorted = [...numbers].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  
  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2
  } else {
    return sorted[middle]
  }
}

/**
 * Gestione errori con logging
 */
export const handleError = (error: unknown, context: string = ''): void => {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error'
  const fullMessage = context ? `${context}: ${errorMessage}` : errorMessage
  
  console.error(fullMessage, error)
  
  // In produzione, potresti voler inviare l'errore a un servizio di monitoring
  if (process.env.NODE_ENV === 'production') {
    // Esempio: Sentry.captureException(error)
  }
}

/**
 * Valida se una stringa è un'email valida
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Capitalizza la prima lettera di una stringa
 */
export const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

/**
 * Tronca una stringa a una lunghezza specifica
 */
export const truncate = (str: string, length: number, suffix: string = '...'): string => {
  if (str.length <= length) return str
  return str.substring(0, length) + suffix
}

/**
 * Rimuove caratteri speciali da una stringa
 */
export const sanitizeString = (str: string): string => {
  return str.replace(/[^a-zA-Z0-9 ]/g, '')
}

/**
 * Converte una stringa in slug URL-friendly
 */
export const slugify = (str: string): string => {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

/**
 * Storage sicuro per localStorage con fallback
 */
export const storage = {
  get: (key: string, fallback: any = null): any => {
    if (typeof window === 'undefined') return fallback
    
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : fallback
    } catch {
      return fallback
    }
  },
  
  set: (key: string, value: any): boolean => {
    if (typeof window === 'undefined') return false
    
    try {
      localStorage.setItem(key, JSON.stringify(value))
      return true
    } catch {
      return false
    }
  },
  
  remove: (key: string): boolean => {
    if (typeof window === 'undefined') return false
    
    try {
      localStorage.removeItem(key)
      return true
    } catch {
      return false
    }
  }
}