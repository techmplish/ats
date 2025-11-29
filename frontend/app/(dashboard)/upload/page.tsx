"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import api from "@/lib/api"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, FileText, CheckCircle, Loader2 } from "lucide-react"

export default function UploadPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [parsedData, setParsedData] = useState<any>(null)
    const [mode, setMode] = useState("upload") // upload | manual

    const [formData, setFormData] = useState({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        linkedin_url: "",
        skills: "",
        experience_years: 0
    })

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0]) return

        setLoading(true)
        const file = e.target.files[0]
        const data = new FormData()
        data.append("file", file)

        try {
            const res = await api.post("/resume/upload", data, {
                headers: { "Content-Type": "multipart/form-data" }
            })

            const parsed = res.data.parsed_data
            setParsedData(parsed)

            // Auto-fill form with parsed data
            setFormData({
                first_name: parsed.first_name || "",
                last_name: parsed.last_name || "",
                email: parsed.email || "",
                phone: parsed.phone || "",
                linkedin_url: parsed.linkedin_url || "",
                skills: Array.isArray(parsed.skills) ? parsed.skills.join(", ") : parsed.skills || "",
                experience_years: parsed.experience_years || 0
            })

            setMode("review") // Switch to review mode
        } catch (error) {
            console.error("Upload failed", error)
            alert("Failed to upload resume")
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            // In a real app, we would save/update the candidate here
            // For now, we'll just simulate a save and redirect
            await api.put("/candidates/me", formData) // Assuming we are updating 'me' or creating new

            router.push("/candidates")
        } catch (error) {
            console.error("Save failed", error)
            alert("Failed to save candidate profile")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <h1 className="text-3xl font-bold">Add Candidate</h1>

            <Tabs value={mode} onValueChange={setMode} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="upload">Upload Resume</TabsTrigger>
                    <TabsTrigger value="manual">Manual Entry</TabsTrigger>
                </TabsList>

                <TabsContent value="upload">
                    <Card>
                        <CardHeader>
                            <CardTitle>Upload Resume</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="border-2 border-dashed rounded-lg p-10 text-center hover:bg-accent/50 transition-colors">
                                <input
                                    type="file"
                                    id="resume-upload"
                                    className="hidden"
                                    accept=".pdf,.doc,.docx"
                                    onChange={handleFileUpload}
                                    disabled={loading}
                                />
                                <label htmlFor="resume-upload" className="cursor-pointer flex flex-col items-center gap-2">
                                    {loading ? (
                                        <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
                                    ) : (
                                        <Upload className="h-10 w-10 text-muted-foreground" />
                                    )}
                                    <span className="text-sm font-medium">
                                        {loading ? "Parsing Resume..." : "Click to upload PDF or DOCX"}
                                    </span>
                                </label>
                            </div>
                            <p className="text-xs text-muted-foreground text-center">
                                We will automatically extract details from the resume.
                            </p>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="manual">
                    <Card>
                        <CardHeader>
                            <CardTitle>Candidate Details</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="first_name">First Name</Label>
                                        <Input
                                            id="first_name"
                                            value={formData.first_name}
                                            onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="last_name">Last Name</Label>
                                        <Input
                                            id="last_name"
                                            value={formData.last_name}
                                            onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="phone">Phone</Label>
                                        <Input
                                            id="phone"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="linkedin">LinkedIn URL</Label>
                                    <Input
                                        id="linkedin"
                                        value={formData.linkedin_url}
                                        onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="skills">Skills (comma separated)</Label>
                                    <Textarea
                                        id="skills"
                                        value={formData.skills}
                                        onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                                        placeholder="Python, React, SQL..."
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="experience">Experience (Years)</Label>
                                    <Input
                                        id="experience"
                                        type="number"
                                        value={formData.experience_years}
                                        onChange={(e) => setFormData({ ...formData, experience_years: parseInt(e.target.value) || 0 })}
                                    />
                                </div>

                                <Button type="submit" className="w-full" disabled={loading}>
                                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                                    Save Candidate
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="review">
                    <Card>
                        <CardHeader>
                            <CardTitle>Review Parsed Data</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="review_first_name">First Name</Label>
                                        <Input
                                            id="review_first_name"
                                            value={formData.first_name}
                                            onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="review_last_name">Last Name</Label>
                                        <Input
                                            id="review_last_name"
                                            value={formData.last_name}
                                            onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="review_email">Email</Label>
                                        <Input
                                            id="review_email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="review_phone">Phone</Label>
                                        <Input
                                            id="review_phone"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="review_skills">Skills</Label>
                                    <Textarea
                                        id="review_skills"
                                        value={formData.skills}
                                        onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="review_experience">Experience (Years)</Label>
                                    <Input
                                        id="review_experience"
                                        type="number"
                                        value={formData.experience_years}
                                        onChange={(e) => setFormData({ ...formData, experience_years: parseInt(e.target.value) || 0 })}
                                    />
                                </div>

                                <div className="flex gap-2">
                                    <Button type="button" variant="outline" onClick={() => setMode("upload")}>Cancel</Button>
                                    <Button type="submit" className="flex-1">Save Profile</Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
