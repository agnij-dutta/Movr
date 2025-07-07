"use client"

import { useState } from "react"
import { ChatInputDemo } from "@/components/ui/chat-input-demo"
import { Button } from "@/components/ui/button"
import { Copy } from "lucide-react"

export default function AIPage() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hi! I am your Move package AI assistant. Ask me anything about Move packages, DAO contracts, usage, or code generation!"
    }
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSend = async (e) => {
    e.preventDefault()
    if (!input.trim()) return
    setMessages([...messages, { role: "user", content: input }])
    setLoading(true)
    try {
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.content }]
      }))
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input, history })
      })
      const data = await res.json()
      setMessages(msgs => [...msgs, { role: "assistant", content: data.text || data.error || "No response from AI." }])
    } catch (err) {
      setMessages(msgs => [...msgs, { role: "assistant", content: "[Error: " + err.message + "]" }])
    }
    setLoading(false)
    setInput("")
  }

  const handleCopy = (content) => {
    navigator.clipboard.writeText(content)
  }

  return (
    <div className="flex flex-col items-center min-h-screen bg-background py-8">
      <div className="w-full max-w-3xl bg-card rounded-xl shadow-lg border p-6 flex flex-col gap-4">
        <h1 className="text-2xl font-bold mb-2">AI Move Package Assistant</h1>
        <div className="flex-1 overflow-y-auto max-h-[50vh] flex flex-col gap-4">
          {messages.map((msg, i) => (
            <div key={i} className={`rounded-lg p-4 relative ${msg.role === "assistant" ? "bg-muted" : "bg-primary/10"}`}>
              <div className="whitespace-pre-wrap text-sm">{msg.content}</div>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2"
                onClick={() => handleCopy(msg.content)}
                title="Copy markdown"
              >
                <Copy className="size-4" />
              </Button>
            </div>
          ))}
          {loading && (
            <div className="rounded-lg p-4 bg-muted animate-pulse text-muted-foreground">AI is thinking...</div>
          )}
        </div>
        <div className="mt-4 flex flex-col gap-2">
          <ChatInputDemo value={input} setValue={setInput} onSubmit={handleSend} />
        </div>
      </div>
    </div>
  )
} 