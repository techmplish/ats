"use client"

import { useEffect, useState } from "react"
import api from "@/lib/api"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, CheckCircle2, Clock, Loader2 } from "lucide-react"

export default function CandidateApplicationsPage() {
    const [applications, setApplications] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchApps = async () => {
            try {
                const { data } = await api.get("/applications/me")
                setApplications(data)
            } catch (e) {
                console.error("Failed to fetch applications")
            } finally {
                setLoading(false)
            }
        }
        fetchApps()
    }, [])

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'hired': return 'bg-green-100 text-green-800'
            case 'screening': return 'bg-blue-100 text-blue-800'
            case 'interview': return 'bg-purple-100 text-purple-800'
            case 'offer': return 'bg-yellow-100 text-yellow-800'
            case 'rejected': return 'bg-red-100 text-red-800'
            case 'withdrawn': return 'bg-gray-100 text-gray-800'
            default: return 'bg-gray-100 text-gray-800'
        }
    }

    // Helper to check if a step is active/completed based on current status
    const isStepActive = (currentStatus: string, step: string) => {
        const status = currentStatus.toLowerCase()
        if (status === 'rejected' || status === 'withdrawn') return false // Or maybe show red?

        // Step 1: Applied (Always true if not rejected/withdrawn, but let's assume true for history)
        if (step === 'applied') return true

        // Step 2: Screening
        if (step === 'screening') {
            return ['screening', 'interview', 'offer', 'hired'].includes(status)
        }

        // Step 3: Interview
        if (step === 'interview') {
            return ['interview', 'offer', 'hired'].includes(status)
        }

        return false
    }

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">My Applications</h1>

            <div className="grid gap-4">
                {applications.length === 0 ? (
                    <p className="text-muted-foreground">You haven't applied to any jobs yet.</p>
                ) : (
                    applications.map((app) => (
                        <Card key={app.id}>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <h3 className="text-xl font-semibold">{app.job_title}</h3>
                                        <p className="text-sm text-muted-foreground">{app.company}</p>
                                    </div>
                                    <Badge className={getStatusColor(app.status)} variant="secondary">
                                        {app.status}
                                    </Badge>
                                </div>

                                <div className="mt-6 flex items-center gap-6 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4" />
                                        Applied: {app.applied_at}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Clock className="h-4 w-4" />
                                        Last Update: {app.last_update}
                                    </div>
                                </div>

                                <div className="mt-6 pt-6 border-t">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 className={`h-5 w-5 ${isStepActive(app.status, 'applied') ? 'text-green-500' : 'text-gray-300'}`} />
                                        <span className={`font-medium ${isStepActive(app.status, 'applied') ? '' : 'text-muted-foreground'}`}>Application Received</span>

                                        <div className={`h-px flex-1 mx-4 ${isStepActive(app.status, 'screening') ? 'bg-green-500' : 'bg-gray-200'}`} />

                                        <div className={`h-3 w-3 rounded-full ${isStepActive(app.status, 'screening') ? 'bg-green-500' : 'bg-gray-200'}`} />
                                        <span className={`text-sm ${isStepActive(app.status, 'screening') ? 'font-medium' : 'text-muted-foreground'}`}>Screening</span>

                                        <div className={`h-px flex-1 mx-4 ${isStepActive(app.status, 'interview') ? 'bg-green-500' : 'bg-gray-200'}`} />

                                        <div className={`h-3 w-3 rounded-full ${isStepActive(app.status, 'interview') ? 'bg-green-500' : 'bg-gray-200'}`} />
                                        <span className={`text-sm ${isStepActive(app.status, 'interview') ? 'font-medium' : 'text-muted-foreground'}`}>Interview</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    )
}
