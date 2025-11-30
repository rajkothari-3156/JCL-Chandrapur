'use client'

import Navbar from '@/components/layout/Navbar'
import Image from 'next/image'
import { Award, Trophy, Heart, UtensilsCrossed, Shirt, Users, Droplets, Gift, DoorOpen, Store, UserCheck } from 'lucide-react'

interface Partner {
  name: string
  logoPath: string
}

interface SponsorCategory {
  label: string
  icon: any
  color: string
  description: string
  height: number
  logoPath?: string
  name?: string
  partners?: Partner[]
}

export default function SponsorsPage() {
  const sponsorCategories: SponsorCategory[] = [
    { 
      label: 'Food Partner', 
      icon: UtensilsCrossed, 
      color: 'orange',
      description: 'Official food and catering partner for all events',
      logoPath: '/sponsors/food-sponsor-anand-nagri.png',
      name: 'Anand Nagri Bank Parivar',
      height: 280
    },
    { 
      label: 'Co-Sponsor', 
      icon: Award, 
      color: 'green',
      description: 'Strategic partnership with prominent brand placement',
      logoPath: '/sponsors/co-sponsor-bpb.png',
      name: 'BPB',
      height: 240
    },
    { 
      label: 'T-Shirt Sponsor', 
      icon: Shirt, 
      color: 'purple',
      description: 'Official apparel partner for the tournament',
      logoPath: '/sponsors/tshirt-sponsor-guru-ganesh.jpeg',
      name: 'Guru Ganesh',
      height: 210
    },
    { 
      label: 'Water Bottle Sponsor', 
      icon: Droplets, 
      color: 'cyan',
      description: 'Official hydration partner for players and audience',
      logoPath: '/sponsors/water-bottle-jain-trading.png',
      name: 'Jain Trading Company',
      height: 180
    },
    { 
      label: 'Presentation Partner', 
      icon: Gift, 
      color: 'indigo',
      description: 'Associated with trophy and award presentations',
      logoPath: '/sponsors/presentation-praful-traders.png',
      name: 'Praful Traders',
      height: 180
    },
    { 
      label: 'Entry Gate Partner', 
      icon: DoorOpen, 
      color: 'yellow',
      description: 'Prominent branding at venue entry points',
      logoPath: '/sponsors/entry-gate-rajesh-jewellers.png',
      name: 'Rajesh Jewellers',
      height: 180
    },
    { 
      label: 'Product Stall Partner', 
      icon: Store, 
      color: 'teal',
      description: 'Official product stall and merchandise partner',
      logoPath: '/sponsors/product-stall-kalptree.png',
      name: 'Kalptree',
      height: 180
    },
    { 
      label: 'Community & FairPlay Partner', 
      icon: UserCheck, 
      color: 'blue',
      description: 'Promoting fair play and community values',
      logoPath: '/sponsors/community-fairplay-shri-rahulbabu-puglia.png',
      name: 'Shri RahulBabu Puglia',
      height: 240
    },
    { 
      label: 'Event Partners', 
      icon: Users, 
      color: 'pink',
      description: 'Supporting partners for successful event execution',
      partners: [
        { name: 'Active Tribe', logoPath: '/sponsors/event-partner-active-tribe.png' },
        { name: 'Alankar Imitation Jewellery', logoPath: '/sponsors/event-partner-alankar.png' },
        { name: 'Kanak Jewels', logoPath: '/sponsors/event-partner-kanak-jewels.png' },
        { name: 'Sumit Jewellers', logoPath: '/sponsors/event-partner-sumit-jewellers.png' },
        { name: 'Chanda Plastics', logoPath: '/sponsors/event-partner-chanda-plastics.jpeg' },
        { name: 'Dhansiddh Earthmovers', logoPath: '/sponsors/event-partner-dhansiddh.jpeg' },
        { name: 'Giriraj Marketing', logoPath: '/sponsors/event-partner-giriraj.png' },
        { name: 'Ramdev Readymade', logoPath: '/sponsors/event-partner-ramdev.jpeg' },
        { name: 'Absolute Healthcare', logoPath: '/sponsors/event-partner-absolute.jpeg' },
        { name: 'Maruti Group Cotton Gining', logoPath: '/sponsors/event-partner-maruti.jpeg' },
      ],
      height: 140
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
              const borderColorClasses = {
                green: 'border-green-400',
                orange: 'border-orange-400',
                blue: 'border-blue-400',
                purple: 'border-purple-400',
                pink: 'border-pink-400',
                cyan: 'border-cyan-400',
                indigo: 'border-indigo-400',
                yellow: 'border-yellow-400',
                teal: 'border-teal-400',
              }
              const bgColorClasses = {
                green: 'from-green-500 to-green-700',
                orange: 'from-orange-500 to-orange-700',
                blue: 'from-blue-500 to-blue-700',
                purple: 'from-purple-500 to-purple-700',
                pink: 'from-pink-500 to-pink-700',
                cyan: 'from-cyan-500 to-cyan-700',
                indigo: 'from-indigo-500 to-indigo-700',
                yellow: 'from-yellow-400 to-yellow-600',
                teal: 'from-teal-500 to-teal-700',
              }
              
              return (
                <div key={index}>
                  {/* Category Header */}
                  <div className="text-center mb-6">
                    <div className={`inline-flex items-center gap-2 bg-gradient-to-r ${bgColorClasses[category.color as keyof typeof bgColorClasses]} px-6 py-3 rounded-lg shadow-lg`}>
                      <Icon className="w-6 h-6 text-white" />
                      <span className="text-white font-bold text-lg uppercase">
                        {category.label}
                      </span>
                    </div>
                    <p className="text-green-200 mt-2 text-sm">{category.description}</p>
                  </div>
                  
                  {/* Logo Card(s) */}
                  {category.partners ? (
                    // Multiple Event Partners
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                      {category.partners.map((partner, pIndex) => (
                        <div key={pIndex} className={`bg-white rounded-xl p-6 shadow-xl border-2 ${borderColorClasses[category.color as keyof typeof borderColorClasses]}`}>
                          <div className="relative flex items-center justify-center" style={{ height: `${category.height}px` }}>
                            <Image
                              src={partner.logoPath}
                              alt={partner.name}
                              fill
                              className="object-contain p-2"
                            />
                          </div>
                          <p className="text-center text-gray-700 font-semibold mt-3 text-sm">{partner.name}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    // Single Sponsor
                    <div className="max-w-3xl mx-auto">
                      <div className={`bg-white rounded-2xl p-8 shadow-2xl border-4 ${borderColorClasses[category.color as keyof typeof borderColorClasses]}`}>
                        <div className="relative flex items-center justify-center" style={{ height: `${category.height}px` }}>
                          <Image
                            src={category.logoPath!}
                            alt={category.name!}
                            fill
                            className="object-contain p-4"
                          />
                        </div>
                        <p className="text-center text-gray-800 font-bold mt-4 text-xl">{category.name}</p>
                      </div>
                    </div>
                  )}
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
