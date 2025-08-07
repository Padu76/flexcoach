// hooks/useSoundFeedback.ts - Hook per feedback audio che funziona su mobile

import { useRef, useEffect, useState } from 'react'

export const useSoundFeedback = () => {
  const audioContextRef = useRef<AudioContext | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [isMuted, setIsMuted] = useState(false)

  // Inizializza AudioContext
  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [])

  // Inizializza audio (deve essere chiamato da un evento utente)
  const initializeAudio = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      setIsInitialized(true)
      console.log('🔊 Audio context inizializzato')
    }
  }

  // Crea un beep
  const playBeep = (frequency: number = 440, duration: number = 200, volume: number = 0.3) => {
    if (!audioContextRef.current || isMuted) return

    try {
      const oscillator = audioContextRef.current.createOscillator()
      const gainNode = audioContextRef.current.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContextRef.current.destination)
      
      oscillator.frequency.value = frequency
      oscillator.type = 'sine'
      
      gainNode.gain.setValueAtTime(volume, audioContextRef.current.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + duration / 1000)
      
      oscillator.start(audioContextRef.current.currentTime)
      oscillator.stop(audioContextRef.current.currentTime + duration / 1000)
    } catch (error) {
      console.error('Errore playBeep:', error)
    }
  }

  // Suoni predefiniti
  const sounds = {
    // Feedback profondità
    scendi: () => {
      playBeep(300, 150, 0.3) // Tono basso
    },
    
    perfetto: () => {
      playBeep(523, 100, 0.3) // Do
      setTimeout(() => playBeep(659, 100, 0.3), 100) // Mi
      setTimeout(() => playBeep(784, 150, 0.3), 200) // Sol
    },
    
    troppoGiu: () => {
      playBeep(200, 300, 0.4) // Tono molto basso lungo
    },
    
    // Conteggio reps
    rep: () => {
      playBeep(800, 100, 0.4) // Tono alto breve
      setTimeout(() => playBeep(800, 100, 0.4), 150)
    },
    
    // Milestones
    cinqueReps: () => {
      for (let i = 0; i < 3; i++) {
        setTimeout(() => playBeep(600 + i * 100, 100, 0.3), i * 100)
      }
    },
    
    dieciReps: () => {
      for (let i = 0; i < 5; i++) {
        setTimeout(() => playBeep(500 + i * 100, 80, 0.3), i * 80)
      }
    },
    
    // Start/Stop
    start: () => {
      playBeep(440, 100, 0.3)
      setTimeout(() => playBeep(554, 100, 0.3), 100)
      setTimeout(() => playBeep(659, 150, 0.3), 200)
    },
    
    stop: () => {
      playBeep(659, 100, 0.3)
      setTimeout(() => playBeep(554, 100, 0.3), 100)
      setTimeout(() => playBeep(440, 150, 0.3), 200)
    }
  }

  // Toggle mute
  const toggleMute = () => {
    setIsMuted(!isMuted)
    if (!isMuted && isInitialized) {
      playBeep(440, 100, 0.2) // Test beep quando riattivi
    }
  }

  return {
    initializeAudio,
    isInitialized,
    isMuted,
    toggleMute,
    sounds,
    playBeep
  }
}