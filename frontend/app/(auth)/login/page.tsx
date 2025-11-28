"use client"

import { useState } from "react"
import { useAuth } from "@/context/AuthContext"
import api from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from "@/components/ui/card"
import Link from "next/link"
import { Shield } from "lucide-react"

export default function LoginPage() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const { login } = useAuth()
    const [error, setError] = useState("")

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const { data } = await api.post("/auth/login", { email, password })
            // Backend returns { token, role, user_id }
            const userData = {
                id: data.user_id,
                email: email,
                role: data.role
            }
            // Backend only returns 'token' (access token), no refresh token yet
            login(data.token, "", userData)

            // Redirect based on role
            if (data.role === 'admin') {
                window.location.href = '/admin/dashboard'
            } else if (data.role === 'candidate') {
                window.location.href = '/portal/dashboard'
            } else {
                window.location.href = '/dashboard'
            }
        } catch (err) {
            setError("Invalid credentials")
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
                        <CardTitle className="text-2xl text-center">Sign in</CardTitle>
                        <CardDescription className="text-center">
                            Enter your email and password to access your account
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleLogin} className="space-y-4">
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
                                <label className="text-sm font-medium">Password</label>
                                <Input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                            {error && <p className="text-sm text-red-500">{error}</p>}
                            <Button type="submit" className="w-full">Sign In</Button>
                        </form>
                    </CardContent>
                    <CardFooter className="justify-center">
                        <Link href="/signup" className="text-sm text-primary hover:underline">
                            Don't have an account? Sign up
                        </Link>
                    </CardFooter>
                </Card>
            </div>
        </div>
    )
}
