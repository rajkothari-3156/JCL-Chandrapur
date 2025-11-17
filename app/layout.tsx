import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'JCL Chandrapur | Cricket League Management Platform',
  description: 'Complete cricket management platform featuring live player statistics, interactive quizzes, player registrations, and real-time auction systems for JCL Chandrapur 2025',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-gradient-to-br from-cricket-green via-cricket-lightgreen to-green-900 min-h-screen">
        {children}
      </body>
    </html>
  )
}
