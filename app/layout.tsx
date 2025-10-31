import NavigationBar from '@/components/layout/navigation-bar';
import type React from "react"
import type { Metadata } from "next"
import { Inter, Instrument_Serif, Hind_Siliguri } from "next/font/google"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  preload: true,
})

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  variable: "--font-instrument-serif",
  weight: ["400"],
  display: "swap",
  preload: true,
})

const hindSiliguri = Hind_Siliguri({
  subsets: ['bengali', 'latin'],
  weight: ['400', '700'], // Regular and Bold
  variable: "--font-hind-siliguri",
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  title: "Brillance - Effortless Custom Contract Billing",
  description:
    "Streamline your billing process with seamless automation for every custom contract, tailored by Brillance.",
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${instrumentSerif.variable} ${hindSiliguri.variable} antialiased`}>
      <head>
      </head>
      <body className={`${inter.className} antialiased`}>
        <NavigationBar />
        {children}
      </body>
    </html>
  )
}
