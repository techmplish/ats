"use client"

import { useEffect, useState } from "react"
import api from "@/lib/api"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { FileText, Briefcase, CheckCircle } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface CandidateStats {
    applications_submitted: number
    interviews_scheduled: number
    profile_completeness: number
    recent_applications: Array<{
        id: number
        job_title: string
        company: string
        status: string
        created_at: string
    }>
}

export default function CandidateDashboard() {
    const [stats, setStats] = useState<CandidateStats>({
        applications_submitted: 0,
        interviews_scheduled: 0,
        profile_completeness: 0,
        recent_applications: []
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const { data } = await api.get("/dashboard/candidate-stats")
                setStats(data)
            } catch (error) {
                console.error("Failed to fetch candidate stats", error)
            } finally {
                setLoading(false)
            }
        }
        fetchStats()
    }, [])

    if (loading) {
        return <div className="p-8">Loading dashboard...</div>
    }

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight">Candidate Portal</h1>
                <Link href="/portal/jobs">
                    <Button>Find Jobs</Button>
                </Link>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Link href="/portal/applications">
                    <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Applications Submitted</CardTitle>
                            <FileText className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.applications_submitted}</div>
                            <p className="text-xs text-muted-foreground">Total active applications</p>
                        </CardContent>
                    </Card>
                </Link>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Interviews</CardTitle>
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.interviews_scheduled}</div>
                        <p className="text-xs text-muted-foreground">Scheduled interviews</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Profile Completeness</CardTitle>
                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.profile_completeness}%</div>
                        <p className="text-xs text-muted-foreground">
                            {stats.profile_completeness < 100 ? "Complete your profile to improve visibility" : "Profile complete!"}
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>My Applications</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {stats.recent_applications.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No applications yet. Go find some jobs!</p>
                        ) : (
                            stats.recent_applications.map((app) => (
                                <div key={app.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                                    <div>
                                        <p className="font-medium">{app.job_title}</p>
                                        <p className="text-sm text-muted-foreground">{app.company}</p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Applied {formatDistanceToNow(new Date(app.created_at), { addSuffix: true })}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${app.status === 'Hired' ? 'bg-green-100 text-green-800' :
                                            app.status === 'Interview' ? 'bg-purple-100 text-purple-800' :
                                                app.status === 'Withdrawn' ? 'bg-gray-100 text-gray-800' :
                                                    'bg-blue-100 text-blue-800'
                                            }`}>
                                            {app.status}
                                        </span>
                                        {app.status !== 'Withdrawn' && app.status !== 'Hired' && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 text-xs"
                                                onClick={async () => {
                                                    if (!confirm("Are you sure you want to withdraw this application?")) return;
                                                    try {
                                                        await api.put(`/applications/${app.id}/withdraw`);
                                                        // Update local state
                                                        setStats(prev => ({
                                                            ...prev,
                                                            recent_applications: prev.recent_applications.map(a =>
                                                                a.id === app.id ? { ...a, status: 'Withdrawn' } : a
                                                            )
                                                        }));
                                                    } catch (e) {
                                                        console.error("Failed to withdraw", e);
                                                        alert("Failed to withdraw application");
                                                    }
                                                }}
                                            >
                                                Withdraw
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
