"use client"

import { useEffect, useState } from "react"
import api from "@/lib/api"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Mail, Phone, MapPin, Download, Briefcase } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"

export default function ApplicationDetailPage() {
    const { id } = useParams()
    const router = useRouter()
    const [app, setApp] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchApp = async () => {
            try {
                const { data } = await api.get(`/applications/${id}`)
                setApp(data)
            } catch (e) {
                console.error("Failed to fetch application details")
            } finally {
                setLoading(false)
            }
        }
        if (id) fetchApp()
    }, [id])

    if (loading) return <div className="p-8">Loading application details...</div>
    if (!app) return <div className="p-8">Application not found</div>

    return (
        <div className="h-[calc(100vh-8rem)] flex flex-col space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.back()}
                        title="Go Back"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">{app.candidate.first_name} {app.candidate.last_name}</h1>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>Applied for {app.job_title}</span>
                            <Badge variant="outline">{app.status}</Badge>
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline">Reject</Button>
                    <Button>Move to Interview</Button>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-6 h-full overflow-hidden">
                {/* Left Column: Resume & Info */}
                <div className="space-y-6 overflow-y-auto pr-2 pb-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Candidate Info</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex items-center gap-2 text-sm">
                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                    {app.candidate.email}
                                </div>
                                {app.candidate.phone && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <Phone className="h-4 w-4 text-muted-foreground" />
                                        {app.candidate.phone}
                                    </div>
                                )}
                                {app.candidate.linkedin_url && (
                                    <div className="flex items-center gap-2 text-sm col-span-2">
                                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                                        <a href={app.candidate.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                            LinkedIn Profile
                                        </a>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="h-[600px] flex flex-col">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Resume</CardTitle>
                            <Button variant="ghost" size="sm"><Download className="h-4 w-4" /></Button>
                        </CardHeader>
                        <CardContent className="flex-1 bg-gray-100 flex items-center justify-center">
                            <p className="text-muted-foreground">PDF Viewer Placeholder</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Activity & AI Analysis */}
                <div className="space-y-6 overflow-y-auto pl-2 pb-8">
                    <Tabs defaultValue="analysis">
                        <TabsList className="w-full">
                            <TabsTrigger value="analysis" className="flex-1">AI Analysis</TabsTrigger>
                            <TabsTrigger value="activity" className="flex-1">Activity</TabsTrigger>
                            <TabsTrigger value="notes" className="flex-1">Notes</TabsTrigger>
                        </TabsList>
                        <TabsContent value="analysis" className="space-y-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex justify-between items-center">
                                        Match Score
                                        <span className="text-green-600 text-2xl">{app.score || 'N/A'}%</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <h4 className="font-semibold mb-2">Summary</h4>
                                        <p className="text-sm text-muted-foreground">AI analysis not yet generated.</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                        <TabsContent value="activity">
                            <Card>
                                <CardContent className="pt-6">
                                    <div className="space-y-4">
                                        <div className="flex gap-4">
                                            <div className="w-2 h-2 mt-2 rounded-full bg-blue-500" />
                                            <div>
                                                <p className="text-sm font-medium">Applied to job</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {new Date(app.applied_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    )
}
