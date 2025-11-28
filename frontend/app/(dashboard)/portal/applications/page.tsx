"use client"

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, CheckCircle2, Clock } from "lucide-react"

export default function CandidateApplicationsPage() {
    // Mock data for now
    const applications = [
        {
            id: 1,
            job_title: "Senior Python Engineer",
            company: "Techmplish Inc.",
            status: "Screening",
            applied_at: "2023-11-25",
            last_update: "2023-11-26"
        },
        {
            id: 2,
            job_title: "Frontend Developer",
            company: "Techmplish Inc.",
            status: "Applied",
            applied_at: "2023-11-28",
            last_update: "2023-11-28"
        }
    ]

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'hired': return 'bg-green-100 text-green-800'
            case 'screening': return 'bg-blue-100 text-blue-800'
            case 'interview': return 'bg-purple-100 text-purple-800'
            case 'offer': return 'bg-yellow-100 text-yellow-800'
            default: return 'bg-gray-100 text-gray-800'
        }
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">My Applications</h1>

            <div className="grid gap-4">
                {applications.map((app) => (
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
                                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                                    <span className="font-medium">Application Received</span>
                                    <div className="h-px bg-gray-200 flex-1 mx-4" />
                                    <div className={`h-3 w-3 rounded-full ${app.status !== 'Applied' ? 'bg-green-500' : 'bg-gray-200'}`} />
                                    <span className={`text-sm ${app.status !== 'Applied' ? 'font-medium' : 'text-muted-foreground'}`}>Screening</span>
                                    <div className="h-px bg-gray-200 flex-1 mx-4" />
                                    <div className={`h-3 w-3 rounded-full ${['Interview', 'Offer', 'Hired'].includes(app.status) ? 'bg-green-500' : 'bg-gray-200'}`} />
                                    <span className={`text-sm ${['Interview', 'Offer', 'Hired'].includes(app.status) ? 'font-medium' : 'text-muted-foreground'}`}>Interview</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
