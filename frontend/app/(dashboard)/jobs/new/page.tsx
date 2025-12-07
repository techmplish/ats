"use client"

import { useState } from "react"
import api from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"

export default function NewJobPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        title: "",
        department: "",
        location: "",
        description: "",
        requirements: "",
        salary_min: "",
        salary_max: "",
        currency: "USD"
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            await api.post("/jobs", formData)
            router.push("/jobs")
        } catch (error) {
            console.error("Failed to create job", error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-3xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">Post New Job</h1>

            <Card>
                <CardHeader>
                    <CardTitle>Job Details</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="title">Job Title</Label>
                            <Input
                                id="title"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                required
                                placeholder="e.g. Senior Software Engineer"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="department">Department</Label>
                                <Input
                                    id="department"
                                    value={formData.department}
                                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                    required
                                    placeholder="e.g. Engineering"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="location">Location</Label>
                                <Input
                                    id="location"
                                    value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    required
                                    placeholder="e.g. Remote, NY"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="salary_min">Min Salary</Label>
                                <Input
                                    id="salary_min"
                                    type="number"
                                    value={formData.salary_min}
                                    onChange={(e) => setFormData({ ...formData, salary_min: e.target.value })}
                                    placeholder="e.g. 100000"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="salary_max">Max Salary</Label>
                                <Input
                                    id="salary_max"
                                    type="number"
                                    value={formData.salary_max}
                                    onChange={(e) => setFormData({ ...formData, salary_max: e.target.value })}
                                    placeholder="e.g. 150000"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="currency">Currency</Label>
                                <Select value={formData.currency} onValueChange={(val) => setFormData({ ...formData, currency: val })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="USD">USD ($)</SelectItem>
                                        <SelectItem value="EUR">EUR (€)</SelectItem>
                                        <SelectItem value="GBP">GBP (£)</SelectItem>
                                        <SelectItem value="INR">INR (₹)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                className="min-h-[150px]"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                required
                                placeholder="Detailed job description..."
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="requirements">Requirements</Label>
                            <Textarea
                                id="requirements"
                                className="min-h-[100px]"
                                value={formData.requirements}
                                onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                                required
                                placeholder="Key requirements and skills..."
                            />
                        </div>

                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? "Posting..." : "Post Job"}
                        </Button>
                        <p className="text-xs text-center text-muted-foreground mt-2">
                            A unique Job ID (e.g. JOB-123) will be automatically generated.
                        </p>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
