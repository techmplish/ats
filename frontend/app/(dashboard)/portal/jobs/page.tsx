"use client"

import { useState, useEffect } from "react"
import api from "@/lib/api"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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
}

export default function CandidateJobsPage() {
    const [jobs, setJobs] = useState<Job[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [selectedJob, setSelectedJob] = useState<Job | null>(null)
    const [applying, setApplying] = useState(false)
    const { toast } = useToast()

    useEffect(() => {
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

    const filteredJobs = jobs.filter(job =>
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.department.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4">
                <h1 className="text-3xl font-bold tracking-tight">Find Your Next Role</h1>
                <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by job title or department..."
                        className="pl-10 max-w-md"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {loading ? (
                <div>Loading jobs...</div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredJobs.map((job) => (
                        <Card key={job.id} className="flex flex-col">
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <CardTitle className="text-xl">{job.title}</CardTitle>
                                    <Badge variant="secondary">{job.department}</Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-1 space-y-4">
                                <div className="flex items-center text-sm text-muted-foreground gap-4">
                                    <div className="flex items-center gap-1">
                                        <MapPin className="h-4 w-4" />
                                        {job.location}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Briefcase className="h-4 w-4" />
                                        Full-time
                                    </div>
                                </div>
                                <p className="text-sm line-clamp-3 text-muted-foreground">
                                    {job.description}
                                </p>
                            </CardContent>
                            <CardFooter>
                                <Button className="w-full" onClick={() => setSelectedJob(job)}>Apply Now</Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
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
