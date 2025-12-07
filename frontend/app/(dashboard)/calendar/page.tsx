"use client"

import { useState, useEffect } from "react"
import api from "@/lib/api"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from "date-fns"
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Clock, MapPin } from "lucide-react"

export default function CalendarPage() {
    const { toast } = useToast()
    const [currentDate, setCurrentDate] = useState(new Date())
    const [events, setEvents] = useState<any[]>([])
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [newEvent, setNewEvent] = useState({
        title: "",
        description: "",
        date: format(new Date(), "yyyy-MM-dd"),
        start_time: "09:00",
        end_time: "10:00",
        location: ""
    })
    const [selectedDate, setSelectedDate] = useState<Date | null>(null)

    const fetchEvents = async () => {
        // Fetch for the visible range (startOfWeek of startOfMonth to endOfWeek of endOfMonth)
        const start = startOfWeek(startOfMonth(currentDate)).toISOString()
        const end = endOfWeek(endOfMonth(currentDate)).toISOString()
        try {
            const { data } = await api.get(`/calendar?start=${start}&end=${end}`)
            setEvents(data)
        } catch (error) {
            console.error("Failed to fetch events", error)
        }
    }

    useEffect(() => {
        fetchEvents()
    }, [currentDate])

    const handleCreateEvent = async () => {
        if (!newEvent.title || !newEvent.date || !newEvent.start_time || !newEvent.end_time) {
            toast({ title: "Validation Error", description: "All fields are required.", variant: "destructive" })
            return
        }
        try {
            // Manual parsing to avoid browser inconsistencies
            const [year, month, day] = newEvent.date.split('-').map(Number)
            const [startH, startM] = newEvent.start_time.split(':').map(Number)
            const [endH, endM] = newEvent.end_time.split(':').map(Number)

            const startDateTime = new Date(year, month - 1, day, startH, startM)
            const endDateTime = new Date(year, month - 1, day, endH, endM)

            if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
                throw new Error("Invalid date or time format")
            }

            await api.post("/calendar", {
                title: newEvent.title,
                description: newEvent.description,
                start_time: startDateTime.toISOString(),
                end_time: endDateTime.toISOString(),
                location: newEvent.location
            })
            setIsCreateOpen(false)
            fetchEvents()
            toast({ title: "Event Created", description: "Your event has been scheduled." })

            // Reset form
            setNewEvent({
                title: "",
                description: "",
                date: format(new Date(), "yyyy-MM-dd"),
                start_time: "09:00",
                end_time: "10:00",
                location: ""
            })
        } catch (error: any) {
            console.error("Failed to create event", error)
            toast({ title: "Error", description: error.response?.data?.error || "Failed to save event.", variant: "destructive" })
        }
    }

    // Generate days including padding for full weeks
    const days = eachDayOfInterval({
        start: startOfWeek(startOfMonth(currentDate)),
        end: endOfWeek(endOfMonth(currentDate))
    })

    const getEventsForDay = (day: Date) => {
        return events.filter(event => isSameDay(new Date(event.start_time), day))
    }

    return (
        <div className="h-full flex flex-col space-y-4">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <h1 className="text-3xl font-bold">{format(currentDate, 'MMMM yyyy')}</h1>
                    <div className="flex gap-1">
                        <Button variant="outline" size="icon" onClick={() => setCurrentDate(subMonths(currentDate, 1))}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon" onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
                <Button onClick={() => setIsCreateOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> Add Event
                </Button>
            </div>

            <div className="flex-1 grid grid-cols-7 gap-px bg-muted rounded-lg overflow-hidden border shadow-sm">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="bg-background/95 p-2 text-center text-sm font-semibold border-b">
                        {day}
                    </div>
                ))}

                {days.map((day, dayIdx) => {
                    const dayEvents = getEventsForDay(day)
                    const isToday = isSameDay(day, new Date())
                    return (
                        <div
                            key={day.toString()}
                            className={`bg-background min-h-[120px] p-2 hover:bg-muted/50 transition-colors cursor-pointer border-r border-b ${!isSameMonth(day, currentDate) ? 'bg-muted/10 text-muted-foreground' : ''}`}
                            onClick={() => {
                                setNewEvent(prev => ({ ...prev, date: format(day, 'yyyy-MM-dd') }))
                                setIsCreateOpen(true)
                            }}
                        >
                            <div className="flex justify-between items-start">
                                <span className={`text-sm font-medium h-7 w-7 flex items-center justify-center rounded-full ${isToday ? 'bg-primary text-primary-foreground' : ''}`}>
                                    {format(day, 'd')}
                                </span>
                            </div>

                            <div className="space-y-1 mt-1">
                                {dayEvents.map(event => (
                                    <div key={event.id} className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded truncate font-medium border-l-2 border-primary/50">
                                        {format(new Date(event.start_time), 'HH:mm')} {event.title}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )
                })}
            </div>

            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Schedule Event</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Event Title</Label>
                            <Input
                                value={newEvent.title}
                                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                                placeholder="Interview with Candidate"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Date</Label>
                                <Input
                                    type="date"
                                    value={newEvent.date}
                                    onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Time</Label>
                                <div className="flex gap-2 items-center">
                                    <Input
                                        type="time"
                                        value={newEvent.start_time}
                                        onChange={(e) => setNewEvent({ ...newEvent, start_time: e.target.value })}
                                    />
                                    <span>-</span>
                                    <Input
                                        type="time"
                                        value={newEvent.end_time}
                                        onChange={(e) => setNewEvent({ ...newEvent, end_time: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Location / Link</Label>
                            <Input
                                value={newEvent.location}
                                onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                                placeholder="Meeting Link or Office Room"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea
                                value={newEvent.description}
                                onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                        <Button onClick={handleCreateEvent}>Save Event</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
