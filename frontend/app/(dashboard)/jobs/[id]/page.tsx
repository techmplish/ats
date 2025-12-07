"use client"

import { useEffect, useState } from "react"
import api from "@/lib/api"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useParams } from "next/navigation"
import { ArrowLeft, MapPin, Briefcase } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { ConfirmModal } from "@/components/ui/confirm-modal"

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
    const [applications, setApplications] = useState<any[]>([])

    useEffect(() => {
        const fetchJob = async () => {
            try {
                const [jobRes, appsRes] = await Promise.all([
                    api.get(`/jobs/${id}`),
                    api.get(`/jobs/${id}/applications`)
                ])
                setJob(jobRes.data)
                setApplications(appsRes.data)
            } catch (e) {
                console.error("Failed to fetch job details")
            } finally {
                setLoading(false)
            }
        }
        if (id) fetchJob()
    }, [id])

    const handleShare = () => {
        const url = window.location.href
        navigator.clipboard.writeText(url)
        alert("Job link copied to clipboard!")
    }

    const [isCloseModalOpen, setIsCloseModalOpen] = useState(false)

    const handleStatusChange = async (newStatus: string) => {
        try {
            await api.put(`/jobs/${id}`, { status: newStatus })
            setJob(prev => prev ? { ...prev, status: newStatus } : null)
            setIsCloseModalOpen(false)
        } catch (error) {
            console.error("Failed to update status", error)
            alert("Failed to update status")
        }
    }

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
                    <Button variant="outline" onClick={() => alert("Edit functionality coming soon!")}>Edit Job</Button>
                    {job.status === 'active' ? (
                        <Button variant="destructive" onClick={() => setIsCloseModalOpen(true)}>Close Job</Button>
                    ) : (
                        <Button variant="outline" onClick={() => handleStatusChange('active')}>Reopen Job</Button>
                    )}
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

                    <Card id="applicants">
                        <CardHeader>
                            <CardTitle>Applicants ({applications.length})</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {applications.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">No applications yet.</p>
                                ) : (
                                    applications.map((app) => (
                                        <div key={app.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                                            <div>
                                                <p className="font-medium">{app.candidate_name}</p>
                                                <p className="text-sm text-muted-foreground">{app.email}</p>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    Applied {new Date(app.applied_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline">{app.status}</Badge>
                                                <Link href={`/applications/${app.id}`}>
                                                    <Button size="sm" variant="ghost">View</Button>
                                                </Link>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Quick Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <Button
                                className="w-full"
                                onClick={() => document.getElementById('applicants')?.scrollIntoView({ behavior: 'smooth' })}
                            >
                                View Candidates
                            </Button>
                            <Link href={`/candidates?q=${encodeURIComponent(job.title)}`} className="block">
                                <Button variant="outline" className="w-full">
                                    Find Matching Candidates
                                </Button>
                            </Link>
                            <Button variant="outline" className="w-full" onClick={handleShare}>Share Job Link</Button>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <ConfirmModal
                isOpen={isCloseModalOpen}
                onClose={() => setIsCloseModalOpen(false)}
                onConfirm={() => handleStatusChange('closed')}
                title="Close Job Posting"
                description="Are you sure you want to close this job? It will no longer be visible to candidates."
            />
        </div>
    )
}
