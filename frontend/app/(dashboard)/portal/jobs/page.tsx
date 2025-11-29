"use client"

import { useState, useEffect } from "react"
import api from "@/lib/api"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { PaginationControls } from "@/components/ui/pagination-controls"
import { Search, MapPin, Briefcase, Loader2 } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"

interface Job {
    id: number
    title: string
    department: string
    location: string
    type: string
    description: string
    application_status?: string
    application_id?: number
}

export default function CandidateJobsPage() {
    const [jobs, setJobs] = useState<Job[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [selectedJob, setSelectedJob] = useState<Job | null>(null)
    const [applying, setApplying] = useState(false)
    const [withdrawing, setWithdrawing] = useState(false)
    const { toast } = useToast()

    const fetchJobs = async () => {
        try {
            const { data } = await api.get("/jobs")
            setJobs(data)
        } catch (error) {
            console.error("Failed to fetch jobs", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchJobs()
    }, [])

    const handleApply = async () => {
        if (!selectedJob) return
        setApplying(true)
        try {
            await api.post("/applications", { job_id: selectedJob.id })
            toast({
                title: "Application Submitted",
                description: `You have successfully applied for ${selectedJob.title}.`,
            })
            setSelectedJob(null)
            fetchJobs() // Refresh to update status
        } catch (error: any) {
            toast({
                title: "Application Failed",
                description: error.response?.data?.error || "Could not submit application.",
                variant: "destructive"
            })
        } finally {
            setApplying(false)
        }
    }

    const handleWithdraw = async (appId: number) => {
        if (!confirm("Are you sure you want to withdraw your application?")) return
        setWithdrawing(true)
        try {
            await api.put(`/applications/${appId}/withdraw`)
            toast({
                title: "Application Withdrawn",
                description: "Your application has been withdrawn.",
            })
            fetchJobs()
        } catch (error: any) {
            toast({
                title: "Withdrawal Failed",
                description: error.response?.data?.error || "Could not withdraw application.",
                variant: "destructive"
            })
        } finally {
            setWithdrawing(false)
        }
    }

    const filteredJobs = jobs.filter(job =>
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.description.toLowerCase().includes(searchTerm.toLowerCase())
    )

    // Pagination Logic
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)

    // Reset page when search changes
    useEffect(() => {
        setCurrentPage(1)
    }, [searchTerm])

    const totalItems = filteredJobs.length
    const totalPages = Math.ceil(totalItems / pageSize)
    const paginatedJobs = filteredJobs.slice((currentPage - 1) * pageSize, currentPage * pageSize)

    const getActionButton = (job: Job) => {
        const isApplied = job.application_status && job.application_status.toLowerCase() !== 'withdrawn'
        const isWithdrawn = job.application_status && job.application_status.toLowerCase() === 'withdrawn'

        if (isApplied) {
            return (
                <>
                    <Button className="w-full" disabled variant="secondary">Already Applied</Button>
                    <Button
                        variant="outline"
                        className="text-red-500 hover:text-red-600"
                        onClick={() => handleWithdraw(job.application_id!)}
                        disabled={withdrawing}
                    >
                        Withdraw
                    </Button>
                </>
            )
        } else if (isWithdrawn) {
            return (
                <Button className="w-full" onClick={() => setSelectedJob(job)}>Re-apply</Button>
            )
        } else {
            return (
                <Button className="w-full" onClick={() => setSelectedJob(job)}>Apply Now</Button>
            )
        }
    }

    return (
        <div className="max-w-6xl space-y-8 pb-10">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Find Your Next Role</h1>
                <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by job title, department, company or location..."
                        className="pl-10 h-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="h-48 rounded-xl bg-muted/20 animate-pulse" />
                    ))}
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {paginatedJobs.map((job) => (
                            <Card key={job.id} className="flex flex-col transition-all hover:shadow-md">
                                <CardHeader>
                                    <div className="flex justify-between items-start">
                                        <CardTitle className="text-xl line-clamp-1" title={job.title}>{job.title}</CardTitle>
                                        <Badge variant="secondary" className="shrink-0">{job.department}</Badge>
                                    </div>
                                    <div className="flex gap-4 text-sm text-muted-foreground mt-2">
                                        <div className="flex items-center gap-1">
                                            <MapPin className="h-3 w-3" />
                                            {job.location}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Briefcase className="h-3 w-3" />
                                            Full-time
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="flex-1">
                                    <p className="text-sm text-muted-foreground line-clamp-3">
                                        {job.description}
                                    </p>
                                </CardContent>
                                <CardFooter>
                                    {getActionButton(job)}
                                </CardFooter>
                            </Card>
                        ))}
                    </div>

                    {filteredJobs.length === 0 && (
                        <div className="text-center py-12 text-muted-foreground">
                            No jobs found matching your search.
                        </div>
                    )}

                    {filteredJobs.length > 0 && (
                        <PaginationControls
                            currentPage={currentPage}
                            totalPages={totalPages}
                            pageSize={pageSize}
                            totalItems={totalItems}
                            onPageChange={setCurrentPage}
                            onPageSizeChange={(size) => {
                                setPageSize(size)
                                setCurrentPage(1)
                            }}
                        />
                    )}
                </>
            )}

            <Dialog open={!!selectedJob} onOpenChange={(open) => !open && setSelectedJob(null)}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>{selectedJob?.title}</DialogTitle>
                        <DialogDescription>
                            {selectedJob?.department} • {selectedJob?.location}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 max-h-[60vh] overflow-y-auto">
                        <h4 className="font-medium mb-2">Job Description</h4>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {selectedJob?.description}
                        </p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSelectedJob(null)}>Cancel</Button>
                        <Button onClick={handleApply} disabled={applying}>
                            {applying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Confirm Application
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
