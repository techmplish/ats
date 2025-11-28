"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar" // Need to implement this or use react-day-picker
import { useState } from "react"

export default function CalendarPage() {
    const [date, setDate] = useState<Date | undefined>(new Date())

    return (
        <div className="flex h-full gap-6">
            <Card className="w-auto h-fit">
                <CardHeader>
                    <CardTitle>Select Date</CardTitle>
                </CardHeader>
                <CardContent>
                    <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        className="rounded-md border"
                    />
                </CardContent>
            </Card>

            <Card className="flex-1">
                <CardHeader>
                    <CardTitle>Schedule for {date?.toDateString()}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {/* Mock Events */}
                        <div className="p-4 border rounded-lg bg-blue-50 border-blue-100">
                            <h4 className="font-semibold text-blue-900">Interview with Sarah Jones</h4>
                            <p className="text-sm text-blue-700">10:00 AM - 11:00 AM</p>
                        </div>
                        <div className="p-4 border rounded-lg">
                            <h4 className="font-semibold">Team Sync</h4>
                            <p className="text-sm text-muted-foreground">2:00 PM - 3:00 PM</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
