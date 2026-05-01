import type { Metadata } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Mulima Secondary School',
    template: '%s | Mulima Secondary School',
  },
  description:
    'Official portal for Mulima Secondary School — Thohoyandou, Limpopo. Student marks, timetables, school fees, notices and more.',
  keywords: ['Mulima Secondary School', 'school portal', 'Limpopo', 'Thohoyandou'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body>{children}</body>
    </html>
  )
}