"use client"

import { useState } from "react"
import api from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Bot, Send, User } from "lucide-react"

interface Message {
    role: 'user' | 'assistant'
    content: string
}

export default function AIPage() {
    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', content: 'Hello! I am your AI assistant. How can I help you with your recruiting tasks today?' }
    ])
    const [input, setInput] = useState("")
    const [loading, setLoading] = useState(false)

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!input.trim()) return

        const userMsg = input
        setMessages(prev => [...prev, { role: 'user', content: userMsg }])
        setInput("")
        setLoading(true)

        try {
            const { data } = await api.post("/rag/ask", { question: userMsg })
            setMessages(prev => [...prev, { role: 'assistant', content: data.answer }])
        } catch (error) {
            setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I encountered an error. Please try again." }])
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="h-[calc(100vh-8rem)] flex flex-col">
            <div className="mb-6">
                <h1 className="text-3xl font-bold tracking-tight">AI Assistant</h1>
                <p className="text-muted-foreground">Ask questions about your candidates and jobs.</p>
            </div>

            <Card className="flex-1 flex flex-col">
                <CardContent className="flex-1 p-0">
                    <ScrollArea className="h-[calc(100vh-16rem)] p-4">
                        <div className="space-y-4">
                            {messages.map((msg, i) => (
                                <div
                                    key={i}
                                    className={`flex items-start gap-3 ${msg.role === 'assistant' ? 'flex-row' : 'flex-row-reverse'
                                        }`}
                                >
                                    <div className={`p-2 rounded-full ${msg.role === 'assistant' ? 'bg-primary/10' : 'bg-secondary'
                                        }`}>
                                        {msg.role === 'assistant' ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                                    </div>
                                    <div className={`rounded-lg p-3 max-w-[80%] ${msg.role === 'assistant'
                                        ? 'bg-muted'
                                        : 'bg-primary text-primary-foreground'
                                        }`}>
                                        <p className="text-sm">{msg.content}</p>
                                    </div>
                                </div>
                            ))}
                            {loading && (
                                <div className="flex items-start gap-3">
                                    <div className="p-2 rounded-full bg-primary/10">
                                        <Bot className="h-4 w-4" />
                                    </div>
                                    <div className="rounded-lg p-3 bg-muted">
                                        <p className="text-sm animate-pulse">Thinking...</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </CardContent>
                <CardFooter className="p-4 border-t">
                    <form onSubmit={handleSend} className="flex w-full gap-2">
                        <Input
                            placeholder="Ask a question..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            disabled={loading}
                        />
                        <Button type="submit" disabled={loading}>
                            <Send className="h-4 w-4" />
                        </Button>
                    </form>
                </CardFooter>
            </Card>
        </div>
    )
}
