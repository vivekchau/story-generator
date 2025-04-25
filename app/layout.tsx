// This is a server component (no 'use client' here)
import type { Metadata } from "next"
import "@/app/globals.css"
import { Inter } from "next/font/google"
import { ClientLayout } from "./client-layout"
import { Providers } from '@/components/providers'

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "AIStory - AI-Powered Bedtime Stories",
  description: "Create magical bedtime stories with AI",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <ClientLayout>{children}</ClientLayout>
        </Providers>
      </body>
    </html>
  )
}



import './globals.css'