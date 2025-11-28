import type { Metadata } from 'next'
import { Roboto } from 'next/font/google'
import './globals.css'
import { cn } from '@/lib/utils'
import { AuthProvider } from '@/context/AuthContext'
import { Toaster } from "@/components/ui/toaster"

const roboto = Roboto({
    weight: ['300', '400', '500', '700'],
    subsets: ['latin'],
    variable: '--font-roboto',
})

export const metadata: Metadata = {
    title: 'Techmplish ATS',
    description: 'AI-Powered Applicant Tracking System',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
            <body className={cn(roboto.className, "min-h-screen bg-background font-sans antialiased")}>
                <AuthProvider>
                    {children}
                    <Toaster />
                </AuthProvider>
            </body>
        </html>
    )
}
