"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import api from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from "@/components/ui/card"
import Link from "next/link"
import { Shield } from "lucide-react"

export default function SignupPage() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [role, setRole] = useState("recruiter")
    const router = useRouter()
    const [error, setError] = useState("")

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            await api.post("/auth/register", { email, password, role, first_name: "New", last_name: "User" })
            router.push("/login")
        } catch (err) {
            setError("Signup failed. Email might be taken.")
        }
    }

    return (
        <div className="flex h-screen items-center justify-center bg-gray-100">
            <div className="w-full max-w-md">
                <div className="flex justify-center mb-8">
                    <div className="flex items-center gap-2 text-primary text-2xl font-bold">
                        <Shield className="h-8 w-8" />
                        Techmplish ATS
                    </div>
                </div>
                <Card className="shadow-lg">
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-2xl text-center">Create an account</CardTitle>
                        <CardDescription className="text-center">
                            Enter your email below to create your account
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSignup} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Email</label>
                                <Input
                                    type="email"
                                    placeholder="name@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Role</label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    value={role}
                                    onChange={(e) => setRole(e.target.value)}
                                    required
                                >
                                    <option value="recruiter">Recruiter</option>
                                    <option value="candidate">Candidate</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Password</label>
                                <Input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                            {error && <p className="text-sm text-red-500">{error}</p>}
                            <Button type="submit" className="w-full">Sign Up</Button>
                        </form>
                    </CardContent>
                    <CardFooter className="justify-center">
                        <Link href="/login" className="text-sm text-primary hover:underline">
                            Already have an account? Sign in
                        </Link>
                    </CardFooter>
                </Card>
            </div>
        </div>
    )
}
