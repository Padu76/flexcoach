// components/Header.tsx - Header unificato per tutta l'app

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  HomeIcon,
  PlayCircleIcon,
  ChartBarIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  BellIcon,
  Bars3Icon,
  XMarkIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline'

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  
  // Funzione per determinare se un link è attivo
  const isActive = (path: string) => {
    if (path === '/') return pathname === '/'
    return pathname.startsWith(path)
  }
  
  // Chiudi menu mobile quando si clicca un link
  const handleLinkClick = () => {
    setIsMobileMenuOpen(false)
  }
  
  return (
    <>
      {/* Navigation Header */}
      <nav className="bg-white shadow-sm fixed w-full top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo - SEMPRE cliccabile verso home */}
            <Link 
              href="/" 
              className="flex items-center"
              onClick={handleLinkClick}
            >
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                FlexCoach
              </span>
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <Link 
                href="/" 
                className={`flex items-center gap-1 transition-colors ${
                  isActive('/') 
                    ? 'text-blue-600 font-medium' 
                    : 'text-gray-700 hover:text-blue-600'
                }`}
              >
                <HomeIcon className="w-4 h-4" />
                Home
              </Link>
              <Link 
                href="/exercises" 
                className={`flex items-center gap-1 transition-colors ${
                  isActive('/exercises') 
                    ? 'text-blue-600 font-medium' 
                    : 'text-gray-700 hover:text-blue-600'
                }`}
              >
                <PlayCircleIcon className="w-4 h-4" />
                Esercizi
              </Link>
              <Link 
                href="/dashboard" 
                className={`flex items-center gap-1 transition-colors ${
                  isActive('/dashboard') && !pathname.includes('profile')
                    ? 'text-blue-600 font-medium' 
                    : 'text-gray-700 hover:text-blue-600'
                }`}
              >
                <ChartBarIcon className="w-4 h-4" />
                Dashboard
              </Link>
              <Link 
                href="/dashboard?section=profile" 
                className={`flex items-center gap-1 transition-colors ${
                  pathname.includes('profile') 
                    ? 'text-blue-600 font-medium' 
                    : 'text-gray-700 hover:text-blue-600'
                }`}
              >
                <UserCircleIcon className="w-4 h-4" />
                Profilo
              </Link>
            </div>
            
            {/* Desktop Menu Right */}
            <div className="hidden md:flex items-center space-x-3">
              <button className="p-2 text-gray-600 hover:text-blue-600 transition-colors">
                <BellIcon className="w-5 h-5" />
              </button>
              <button className="p-2 text-gray-600 hover:text-blue-600 transition-colors">
                <Cog6ToothIcon className="w-5 h-5" />
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <UserCircleIcon className="w-4 h-4" />
                Accedi
              </button>
            </div>
            
            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-gray-600"
              aria-label="Toggle menu"
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
              <Link 
                href="/" 
                onClick={handleLinkClick}
                className={`block px-3 py-2 rounded-lg transition-colors ${
                  isActive('/') 
                    ? 'bg-blue-50 text-blue-600 font-medium' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  <HomeIcon className="w-4 h-4" />
                  Home
                </div>
              </Link>
              <Link 
                href="/exercises" 
                onClick={handleLinkClick}
                className={`block px-3 py-2 rounded-lg transition-colors ${
                  isActive('/exercises') 
                    ? 'bg-blue-50 text-blue-600 font-medium' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  <PlayCircleIcon className="w-4 h-4" />
                  Esercizi
                </div>
              </Link>
              <Link 
                href="/dashboard" 
                onClick={handleLinkClick}
                className={`block px-3 py-2 rounded-lg transition-colors ${
                  isActive('/dashboard') && !pathname.includes('profile')
                    ? 'bg-blue-50 text-blue-600 font-medium' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  <ChartBarIcon className="w-4 h-4" />
                  Dashboard
                </div>
              </Link>
              <Link 
                href="/dashboard?section=profile" 
                onClick={handleLinkClick}
                className={`block px-3 py-2 rounded-lg transition-colors ${
                  pathname.includes('profile') 
                    ? 'bg-blue-50 text-blue-600 font-medium' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  <UserCircleIcon className="w-4 h-4" />
                  Profilo
                </div>
              </Link>
              
              <div className="border-t mt-3 pt-3">
                <button className="flex items-center gap-2 w-full text-left px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
                  <BellIcon className="w-4 h-4" />
                  Notifiche
                </button>
                <button className="flex items-center gap-2 w-full text-left px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
                  <Cog6ToothIcon className="w-4 h-4" />
                  Impostazioni
                </button>
                <button className="flex items-center gap-2 w-full text-left px-3 py-2 text-blue-600 font-medium hover:bg-blue-50 rounded-lg">
                  <UserCircleIcon className="w-4 h-4" />
                  Accedi
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>
      
      {/* Spacing for fixed nav */}
      <div className="h-16"></div>
    </>
  )
}