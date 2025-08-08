// hooks/useSoundFeedback.ts - Hook per feedback audio che funziona su mobile/Safari/iOS

import { useRef, useEffect, useState, useCallback } from 'react'

// Type per gestire vendor prefixes
interface WindowWithWebkit extends Window {
  webkitAudioContext?: typeof AudioContext
}

export const useSoundFeedback = () => {
  const audioContextRef = useRef<AudioContext | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [audioState, setAudioState] = useState<'suspended' | 'running' | 'closed'>('suspended')
  const [needsUserGesture, setNeedsUserGesture] = useState(false)
  const initAttempted = useRef(false)
  const volumeRef = useRef(0.3) // Volume globale configurabile

  // Check se siamo su iOS/Safari
  const isIOS = () => {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
           (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  }

  const isSafari = () => {
    return /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
  }

  // Cleanup al dismount
  useEffect(() => {
    return () => {
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close()
      }
    }
  }, [])

  // Inizializza AudioContext con gestione cross-browser
  const initializeAudio = useCallback(async () => {
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      // Se già esiste, prova a riattivarlo
      if (audioContextRef.current.state === 'suspended') {
        try {
          await audioContextRef.current.resume()
          setAudioState('running')
          setIsInitialized(true)
          setNeedsUserGesture(false)
          console.log('🔊 Audio context resumed successfully')
          return true
        } catch (error) {
          console.error('Failed to resume audio context:', error)
          setNeedsUserGesture(true)
          return false
        }
      }
      return true
    }

    try {
      // Crea nuovo AudioContext con gestione vendor prefix
      const AudioContextClass = window.AudioContext || (window as WindowWithWebkit).webkitAudioContext
      
      if (!AudioContextClass) {
        console.error('Web Audio API not supported')
        return false
      }

      // Crea context con opzioni per mobile
      audioContextRef.current = new AudioContextClass({
        latencyHint: 'interactive',
        sampleRate: 44100
      } as AudioContextOptions)

      // Su iOS/Safari il context parte sempre suspended
      if (audioContextRef.current.state === 'suspended') {
        try {
          await audioContextRef.current.resume()
          console.log('🔊 Audio context resumed on creation')
        } catch (error) {
          console.log('⚠️ Audio needs user interaction to start')
          setNeedsUserGesture(true)
        }
      }

      setAudioState(audioContextRef.current.state as any)
      setIsInitialized(true)
      initAttempted.current = true
      
      // Listener per cambio stato
      audioContextRef.current.onstatechange = () => {
        if (audioContextRef.current) {
          setAudioState(audioContextRef.current.state as any)
          console.log('🔊 Audio state changed:', audioContextRef.current.state)
        }
      }

      console.log('🔊 Audio context initialized:', audioContextRef.current.state)
      
      // Test beep solo se running
      if (audioContextRef.current.state === 'running') {
        playTestBeep()
        setNeedsUserGesture(false)
      }
      
      return true
    } catch (error) {
      console.error('Failed to initialize audio:', error)
      setNeedsUserGesture(true)
      return false
    }
  }, [])

  // Auto-init al primo user interaction
  useEffect(() => {
    if (!initAttempted.current) {
      const handleFirstInteraction = async () => {
        if (!initAttempted.current) {
          console.log('🎵 First user interaction detected, initializing audio...')
          await initializeAudio()
          
          // Rimuovi listeners dopo primo uso
          document.removeEventListener('touchstart', handleFirstInteraction)
          document.removeEventListener('click', handleFirstInteraction)
        }
      }

      // Aggiungi listeners per primo interaction
      document.addEventListener('touchstart', handleFirstInteraction, { once: true })
      document.addEventListener('click', handleFirstInteraction, { once: true })

      return () => {
        document.removeEventListener('touchstart', handleFirstInteraction)
        document.removeEventListener('click', handleFirstInteraction)
      }
    }
  }, [initializeAudio])

  // Funzione per attivare audio manualmente (per bottone dedicato)
  const enableAudio = useCallback(async () => {
    const success = await initializeAudio()
    if (success && audioContextRef.current?.state === 'running') {
      playTestBeep()
      setNeedsUserGesture(false)
      return true
    }
    return false
  }, [initializeAudio])

  // Test beep
  const playTestBeep = () => {
    if (!audioContextRef.current || audioContextRef.current.state !== 'running') return
    
    try {
      const oscillator = audioContextRef.current.createOscillator()
      const gainNode = audioContextRef.current.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContextRef.current.destination)
      
      oscillator.frequency.value = 440
      oscillator.type = 'sine'
      
      const now = audioContextRef.current.currentTime
      gainNode.gain.setValueAtTime(0.1, now)
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1)
      
      oscillator.start(now)
      oscillator.stop(now + 0.1)
    } catch (error) {
      console.error('Test beep failed:', error)
    }
  }

  // Crea un beep con gestione errori migliorata
  const playBeep = useCallback((frequency: number = 440, duration: number = 200, volume?: number) => {
    // Check preliminari
    if (isMuted || !audioContextRef.current) return
    
    // Se audio è suspended, prova a riattivarlo
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume().then(() => {
        console.log('Audio resumed for beep')
      }).catch(error => {
        console.error('Cannot resume audio:', error)
        setNeedsUserGesture(true)
      })
      return
    }
    
    if (audioContextRef.current.state !== 'running') {
      console.warn('Audio context not running, state:', audioContextRef.current.state)
      return
    }

    try {
      const oscillator = audioContextRef.current.createOscillator()
      const gainNode = audioContextRef.current.createGain()
      
      // Connessioni
      oscillator.connect(gainNode)
      gainNode.connect(audioContextRef.current.destination)
      
      // Configurazione oscillatore
      oscillator.frequency.value = frequency
      oscillator.type = 'sine'
      
      // Volume con fade in/out per evitare click
      const now = audioContextRef.current.currentTime
      const vol = (volume ?? volumeRef.current) * (isIOS() ? 0.5 : 1) // Volume ridotto su iOS
      
      gainNode.gain.setValueAtTime(0, now)
      gainNode.gain.linearRampToValueAtTime(vol, now + 0.01) // Fade in
      gainNode.gain.setValueAtTime(vol, now + duration / 1000 - 0.01)
      gainNode.gain.linearRampToValueAtTime(0.001, now + duration / 1000) // Fade out
      
      // Start e stop
      oscillator.start(now)
      oscillator.stop(now + duration / 1000)
      
      // Cleanup automatico
      oscillator.onended = () => {
        oscillator.disconnect()
        gainNode.disconnect()
      }
    } catch (error) {
      console.error('Errore playBeep:', error)
    }
  }, [isMuted])

  // Suoni predefiniti con volumi ottimizzati per mobile
  const sounds = {
    // Feedback profondità
    scendi: () => {
      playBeep(300, 150, 0.25)
    },
    
    perfetto: () => {
      playBeep(523, 100, 0.25) // Do
      setTimeout(() => playBeep(659, 100, 0.25), 100) // Mi
      setTimeout(() => playBeep(784, 150, 0.25), 200) // Sol
    },
    
    troppoGiu: () => {
      playBeep(200, 300, 0.35)
    },
    
    // Conteggio reps
    rep: () => {
      playBeep(800, 100, 0.35)
      setTimeout(() => playBeep(800, 100, 0.35), 150)
    },
    
    // Milestones
    cinqueReps: () => {
      for (let i = 0; i < 3; i++) {
        setTimeout(() => playBeep(600 + i * 100, 100, 0.25), i * 100)
      }
    },
    
    dieciReps: () => {
      for (let i = 0; i < 5; i++) {
        setTimeout(() => playBeep(500 + i * 100, 80, 0.25), i * 80)
      }
    },
    
    // Start/Stop
    start: () => {
      playBeep(440, 100, 0.25)
      setTimeout(() => playBeep(554, 100, 0.25), 100)
      setTimeout(() => playBeep(659, 150, 0.25), 200)
    },
    
    stop: () => {
      playBeep(659, 100, 0.25)
      setTimeout(() => playBeep(554, 100, 0.25), 100)
      setTimeout(() => playBeep(440, 150, 0.25), 200)
    },
    
    // Alert infortuni
    warning: () => {
      playBeep(600, 200, 0.4)
      setTimeout(() => playBeep(500, 200, 0.4), 250)
    },
    
    danger: () => {
      // Pattern urgente
      for (let i = 0; i < 3; i++) {
        setTimeout(() => {
          playBeep(800, 150, 0.5)
          setTimeout(() => playBeep(400, 150, 0.5), 160)
        }, i * 350)
      }
    },
    
    // Test audio
    test: () => {
      playBeep(440, 200, 0.3)
    }
  }

  // Toggle mute
  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      const newMuted = !prev
      // Test beep quando riattivi (solo se audio running)
      if (!newMuted && isInitialized && audioContextRef.current?.state === 'running') {
        setTimeout(() => playBeep(440, 100, 0.2), 100)
      }
      return newMuted
    })
  }, [isInitialized, playBeep])

  // Imposta volume globale
  const setVolume = useCallback((volume: number) => {
    volumeRef.current = Math.max(0, Math.min(1, volume))
  }, [])

  // Get audio status per debug
  const getAudioStatus = () => {
    return {
      initialized: isInitialized,
      state: audioState,
      muted: isMuted,
      needsUserGesture,
      contextExists: !!audioContextRef.current,
      isIOS: isIOS(),
      isSafari: isSafari()
    }
  }

  return {
    // Stato
    isInitialized,
    isMuted,
    audioState,
    needsUserGesture,
    
    // Funzioni principali
    initializeAudio,
    enableAudio,
    toggleMute,
    setVolume,
    
    // Suoni
    sounds,
    playBeep,
    
    // Utils
    getAudioStatus,
    isIOS,
    isSafari
  }
}