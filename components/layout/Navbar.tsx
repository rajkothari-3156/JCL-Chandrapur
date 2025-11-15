'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Trophy, Brain, Users, Gavel, BarChart3, Award } from 'lucide-react'

export default function Navbar() {
  const pathname = usePathname()

  const navItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/stats', label: 'Stats', icon: BarChart3 },
    { href: '/quizzes', label: 'Quizzes', icon: Brain },
    { href: '/registrations', label: 'Players', icon: Users },
    { href: '/auction', label: 'Auction', icon: Gavel },
    { href: '/sponsors', label: 'Sponsors', icon: Award },
  ]

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <nav className="bg-gradient-to-r from-green-900 via-green-800 to-green-900 border-b border-green-700 shadow-xl sticky top-0 z-50 backdrop-blur-sm bg-opacity-95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="bg-gradient-to-br from-yellow-400 to-yellow-600 p-2 rounded-lg shadow-lg group-hover:scale-110 transition-transform">
              <Trophy className="w-6 h-6 text-green-900" />
            </div>
            <span className="text-xl font-bold text-white hidden sm:block">
              JCL Chandrapur
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="flex space-x-1 sm:space-x-2">
            {navItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 rounded-lg font-medium transition-all duration-200
                    ${active
                      ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-green-900 shadow-lg scale-105'
                      : 'text-green-100 hover:bg-green-700/50 hover:text-white'
                    }
                  `}
                >
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="text-sm sm:text-base">{item.label}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </nav>
  )
}
