// app/trainer/page.tsx - Pagina Trainer con header completo

'use client'

import { useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { Suspense } from 'react'
import { 
  HomeIcon,
  UserCircleIcon,
  BellIcon,
  CogIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline'

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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Caricamento Trainer Dashboard...</p>
      </div>
    </div>
  )
}

// Main page component con header
export default function TrainerPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className="bg-white shadow-sm fixed w-full top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo - Always links to home */}
            <Link href="/" className="flex items-center">
              <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                FlexCoach
              </span>
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/" className="text-gray-700 hover:text-blue-600 flex items-center gap-1">
                <HomeIcon className="w-4 h-4" />
                Home
              </Link>
              <Link href="/dashboard" className="text-gray-700 hover:text-blue-600">
                Dashboard
              </Link>
              <Link href="/exercises" className="text-gray-700 hover:text-blue-600">
                Esercizi
              </Link>
              <Link href="/trainer" className="text-purple-600 font-medium flex items-center gap-1">
                <span className="text-lg">👨‍🏫</span>
                Trainer
              </Link>
            </div>
            
            {/* Desktop Menu Right */}
            <div className="hidden md:flex items-center space-x-4">
              <button className="p-2 text-gray-600 hover:text-purple-600">
                <BellIcon className="w-5 h-5" />
              </button>
              <button className="p-2 text-gray-600 hover:text-purple-600">
                <CogIcon className="w-5 h-5" />
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                <UserCircleIcon className="w-4 h-4" />
                Trainer Login
              </button>
            </div>
            
            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2"
            >
              {isMobileMenuOpen ? (
                <XMarkIcon className="w-6 h-6" />
              ) : (
                <Bars3Icon className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
        
        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-t">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <Link href="/" className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded">
                Home
              </Link>
              <Link href="/dashboard" className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded">
                Dashboard
              </Link>
              <Link href="/exercises" className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded">
                Esercizi
              </Link>
              <Link href="/trainer" className="block px-3 py-2 text-purple-600 font-medium">
                👨‍🏫 Trainer
              </Link>
              <div className="border-t border-gray-200 my-2"></div>
              <button className="w-full text-left px-3 py-2 text-purple-600 font-medium">
                Trainer Login
              </button>
            </div>
          </div>
        )}
      </nav>
      
      {/* Main Content with padding for fixed header */}
      <div className="pt-16">
        <Suspense fallback={<LoadingScreen />}>
          <TrainerDashboard />
        </Suspense>
      </div>
    </div>
  )
}