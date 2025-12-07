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

    // Resume Selection State
    const [resumes, setResumes] = useState<any[]>([])
    const [loadingResumes, setLoadingResumes] = useState(false)
    const [selectedResumeId, setSelectedResumeId] = useState<number | null>(null)

    const fetchResumes = async () => {
        setLoadingResumes(true)
        try {
            // Need candidate ID first? Usually /me endpoint or just depend on user context
            // Assuming current user is candidate.
            const { data: me } = await api.get("/candidates/me")
            if (me && me.id) {
                const { data: history } = await api.get(`/resume/history/${me.id}`)
                setResumes(history)
                if (history.length > 0) {
                    setSelectedResumeId(history[0].id) // Default to latest
                }
            }
        } catch (error) {
            console.error("Failed to fetch resumes", error)
        } finally {
            setLoadingResumes(false)
        }
    }

    const fetchJobs = async () => {
        try {
            const { data } = await api.get("/jobs?limit=100")
            setJobs(data.jobs || [])
        } catch (error) {
            console.error("Failed to fetch jobs", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchJobs()
        fetchResumes()
    }, [])

    const handleApply = async () => {
        if (!selectedJob) return
        setApplying(true)
        try {
            await api.post("/applications", {
                job_id: selectedJob.id,
                resume_id: selectedResumeId
            })
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
                    <div className="py-4 max-h-[60vh] overflow-y-auto space-y-4">
                        <div>
                            <h4 className="font-medium mb-2">Job Description</h4>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                {selectedJob?.description}
                            </p>
                        </div>

                        <div className="border-t pt-4">
                            <h4 className="font-medium mb-3">Select Resume</h4>
                            {loadingResumes ? (
                                <div className="text-sm text-muted-foreground">Loading resumes...</div>
                            ) : resumes.length === 0 ? (
                                <div className="text-sm text-yellow-600 bg-yellow-50 p-3 rounded-md">
                                    No resumes found. Please upload a resume in your profile first.
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {resumes.map((res: any) => (
                                        <div key={res.id}
                                            className={`flex items-center justify-between p-3 rounded-md border cursor-pointer transition-colors ${selectedResumeId === res.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'}`}
                                            onClick={() => setSelectedResumeId(res.id)}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`h-4 w-4 rounded-full border border-primary flex items-center justify-center ${selectedResumeId === res.id ? 'bg-primary' : ''}`}>
                                                    {selectedResumeId === res.id && <div className="h-2 w-2 rounded-full bg-white" />}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-sm">{res.file_name}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        Uploaded: {new Date(res.uploaded_at).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSelectedJob(null)}>Cancel</Button>
                        <Button onClick={handleApply} disabled={applying || (resumes.length > 0 && !selectedResumeId)}>
                            {applying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Submit Application
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
