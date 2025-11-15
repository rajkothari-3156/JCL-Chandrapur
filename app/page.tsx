'use client'

import Link from 'next/link'
import { Trophy, Brain, Users, Gavel, BarChart3, TrendingUp, Award, Zap, ArrowRight } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import SponsorsBar from '@/components/layout/SponsorsBar'

export default function Home() {
  const features = [
    {
      title: 'Player Statistics',
      description: 'View comprehensive batting, bowling, fielding, and MVP stats from multiple seasons',
      icon: BarChart3,
      href: '/stats',
      color: 'from-blue-500 to-blue-700',
      stats: ['2023 & 2024 Seasons', 'Top Performers', 'Live Rankings']
    },
    {
      title: 'Cricket Quizzes',
      description: 'Test your cricket knowledge with weekly quizzes and compete on the leaderboard',
      icon: Brain,
      href: '/quizzes',
      color: 'from-purple-500 to-purple-700',
      stats: ['Weekly Challenges', 'Real-time Scoring', 'Leaderboards']
    },
    {
      title: 'Player Registrations',
      description: 'Browse registered players, view profiles, and manage team rosters',
      icon: Users,
      href: '/registrations',
      color: 'from-green-500 to-green-700',
      stats: ['Player Profiles', 'Contact Info', 'Playing Styles']
    },
    {
      title: 'Auction System',
      description: 'Manage player auctions, team budgets, and track draft picks in real-time',
      icon: Gavel,
      href: '/auction',
      color: 'from-orange-500 to-orange-700',
      stats: ['Live Bidding', 'Team Budgets', 'Player Pool']
    },
    {
      title: 'Our Sponsors',
      description: 'Meet our valued partners and sponsors who make JCL Chandrapur possible',
      icon: Award,
      href: '/sponsors',
      color: 'from-yellow-500 to-yellow-700',
      stats: ['Title Sponsor', 'Co-Sponsors', 'Partners']
    },
  ]

  return (
    <>
      <Navbar />
      
      <main className="min-h-screen">
        {/* Hero Section */}
        <section className="relative py-20 px-4 overflow-hidden">
          {/* Animated background elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute w-96 h-96 bg-yellow-400/10 rounded-full blur-3xl -top-48 -left-48 animate-pulse"></div>
            <div className="absolute w-96 h-96 bg-green-400/10 rounded-full blur-3xl -bottom-48 -right-48 animate-pulse" style={{ animationDelay: '2s' }}></div>
          </div>

          <div className="max-w-7xl mx-auto relative z-10">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 bg-yellow-400/20 backdrop-blur-sm px-4 py-2 rounded-full border border-yellow-400/30 mb-6">
                <Zap className="w-4 h-4 text-yellow-300" />
                <span className="text-yellow-100 text-sm font-medium">JCL Chandrapur 2025</span>
              </div>
              
              <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
                Welcome to
                <span className="block bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-400 bg-clip-text text-transparent">
                  JCL Cricket League
                </span>
              </h1>
              
              <p className="text-xl md:text-2xl text-green-100 max-w-3xl mx-auto leading-relaxed">
                Your complete cricket management platform featuring live stats, interactive quizzes, 
                player registrations, and real-time auction systems
              </p>
            </div>

            {/* Feature Cards Grid */}
            <div className="grid md:grid-cols-2 gap-6 lg:gap-8 mt-12">
              {features.map((feature, index) => {
                const Icon = feature.icon
                return (
                  <Link
                    key={feature.href}
                    href={feature.href}
                    className="group relative bg-white/10 backdrop-blur-md rounded-2xl p-6 lg:p-8 border border-white/20 hover:border-white/40 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    {/* Gradient overlay */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity duration-300`}></div>
                    
                    <div className="relative z-10">
                      {/* Icon */}
                      <div className={`inline-flex p-4 rounded-xl bg-gradient-to-br ${feature.color} shadow-lg mb-4 group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className="w-8 h-8 text-white" />
                      </div>

                      {/* Title */}
                      <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-yellow-300 transition-colors">
                        {feature.title}
                      </h3>

                      {/* Description */}
                      <p className="text-green-100 mb-4 leading-relaxed">
                        {feature.description}
                      </p>

                      {/* Stats */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {feature.stats.map((stat) => (
                          <span
                            key={stat}
                            className="text-xs px-3 py-1 rounded-full bg-white/10 text-green-100 border border-white/20"
                          >
                            {stat}
                          </span>
                        ))}
                      </div>

                      {/* CTA */}
                      <div className="flex items-center text-yellow-300 font-semibold group-hover:gap-2 transition-all">
                        <span>Explore</span>
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>

            {/* Quick Stats Section */}
            <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Active Players', value: '50+', icon: Users },
                { label: 'Total Matches', value: '15+', icon: Trophy },
                { label: 'Quiz Participants', value: '50+', icon: Brain },
                { label: 'Auction Teams', value: '8', icon: Gavel },
              ].map((stat, index) => {
                const Icon = stat.icon
                return (
                  <div
                    key={stat.label}
                    className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 text-center"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <Icon className="w-8 h-8 text-yellow-300 mx-auto mb-2" />
                    <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
                    <div className="text-sm text-green-100">{stat.label}</div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* Sponsors Bar */}
        <SponsorsBar />

        {/* Footer */}
        <footer className="border-t border-green-800/50 bg-green-950/50 backdrop-blur-sm mt-20">
          <div className="max-w-7xl mx-auto px-4 py-8 text-center">
            <p className="text-green-200">
              © 2025 JCL Chandrapur Cricket League. All rights reserved.
            </p>
          </div>
        </footer>
      </main>
    </>
  )
}
