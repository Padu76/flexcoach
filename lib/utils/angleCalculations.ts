import type { Poselandmark } from '@/types'

/**
 * Calcola l'angolo tra tre punti (A-B-C) dove B è il vertice
 * @param a Primo punto
 * @param b Punto vertice (centro dell'angolo)
 * @param c Terzo punto
 * @returns Angolo in gradi (0-180)
 */
export const calculateAngle = (a: Poselandmark, b: Poselandmark, c: Poselandmark): number => {
  // Calcola i vettori BA e BC
  const vectorBA = {
    x: a.x - b.x,
    y: a.y - b.y
  }
  
  const vectorBC = {
    x: c.x - b.x,
    y: c.y - b.y
  }
  
  // Calcola il prodotto scalare
  const dotProduct = vectorBA.x * vectorBC.x + vectorBA.y * vectorBC.y
  
  // Calcola le magnitudini
  const magnitudeBA = Math.sqrt(vectorBA.x * vectorBA.x + vectorBA.y * vectorBA.y)
  const magnitudeBC = Math.sqrt(vectorBC.x * vectorBC.x + vectorBC.y * vectorBC.y)
  
  // Evita divisione per zero
  if (magnitudeBA === 0 || magnitudeBC === 0) {
    return 0
  }
  
  // Calcola il coseno dell'angolo
  const cosAngle = dotProduct / (magnitudeBA * magnitudeBC)
  
  // Assicurati che il coseno sia nel range valido [-1, 1]
  const clampedCos = Math.max(-1, Math.min(1, cosAngle))
  
  // Converti in gradi
  const angleInRadians = Math.acos(clampedCos)
  const angleInDegrees = (angleInRadians * 180) / Math.PI
  
  return angleInDegrees
}

/**
 * Calcola l'angolo alternativo utilizzando atan2 (può dare risultati diversi)
 * Utile per alcuni tipi di analisi
 */
export const calculateAngleAtan2 = (a: Poselandmark, b: Poselandmark, c: Poselandmark): number => {
  const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x)
  let angle = Math.abs(radians * 180.0 / Math.PI)
  
  if (angle > 180.0) {
    angle = 360 - angle
  }
  
  return angle
}

/**
 * Calcola la distanza euclidea tra due punti
 */
export const calculateDistance = (a: Poselandmark, b: Poselandmark): number => {
  const dx = a.x - b.x
  const dy = a.y - b.y
  const dz = (a.z || 0) - (b.z || 0)
  
  return Math.sqrt(dx * dx + dy * dy + dz * dz)
}

/**
 * Calcola la distanza 2D tra due punti (ignora z)
 */
export const calculateDistance2D = (a: Poselandmark, b: Poselandmark): number => {
  const dx = a.x - b.x
  const dy = a.y - b.y
  
  return Math.sqrt(dx * dx + dy * dy)
}

/**
 * Determina se un punto è a sinistra o destra di una linea
 * Utile per determinare la direzione del movimento
 */
export const getPointSide = (point: Poselandmark, lineStart: Poselandmark, lineEnd: Poselandmark): 'left' | 'right' | 'on' => {
  const crossProduct = (lineEnd.x - lineStart.x) * (point.y - lineStart.y) - (lineEnd.y - lineStart.y) * (point.x - lineStart.x)
  
  if (crossProduct > 0) return 'left'
  if (crossProduct < 0) return 'right'
  return 'on'
}

/**
 * Calcola l'inclinazione della schiena (per squat e deadlift)
 * Restituisce l'angolo della schiena rispetto alla verticale
 */
export const calculateBackLean = (shoulder: Poselandmark, hip: Poselandmark): number => {
  // Vettore verticale di riferimento (verso l'alto)
  const verticalVector = { x: 0, y: -1 }
  
  // Vettore della schiena (da hip a shoulder)
  const backVector = {
    x: shoulder.x - hip.x,
    y: shoulder.y - hip.y
  }
  
  // Normalizza il vettore della schiena
  const backMagnitude = Math.sqrt(backVector.x * backVector.x + backVector.y * backVector.y)
  if (backMagnitude === 0) return 0
  
  const normalizedBack = {
    x: backVector.x / backMagnitude,
    y: backVector.y / backMagnitude
  }
  
  // Calcola l'angolo con il vettore verticale
  const dotProduct = normalizedBack.x * verticalVector.x + normalizedBack.y * verticalVector.y
  const clampedDot = Math.max(-1, Math.min(1, dotProduct))
  const angleInRadians = Math.acos(clampedDot)
  
  return (angleInRadians * 180) / Math.PI
}

/**
 * Determina la fase del movimento per lo squat
 */
export const getSquatPhase = (kneeAngle: number): 'up' | 'down' | 'transition' => {
  if (kneeAngle > 150) return 'up'
  if (kneeAngle < 100) return 'down'
  return 'transition'
}

/**
 * Determina la fase del movimento per la panca
 */
export const getBenchPhase = (elbowAngle: number): 'up' | 'down' | 'transition' => {
  if (elbowAngle > 140) return 'up'
  if (elbowAngle < 90) return 'down'
  return 'transition'
}

/**
 * Calcola il punto medio tra due landmarks
 */
export const getMidpoint = (a: Poselandmark, b: Poselandmark): Poselandmark => {
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
    z: ((a.z || 0) + (b.z || 0)) / 2,
    visibility: Math.min(a.visibility || 1, b.visibility || 1)
  }
}

/**
 * Controlla se due angoli sono simili entro una tolleranza
 */
export const areAnglesSimilar = (angle1: number, angle2: number, tolerance: number = 10): boolean => {
  return Math.abs(angle1 - angle2) <= tolerance
}

/**
 * Smooth degli angoli per ridurre il jitter
 * Utilizza una media mobile semplice
 */
export class AngleSmoother {
  private history: number[] = []
  private maxHistory: number
  
  constructor(windowSize: number = 5) {
    this.maxHistory = windowSize
  }
  
  smooth(angle: number): number {
    this.history.push(angle)
    
    // Mantieni solo gli ultimi N valori
    if (this.history.length > this.maxHistory) {
      this.history.shift()
    }
    
    // Calcola la media
    const sum = this.history.reduce((acc, val) => acc + val, 0)
    return sum / this.history.length
  }
  
  reset(): void {
    this.history = []
  }
}

/**
 * Valida se un landmark è valido e visibile
 */
export const isLandmarkValid = (landmark: Poselandmark, minVisibility: number = 0.5): boolean => {
  if (!landmark) return false
  if (landmark.visibility !== undefined && landmark.visibility < minVisibility) return false
  if (isNaN(landmark.x) || isNaN(landmark.y)) return false
  return true
}

/**
 * Calcola la stabilità di una sequenza di angoli
 * Utile per determinare se l'utente è in posizione stabile
 */
export const calculateAngleStability = (angles: number[]): number => {
  if (angles.length < 2) return 0
  
  let totalVariation = 0
  for (let i = 1; i < angles.length; i++) {
    const currentAngle = angles[i]
    const previousAngle = angles[i - 1]
    
    // Controlla che entrambi gli angoli esistano
    if (currentAngle !== undefined && previousAngle !== undefined) {
      totalVariation += Math.abs(currentAngle - previousAngle)
    }
  }
  
  const averageVariation = totalVariation / (angles.length - 1)
  
  // Converti in punteggio di stabilità (0-100)
  // Meno variazione = maggiore stabilità
  return Math.max(0, 100 - averageVariation * 2)
}