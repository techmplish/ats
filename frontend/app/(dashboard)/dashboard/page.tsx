"use client"

import { useEffect, useState } from "react"
import api from "@/lib/api"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, Briefcase, FileText, Clock, ArrowUpRight } from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"

interface DashboardStats {
    total_candidates: number
    active_jobs: number
    total_applications: number
    interviews_scheduled: number
    recent_applications: Array<{
        id: number
        candidate_name: string
        job_title: string
        status: string
        created_at: string
    }>
}

export default function DashboardPage() {
    const [stats, setStats] = useState<DashboardStats>({
        total_candidates: 0,
        active_jobs: 0,
        total_applications: 0,
        interviews_scheduled: 0,
        recent_applications: []
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const { data } = await api.get("/dashboard/stats")
                console.log("DEBUG: Dashboard stats received:", data)
                setStats(data)
            } catch (e) {
                console.error("Failed to fetch dashboard stats", e)
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
                <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                <div className="flex gap-2">
                    <Link href="/jobs/new">
                        <Button>Post New Job</Button>
                    </Link>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Link href="/applications">
                    <Card className="hover:bg-accent/50 transition-colors cursor-pointer h-full">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
                            <FileText className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total_applications}</div>
                            <p className="text-xs text-muted-foreground">All time</p>
                        </CardContent>
                    </Card>
                </Link>
                <Link href="/jobs">
                    <Card className="hover:bg-accent/50 transition-colors cursor-pointer h-full">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
                            <Briefcase className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.active_jobs}</div>
                            <p className="text-xs text-muted-foreground">Currently hiring</p>
                        </CardContent>
                    </Card>
                </Link>
                <Link href="/calendar">
                    <Card className="hover:bg-accent/50 transition-colors cursor-pointer h-full">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Interviews</CardTitle>
                            <Clock className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.interviews_scheduled}</div>
                            <p className="text-xs text-muted-foreground">Scheduled</p>
                        </CardContent>
                    </Card>
                </Link>
                <Link href="/candidates">
                    <Card className="hover:bg-accent/50 transition-colors cursor-pointer h-full">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Candidates</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total_candidates}</div>
                            <p className="text-xs text-muted-foreground">Total pool</p>
                        </CardContent>
                    </Card>
                </Link>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Recent Applications</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-8">
                            {stats.recent_applications.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No recent applications.</p>
                            ) : (
                                stats.recent_applications.map((app) => (
                                    <div key={app.id} className="flex items-center">
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium leading-none">{app.candidate_name}</p>
                                            <p className="text-sm text-muted-foreground">{app.job_title}</p>
                                        </div>
                                        <div className="ml-auto flex flex-col items-end">
                                            <span className="text-sm font-medium">{app.status}</span>
                                            <span className="text-xs text-muted-foreground">
                                                {formatDistanceToNow(new Date(app.created_at), { addSuffix: true })}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <Link href="/jobs/new" className="block">
                                <Button variant="outline" className="w-full justify-start">
                                    <Briefcase className="mr-2 h-4 w-4" />
                                    Post a Job
                                </Button>
                            </Link>
                            <Link href="/upload" className="block">
                                <Button variant="outline" className="w-full justify-start">
                                    <FileText className="mr-2 h-4 w-4" />
                                    Upload Resume
                                </Button>
                            </Link>
                            <Link href="/rag" className="block">
                                <Button variant="outline" className="w-full justify-start">
                                    <Users className="mr-2 h-4 w-4" />
                                    Ask AI Assistant
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
