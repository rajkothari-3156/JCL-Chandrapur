'use client'

import Link from 'next/link'
import { Trophy, Award } from 'lucide-react'

export default function SponsorsBar() {
  return (
    <div className="bg-gradient-to-r from-green-950 via-green-900 to-green-950 border-t border-green-800 shadow-inner">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Title Sponsor */}
          <div className="flex items-center gap-3">
            <span className="text-yellow-400 text-sm font-semibold">TITLE SPONSOR:</span>
            <Link 
              href="/sponsors"
              className="flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-yellow-500 px-4 py-2 rounded-lg hover:scale-105 transition-transform"
            >
              <Trophy className="w-5 h-5 text-green-900" />
              <span className="text-green-900 font-bold">Your Brand Here</span>
            </Link>
          </div>

          {/* Co-Sponsors */}
          <div className="flex items-center gap-3 flex-wrap justify-center">
            <span className="text-green-300 text-sm font-semibold">CO-SPONSORS:</span>
            {[1, 2, 3].map((index) => (
              <Link
                key={index}
                href="/sponsors"
                className="flex items-center gap-1 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-md border border-white/20 hover:border-white/40 hover:bg-white/20 transition-all"
              >
                <Award className="w-4 h-4 text-green-300" />
                <span className="text-white text-sm font-medium">Co-Sponsor {index}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* View All Sponsors Link */}
        <div className="text-center mt-3">
          <Link 
            href="/sponsors" 
            className="text-yellow-300 text-sm hover:text-yellow-200 hover:underline"
          >
            View All Sponsors →
          </Link>
        </div>
      </div>
    </div>
  )
}
