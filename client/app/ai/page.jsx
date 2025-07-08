"use client"

import { useState, useEffect } from "react"
import { ChatInputDemo } from "@/components/ui/chat-input-demo"
import { Button } from "@/components/ui/button"
import { Copy, ThumbsUp, ThumbsDown } from "lucide-react"
import { v4 as uuidv4 } from "uuid"
import { getAllPackages } from "@/lib/aptos"

export default function AIPage() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hi! I am your Move package AI assistant. Ask me anything about Move packages, DAO contracts, usage, or code generation!"
    }
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [threads, setThreads] = useState([])
  const [currentId, setCurrentId] = useState(null)
  const [allPackages, setAllPackages] = useState([])
  const [lastPkg, setLastPkg] = useState(null)

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("chatThreads") || "[]")
    setThreads(stored)
    if (stored.length) {
      setCurrentId(stored[0].id)
      const savedMessages = JSON.parse(localStorage.getItem("chat_" + stored[0].id) || "null")
      if (savedMessages) setMessages(savedMessages)
    } else {
      const id = uuidv4()
      setCurrentId(id)
      const newThread = { id, title: "New Chat", ts: Date.now() }
      localStorage.setItem("chatThreads", JSON.stringify([newThread]))
      setThreads([newThread])
    }
  }, [])

  useEffect(() => {
    if (currentId) {
      localStorage.setItem("chat_" + currentId, JSON.stringify(messages))
    }
  }, [messages, currentId])

  useEffect(() => {
    getAllPackages().then(setAllPackages).catch(() => setAllPackages([]))
  }, [])

  const handleSend = async (e) => {
    e.preventDefault()
    if (!input.trim()) return
    setMessages([...messages, { role: "user", markdown: input }])
    setLoading(true)
    try {
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.markdown || m.content }]
      }))
      let pkg = null
      for (const p of allPackages) {
        const re = new RegExp(`\\b${p.name.replace(/[-_]/g, "[-_]") }\\b`, "i")
        if (re.test(input)) {
          pkg = { name: p.name, version: p.version }
          setLastPkg(pkg)
          break
        }
      }
      if (!pkg && lastPkg) {
        pkg = lastPkg
      }
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pkg ? { message: input, history, pkg } : { message: input, history })
      })
      const data = await res.json()
      setMessages(msgs => [...msgs, { role: "assistant", markdown: data.text || data.error || "No response from AI.", html: data.html }])
    } catch (err) {
      setMessages(msgs => [...msgs, { role: "assistant", content: "[Error: " + err.message + "]" }])
    }
    setLoading(false)
    setInput("")
  }

  const handleCopy = (content) => {
    navigator.clipboard.writeText(content)
  }

  function handleNewChat() {
    const id = uuidv4()
    const newThread = { id, title: "New Chat", ts: Date.now() }
    const updated = [newThread, ...threads]
    setThreads(updated)
    localStorage.setItem("chatThreads", JSON.stringify(updated))
    setCurrentId(id)
    setMessages([
      { role: "assistant", markdown: "Hi! I am your Move package AI assistant. Ask me anything!" }
    ])
  }

  function handleSelect(id) {
    setCurrentId(id)
    const saved = JSON.parse(localStorage.getItem("chat_" + id) || "null")
    if (saved) setMessages(saved)
  }

  async function sendFeedback(msgIdx, rating) {
    if (!currentId) return;
    await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chatId: currentId, msgIdx, rating })
    });
  }

  return (
    <div className="flex min-h-screen bg-background">
      <div className="w-64 border-r bg-card p-4 space-y-2">
        <Button onClick={handleNewChat} className="w-full">New Chat</Button>
        <div className="space-y-1 overflow-y-auto max-h-[80vh]">
          {threads.map(t => (
            <div key={t.id} className={`cursor-pointer p-2 rounded ${t.id===currentId? 'bg-primary text-primary-foreground':'hover:bg-muted'}`} onClick={()=>handleSelect(t.id)}>
              {t.title}
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-col flex-1 items-center py-8">
        <div className="w-full max-w-3xl bg-card rounded-xl shadow-lg border p-6 flex flex-col gap-4">
          <h1 className="text-2xl font-bold mb-2">AI Move Package Assistant</h1>
          <div className="flex-1 overflow-y-auto max-h-[50vh] flex flex-col gap-4">
            {messages.map((msg, i) => (
              <div key={i} className={`rounded-lg p-4 relative ${msg.role === "assistant" ? "bg-muted" : "bg-primary/10"}`}>
                {msg.html ? (
                  <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: msg.html }} />
                ) : (
                  <div className="whitespace-pre-wrap text-sm">{msg.markdown}</div>
                )}
                <div className="absolute top-2 right-2 flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleCopy(msg.markdown || msg.content)}
                    title="Copy markdown"
                  >
                    <Copy className="size-4" />
                  </Button>
                  {msg.role === "assistant" && (
                    <>
                      <Button variant="ghost" size="icon" onClick={() => sendFeedback(i, 1)} title="Thumbs up"><ThumbsUp className="size-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => sendFeedback(i, -1)} title="Thumbs down"><ThumbsDown className="size-4" /></Button>
                    </>
                  )}
                </div>
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
    </div>
  )
} 