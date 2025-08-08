// components/InjuryPreventionSystem.tsx - Sistema predizione infortuni

'use client'

import { useState, useEffect, useRef } from 'react'
import { 
  ExclamationTriangleIcon,
  ShieldExclamationIcon,
  FireIcon,
  ChartBarIcon,
  XCircleIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  BoltIcon,
  HeartIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ClockIcon,
  BeakerIcon
} from '@heroicons/react/24/outline'
import type { ExerciseType } from '@/types'

// Pattern di rischio rilevabili
interface RiskPattern {
  id: string
  type: 'form' | 'fatigue' | 'asymmetry' | 'overload' | 'technique'
  severity: 'low' | 'medium' | 'high' | 'critical'
  bodyPart: string[]
  description: string
  threshold: number
  currentValue: number
  trend: 'improving' | 'stable' | 'worsening'
}

interface BiomechanicalData {
  timestamp: number
  exercise: ExerciseType
  
  // Angoli critici
  kneeValgus: number // Ginocchia verso interno (gradi)
  spinalFlexion: number // Flessione spinale (gradi)
  shoulderImpingement: number // Impingement spalla (gradi)
  hipShift: number // Shift laterale anca (cm)
  
  // Asimmetrie
  leftRightImbalance: number // % differenza dx/sx
  anteriorPosteriorTilt: number // Tilt anteriore/posteriore
  rotationalAsymmetry: number // Rotazione asimmetrica
  
  // Velocità e accelerazione
  descentSpeed: number // Velocità discesa (m/s)
  ascentSpeed: number // Velocità risalita (m/s)
  jerkiness: number // "Scatti" nel movimento (0-100)
  
  // Fatica
  formDegradation: number // Degradazione forma (%)
  compensatoryMovement: number // Movimenti compensatori rilevati
  timeUnderTension: number // Tempo sotto tensione (s)
  
  // Load management
  weight: number
  reps: number
  sets: number
  restTime: number
  volumeLoad: number // weight × reps × sets
}

interface InjuryRisk {
  overallRisk: number // 0-100
  riskLevel: 'safe' | 'caution' | 'warning' | 'danger'
  primaryRisks: RiskPattern[]
  bodyPartRisks: Map<string, number>
  recommendations: string[]
  requiresStop: boolean
}

interface FatigueMetrics {
  muscularFatigue: number // 0-100
  neuralFatigue: number // 0-100
  cardioFatigue: number // 0-100
  overallFatigue: number // 0-100
  recoveryNeeded: number // ore
}

interface Props {
  currentData?: BiomechanicalData
  exerciseType: ExerciseType
  isLive?: boolean
  onRiskDetected?: (risk: InjuryRisk) => void
  onEmergencyStop?: () => void
}

export default function InjuryPreventionSystem({
  currentData,
  exerciseType,
  isLive = false,
  onRiskDetected,
  onEmergencyStop
}: Props) {
  const [riskHistory, setRiskHistory] = useState<InjuryRisk[]>([])
  const [currentRisk, setCurrentRisk] = useState<InjuryRisk | null>(null)
  const [fatigue, setFatigue] = useState<FatigueMetrics>({
    muscularFatigue: 0,
    neuralFatigue: 0,
    cardioFatigue: 0,
    overallFatigue: 0,
    recoveryNeeded: 0
  })
  
  const [showDetails, setShowDetails] = useState(false)
  const [alertMode, setAlertMode] = useState<'none' | 'warning' | 'danger'>('none')
  const [recommendations, setRecommendations] = useState<string[]>([])
  
  // Tracking patterns nel tempo
  const patternHistoryRef = useRef<BiomechanicalData[]>([])
  const alertTimeoutRef = useRef<NodeJS.Timeout>()
  
  // Canvas per visualizzazione 3D skeleton
  const skeletonCanvasRef = useRef<HTMLCanvasElement>(null)
  
  // Thresholds personalizzati per esercizio
  const getThresholds = () => {
    switch (exerciseType) {
      case 'squat':
        return {
          maxKneeValgus: 10, // gradi
          maxSpinalFlexion: 30,
          maxHipShift: 5, // cm
          maxAsymmetry: 15, // %
          minDescentSpeed: 0.1, // m/s
          maxDescentSpeed: 1.0
        }
      case 'bench-press':
        return {
          maxShoulderImpingement: 15,
          maxElbowFlare: 75,
          maxWristDeviation: 20,
          maxAsymmetry: 10,
          minDescentSpeed: 0.05,
          maxAscentSpeed: 1.5
        }
      case 'deadlift':
        return {
          maxSpinalFlexion: 20,
          maxKneeValgus: 5,
          maxHipShift: 3,
          maxAsymmetry: 10,
          minLockoutTime: 0.5,
          maxJerkiness: 30
        }
      default:
        return {}
    }
  }
  
  // Analizza pattern di rischio
  const analyzeRiskPatterns = (data: BiomechanicalData): RiskPattern[] => {
    const patterns: RiskPattern[] = []
    const thresholds = getThresholds()
    
    // 1. Analisi Valgismo Ginocchia (Squat/Deadlift)
    if (exerciseType !== 'bench-press' && data.kneeValgus > thresholds.maxKneeValgus!) {
      patterns.push({
        id: 'knee_valgus',
        type: 'form',
        severity: data.kneeValgus > thresholds.maxKneeValgus! * 2 ? 'critical' : 
                 data.kneeValgus > thresholds.maxKneeValgus! * 1.5 ? 'high' : 'medium',
        bodyPart: ['ginocchia', 'legamenti_crociati'],
        description: `Ginocchia cedono verso l'interno (${data.kneeValgus.toFixed(0)}°)`,
        threshold: thresholds.maxKneeValgus!,
        currentValue: data.kneeValgus,
        trend: calculateTrend('kneeValgus')
      })
    }
    
    // 2. Analisi Flessione Spinale
    if (data.spinalFlexion > thresholds.maxSpinalFlexion!) {
      patterns.push({
        id: 'spinal_flexion',
        type: 'technique',
        severity: data.spinalFlexion > thresholds.maxSpinalFlexion! * 1.5 ? 'critical' : 'high',
        bodyPart: ['schiena', 'lombare', 'dischi_vertebrali'],
        description: `Schiena troppo curva (${data.spinalFlexion.toFixed(0)}°)`,
        threshold: thresholds.maxSpinalFlexion!,
        currentValue: data.spinalFlexion,
        trend: calculateTrend('spinalFlexion')
      })
    }
    
    // 3. Analisi Asimmetria
    if (data.leftRightImbalance > thresholds.maxAsymmetry!) {
      patterns.push({
        id: 'asymmetry',
        type: 'asymmetry',
        severity: data.leftRightImbalance > thresholds.maxAsymmetry! * 2 ? 'high' : 'medium',
        bodyPart: ['muscoli_stabilizzatori', 'core'],
        description: `Asimmetria dx/sx rilevata (${data.leftRightImbalance.toFixed(0)}%)`,
        threshold: thresholds.maxAsymmetry!,
        currentValue: data.leftRightImbalance,
        trend: calculateTrend('leftRightImbalance')
      })
    }
    
    // 4. Analisi Fatica
    if (data.formDegradation > 30) {
      patterns.push({
        id: 'fatigue',
        type: 'fatigue',
        severity: data.formDegradation > 50 ? 'high' : 'medium',
        bodyPart: ['sistema_nervoso', 'muscoli_principali'],
        description: `Forma degradata del ${data.formDegradation.toFixed(0)}%`,
        threshold: 30,
        currentValue: data.formDegradation,
        trend: calculateTrend('formDegradation')
      })
    }
    
    // 5. Analisi Velocità (troppo veloce = rischio)
    if (data.descentSpeed > thresholds.maxDescentSpeed!) {
      patterns.push({
        id: 'speed_excess',
        type: 'technique',
        severity: 'medium',
        bodyPart: ['tendini', 'articolazioni'],
        description: `Discesa troppo veloce (${data.descentSpeed.toFixed(1)} m/s)`,
        threshold: thresholds.maxDescentSpeed!,
        currentValue: data.descentSpeed,
        trend: calculateTrend('descentSpeed')
      })
    }
    
    // 6. Analisi Sovraccarico
    if (data.volumeLoad > calculateMaxSafeVolume()) {
      patterns.push({
        id: 'overload',
        type: 'overload',
        severity: 'high',
        bodyPart: ['tutti'],
        description: `Volume di carico eccessivo (${data.volumeLoad} kg)`,
        threshold: calculateMaxSafeVolume(),
        currentValue: data.volumeLoad,
        trend: 'stable'
      })
    }
    
    return patterns
  }
  
  // Calcola trend basato su storico
  const calculateTrend = (metric: keyof BiomechanicalData): 'improving' | 'stable' | 'worsening' => {
    if (patternHistoryRef.current.length < 3) return 'stable'
    
    const recent = patternHistoryRef.current.slice(-3)
    const values = recent.map(d => d[metric] as number)
    
    const avgFirst = values[0]
    const avgLast = values[values.length - 1]
    
    if (avgLast > avgFirst * 1.1) return 'worsening'
    if (avgLast < avgFirst * 0.9) return 'improving'
    return 'stable'
  }
  
  // Calcola volume massimo sicuro
  const calculateMaxSafeVolume = (): number => {
    // Basato su storico + fattori personali
    const baseVolume = 5000 // kg base
    const experienceFactor = 1.2 // moltiplicatore esperienza
    const fatigueFactor = 1 - (fatigue.overallFatigue / 100)
    
    return baseVolume * experienceFactor * fatigueFactor
  }
  
  // Calcola rischio complessivo
  const calculateOverallRisk = (patterns: RiskPattern[]): InjuryRisk => {
    if (patterns.length === 0) {
      return {
        overallRisk: 0,
        riskLevel: 'safe',
        primaryRisks: [],
        bodyPartRisks: new Map(),
        recommendations: ['✅ Forma eccellente, continua così!'],
        requiresStop: false
      }
    }
    
    // Calcola rischio per parte del corpo
    const bodyPartRisks = new Map<string, number>()
    patterns.forEach(pattern => {
      pattern.bodyPart.forEach(part => {
        const current = bodyPartRisks.get(part) || 0
        const increment = pattern.severity === 'critical' ? 40 :
                         pattern.severity === 'high' ? 25 :
                         pattern.severity === 'medium' ? 15 : 5
        bodyPartRisks.set(part, Math.min(100, current + increment))
      })
    })
    
    // Calcola rischio overall
    const severityScores = patterns.map(p => 
      p.severity === 'critical' ? 100 :
      p.severity === 'high' ? 70 :
      p.severity === 'medium' ? 40 : 20
    )
    const overallRisk = Math.min(100, Math.max(...severityScores))
    
    // Determina livello di rischio
    const riskLevel = overallRisk >= 80 ? 'danger' :
                     overallRisk >= 60 ? 'warning' :
                     overallRisk >= 30 ? 'caution' : 'safe'
    
    // Genera raccomandazioni
    const recommendations = generateRecommendations(patterns, bodyPartRisks)
    
    // Determina se fermare
    const requiresStop = patterns.some(p => p.severity === 'critical') || overallRisk >= 90
    
    return {
      overallRisk,
      riskLevel,
      primaryRisks: patterns.sort((a, b) => {
        const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
        return severityOrder[a.severity] - severityOrder[b.severity]
      }),
      bodyPartRisks,
      recommendations,
      requiresStop
    }
  }
  
  // Genera raccomandazioni personalizzate
  const generateRecommendations = (patterns: RiskPattern[], bodyPartRisks: Map<string, number>): string[] => {
    const recs: string[] = []
    
    patterns.forEach(pattern => {
      switch (pattern.id) {
        case 'knee_valgus':
          recs.push('🦵 Attiva glutei e spingi le ginocchia verso l\'esterno')
          recs.push('💡 Riduci il peso e concentrati sull\'allineamento')
          break
        case 'spinal_flexion':
          recs.push('🦴 Mantieni il petto alto e la schiena neutra')
          recs.push('💪 Rinforza il core prima di aumentare il carico')
          break
        case 'asymmetry':
          recs.push('⚖️ Lavora su esercizi unilaterali per bilanciare')
          recs.push('🔍 Controlla se hai tensioni muscolari da un lato')
          break
        case 'fatigue':
          recs.push('⏸️ Aumenta il tempo di riposo tra le serie')
          recs.push('🔄 Considera di ridurre il volume totale')
          break
        case 'speed_excess':
          recs.push('🐌 Rallenta il movimento, specialmente in discesa')
          recs.push('⏱️ Usa un tempo 3-1-2 (discesa-pausa-salita)')
          break
        case 'overload':
          recs.push('📉 Riduci il peso del 10-15%')
          recs.push('📊 Segui una progressione più graduale')
          break
      }
    })
    
    // Raccomandazioni per parti del corpo a rischio
    bodyPartRisks.forEach((risk, part) => {
      if (risk > 70) {
        switch (part) {
          case 'ginocchia':
            recs.push('🦵 Riscalda bene ginocchia con movimenti circolari')
            break
          case 'schiena':
            recs.push('🦴 Aggiungi stretching per flessori dell\'anca')
            break
          case 'spalle':
            recs.push('💪 Mobilizza le spalle prima dell\'allenamento')
            break
        }
      }
    })
    
    return [...new Set(recs)] // Rimuovi duplicati
  }
  
  // Calcola metriche di fatica
  const calculateFatigue = (data: BiomechanicalData): FatigueMetrics => {
    const muscular = Math.min(100, data.formDegradation * 1.5)
    const neural = Math.min(100, data.compensatoryMovement * 2)
    const cardio = Math.min(100, (data.timeUnderTension / 60) * 30)
    const overall = (muscular + neural + cardio) / 3
    
    const recoveryNeeded = overall > 80 ? 48 :
                          overall > 60 ? 24 :
                          overall > 40 ? 12 : 6
    
    return {
      muscularFatigue: muscular,
      neuralFatigue: neural,
      cardioFatigue: cardio,
      overallFatigue: overall,
      recoveryNeeded
    }
  }
  
  // Analisi real-time quando arrivano nuovi dati
  useEffect(() => {
    if (currentData && isLive) {
      // Aggiungi a storico
      patternHistoryRef.current.push(currentData)
      if (patternHistoryRef.current.length > 100) {
        patternHistoryRef.current.shift() // Mantieni solo ultimi 100
      }
      
      // Analizza pattern
      const patterns = analyzeRiskPatterns(currentData)
      const risk = calculateOverallRisk(patterns)
      const newFatigue = calculateFatigue(currentData)
      
      setCurrentRisk(risk)
      setFatigue(newFatigue)
      setRiskHistory(prev => [...prev.slice(-50), risk]) // Mantieni ultimi 50
      
      // Gestisci alert
      if (risk.riskLevel === 'danger') {
        setAlertMode('danger')
        if (risk.requiresStop && onEmergencyStop) {
          onEmergencyStop()
        }
      } else if (risk.riskLevel === 'warning') {
        setAlertMode('warning')
      } else {
        setAlertMode('none')
      }
      
      // Callback
      if (onRiskDetected) {
        onRiskDetected(risk)
      }
      
      // Auto-clear alert dopo 5 secondi se non critico
      if (risk.riskLevel !== 'danger') {
        if (alertTimeoutRef.current) {
          clearTimeout(alertTimeoutRef.current)
        }
        alertTimeoutRef.current = setTimeout(() => {
          setAlertMode('none')
        }, 5000)
      }
    }
  }, [currentData, isLive])
  
  // Visualizza skeleton 3D con punti a rischio
  useEffect(() => {
    if (skeletonCanvasRef.current && currentRisk) {
      drawRiskSkeleton()
    }
  }, [currentRisk])
  
  const drawRiskSkeleton = () => {
    const canvas = skeletonCanvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    // Setup canvas
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * window.devicePixelRatio
    canvas.height = rect.height * window.devicePixelRatio
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
    
    // Clear
    ctx.clearRect(0, 0, rect.width, rect.height)
    
    // Draw skeleton base
    const centerX = rect.width / 2
    const centerY = rect.height / 2
    
    // Body parts positions (simplified)
    const skeleton = {
      head: { x: centerX, y: centerY - 80 },
      neck: { x: centerX, y: centerY - 60 },
      leftShoulder: { x: centerX - 30, y: centerY - 50 },
      rightShoulder: { x: centerX + 30, y: centerY - 50 },
      leftElbow: { x: centerX - 40, y: centerY - 20 },
      rightElbow: { x: centerX + 40, y: centerY - 20 },
      leftWrist: { x: centerX - 45, y: centerY + 10 },
      rightWrist: { x: centerX + 45, y: centerY + 10 },
      spine: { x: centerX, y: centerY },
      leftHip: { x: centerX - 20, y: centerY + 20 },
      rightHip: { x: centerX + 20, y: centerY + 20 },
      leftKnee: { x: centerX - 25, y: centerY + 50 },
      rightKnee: { x: centerX + 25, y: centerY + 50 },
      leftAnkle: { x: centerX - 25, y: centerY + 80 },
      rightAnkle: { x: centerX + 25, y: centerY + 80 }
    }
    
    // Draw connections
    ctx.strokeStyle = '#E5E7EB'
    ctx.lineWidth = 2
    
    const connections = [
      ['head', 'neck'],
      ['neck', 'spine'],
      ['neck', 'leftShoulder'],
      ['neck', 'rightShoulder'],
      ['leftShoulder', 'leftElbow'],
      ['leftElbow', 'leftWrist'],
      ['rightShoulder', 'rightElbow'],
      ['rightElbow', 'rightWrist'],
      ['spine', 'leftHip'],
      ['spine', 'rightHip'],
      ['leftHip', 'leftKnee'],
      ['leftKnee', 'leftAnkle'],
      ['rightHip', 'rightKnee'],
      ['rightKnee', 'rightAnkle']
    ]
    
    connections.forEach(([from, to]) => {
      const fromPoint = skeleton[from as keyof typeof skeleton]
      const toPoint = skeleton[to as keyof typeof skeleton]
      ctx.beginPath()
      ctx.moveTo(fromPoint.x, fromPoint.y)
      ctx.lineTo(toPoint.x, toPoint.y)
      ctx.stroke()
    })
    
    // Draw risk areas
    if (currentRisk) {
      currentRisk.bodyPartRisks.forEach((risk, part) => {
        let point = null
        
        switch (part) {
          case 'ginocchia':
          case 'legamenti_crociati':
            point = [skeleton.leftKnee, skeleton.rightKnee]
            break
          case 'schiena':
          case 'lombare':
            point = [skeleton.spine]
            break
          case 'spalle':
            point = [skeleton.leftShoulder, skeleton.rightShoulder]
            break
        }
        
        if (point) {
          const color = risk > 70 ? '#EF4444' :
                       risk > 40 ? '#F59E0B' : '#3B82F6'
          
          point.forEach(p => {
            // Glow effect
            const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 20)
            gradient.addColorStop(0, color + '80')
            gradient.addColorStop(1, color + '00')
            ctx.fillStyle = gradient
            ctx.fillRect(p.x - 20, p.y - 20, 40, 40)
            
            // Point
            ctx.fillStyle = color
            ctx.beginPath()
            ctx.arc(p.x, p.y, 5, 0, Math.PI * 2)
            ctx.fill()
          })
        }
      })
    }
    
    // Draw body points
    Object.values(skeleton).forEach(point => {
      ctx.fillStyle = '#6B7280'
      ctx.beginPath()
      ctx.arc(point.x, point.y, 3, 0, Math.PI * 2)
      ctx.fill()
    })
  }
  
  // Generate mock data for testing
  const generateMockData = (): BiomechanicalData => {
    const base = Math.random() * 30
    return {
      timestamp: Date.now(),
      exercise: exerciseType,
      kneeValgus: base + Math.random() * 15,
      spinalFlexion: base + Math.random() * 20,
      shoulderImpingement: Math.random() * 10,
      hipShift: Math.random() * 8,
      leftRightImbalance: Math.random() * 25,
      anteriorPosteriorTilt: Math.random() * 10,
      rotationalAsymmetry: Math.random() * 15,
      descentSpeed: 0.3 + Math.random() * 0.7,
      ascentSpeed: 0.4 + Math.random() * 0.8,
      jerkiness: base + Math.random() * 40,
      formDegradation: base + Math.random() * 30,
      compensatoryMovement: base + Math.random() * 20,
      timeUnderTension: 20 + Math.random() * 40,
      weight: 60 + Math.random() * 40,
      reps: 8 + Math.floor(Math.random() * 5),
      sets: 3,
      restTime: 90,
      volumeLoad: 0
    }
  }
  
  const getRiskColor = (level: string): string => {
    switch (level) {
      case 'danger': return 'text-red-600 bg-red-100'
      case 'warning': return 'text-yellow-600 bg-yellow-100'
      case 'caution': return 'text-blue-600 bg-blue-100'
      default: return 'text-green-600 bg-green-100'
    }
  }
  
  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'danger': return <XCircleIcon className="w-6 h-6 text-red-600" />
      case 'warning': return <ExclamationTriangleIcon className="w-6 h-6 text-yellow-600" />
      case 'caution': return <InformationCircleIcon className="w-6 h-6 text-blue-600" />
      default: return <CheckCircleIcon className="w-6 h-6 text-green-600" />
    }
  }
  
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ShieldExclamationIcon className="w-6 h-6 text-red-600" />
            Sistema Prevenzione Infortuni
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Monitoraggio real-time pattern di rischio
          </p>
        </div>
        
        {isLive && (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm text-gray-600">Live Monitoring</span>
          </div>
        )}
      </div>
      
      {/* Alert Banner */}
      {alertMode !== 'none' && currentRisk && (
        <div className={`mb-6 p-4 rounded-lg border-2 ${
          alertMode === 'danger' 
            ? 'bg-red-50 border-red-500' 
            : 'bg-yellow-50 border-yellow-500'
        }`}>
          <div className="flex items-start gap-3">
            {alertMode === 'danger' 
              ? <XCircleIcon className="w-6 h-6 text-red-600 mt-1" />
              : <ExclamationTriangleIcon className="w-6 h-6 text-yellow-600 mt-1" />
            }
            <div className="flex-1">
              <h3 className={`font-semibold text-lg ${
                alertMode === 'danger' ? 'text-red-900' : 'text-yellow-900'
              }`}>
                {alertMode === 'danger' 
                  ? '🚨 ATTENZIONE: Rischio Infortunio Elevato!' 
                  : '⚠️ Attenzione: Pattern Rischioso Rilevato'}
              </h3>
              {currentRisk.primaryRisks.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {currentRisk.primaryRisks.slice(0, 3).map((risk, idx) => (
                    <li key={idx} className={`text-sm ${
                      alertMode === 'danger' ? 'text-red-700' : 'text-yellow-700'
                    }`}>
                      • {risk.description}
                    </li>
                  ))}
                </ul>
              )}
              {currentRisk.requiresStop && (
                <div className="mt-3 p-2 bg-red-600 text-white rounded font-medium text-center">
                  ⛔ FERMA L'ESERCIZIO IMMEDIATAMENTE
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Risk Overview */}
      {currentRisk && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Overall Risk */}
          <div className={`rounded-lg p-4 ${getRiskColor(currentRisk.riskLevel)}`}>
            <div className="flex items-center justify-between mb-2">
              {getRiskIcon(currentRisk.riskLevel)}
              <span className="text-2xl font-bold">
                {currentRisk.overallRisk.toFixed(0)}%
              </span>
            </div>
            <div className="text-sm font-medium">
              Rischio Complessivo
            </div>
            <div className="text-xs mt-1 opacity-80">
              {currentRisk.riskLevel === 'safe' ? 'Forma sicura' :
               currentRisk.riskLevel === 'caution' ? 'Prestare attenzione' :
               currentRisk.riskLevel === 'warning' ? 'Correggere subito' :
               'Rischio elevato!'}
            </div>
          </div>
          
          {/* Fatigue Level */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <BoltIcon className="w-6 h-6 text-purple-600" />
              <span className="text-2xl font-bold text-gray-900">
                {fatigue.overallFatigue.toFixed(0)}%
              </span>
            </div>
            <div className="text-sm font-medium text-gray-900">
              Livello Fatica
            </div>
            <div className="text-xs text-purple-600 mt-1">
              Recupero: {fatigue.recoveryNeeded}h
            </div>
          </div>
          
          {/* Pattern Count */}
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <ChartBarIcon className="w-6 h-6 text-orange-600" />
              <span className="text-2xl font-bold text-gray-900">
                {currentRisk.primaryRisks.length}
              </span>
            </div>
            <div className="text-sm font-medium text-gray-900">
              Pattern Rilevati
            </div>
            <div className="text-xs text-orange-600 mt-1">
              {currentRisk.primaryRisks.filter(r => r.severity === 'critical').length} critici
            </div>
          </div>
        </div>
      )}
      
      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 3D Skeleton Visualization */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <HeartIcon className="w-5 h-5 text-red-500" />
            Mappa Rischio Anatomica
          </h3>
          
          <canvas
            ref={skeletonCanvasRef}
            className="w-full h-64 bg-white rounded"
            style={{ width: '100%', height: '256px' }}
          />
          
          {currentRisk && currentRisk.bodyPartRisks.size > 0 && (
            <div className="mt-3 space-y-2">
              {Array.from(currentRisk.bodyPartRisks.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 4)
                .map(([part, risk]) => (
                  <div key={part} className="flex items-center justify-between text-sm">
                    <span className="capitalize text-gray-700">
                      {part.replace('_', ' ')}
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            risk > 70 ? 'bg-red-500' :
                            risk > 40 ? 'bg-yellow-500' : 'bg-blue-500'
                          }`}
                          style={{ width: `${risk}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium w-10 text-right">
                        {risk.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
        
        {/* Pattern Details */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" />
            Pattern di Rischio Rilevati
          </h3>
          
          {currentRisk && currentRisk.primaryRisks.length > 0 ? (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {currentRisk.primaryRisks.map((pattern, idx) => (
                <div 
                  key={idx}
                  className={`p-3 rounded-lg border ${
                    pattern.severity === 'critical' ? 'border-red-300 bg-red-50' :
                    pattern.severity === 'high' ? 'border-orange-300 bg-orange-50' :
                    pattern.severity === 'medium' ? 'border-yellow-300 bg-yellow-50' :
                    'border-blue-300 bg-blue-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-sm text-gray-900">
                        {pattern.description}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        Valore: {pattern.currentValue.toFixed(1)} / Soglia: {pattern.threshold}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {pattern.trend === 'worsening' && (
                        <ArrowTrendingUpIcon className="w-4 h-4 text-red-500" />
                      )}
                      {pattern.trend === 'improving' && (
                        <ArrowTrendingDownIcon className="w-4 h-4 text-green-500" />
                      )}
                      <span className={`text-xs font-medium px-2 py-1 rounded ${
                        pattern.severity === 'critical' ? 'bg-red-200 text-red-800' :
                        pattern.severity === 'high' ? 'bg-orange-200 text-orange-800' :
                        pattern.severity === 'medium' ? 'bg-yellow-200 text-yellow-800' :
                        'bg-blue-200 text-blue-800'
                      }`}>
                        {pattern.severity}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <CheckCircleIcon className="w-12 h-12 mx-auto mb-2 text-green-500" />
              <p className="text-sm">Nessun pattern rischioso rilevato</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Recommendations */}
      {currentRisk && currentRisk.recommendations.length > 0 && (
        <div className="mt-6 bg-blue-50 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
            <InformationCircleIcon className="w-5 h-5" />
            Raccomandazioni Correttive
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {currentRisk.recommendations.map((rec, idx) => (
              <div key={idx} className="text-sm text-blue-800 flex items-start gap-2">
                <span className="mt-0.5">→</span>
                <span>{rec}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Fatigue Breakdown */}
      <div className="mt-6 bg-gray-50 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <BoltIcon className="w-5 h-5 text-purple-600" />
          Analisi Fatica Dettagliata
        </h3>
        
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-700">Fatica Muscolare</span>
              <span className="font-medium">{fatigue.muscularFatigue.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-green-400 to-red-500 h-2 rounded-full transition-all"
                style={{ width: `${fatigue.muscularFatigue}%` }}
              />
            </div>
          </div>
          
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-700">Fatica Neurale</span>
              <span className="font-medium">{fatigue.neuralFatigue.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-400 to-purple-500 h-2 rounded-full transition-all"
                style={{ width: `${fatigue.neuralFatigue}%` }}
              />
            </div>
          </div>
          
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-700">Fatica Cardiovascolare</span>
              <span className="font-medium">{fatigue.cardioFatigue.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-yellow-400 to-orange-500 h-2 rounded-full transition-all"
                style={{ width: `${fatigue.cardioFatigue}%` }}
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Test Controls */}
      {!isLive && (
        <div className="mt-6 flex gap-3">
          <button
            onClick={() => {
              const mockData = generateMockData()
              const patterns = analyzeRiskPatterns(mockData)
              const risk = calculateOverallRisk(patterns)
              const newFatigue = calculateFatigue(mockData)
              
              setCurrentRisk(risk)
              setFatigue(newFatigue)
              
              if (risk.riskLevel === 'danger' || risk.riskLevel === 'warning') {
                setAlertMode(risk.riskLevel)
              }
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <BeakerIcon className="w-4 h-4 inline mr-2" />
            Simula Pattern Rischio
          </button>
          
          <button
            onClick={() => {
              setCurrentRisk(null)
              setFatigue({
                muscularFatigue: 0,
                neuralFatigue: 0,
                cardioFatigue: 0,
                overallFatigue: 0,
                recoveryNeeded: 0
              })
              setAlertMode('none')
              patternHistoryRef.current = []
            }}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
          >
            Reset Analisi
          </button>
        </div>
      )}
    </div>
  )
}