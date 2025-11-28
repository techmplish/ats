"use client"

import { useEffect, useState } from "react"
import api from "@/lib/api"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useParams } from "next/navigation"
import { ArrowLeft, MapPin, Briefcase } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface Job {
    id: number
    title: string
    description: string
    department: string
    location: string
    status: string
    requirements: string
}

export default function JobDetailPage() {
    const { id } = useParams()
    const [job, setJob] = useState<Job | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchJob = async () => {
            try {
                const { data } = await api.get(`/jobs/${id}`)
                setJob(data)
            } catch (e) {
                console.error("Failed to fetch job")
            } finally {
                setLoading(false)
            }
        }
        if (id) fetchJob()
    }, [id])

    if (loading) return <div className="p-8">Loading...</div>
    if (!job) return <div className="p-8">Job not found</div>

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <Link href="/jobs" className="text-primary hover:underline flex items-center gap-2 mb-4">
                <ArrowLeft className="h-4 w-4" /> Back to Jobs
            </Link>

            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold">{job.title}</h1>
                    <div className="flex items-center gap-4 mt-2 text-muted-foreground">
                        <div className="flex items-center gap-1"><Briefcase className="h-4 w-4" /> {job.department}</div>
                        <div className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {job.location}</div>
                        <Badge variant={job.status === 'active' ? 'default' : 'secondary'}>{job.status}</Badge>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline">Edit Job</Button>
                    <Button variant="destructive">Close Job</Button>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Description</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="whitespace-pre-wrap">{job.description}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Requirements</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="whitespace-pre-wrap">{job.requirements}</p>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Quick Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <Button className="w-full">View Candidates</Button>
                            <Button variant="outline" className="w-full">Share Job Link</Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
