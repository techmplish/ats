"use client"

import { useEffect, useState } from "react"
import api from "@/lib/api"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { MapPin, Briefcase, Clock } from "lucide-react"

import { PipelineBoard } from "@/components/jobs/PipelineBoard"

const STAGES = ['Applied', 'Screening', 'Interview', 'Offer', 'Hired']

export default function JobBoardPage() {
    const [applications, setApplications] = useState<any[]>([])
    const [jobs, setJobs] = useState<any[]>([])

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [appsRes, jobsRes] = await Promise.all([
                    api.get("/applications/board"),
                    api.get("/jobs")
                ])
                setApplications(appsRes.data)
                setJobs(jobsRes.data)
            } catch (e) {
                console.error(e)
            }
        }
        fetchData()
    }, [])

    const getAppsByStage = (stage: string) => {
        return applications.filter(app => app.stage === stage)
    }

    return (
        <div className="h-full flex flex-col space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Jobs & Pipeline</h1>
                <Link href="/jobs/new">
                    <Button>Post Job</Button>
                </Link>
            </div>

            <Tabs defaultValue="list" className="flex-1 flex flex-col">
                <TabsList>
                    <TabsTrigger value="pipeline">Pipeline Board</TabsTrigger>
                    <TabsTrigger value="list">All Jobs</TabsTrigger>
                </TabsList>

                <TabsContent value="pipeline" className="flex-1 mt-4 h-full overflow-hidden">
                    <PipelineBoard initialApplications={applications} />
                </TabsContent>

                <TabsContent value="list" className="mt-4">
                    <div className="grid gap-4">
                        {jobs.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">No jobs posted yet.</div>
                        ) : (
                            jobs.map(job => (
                                <Card key={job.id}>
                                    <CardHeader>
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <CardTitle className="text-xl">
                                                    <Link href={`/jobs/${job.id}`} className="hover:underline">
                                                        {job.title}
                                                    </Link>
                                                </CardTitle>
                                                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                                    <div className="flex items-center gap-1"><Briefcase className="h-4 w-4" /> {job.department}</div>
                                                    <div className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {job.location}</div>
                                                    <div className="flex items-center gap-1"><Clock className="h-4 w-4" /> Posted {new Date(job.created_at).toLocaleDateString()}</div>
                                                </div>
                                            </div>
                                            <Badge variant={job.status === 'active' ? 'default' : 'secondary'}>{job.status}</Badge>
                                        </div>
                                    </CardHeader>
                                    <CardFooter>
                                        <Link href={`/jobs/${job.id}`}>
                                            <Button variant="outline">View Details</Button>
                                        </Link>
                                    </CardFooter>
                                </Card>
                            ))
                        )}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}
