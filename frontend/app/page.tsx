import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function LandingPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen py-2">
            <main className="flex flex-col items-center justify-center w-full flex-1 px-20 text-center">
                <h1 className="text-6xl font-bold">
                    Welcome to <span className="text-blue-600">Techmplish ATS</span>
                </h1>
                <p className="mt-3 text-2xl">
                    AI-Powered Applicant Tracking System
                </p>
                <div className="flex mt-6 space-x-4">
                    <Link href="/login">
                        <Button size="lg">Login</Button>
                    </Link>
                    <Link href="/signup">
                        <Button variant="outline" size="lg">Sign Up</Button>
                    </Link>
                </div>
            </main>
        </div>
    )
}
