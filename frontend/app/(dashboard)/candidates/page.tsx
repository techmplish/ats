"use client"

import { useEffect, useState } from "react"
import api from "@/lib/api"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Mail, Phone, Linkedin, Calendar, Upload } from "lucide-react"

export default function CandidatesPage() {
    const [candidates, setCandidates] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")
    const [experience, setExperience] = useState("")

    const fetchCandidates = async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams()
            if (search) params.append("q", search)
            if (experience) params.append("experience", experience)

            const { data } = await api.get(`/candidates?${params.toString()}`)
            setCandidates(data)
        } catch (e) {
            console.error("Failed to fetch candidates")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchCandidates()
    }, [])

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        fetchCandidates()
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Resume Repository</h1>
                <Button onClick={() => window.location.href = '/upload'}>Add Candidate / Upload Resume</Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Search Candidates</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSearch} className="flex gap-4 items-end">
                        <div className="grid w-full max-w-sm items-center gap-1.5">
                            <Label htmlFor="search">Keywords (Skills, Name)</Label>
                            <Input
                                id="search"
                                placeholder="Java, Python, John..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <div className="grid w-full max-w-xs items-center gap-1.5">
                            <Label htmlFor="experience">Min Experience (Years)</Label>
                            <Input
                                id="experience"
                                type="number"
                                placeholder="e.g. 3"
                                value={experience}
                                onChange={(e) => setExperience(e.target.value)}
                            />
                        </div>
                        <Button type="submit">Search</Button>
                    </form>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Results ({candidates.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="p-8 text-center">Loading...</div>
                    ) : candidates.length === 0 ? (
                        <p className="text-muted-foreground">No candidates found matching your criteria.</p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Skills</TableHead>
                                    <TableHead>Experience</TableHead>
                                    <TableHead>Contact</TableHead>
                                    <TableHead>Social</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {candidates.map((candidate) => (
                                    <TableRow key={candidate.id}>
                                        <TableCell className="font-medium">
                                            {candidate.first_name} {candidate.last_name}
                                        </TableCell>
                                        <TableCell className="max-w-xs truncate" title={candidate.skills}>
                                            {candidate.skills || "-"}
                                        </TableCell>
                                        <TableCell>
                                            {candidate.experience_years ? `${candidate.experience_years} years` : "-"}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1 text-sm">
                                                <div className="flex items-center gap-2">
                                                    <Mail className="h-3 w-3 text-muted-foreground" />
                                                    {candidate.email}
                                                </div>
                                                {candidate.phone && (
                                                    <div className="flex items-center gap-2">
                                                        <Phone className="h-3 w-3 text-muted-foreground" />
                                                        {candidate.phone}
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {candidate.linkedin_url && (
                                                <a
                                                    href={candidate.linkedin_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-primary hover:underline flex items-center gap-1"
                                                >
                                                    <Linkedin className="h-3 w-3" /> LinkedIn
                                                </a>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button variant="ghost" size="sm" onClick={() => window.open(`${api.defaults.baseURL}/resume/download/${candidate.id}`, '_blank')}>
                                                    <Upload className="h-4 w-4 rotate-180" /> {/* Download icon */}
                                                </Button>
                                                <Button variant="ghost" size="sm">View Profile</Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
