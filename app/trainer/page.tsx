// app/trainer/page.tsx - Route per Trainer Dashboard

'use client'

import dynamic from 'next/dynamic'
import { Suspense } from 'react'

// Dynamic import per evitare SSR issues
const TrainerDashboard = dynamic(() => import('@/components/TrainerDashboard'), { 
  ssr: false,
  loading: () => <LoadingScreen />
})

// Loading component
function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Caricamento Trainer Dashboard...</p>
      </div>
    </div>
  )
}

// Main page component con Suspense boundary
export default function TrainerPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <TrainerDashboard />
    </Suspense>
  )
}