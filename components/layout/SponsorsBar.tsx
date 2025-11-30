'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Trophy, Award, UtensilsCrossed, Shirt, Gift, Droplets, UserCheck, DoorOpen, Users, Store, Radio, ExternalLink } from 'lucide-react'

export default function SponsorsBar() {
  const sponsorCategories = [
    { label: 'Food Partner', icon: UtensilsCrossed, color: 'orange', logoPath: '/sponsors/food-sponsor-anand-nagri.png', name: 'Anand Nagri Bank Parivar' },
    { label: 'Co-Sponsor', icon: Award, color: 'green', logoPath: '/sponsors/co-sponsor-bpb.png', name: 'BPB' },
    { label: 'T-Shirt Sponsor', icon: Shirt, color: 'purple', logoPath: '/sponsors/tshirt-sponsor-guru-ganesh.jpeg', name: 'Guru Ganesh' },
    { label: 'Water Bottle Sponsor', icon: Droplets, color: 'cyan', logoPath: '/sponsors/water-bottle-jain-trading.png', name: 'Jain Trading Company' },
    { label: 'Community & FairPlay Partner', icon: UserCheck, color: 'blue', logoPath: '/sponsors/community-fairplay-shri-rahulbabu-puglia.png', name: 'Shri RahulBabu Puglia' },
    { label: 'Presentation Partner', icon: Gift, color: 'indigo', logoPath: '/sponsors/presentation-praful-traders.png', name: 'Praful Traders' },
    { label: 'Entry Gate Partner', icon: DoorOpen, color: 'amber', logoPath: '/sponsors/entry-gate-rajesh-jewellers.png', name: 'Rajesh Jewellers' },
    { label: 'Product Stall Partner', icon: Store, color: 'teal', logoPath: '/sponsors/product-stall-kalptree.png', name: 'Kalptree' },
    { label: 'Media Partner', icon: Radio, color: 'red', logoPath: '/sponsors/media-partner-arihant.png', name: 'Arihant Furniture' },
    { label: 'Event Partners', icon: Users, color: 'pink', logoPath: null, name: 'Event Partners' },
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

        {/* All Sponsors Grid */}
        <div className="mb-4">
          <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-5 gap-3 max-w-6xl mx-auto">
            {sponsorCategories.map((category, index) => {
              const Icon = category.icon
              const colorClasses = {
                green: 'border-green-400 hover:border-green-500',
                orange: 'border-orange-400 hover:border-orange-500',
                blue: 'border-blue-400 hover:border-blue-500',
                purple: 'border-purple-400 hover:border-purple-500',
                cyan: 'border-cyan-400 hover:border-cyan-500',
                indigo: 'border-indigo-400 hover:border-indigo-500',
                yellow: 'border-yellow-400 hover:border-yellow-500',
                amber: 'border-amber-400 hover:border-amber-500',
                teal: 'border-teal-400 hover:border-teal-500',
                pink: 'border-pink-400 hover:border-pink-500',
                red: 'border-red-400 hover:border-red-500',
              }
              const iconColorClasses = {
                green: 'text-green-500',
                orange: 'text-orange-500',
                blue: 'text-blue-500',
                purple: 'text-purple-500',
                cyan: 'text-cyan-500',
                indigo: 'text-indigo-500',
                yellow: 'text-yellow-500',
                amber: 'text-amber-500',
                teal: 'text-teal-500',
                pink: 'text-pink-500',
                red: 'text-red-500',
              }
              
              return (
                <Link
                  key={index}
                  href="/sponsors"
                  className="group"
                >
                  <div className={`bg-white rounded-lg p-3 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border-2 ${colorClasses[category.color as keyof typeof colorClasses]}`}>
                    <div className="relative h-16 flex items-center justify-center">
                      {category.logoPath ? (
                        <Image
                          src={category.logoPath}
                          alt={category.name}
                          fill
                          className="object-contain p-1"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-100 rounded flex items-center justify-center">
                          <div className="text-center">
                            <Icon className={`w-6 h-6 ${iconColorClasses[category.color as keyof typeof iconColorClasses]} mx-auto mb-1`} />
                            <p className="text-[10px] font-semibold text-gray-700 leading-tight">{category.label}</p>
                          </div>
                        </div>
                      )}
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
