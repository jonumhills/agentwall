import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AgentWall — Execution Firewall',
  description: 'Real-time firewall dashboard for OWS agent wallets',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
