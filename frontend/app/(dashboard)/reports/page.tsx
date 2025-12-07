"use client"

import { useState, useEffect } from "react"
import api from "@/lib/api"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Loader2, Users, Briefcase, Activity } from "lucide-react"

export default function ReportsPage() {
    const [loading, setLoading] = useState(true)
    const [pipelineData, setPipelineData] = useState<any[]>([])
    const [jobStats, setJobStats] = useState<any>(null)
    const [jobs, setJobs] = useState<any[]>([])

    // Filters
    const [locationFilter, setLocationFilter] = useState("all")
    const [departmentFilter, setDepartmentFilter] = useState("all")
    const [roleFilter, setRoleFilter] = useState("all") // Job Title

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const { data: jobsData } = await api.get("/jobs?limit=100")
                setJobs(jobsData.jobs || [])

                const { data: statsData } = await api.get("/reports/job-stats")
                setJobStats(statsData)
            } catch (error) {
                console.error("Failed to fetch initial data", error)
            }
        }
        fetchInitialData()
    }, [])

    useEffect(() => {
        const fetchPipeline = async () => {
            setLoading(true)
            try {
                const params = new URLSearchParams()
                if (locationFilter !== "all") params.append("location", locationFilter)
                if (departmentFilter !== "all") params.append("department", departmentFilter)
                // If roleFilter is a specific job ID? No, the filter logic in ID. 
                // Wait, "Job Role" usually implies Title. 
                // My backend checks "job_id" for exact job, OR I can add "title" filter? 
                // The backend currently supports: job_id, location, department, company.
                // It does NOT support Title. 
                // I'll map "Role" to "job_id" if I select a specific Job? 
                // Or I can add title filtering to backend. 
                // For now, let's treat "Role" as "Job Title". I'll skip it if backend doesn't support it, 
                // or just assume the user selects a Specific Job. 
                // Let's use "Job" selector instead of "Role".
                if (roleFilter !== "all") params.append("job_id", roleFilter)

                const { data } = await api.get(`/reports/pipeline-summary?${params.toString()}`)

                // Transform object { "Applied": 10, ... } to Array for Recharts
                const STAGES = ['Applied', 'Screening', 'Interview', 'Offer', 'Hired', 'Rejected']
                const chartData = STAGES.map(stage => ({
                    name: stage,
                    count: data[stage] || 0
                }))
                setPipelineData(chartData)
            } catch (error) {
                console.error("Failed to fetch report data", error)
            } finally {
                setLoading(false)
            }
        }
        fetchPipeline()
    }, [locationFilter, departmentFilter, roleFilter])

    // Derive unique options
    const locations = Array.from(new Set(jobs.map(j => j.location).filter(Boolean)))
    const departments = Array.from(new Set(jobs.map(j => j.department).filter(Boolean)))

    return (
        <div className="space-y-6 pb-10">
            <h1 className="text-3xl font-bold tracking-tight">Recruitment Analytics</h1>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{jobStats?.total_applications || 0}</div>
                        <p className="text-xs text-muted-foreground">Across all jobs</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{jobStats?.active_jobs || 0}</div>
                        <p className="text-xs text-muted-foreground">Currently hiring</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {jobStats && jobStats.total_applications > 0
                                ? ((pipelineData.find(p => p.name === 'Hired')?.count || 0) / jobStats.total_applications * 100).toFixed(1) + '%'
                                : '0%'}
                        </div>
                        <p className="text-xs text-muted-foreground">Hired / Total Applications</p>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Job</label>
                            <Select value={roleFilter} onValueChange={setRoleFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All Jobs" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Jobs</SelectItem>
                                    {jobs.map(job => (
                                        <SelectItem key={job.id} value={String(job.id)}>{job.title}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Department</label>
                            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All Departments" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Departments</SelectItem>
                                    {departments.map(d => (
                                        <SelectItem key={d} value={d}>{d}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Location</label>
                            <Select value={locationFilter} onValueChange={setLocationFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All Locations" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Locations</SelectItem>
                                    {locations.map(l => (
                                        <SelectItem key={l} value={l}>{l}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>Application Pipeline</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-0">
                        <div className="h-[300px] w-full">
                            {loading ? (
                                <div className="h-full flex items-center justify-center">
                                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={pipelineData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                                        <Tooltip
                                            cursor={{ fill: 'transparent' }}
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                        />
                                        <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]}>
                                            {pipelineData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.name === 'Hired' ? '#10b981' : (entry.name === 'Rejected' ? '#ef4444' : '#3b82f6')} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>Top Jobs by Volume</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {jobStats?.top_jobs?.map((job: any, i: number) => (
                                <div key={i} className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium leading-none">{job.title}</p>
                                        <div className="h-2 w-full bg-muted rounded-full overflow-hidden mt-2 w-[200px]">
                                            <div
                                                className="h-full bg-primary"
                                                style={{ width: `${(job.count / (jobStats.total_applications || 1)) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                    <div className="font-bold">{job.count}</div>
                                </div>
                            ))}
                            {(!jobStats?.top_jobs || jobStats.top_jobs.length === 0) && (
                                <div className="text-muted-foreground text-sm">No data available</div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
