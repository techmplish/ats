"use client"

import { useEffect, useState } from "react"
import api from "@/lib/api"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useParams } from "next/navigation"
import { ArrowLeft, Mail, Phone, MapPin, Download } from "lucide-react"
import Link from "next/link"

export default function ApplicationDetailPage() {
    const { id } = useParams()
    const [app, setApp] = useState<any>(null)
    const [analysis, setAnalysis] = useState<any>(null)

    useEffect(() => {
        // Mock fetch for now, assuming endpoint exists or using what we have
        // In real implementation, we'd need a specific endpoint for application details including candidate info
        // For now, let's assume we can fetch it.
    }, [id])

    return (
        <div className="h-[calc(100vh-8rem)] flex flex-col">
            <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/jobs">
                        <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold">Candidate Name</h1>
                        <p className="text-sm text-muted-foreground">Applied for Senior Frontend Developer</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline">Reject</Button>
                    <Button>Move to Interview</Button>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-6 h-full">
                {/* Left Column: Resume & Info */}
                <div className="space-y-6 overflow-y-auto pr-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Candidate Info</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex items-center gap-2 text-sm">
                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                    email@example.com
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <Phone className="h-4 w-4 text-muted-foreground" />
                                    +1 234 567 890
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <MapPin className="h-4 w-4 text-muted-foreground" />
                                    New York, USA
                                </div>
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
                <div className="space-y-6 overflow-y-auto pl-2">
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
                                        <span className="text-green-600 text-2xl">85%</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <h4 className="font-semibold mb-2">Summary</h4>
                                        <p className="text-sm text-muted-foreground">Strong candidate with relevant experience in React and Node.js.</p>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold mb-2">Pros</h4>
                                        <ul className="list-disc list-inside text-sm text-muted-foreground">
                                            <li>5 years of React experience</li>
                                            <li>Led a team of 3</li>
                                        </ul>
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
                                                <p className="text-xs text-muted-foreground">2 days ago</p>
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
