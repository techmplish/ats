"use client"

import { useEffect, useState } from "react"
import api from "@/lib/api"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { MapPin, Briefcase, Clock, Users, Hash, DollarSign } from "lucide-react"

import { PaginationControls } from "@/components/ui/pagination-controls"
import { PipelineBoard } from "@/components/jobs/PipelineBoard"

const STAGES = ['Applied', 'Screening', 'Interview', 'Offer', 'Hired']

export default function JobBoardPage() {
    const [applications, setApplications] = useState<any[]>([])

    // Active Jobs State
    const [activeJobs, setActiveJobs] = useState<any[]>([])
    const [activePage, setActivePage] = useState(1)
    const [activeTotal, setActiveTotal] = useState(0)

    // Closed Jobs State
    const [closedJobs, setClosedJobs] = useState<any[]>([])
    const [closedPage, setClosedPage] = useState(1)
    const [closedTotal, setClosedTotal] = useState(0)

    const [pageSize, setPageSize] = useState(5) // Default to 5 as requested

    useEffect(() => {
        // Initial load of pipeline data
        const fetchPipeline = async () => {
            try {
                const res = await api.get("/applications/board")
                setApplications(res.data)
            } catch (e) { console.error(e) }
        }
        fetchPipeline()
    }, [])

    // Fetch Active Jobs
    useEffect(() => {
        const fetchActive = async () => {
            try {
                const res = await api.get("/jobs", {
                    params: { page: activePage, limit: pageSize, status: 'active' }
                })
                if (res.data.jobs) {
                    setActiveJobs(res.data.jobs)
                    setActiveTotal(res.data.total)
                }
            } catch (e) { console.error(e) }
        }
        fetchActive()
    }, [activePage, pageSize])

    // Fetch Closed Jobs
    useEffect(() => {
        const fetchClosed = async () => {
            try {
                const res = await api.get("/jobs", {
                    params: { page: closedPage, limit: pageSize, status: 'closed' }
                })
                if (res.data.jobs) {
                    setClosedJobs(res.data.jobs)
                    setClosedTotal(res.data.total)
                }
            } catch (e) { console.error(e) }
        }
        fetchClosed()
    }, [closedPage, pageSize])

    // Helper to render job card
    const renderJobCard = (job: any) => (
        <Card key={job.id} className={job.status !== 'active' ? "opacity-75 bg-muted/20" : ""}>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-xl">
                            <Link href={`/jobs/${job.id}`} className={job.status !== 'active' ? "hover:underline text-muted-foreground" : "hover:underline"}>
                                {job.title}
                            </Link>
                        </CardTitle>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                            {job.custom_job_id && (
                                <div className="flex items-center gap-1 font-mono bg-muted px-2 py-0.5 rounded text-xs">
                                    <Hash className="h-3 w-3" /> {job.custom_job_id}
                                </div>
                            )}
                            <div className="flex items-center gap-1"><Briefcase className="h-4 w-4" /> {job.department}</div>
                            <div className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {job.location}</div>
                            {(job.salary_min || job.salary_max) && (
                                <div className="flex items-center gap-1">
                                    <DollarSign className="h-4 w-4" />
                                    {job.currency} {job.salary_min ? (job.salary_min / 1000).toFixed(0) + 'k' : '0'}
                                    {job.salary_max ? ' - ' + (job.salary_max / 1000).toFixed(0) + 'k' : ''}
                                </div>
                            )}
                            <div className="flex items-center gap-1"><Clock className="h-4 w-4" /> {new Date(job.created_at).toLocaleDateString()}</div>
                            <div className="flex items-center gap-1 font-medium text-primary">
                                <Users className="h-4 w-4" /> {job.application_count || 0} Applicants
                            </div>
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
    )

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
                    <div className="space-y-8">
                        {/* Active Jobs */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold">Active Jobs</h3>
                            {activeJobs.length === 0 ? (
                                <div className="text-muted-foreground text-sm">No active jobs.</div>
                            ) : (
                                activeJobs.map(job => renderJobCard(job))
                            )}

                            {activeTotal > 0 && (
                                <PaginationControls
                                    currentPage={activePage}
                                    totalPages={Math.ceil(activeTotal / pageSize)}
                                    pageSize={pageSize}
                                    totalItems={activeTotal}
                                    onPageChange={setActivePage}
                                    onPageSizeChange={setPageSize}
                                />
                            )}
                        </div>

                        {/* Closed Jobs */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-muted-foreground">Closed Jobs</h3>
                            {closedJobs.length === 0 ? (
                                <div className="text-muted-foreground text-sm">No closed jobs found.</div>
                            ) : (
                                closedJobs.map(job => renderJobCard(job))
                            )}

                            {closedTotal > 0 && (
                                <PaginationControls
                                    currentPage={closedPage}
                                    totalPages={Math.ceil(closedTotal / pageSize)}
                                    pageSize={pageSize}
                                    totalItems={closedTotal}
                                    onPageChange={setClosedPage}
                                    onPageSizeChange={setPageSize}
                                />
                            )}
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div >
    )
}
