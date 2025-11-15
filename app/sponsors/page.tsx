'use client'

import Navbar from '@/components/layout/Navbar'
import { Award, Trophy, Star, Heart } from 'lucide-react'

export default function SponsorsPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 drop-shadow-lg">
              Our Sponsors
            </h1>
            <p className="text-xl text-green-100 max-w-2xl mx-auto">
              We thank our generous sponsors for making JCL Chandrapur possible
            </p>
          </div>

          {/* Title Sponsor Section */}
          <div className="mb-12">
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-yellow-600 px-4 py-2 rounded-lg shadow-lg">
                <Trophy className="w-6 h-6 text-green-900" />
                <span className="text-green-900 font-bold text-lg">TITLE SPONSOR</span>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-12 border border-white/20 text-center">
              <div className="h-48 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-32 h-32 mx-auto mb-4 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-lg flex items-center justify-center">
                    <Trophy className="w-16 h-16 text-green-900" />
                  </div>
                  <p className="text-2xl font-bold text-white">Your Brand Here</p>
                  <p className="text-green-200 mt-2">Title Sponsor</p>
                </div>
              </div>
            </div>
          </div>

          {/* Co-Sponsors Section */}
          <div className="mb-12">
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-700 px-4 py-2 rounded-lg shadow-lg">
                <Award className="w-6 h-6 text-white" />
                <span className="text-white font-bold text-lg">CO-SPONSORS</span>
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((index) => (
                <div
                  key={index}
                  className="bg-white/10 backdrop-blur-md rounded-xl p-8 border border-white/20 text-center hover:border-white/40 transition-all hover:scale-105"
                >
                  <div className="h-32 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-20 h-20 mx-auto mb-3 bg-gradient-to-br from-green-500 to-green-700 rounded-lg flex items-center justify-center">
                        <Star className="w-10 h-10 text-white" />
                      </div>
                      <p className="text-lg font-semibold text-white">Co-Sponsor {index}</p>
                      <p className="text-green-200 text-sm mt-1">Partner</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
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
