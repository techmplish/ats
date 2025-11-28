"use client"

import { useState, useEffect } from "react"
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import api from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"

const STAGES = ['Applied', 'Screening', 'Interview', 'Offer', 'Hired']

interface Application {
    id: number
    candidate_name: string
    job_title: string
    stage: string
    score: number
    updated_at: string
}

interface PipelineBoardProps {
    initialApplications: Application[]
}

export function PipelineBoard({ initialApplications }: PipelineBoardProps) {
    const [applications, setApplications] = useState<Application[]>(initialApplications)
    const [isMounted, setIsMounted] = useState(false)
    const { toast } = useToast()

    useEffect(() => {
        setIsMounted(true)
        setApplications(initialApplications)
    }, [initialApplications])

    const onDragEnd = async (result: DropResult) => {
        const { destination, source, draggableId } = result

        if (!destination) return

        if (
            destination.droppableId === source.droppableId &&
            destination.index === source.index
        ) {
            return
        }

        const appId = parseInt(draggableId)
        const newStage = destination.droppableId

        // Optimistic update
        const updatedApps = applications.map(app =>
            app.id === appId ? { ...app, stage: newStage } : app
        )
        setApplications(updatedApps)

        try {
            await api.put(`/applications/${appId}/stage`, { stage: newStage })
            toast({
                title: "Stage Updated",
                description: "Application moved successfully.",
            })
        } catch (error) {
            console.error("Failed to update stage", error)
            // Revert on failure
            setApplications(applications)
            toast({
                title: "Error",
                description: "Failed to update stage.",
                variant: "destructive",
            })
        }
    }

    const getAppsByStage = (stage: string) => {
        return applications.filter(app => app.stage === stage)
    }

    if (!isMounted) {
        return <div className="p-4">Loading board...</div>
    }

    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex-1 overflow-x-auto h-full">
                <div className="flex gap-4 h-full min-w-[1000px] pb-4">
                    {STAGES.map(stage => (
                        <div key={stage} className="w-80 flex-shrink-0 flex flex-col bg-gray-100/50 rounded-lg border p-4">
                            <h3 className="font-semibold mb-4 text-sm uppercase text-gray-500 flex justify-between items-center">
                                {stage}
                                <span className="bg-white border text-gray-700 px-2 py-0.5 rounded-full text-xs shadow-sm">
                                    {getAppsByStage(stage).length}
                                </span>
                            </h3>
                            <Droppable droppableId={stage}>
                                {(provided, snapshot) => (
                                    <div
                                        {...provided.droppableProps}
                                        ref={provided.innerRef}
                                        className={`flex-1 space-y-3 transition-colors rounded-md ${snapshot.isDraggingOver ? 'bg-blue-50/50' : ''
                                            }`}
                                    >
                                        {getAppsByStage(stage).map((app, index) => (
                                            <Draggable key={app.id} draggableId={app.id.toString()} index={index}>
                                                {(provided, snapshot) => (
                                                    <div
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        {...provided.dragHandleProps}
                                                        style={provided.draggableProps.style}
                                                    >
                                                        <Card className={`cursor-grab active:cursor-grabbing hover:shadow-md transition-all ${snapshot.isDragging ? 'shadow-lg ring-2 ring-primary/20 rotate-2' : ''
                                                            }`}>
                                                            <CardContent className="p-4">
                                                                <div className="flex justify-between items-start mb-2">
                                                                    <h4 className="font-medium text-sm">{app.candidate_name}</h4>
                                                                    {app.score > 0 && (
                                                                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${app.score >= 80 ? 'bg-green-100 text-green-700' :
                                                                            app.score >= 60 ? 'bg-yellow-100 text-yellow-700' :
                                                                                'bg-red-100 text-red-700'
                                                                            }`}>
                                                                            {app.score}%
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <p className="text-xs text-muted-foreground mb-3 line-clamp-1">{app.job_title}</p>
                                                                <div className="flex justify-end">
                                                                    <Link href={`/applications/${app.id}`}>
                                                                        <Button variant="ghost" size="sm" className="h-6 text-xs hover:bg-primary/5">View</Button>
                                                                    </Link>
                                                                </div>
                                                            </CardContent>
                                                        </Card>
                                                    </div>
                                                )}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                        </div>
                    ))}
                </div>
            </div>
        </DragDropContext>
    )
}
