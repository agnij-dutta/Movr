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
    <div className="min-h-screen relative bg-[#0A0A0A] text-[--foreground] overflow-hidden" style={{ color: '#FFFFFF', fontFamily: 'Inter, Poppins, Montserrat, Space Grotesk, sans-serif' }}>
      {/* Background image overlay */}
      <div className="absolute inset-0 w-full h-full -z-20 pointer-events-none select-none" style={{
        backgroundImage: 'url(/dash-back.jpeg)',
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
        backgroundPosition: 'center',
        opacity: 0.85
      }} />
      {/* Top bar with AI logo/title and dashboard link */}
      <div className="absolute top-6 left-8 z-20 flex items-center gap-2">
        <a href="/dashboard">
          <Button variant="ghost" className="text-white hover:bg-[#d6ff4b] hover:text-[#232b3b] hover:shadow-[0_0_16px_4px_rgba(214,255,75,0.4)] transition-all flex items-center gap-2">
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="mr-1"><path d="M15 19l-7-7 7-7" /></svg>
            Dashboard
          </Button>
        </a>
      </div>
      {/* Main content layout */}
      <div className="flex min-h-screen relative z-10">
        {/* Sidebar */}
        <div className="w-72 hidden md:flex flex-col border-r border-[#2a3538] bg-[#07171b]/70 backdrop-blur-md p-4 space-y-2 rounded-tr-2xl rounded-br-2xl shadow-lg mt-16 ml-4" style={{ minHeight: '80vh' }}>
          <Button onClick={handleNewChat} className="w-full bg-[#d6ff4b] text-[#232b3b] font-bold rounded-xl shadow-lg hover:bg-[#eaff7b] transition mb-2">New Chat</Button>
          <div className="space-y-1 overflow-y-auto max-h-[70vh] pr-1">
            {threads.map(t => (
              <div key={t.id} className={`cursor-pointer p-3 rounded-xl font-medium transition-colors duration-150 ${t.id===currentId? 'bg-gradient-to-r from-[#eab08a] via-[#a6d6d6] to-[#eab08a] text-transparent bg-clip-text shadow-lg':'hover:bg-[#1a2326] text-[#b0b0b0]'}`} onClick={()=>handleSelect(t.id)}>
                {t.title}
              </div>
            ))}
          </div>
        </div>
        {/* Main chat area */}
        <div className="flex flex-col flex-1 items-center py-16 px-2 md:px-0">
          <div className="w-full max-w-3xl bg-[#07171b]/80 border border-[#2a3538] rounded-2xl shadow-2xl relative overflow-hidden" style={{ backdropFilter: 'blur(8px)' }}>
            {/* Card background image overlay */}
            <img src="/1hero.jpg" alt="ai bg" className="absolute inset-0 w-full h-full object-cover opacity-20 pointer-events-none select-none z-0 rounded-2xl" />
            <div className="relative z-10 flex flex-col gap-4 p-8">
              <h1 className="text-3xl md:text-4xl font-extrabold mb-2 bg-gradient-to-r from-[#eab08a] via-[#a6d6d6] to-[#eab08a] text-transparent bg-clip-text font-sans text-center" style={{ letterSpacing: '-0.02em' }}>
                Movr Assistant
              </h1>
              {/* AI Assistant welcome message, left-aligned and visually distinct */}
              <div className="w-full flex justify-start">
                <div className="rounded-xl bg-[#1a2326]/80 border border-[#2a3538] shadow-md px-6 py-4 mb-4 max-w-2xl text-left text-lg font-semibold text-white">
                  Hi! I am your Movr AI assistant. Ask me anything about Move packages, DAO contracts, usage, or code generation!
                </div>
              </div>
              <div className="flex-1 overflow-y-auto max-h-[50vh] flex flex-col gap-4">
                {messages.map((msg, i) => (
                  <div key={i} className={`rounded-xl p-5 relative shadow-md border ${msg.role === "assistant" ? "bg-[#1a2326]/80 border-[#2a3538]" : "bg-[#d6ff4b]/10 border-[#d6ff4b]/40"}`} style={{ fontSize: '1rem', color: msg.role === 'assistant' ? '#fff' : '#d6ff4b' }}>
                    {msg.html ? (
                      <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: msg.html }} />
                    ) : (
                      <div className="whitespace-pre-wrap text-base">{msg.markdown || msg.content}</div>
                    )}
                    {/* Action buttons below the message, right-aligned */}
                    <div className="flex justify-end gap-1 mt-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleCopy(msg.markdown || msg.content)}
                        title="Copy markdown"
                        className="hover:bg-[#d6ff4b]/30"
                      >
                        <Copy className="size-4" />
                      </Button>
                      {msg.role === "assistant" && (
                        <>
                          <Button variant="ghost" size="icon" onClick={() => sendFeedback(i, 1)} title="Thumbs up" className="hover:bg-[#d6ff4b]/30"><ThumbsUp className="size-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => sendFeedback(i, -1)} title="Thumbs down" className="hover:bg-[#d6ff4b]/30"><ThumbsDown className="size-4" /></Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="rounded-xl p-5 bg-[#1a2326]/80 border border-[#2a3538] animate-pulse text-[#b0b0b0] shadow-md">AI is thinking...</div>
                )}
              </div>
              {/* Chat input box with dark text on light background, styled like dashboard */}
              <div className="mt-4 flex flex-col gap-2">
                <form onSubmit={handleSend} className="flex gap-2 w-full">
                  <input
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="Type your message here..."
                    className="flex-1 bg-white text-[#232b3b] border border-[#2a3538] rounded-xl px-4 py-3 text-lg placeholder:text-[#5c6a6e] focus:ring-2 focus:ring-[#d6ff4b] shadow-md outline-none"
                    style={{ fontWeight: 500 }}
                  />
                  <Button type="submit" className="bg-[#0A0A0A] text-white font-bold rounded-xl shadow-lg hover:bg-[#d6ff4b] hover:text-[#232b3b] transition px-6 py-2 whitespace-nowrap flex items-center gap-2">
                    Send Message <span className="ml-1">↵</span>
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 