"use client"

import { useEffect, useState } from "react"
import api from "@/lib/api"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"

export default function ApplicationsPage() {
    const [applications, setApplications] = useState<any[]>([])

    useEffect(() => {
        const fetchApps = async () => {
            try {
                const { data } = await api.get("/applications")
                setApplications(data)
            } catch (e) {
                console.error("Failed to fetch applications")
            }
        }
        fetchApps()
    }, [])

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Applications</h1>
                <Button>Upload Application</Button>
            </div>

            <div className="grid gap-4">
                {applications.length === 0 ? (
                    <p>No applications found.</p>
                ) : (
                    applications.map((app) => (
                        <Card key={app.id}>
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle>{app.candidate_name}</CardTitle>
                                        <p className="text-sm text-muted-foreground mt-1">{app.job_title}</p>
                                    </div>
                                    <Badge>{app.stage}</Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="flex justify-between items-center">
                                    <p className="text-sm text-muted-foreground">Applied on {new Date(app.created_at).toLocaleDateString()}</p>
                                    <Link href={`/applications/${app.id}`}>
                                        <Button variant="outline">View Details</Button>
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    )
}
