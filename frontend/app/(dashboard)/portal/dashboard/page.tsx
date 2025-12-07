"use client"

import { useEffect, useState } from "react"
import api from "@/lib/api"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { FileText, Briefcase, CheckCircle, Upload } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

import { PaginationControls } from "@/components/ui/pagination-controls"
import { ConfirmModal } from "@/components/ui/confirm-modal"
import { useRouter } from "next/navigation"
import { toast } from "@/components/ui/use-toast"
import { useAuth } from "@/context/AuthContext"

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
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(5)

    const [showWithdrawModal, setShowWithdrawModal] = useState(false)
    const [selectedAppId, setSelectedAppId] = useState<number | null>(null)
    const router = useRouter()

    const totalItems = stats.recent_applications.length
    const totalPages = Math.ceil(totalItems / pageSize)
    const paginatedApplications = stats.recent_applications.slice((currentPage - 1) * pageSize, currentPage * pageSize)

    const handleWithdrawClick = (appId: number) => {
        setSelectedAppId(appId)
        setShowWithdrawModal(true)
    }

    const confirmWithdraw = async () => {
        if (!selectedAppId) return

        try {
            await api.put(`/applications/${selectedAppId}/withdraw`)
            toast({
                title: "Application Withdrawn",
                description: "You have successfully withdrawn your application.",
            })
            // Refresh stats
            const { data } = await api.get('/dashboard/candidate-stats')
            setStats(data)
        } catch (error) {
            console.error("Failed to withdraw", error)
            toast({
                title: "Error",
                description: "Failed to withdraw application",
                variant: "destructive",
            })
        } finally {
            setShowWithdrawModal(false)
            setSelectedAppId(null)
        }
    }

    const [uploading, setUploading] = useState(false)
    const { updateUser } = useAuth() // Assuming updateUser is available from previous steps

    const handleUploadClick = () => {
        document.getElementById('dashboard-resume-upload')?.click()
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0]) return
        setUploading(true)
        try {
            // Ensure candidate exists (create profile if needed)
            await api.put("/candidates/me", {})

            const file = e.target.files[0]
            const uploadData = new FormData()
            uploadData.append("file", file)

            const res = await api.post("/resume/upload", uploadData, {
                headers: { "Content-Type": "multipart/form-data" }
            })

            const parsed = res.data.parsed_data
            if (parsed) {
                // Update local user context if name changed
                updateUser({
                    first_name: parsed.first_name,
                    last_name: parsed.last_name
                })

                toast({
                    title: "Resume Parsed",
                    description: "Redirecting to profile to review details...",
                })

                // Redirect to profile to see the populated data
                router.push('/portal/profile')
            }
        } catch (error) {
            console.error("Upload failed", error)
            toast({
                title: "Upload Failed",
                description: "Failed to upload and parse resume.",
                variant: "destructive"
            })
        } finally {
            setUploading(false)
        }
    }

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

    // ... existing render code ...

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight">Candidate Portal</h1>
                <div className="flex gap-2">
                    <input
                        type="file"
                        id="dashboard-resume-upload"
                        className="hidden"
                        accept=".pdf,.doc,.docx"
                        onChange={handleFileUpload}
                    />
                    <Button variant="outline" onClick={handleUploadClick} disabled={uploading}>
                        <Upload className="mr-2 h-4 w-4" />
                        {uploading ? 'Uploading...' : 'Upload Resume'}
                    </Button>
                    <Link href="/portal/jobs">
                        <Button>Find Jobs</Button>
                    </Link>
                </div>
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
                <Link href="/portal/applications">
                    <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Interviews</CardTitle>
                            <Briefcase className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.interviews_scheduled}</div>
                            <p className="text-xs text-muted-foreground">Scheduled interviews</p>
                        </CardContent>
                    </Card>
                </Link>
                <Link href="/portal/profile">
                    <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
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
                </Link>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>My Applications</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {paginatedApplications.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No applications yet. Go find some jobs!</p>
                        ) : (
                            <>
                                {paginatedApplications.map((app) => (
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
                                                    onClick={() => handleWithdrawClick(app.id)}
                                                >
                                                    Withdraw
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {stats.recent_applications.length > 0 && (
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
                    </div>
                </CardContent>
            </Card>

            <ConfirmModal
                isOpen={showWithdrawModal}
                onClose={() => setShowWithdrawModal(false)}
                onConfirm={confirmWithdraw}
                title="Withdraw Application?"
                description="Are you sure you want to withdraw this application? This action cannot be undone."
                confirmText="Yes, Withdraw"
                variant="destructive"
            />
        </div>
    )
}
