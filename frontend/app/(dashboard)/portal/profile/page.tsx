"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/context/AuthContext"
import api from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Upload, Plus, Trash2, Briefcase, GraduationCap, Code, User, FileText } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function CandidateProfilePage() {
    const { user } = useAuth()
    const { toast } = useToast()
    const [loading, setLoading] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [activeTab, setActiveTab] = useState("basic")

    const [formData, setFormData] = useState<any>({
        first_name: "",
        last_name: "",
        phone: "",
        linkedin_url: "",
        portfolio_url: "",
        headline: "",
        summary: "",
        skills: "",
        education: [],
        experience: [],
        projects: [],
        languages: []
    })

    useEffect(() => {
        fetchProfile()
    }, [])

    const fetchProfile = async () => {
        try {
            const { data } = await api.get("/candidates/me")

            // Parse JSON fields if they come as strings
            const parseJson = (field: any) => {
                if (typeof field === 'string') {
                    try { return JSON.parse(field) } catch { return [] }
                }
                return field || []
            }

            setFormData({
                ...data,
                first_name: data.first_name || "",
                last_name: data.last_name || "",
                phone: data.phone || "",
                linkedin_url: data.linkedin_url || "",
                portfolio_url: data.portfolio_url || "",
                headline: data.headline || "",
                summary: data.summary || "",
                skills: data.skills || "",
                education: parseJson(data.education),
                experience: parseJson(data.experience),
                projects: parseJson(data.projects),
                languages: parseJson(data.languages)
            })
        } catch (error) {
            console.log("Failed to fetch profile", error)
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
        if (!e.target.files?.[0]) return
        setUploading(true)
        try {
            // Ensure candidate exists
            await api.put("/candidates/me", {})

            const file = e.target.files[0]
            const uploadData = new FormData()
            uploadData.append("file", file)

            const res = await api.post("/resume/upload", uploadData, {
                headers: { "Content-Type": "multipart/form-data" }
            })

            const parsed = res.data.parsed_data
            if (parsed) {
                // Auto-fill logic
                const newFormData = { ...formData }
                if (parsed.first_name) newFormData.first_name = parsed.first_name
                if (parsed.last_name) newFormData.last_name = parsed.last_name
                if (parsed.email) newFormData.email = parsed.email // Email usually read-only but good to have
                if (parsed.phone) newFormData.phone = parsed.phone
                if (parsed.skills) newFormData.skills = Array.isArray(parsed.skills) ? parsed.skills.join(", ") : parsed.skills
                if (parsed.education) {
                    // Simple mapping if parsed.education is string, make it an object
                    if (typeof parsed.education === 'string') {
                        newFormData.education = [{ degree: parsed.education, school: "", year: "" }]
                    } else if (Array.isArray(parsed.education)) {
                        newFormData.education = parsed.education
                    }
                }
                // Experience years is a number, we might put it in summary or headline
                if (parsed.experience_years) {
                    newFormData.headline = `${parsed.experience_years} Years Experience`
                }

                setFormData(newFormData)
                toast({ title: "Resume Parsed", description: "Profile fields auto-filled from resume." })
            }

            toast({ title: "Resume Uploaded", description: "Your resume has been uploaded successfully." })
        } catch (error) {
            toast({ title: "Upload Failed", description: "Could not upload resume.", variant: "destructive" })
        } finally {
            setUploading(false)
        }
    }

    // Helper to manage array fields
    const addItem = (field: string, item: any) => {
        setFormData({ ...formData, [field]: [...formData[field], item] })
    }

    const removeItem = (field: string, index: number) => {
        const newArray = [...formData[field]]
        newArray.splice(index, 1)
        setFormData({ ...formData, [field]: newArray })
    }

    const updateItem = (field: string, index: number, key: string, value: string) => {
        const newArray = [...formData[field]]
        newArray[index] = { ...newArray[index], [key]: value }
        setFormData({ ...formData, [field]: newArray })
    }

    return (
        <div className="max-w-6xl space-y-6 pb-10">
            <div className="flex items-center gap-6 mb-8">
                <Avatar className="h-24 w-24">
                    <AvatarImage src="/avatars/01.png" />
                    <AvatarFallback className="text-2xl">{user?.email[0].toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                    <h1 className="text-3xl font-bold tracking-tight">{formData.first_name} {formData.last_name}</h1>
                    <p className="text-muted-foreground">{formData.headline || "Add a headline"}</p>
                    <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                        <span>{user?.email}</span>
                        <span>{formData.phone}</span>
                        <span>{formData.location}</span>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => document.getElementById('resume-upload')?.click()}>
                        {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                        Upload Resume
                    </Button>
                    <input id="resume-upload" type="file" className="hidden" accept=".pdf,.docx" onChange={handleFileUpload} />

                    <Button variant="outline" onClick={async () => {
                        try {
                            // We need candidate ID. Since we are 'me', we assume backend handles it or we fetch it.
                            // But the download endpoint needs candidate_id.
                            // Let's fetch 'me' first to get ID.
                            const { data } = await api.get("/candidates/me")
                            if (data.id) {
                                window.open(`${api.defaults.baseURL}/resume/download/${data.id}`, '_blank')
                            }
                        } catch (e) {
                            toast({ title: "Error", description: "Could not download resume", variant: "destructive" })
                        }
                    }}>
                        <Briefcase className="mr-2 h-4 w-4" /> Download Resume
                    </Button>

                    <Button onClick={handleSave} disabled={loading}>
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Save Profile"}
                    </Button>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={(v) => {
                setActiveTab(v)
                window.scrollTo({ top: 0, behavior: 'smooth' })
            }} className="flex flex-col md:flex-row gap-6 items-start">
                <TabsList className="flex flex-col h-auto items-start justify-start w-full md:w-64 gap-2 p-2 bg-muted/30 md:sticky md:top-6 flex-shrink-0">
                    <TabsTrigger value="basic" className="w-full justify-start"><User className="mr-2 h-4 w-4" /> Basic Details</TabsTrigger>
                    <TabsTrigger value="summary" className="w-full justify-start"><FileText className="mr-2 h-4 w-4" /> Summary & Headline</TabsTrigger>
                    <TabsTrigger value="skills" className="w-full justify-start"><Code className="mr-2 h-4 w-4" /> Key Skills</TabsTrigger>
                    <TabsTrigger value="experience" className="w-full justify-start"><Briefcase className="mr-2 h-4 w-4" /> Employment</TabsTrigger>
                    <TabsTrigger value="education" className="w-full justify-start"><GraduationCap className="mr-2 h-4 w-4" /> Education</TabsTrigger>
                    <TabsTrigger value="projects" className="w-full justify-start"><FileText className="mr-2 h-4 w-4" /> Projects</TabsTrigger>
                </TabsList>

                <div className="flex-1 space-y-6 min-h-[500px]">
                    <TabsContent value="basic" className="mt-0">
                        <Card>
                            <CardHeader><CardTitle>Personal Information</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>First Name</Label>
                                        <Input name="first_name" value={formData.first_name} onChange={handleChange} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Last Name</Label>
                                        <Input name="last_name" value={formData.last_name} onChange={handleChange} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Phone</Label>
                                    <Input name="phone" value={formData.phone} onChange={handleChange} />
                                </div>
                                <div className="space-y-2">
                                    <Label>LinkedIn URL</Label>
                                    <Input name="linkedin_url" value={formData.linkedin_url} onChange={handleChange} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Portfolio URL</Label>
                                    <Input name="portfolio_url" value={formData.portfolio_url} onChange={handleChange} />
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="summary" className="mt-0">
                        <Card>
                            <CardHeader><CardTitle>Profile Summary</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Resume Headline</Label>
                                    <Input name="headline" value={formData.headline} onChange={handleChange} placeholder="Ex: Senior Java Developer with 5 years of experience" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Profile Summary</Label>
                                    <Textarea name="summary" value={formData.summary} onChange={handleChange} className="h-32" placeholder="Highlight your key achievements..." />
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="skills" className="mt-0">
                        <Card>
                            <CardHeader><CardTitle>Key Skills</CardTitle></CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <Label>Skills (Comma separated)</Label>
                                    <Textarea name="skills" value={formData.skills} onChange={handleChange} placeholder="Java, Python, React, AWS..." />
                                    <p className="text-xs text-muted-foreground">Recruiters look for these skills to find matching candidates.</p>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="experience" className="mt-0">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle>Employment History</CardTitle>
                                <Button size="sm" variant="outline" onClick={() => addItem('experience', { title: '', company: '', duration: '', description: '' })}>
                                    <Plus className="h-4 w-4 mr-2" /> Add Job
                                </Button>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {formData.experience.map((exp: any, index: number) => (
                                    <div key={index} className="border p-4 rounded-lg space-y-4 relative">
                                        <Button variant="ghost" size="icon" className="absolute top-2 right-2 text-destructive" onClick={() => removeItem('experience', index)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Job Title</Label>
                                                <Input value={exp.title} onChange={(e) => updateItem('experience', index, 'title', e.target.value)} placeholder="Software Engineer" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Company</Label>
                                                <Input value={exp.company} onChange={(e) => updateItem('experience', index, 'company', e.target.value)} placeholder="Google" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Duration</Label>
                                            <Input value={exp.duration} onChange={(e) => updateItem('experience', index, 'duration', e.target.value)} placeholder="Jan 2020 - Present" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Description</Label>
                                            <Textarea value={exp.description} onChange={(e) => updateItem('experience', index, 'description', e.target.value)} placeholder="Describe your role..." />
                                        </div>
                                    </div>
                                ))}
                                {formData.experience.length === 0 && <p className="text-muted-foreground text-center py-4">No employment history added.</p>}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="education" className="mt-0">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle>Education</CardTitle>
                                <Button size="sm" variant="outline" onClick={() => addItem('education', { degree: '', school: '', year: '' })}>
                                    <Plus className="h-4 w-4 mr-2" /> Add Education
                                </Button>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {formData.education.map((edu: any, index: number) => (
                                    <div key={index} className="border p-4 rounded-lg space-y-4 relative">
                                        <Button variant="ghost" size="icon" className="absolute top-2 right-2 text-destructive" onClick={() => removeItem('education', index)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                        <div className="space-y-2">
                                            <Label>Degree / Qualification</Label>
                                            <Input value={edu.degree} onChange={(e) => updateItem('education', index, 'degree', e.target.value)} placeholder="B.Tech Computer Science" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>School / University</Label>
                                                <Input value={edu.school} onChange={(e) => updateItem('education', index, 'school', e.target.value)} placeholder="IIT Bombay" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Year of Passing</Label>
                                                <Input value={edu.year} onChange={(e) => updateItem('education', index, 'year', e.target.value)} placeholder="2022" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {formData.education.length === 0 && <p className="text-muted-foreground text-center py-4">No education details added.</p>}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="projects" className="mt-0">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle>Projects</CardTitle>
                                <Button size="sm" variant="outline" onClick={() => addItem('projects', { title: '', description: '', link: '' })}>
                                    <Plus className="h-4 w-4 mr-2" /> Add Project
                                </Button>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {formData.projects.map((proj: any, index: number) => (
                                    <div key={index} className="border p-4 rounded-lg space-y-4 relative">
                                        <Button variant="ghost" size="icon" className="absolute top-2 right-2 text-destructive" onClick={() => removeItem('projects', index)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                        <div className="space-y-2">
                                            <Label>Project Title</Label>
                                            <Input value={proj.title} onChange={(e) => updateItem('projects', index, 'title', e.target.value)} placeholder="E-commerce Website" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Project Link</Label>
                                            <Input value={proj.link} onChange={(e) => updateItem('projects', index, 'link', e.target.value)} placeholder="https://github.com/..." />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Description</Label>
                                            <Textarea value={proj.description} onChange={(e) => updateItem('projects', index, 'description', e.target.value)} placeholder="Technologies used..." />
                                        </div>
                                    </div>
                                ))}
                                {formData.projects.length === 0 && <p className="text-muted-foreground text-center py-4">No projects added.</p>}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    )
}
