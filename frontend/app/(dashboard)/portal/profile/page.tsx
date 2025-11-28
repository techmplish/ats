"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/context/AuthContext"
import api from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Upload, FileText } from "lucide-react"

export default function CandidateProfilePage() {
    const { user } = useAuth()
    const { toast } = useToast()
    const [loading, setLoading] = useState(false)
    const [uploading, setUploading] = useState(false)

    const [formData, setFormData] = useState({
        first_name: "",
        last_name: "",
        phone: "",
        linkedin_url: "",
        portfolio_url: ""
    })

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const { data } = await api.get("/candidates/me")
                setFormData({
                    first_name: data.first_name || "",
                    last_name: data.last_name || "",
                    phone: data.phone || "",
                    linkedin_url: data.linkedin_url || "",
                    portfolio_url: data.portfolio_url || ""
                })
            } catch (error) {
                console.log("Failed to fetch profile", error)
            }
        }
        fetchProfile()
    }, [])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleSave = async () => {
        setLoading(true)
        try {
            await api.put("/candidates/me", formData)
            toast({
                title: "Profile Updated",
                description: "Your information has been saved successfully.",
            })
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to update profile.",
                variant: "destructive"
            })
        } finally {
            setLoading(false)
        }
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return

        const file = e.target.files[0]
        const formData = new FormData()
        formData.append("file", file)

        // We need the candidate ID to link the resume. 
        // The backend /upload endpoint expects 'candidate_id'.
        // However, we don't have it easily available in the frontend context if we just signed up.
        // We should probably update the /upload endpoint to infer candidate_id from the token if not provided.
        // For now, let's try to fetch the candidate ID first or rely on the backend to handle it.
        // Actually, let's update the backend /upload to handle 'me' context or similar.
        // Or better: The backend /candidates/me endpoint creates the candidate record.
        // So we should ensure the candidate record exists before uploading.

        setUploading(true)
        try {
            // First ensure candidate record exists
            await api.put("/candidates/me", {})

            // Now we need the candidate ID. This is tricky without a GET /me for candidate.
            // Let's assume for this MVP we can pass a special flag or the backend /upload needs to be smarter.
            // Let's modify the backend /upload to find the candidate by user_id from token.

            await api.post("/resume/upload", formData, {
                headers: { "Content-Type": "multipart/form-data" }
            })

            toast({
                title: "Resume Uploaded",
                description: "Your resume has been uploaded successfully.",
            })
        } catch (error) {
            toast({
                title: "Upload Failed",
                description: "Could not upload resume.",
                variant: "destructive"
            })
        } finally {
            setUploading(false)
        }
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center gap-6">
                <Avatar className="h-24 w-24">
                    <AvatarImage src="/avatars/01.png" />
                    <AvatarFallback className="text-2xl">{user?.email[0].toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
                    <p className="text-muted-foreground">Manage your personal information and resume</p>
                </div>
            </div>

            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Personal Information</CardTitle>
                        <CardDescription>Update your contact details</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>First Name</Label>
                                <Input name="first_name" value={formData.first_name} onChange={handleChange} placeholder="John" />
                            </div>
                            <div className="space-y-2">
                                <Label>Last Name</Label>
                                <Input name="last_name" value={formData.last_name} onChange={handleChange} placeholder="Doe" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Email</Label>
                            <Input value={user?.email} disabled />
                        </div>
                        <div className="space-y-2">
                            <Label>Phone</Label>
                            <Input name="phone" value={formData.phone} onChange={handleChange} placeholder="+1 (555) 000-0000" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Professional Links</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>LinkedIn URL</Label>
                            <Input name="linkedin_url" value={formData.linkedin_url} onChange={handleChange} placeholder="https://linkedin.com/in/..." />
                        </div>
                        <div className="space-y-2">
                            <Label>Portfolio URL</Label>
                            <Input name="portfolio_url" value={formData.portfolio_url} onChange={handleChange} placeholder="https://..." />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Resume</CardTitle>
                        <CardDescription>Upload your latest resume</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="border-2 border-dashed rounded-lg p-8 text-center hover:bg-gray-50 transition-colors relative">
                            <input
                                type="file"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                accept=".pdf,.docx,.doc"
                                onChange={handleFileUpload}
                                disabled={uploading}
                            />
                            {uploading ? (
                                <div className="flex flex-col items-center gap-2">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                    <p className="text-sm text-muted-foreground">Uploading...</p>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-2">
                                    <Upload className="h-8 w-8 text-muted-foreground" />
                                    <p className="text-sm text-muted-foreground">Click to upload or drag and drop</p>
                                    <p className="text-xs text-muted-foreground">PDF, DOCX up to 10MB</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end">
                    <Button onClick={handleSave} disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                    </Button>
                </div>
            </div>
        </div>
    )
}
