'use client'

import Navbar from '@/components/layout/Navbar'
import { Award, Trophy, Heart, UtensilsCrossed, Hotel, Gift, Droplets, Radio, DoorOpen, Users } from 'lucide-react'

export default function SponsorsPage() {
  const sponsorCategories = [
    { 
      label: 'Title Sponsor', 
      icon: Trophy, 
      color: 'yellow',
      description: 'Premium visibility across all platforms and events',
      logoSize: '800x400px'
    },
    { 
      label: 'Co-Sponsor', 
      icon: Award, 
      color: 'green',
      description: 'Strategic partnership with prominent brand placement',
      logoSize: '600x300px'
    },
    { 
      label: 'Food Sponsor', 
      icon: UtensilsCrossed, 
      color: 'orange',
      description: 'Official food and catering partner for all events',
      logoSize: '500x250px'
    },
    { 
      label: 'Hospitality Sponsor', 
      icon: Hotel, 
      color: 'blue',
      description: 'Providing comfort and hospitality services',
      logoSize: '500x250px'
    },
    { 
      label: 'Presentation Sponsor', 
      icon: Gift, 
      color: 'purple',
      description: 'Associated with trophy and award presentations',
      logoSize: '500x250px'
    },
    { 
      label: 'Water Bottle Sponsor', 
      icon: Droplets, 
      color: 'cyan',
      description: 'Official hydration partner for players and audience',
      logoSize: '500x250px'
    },
    { 
      label: 'Media Partner', 
      icon: Radio, 
      color: 'red',
      description: 'Official media coverage and promotion partner',
      logoSize: '500x250px'
    },
    { 
      label: 'Entry Gate Sponsor', 
      icon: DoorOpen, 
      color: 'indigo',
      description: 'Prominent branding at venue entry points',
      logoSize: '500x250px'
    },
    { 
      label: 'Event Partners', 
      icon: Users, 
      color: 'pink',
      description: 'Supporting partners for successful event execution',
      logoSize: '400x200px'
    },
  ]

  return (
    <>
      <Navbar />
      <main className="min-h-screen p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 drop-shadow-lg">
              Our Sponsors & Partners
            </h1>
            <p className="text-xl text-green-100 max-w-2xl mx-auto">
              We thank our generous sponsors and partners for making JCL Chandrapur 2025 possible
            </p>
          </div>

          {/* All Sponsor Categories */}
          <div className="space-y-12 mb-12">
            {sponsorCategories.map((category, index) => {
              const Icon = category.icon
              const isTitle = category.label === 'Title Sponsor'
              const borderColorClasses = {
                yellow: 'border-yellow-400',
                green: 'border-green-400',
                orange: 'border-orange-400',
                blue: 'border-blue-400',
                purple: 'border-purple-400',
                cyan: 'border-cyan-400',
                red: 'border-red-400',
                indigo: 'border-indigo-400',
                pink: 'border-pink-400',
              }
              const bgColorClasses = {
                yellow: 'from-yellow-400 to-yellow-600',
                green: 'from-green-500 to-green-700',
                orange: 'from-orange-500 to-orange-700',
                blue: 'from-blue-500 to-blue-700',
                purple: 'from-purple-500 to-purple-700',
                cyan: 'from-cyan-500 to-cyan-700',
                red: 'from-red-500 to-red-700',
                indigo: 'from-indigo-500 to-indigo-700',
                pink: 'from-pink-500 to-pink-700',
              }
              const iconColorClasses = {
                yellow: 'text-yellow-500',
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
                <div key={index} className={isTitle ? 'mb-16' : ''}>
                  {/* Category Header */}
                  <div className="text-center mb-6">
                    <div className={`inline-flex items-center gap-2 bg-gradient-to-r ${bgColorClasses[category.color as keyof typeof bgColorClasses]} px-6 py-3 rounded-lg shadow-lg`}>
                      <Icon className={`w-6 h-6 ${category.color === 'yellow' ? 'text-green-900' : 'text-white'}`} />
                      <span className={`${category.color === 'yellow' ? 'text-green-900' : 'text-white'} font-bold text-lg uppercase`}>
                        {category.label}
                      </span>
                    </div>
                    <p className="text-green-200 mt-2 text-sm">{category.description}</p>
                  </div>
                  
                  {/* Logo Card */}
                  <div className={`${isTitle ? 'max-w-4xl' : 'max-w-2xl'} mx-auto`}>
                    <div className={`bg-white rounded-2xl p-8 shadow-2xl border-4 ${borderColorClasses[category.color as keyof typeof borderColorClasses]}`}>
                      {/* Logo Placeholder */}
                      <div className={`relative ${isTitle ? 'h-64' : 'h-48'} bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl flex items-center justify-center mb-4 border-2 border-dashed border-gray-300`}>
                        <div className="text-center">
                          <Icon className={`${isTitle ? 'w-24 h-24' : 'w-16 h-16'} ${iconColorClasses[category.color as keyof typeof iconColorClasses]} mx-auto mb-3`} />
                          <p className={`${isTitle ? 'text-3xl' : 'text-2xl'} font-bold text-gray-800 mb-2 uppercase`}>
                            {category.label}
                          </p>
                          <p className="text-gray-500 text-sm">Logo Size: {category.logoSize}</p>
                          <p className="text-gray-400 text-xs mt-1">PNG/SVG with transparent background</p>
                        </div>
                      </div>
                      
                      {/* Benefits */}
                      {isTitle && (
                        <div className="text-center space-y-2 mt-6">
                          <h3 className="text-xl font-bold text-gray-800">Premium Visibility Package</h3>
                          <div className="grid md:grid-cols-2 gap-2 text-gray-600 text-sm max-w-xl mx-auto">
                            <div>✓ Logo on all website pages</div>
                            <div>✓ Venue banner placement</div>
                            <div>✓ Social media features</div>
                            <div>✓ Press release mentions</div>
                            <div>✓ Official merchandise branding</div>
                            <div>✓ Live streaming credits</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Become a Sponsor CTA */}
          <div className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-400 rounded-2xl p-8 md:p-12 text-center shadow-2xl">
            <Heart className="w-12 h-12 text-green-900 mx-auto mb-4" />
            <h2 className="text-3xl md:text-4xl font-bold text-green-900 mb-4">
              Become a Sponsor
            </h2>
            <p className="text-green-800 text-lg mb-6 max-w-2xl mx-auto">
              Join us in supporting local cricket talent and be part of the JCL Chandrapur legacy.
              Your sponsorship helps us create better opportunities for players.
            </p>
            <button className="px-8 py-4 bg-green-900 text-white font-bold rounded-lg hover:bg-green-800 transition-all shadow-lg hover:scale-105">
              Contact Us for Sponsorship
            </button>
          </div>

          {/* Thank You Section */}
          <div className="mt-12 text-center">
            <p className="text-green-100 text-lg">
              A heartfelt thank you to all our sponsors, partners, and supporters
              <br />
              for making JCL Chandrapur 2025 a grand success!
            </p>
          </div>
        </div>
      </main>
    </>
  )
}
