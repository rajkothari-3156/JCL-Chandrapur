'use client'

import Link from 'next/link'
import { Trophy, Award, UtensilsCrossed, Hotel, Gift, Droplets, Radio, DoorOpen, Users, ExternalLink } from 'lucide-react'

export default function SponsorsBar() {
  const sponsorCategories = [
    { label: 'Title Sponsor', icon: Trophy, color: 'yellow' },
    { label: 'Co-Sponsor', icon: Award, color: 'green' },
    { label: 'Food Sponsor', icon: UtensilsCrossed, color: 'orange' },
    { label: 'Hospitality Sponsor', icon: Hotel, color: 'blue' },
    { label: 'Presentation Sponsor', icon: Gift, color: 'purple' },
    { label: 'Water Bottle Sponsor', icon: Droplets, color: 'cyan' },
    { label: 'Media Partner', icon: Radio, color: 'red' },
    { label: 'Entry Gate Sponsor', icon: DoorOpen, color: 'indigo' },
    { label: 'Event Partners', icon: Users, color: 'pink' },
  ]

  return (
    <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border-y border-gray-700 shadow-2xl py-6">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-6">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Proudly Supported By Our Partners
          </h3>
        </div>

        {/* Title Sponsor - Largest and Most Prominent */}
        <div className="mb-6">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Trophy className="w-5 h-5 text-yellow-400" />
            <span className="text-yellow-400 font-bold text-sm uppercase tracking-wide">Title Sponsor</span>
          </div>
          
          <Link 
            href="/sponsors"
            className="block max-w-lg mx-auto group"
          >
            <div className="bg-white rounded-xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 border-4 border-yellow-400">
              <div className="relative h-24 flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <Trophy className="w-12 h-12 text-yellow-500 mx-auto mb-1" />
                    <p className="text-lg font-bold text-gray-800">TITLE SPONSOR</p>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* All Other Sponsors Grid */}
        <div className="mb-4">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-3 max-w-6xl mx-auto">
            {sponsorCategories.slice(1).map((category, index) => {
              const Icon = category.icon
              const colorClasses = {
                green: 'border-green-400 hover:border-green-500',
                orange: 'border-orange-400 hover:border-orange-500',
                blue: 'border-blue-400 hover:border-blue-500',
                purple: 'border-purple-400 hover:border-purple-500',
                cyan: 'border-cyan-400 hover:border-cyan-500',
                red: 'border-red-400 hover:border-red-500',
                indigo: 'border-indigo-400 hover:border-indigo-500',
                pink: 'border-pink-400 hover:border-pink-500',
              }
              const iconColorClasses = {
                green: 'text-green-500',
                orange: 'text-orange-500',
                blue: 'text-blue-500',
                purple: 'text-purple-500',
                cyan: 'text-cyan-500',
                red: 'text-red-500',
                indigo: 'text-indigo-500',
                pink: 'text-pink-500',
              }
              
              return (
                <Link
                  key={index}
                  href="/sponsors"
                  className="group"
                >
                  <div className={`bg-white rounded-lg p-3 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border-2 ${colorClasses[category.color as keyof typeof colorClasses]}`}>
                    <div className="relative h-16 flex items-center justify-center">
                      <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-100 rounded flex items-center justify-center">
                        <div className="text-center">
                          <Icon className={`w-6 h-6 ${iconColorClasses[category.color as keyof typeof iconColorClasses]} mx-auto mb-1`} />
                          <p className="text-[10px] font-semibold text-gray-700 leading-tight">{category.label}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Footer CTA */}
        <div className="text-center pt-4 border-t border-gray-700">
          <Link 
            href="/sponsors" 
            className="inline-flex items-center gap-2 text-yellow-400 hover:text-yellow-300 font-semibold text-sm transition-colors group"
          >
            <span>View All Sponsor Details & Partnership Opportunities</span>
            <ExternalLink className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  )
}
