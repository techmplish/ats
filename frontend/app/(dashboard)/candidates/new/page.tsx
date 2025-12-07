"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import api from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"

export default function NewCandidatePage() {
    const router = useRouter()
    const { toast } = useToast()
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        linkedin_url: "",
        portfolio_url: "",
        skills: "",
        experience_years: ""
    })

    const [uploading, setUploading] = useState(false)

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0]) return
        setUploading(true)
        try {
            const file = e.target.files[0]
            const uploadData = new FormData()
            uploadData.append("file", file)
            // No candidate_id needed for parsing-only mode

            const res = await api.post("/resume/upload", uploadData, {
                headers: { "Content-Type": "multipart/form-data" }
            })

            const parsed = res.data.parsed_data
            if (parsed) {
                setFormData(prev => ({
                    ...prev,
                    first_name: parsed.first_name || prev.first_name,
                    last_name: parsed.last_name || prev.last_name,
                    email: parsed.email || prev.email,
                    phone: parsed.phone || prev.phone,
                    skills: Array.isArray(parsed.skills) ? parsed.skills.join(", ") : (parsed.skills || prev.skills),
                    experience_years: parsed.experience_years ? String(parsed.experience_years) : prev.experience_years
                }))
                toast({ title: "Resume Parsed", description: "Form auto-filled from resume." })
            }
        } catch (error) {
            console.error("Upload failed", error)
            toast({ title: "Upload Failed", description: "Could not parse resume.", variant: "destructive" })
        } finally {
            setUploading(false)
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            await api.post("/candidates", {
                ...formData,
                experience_years: parseInt(formData.experience_years) || 0
            })
            toast({
                title: "Success",
                description: "Candidate created successfully",
            })
            router.push("/dashboard")
        } catch (error) {
            console.error(error)
            toast({
                title: "Error",
                description: "Failed to create candidate",
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-2xl mx-auto">
            <Card>
                <CardHeader>
                    <CardTitle className="flex justify-between items-center">
                        Add New Candidate
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => document.getElementById('cv-upload')?.click()}>
                                {uploading ? "Parsing..." : "Upload CV"}
                            </Button>
                            <input id="cv-upload" type="file" className="hidden" accept=".pdf,.docx" onChange={handleFileUpload} />
                        </div>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="first_name">First Name</Label>
                                <Input id="first_name" name="first_name" required onChange={handleChange} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="last_name">Last Name</Label>
                                <Input id="last_name" name="last_name" required onChange={handleChange} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" name="email" type="email" required onChange={handleChange} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone</Label>
                            <Input id="phone" name="phone" onChange={handleChange} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="linkedin_url">LinkedIn URL</Label>
                            <Input id="linkedin_url" name="linkedin_url" onChange={handleChange} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="skills">Skills (comma separated)</Label>
                            <Input id="skills" name="skills" placeholder="Python, React, SQL" onChange={handleChange} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="experience_years">Years of Experience</Label>
                            <Input id="experience_years" name="experience_years" type="number" onChange={handleChange} />
                        </div>

                        <div className="flex justify-end gap-4 pt-4">
                            <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
                            <Button type="submit" disabled={loading}>
                                {loading ? "Creating..." : "Create Candidate"}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
