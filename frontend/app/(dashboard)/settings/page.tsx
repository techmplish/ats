"use client"

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function SettingsPage() {
    return (
        <div className="max-w-4xl space-y-8">
            <h1 className="text-3xl font-bold">Settings</h1>

            <Card>
                <CardHeader>
                    <CardTitle>AI Configuration</CardTitle>
                    <CardDescription>Manage your LLM provider and API keys.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>LLM Provider</Label>
                        <Select defaultValue="gemini">
                            <SelectTrigger>
                                <SelectValue placeholder="Select provider" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="gemini">Google Gemini (Default)</SelectItem>
                                <SelectItem value="openai">OpenAI GPT-4</SelectItem>
                                <SelectItem value="local" disabled>Local LLaMA (Coming Soon)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>API Key</Label>
                        <Input type="password" value="************************" />
                    </div>
                    <Button>Save Changes</Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Profile Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>First Name</Label>
                            <Input defaultValue="John" />
                        </div>
                        <div className="space-y-2">
                            <Label>Last Name</Label>
                            <Input defaultValue="Doe" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Email</Label>
                        <Input defaultValue="john@example.com" disabled />
                    </div>
                    <Button>Update Profile</Button>
                </CardContent>
            </Card>
        </div>
    )
}
