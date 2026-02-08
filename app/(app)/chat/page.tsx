"use client"

import { useState, useEffect, useRef } from "react"

interface Message {
  id: string
  role: string
  content: string
  createdAt: string
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    fetchMessages()
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const fetchMessages = async () => {
    try {
      const res = await fetch("/api/chat")
      const data = await res.json()
      setMessages(data.messages || [])
    } catch (error) {
      console.error(error)
    }
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMessage = input.trim()
    setInput("")
    setLoading(true)

    // Optimistic update
    setMessages(prev => [...prev, { 
      id: "temp", 
      role: "user", 
      content: userMessage, 
      createdAt: new Date().toISOString() 
    }])

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage })
      })

      const data = await res.json()

      if (data.message) {
        setMessages(prev => [
          ...prev.filter(m => m.id !== "temp"),
          { id: "user-" + Date.now(), role: "user", content: userMessage, createdAt: new Date().toISOString() },
          { id: "assistant-" + Date.now(), role: "assistant", content: data.message, createdAt: new Date().toISOString() }
        ])
      }
    } catch (error) {
      console.error(error)
      setMessages(prev => prev.filter(m => m.id !== "temp"))
    } finally {
      setLoading(false)
    }
  }

  const clearChat = async () => {
    if (!confirm("Effacer tout l'historique ?")) return
    try {
      await fetch("/api/chat", { method: "DELETE" })
      setMessages([])
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] max-w-lg mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
        <h1 className="text-xl font-bold">🤖 Jarvis</h1>
        <button 
          onClick={clearChat}
          className="text-sm text-red-500 hover:underline"
        >
          Effacer
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-4xl mb-4">🤖</p>
            <p className="font-medium">Salut ! Je suis Jarvis</p>
            <p className="text-sm mt-2">Pose-moi des questions sur la nutrition, les compléments, l'entraînement...</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2 ${
                  msg.role === "user"
                    ? "bg-blue-500 text-white rounded-br-md"
                    : "bg-gray-100 dark:bg-gray-800 rounded-bl-md"
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))
        )}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-bl-md px-4 py-2">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="p-4 border-t dark:border-gray-700">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Message..."
            className="flex-1 px-4 py-3 rounded-full border dark:bg-gray-800 dark:border-gray-700"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center disabled:opacity-50"
          >
            ↑
          </button>
        </div>
      </form>
    </div>
  )
}
