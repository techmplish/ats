"use client"

import { useEffect, useState } from "react"
import api from "@/lib/api"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Users, Briefcase, MapPin } from "lucide-react"

export default function ApplicationsPage() {
    const [jobs, setJobs] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchJobs = async () => {
            try {
                // Pass high limit to ensure we get enough jobs for the dashboard view
                const { data } = await api.get("/jobs?limit=100")
                setJobs(data.jobs || [])
            } catch (e) {
                console.error("Failed to fetch jobs")
            } finally {
                setLoading(false)
            }
        }
        fetchJobs()
    }, [])

    if (loading) return <div className="p-8">Loading...</div>

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Applications by Job</h1>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {jobs.length === 0 ? (
                    <p className="text-muted-foreground col-span-full">No jobs posted yet.</p>
                ) : (
                    jobs.map((job) => (
                        <Card key={job.id} className="flex flex-col">
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <CardTitle className="text-xl line-clamp-1" title={job.title}>
                                        {job.title}
                                    </CardTitle>
                                    <Badge variant={job.status === 'active' ? 'default' : 'secondary'}>
                                        {job.status}
                                    </Badge>
                                </div>
                                <div className="text-sm text-muted-foreground flex flex-col gap-1 mt-2">
                                    <span className="flex items-center gap-2"><Briefcase className="h-4 w-4" /> {job.department}</span>
                                    <span className="flex items-center gap-2"><MapPin className="h-4 w-4" /> {job.location}</span>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-1">
                                <div className="flex items-center gap-2 text-lg font-semibold">
                                    <Users className="h-5 w-5 text-primary" />
                                    <span>{job.application_count || 0} Applicants</span>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Link href={`/jobs/${job.id}`} className="w-full">
                                    <Button className="w-full" variant="outline">View Applicants</Button>
                                </Link>
                            </CardFooter>
                        </Card>
                    ))
                )}
            </div>
        </div>
    )
}
