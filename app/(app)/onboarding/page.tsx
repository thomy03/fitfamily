"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"

interface Message {
  id: string
  role: string
  content: string
}

export default function OnboardingPage() {
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [generating, setGenerating] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchMessages()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const fetchMessages = async () => {
    try {
      const res = await fetch("/api/onboarding")
      const data = await res.json()
      
      if (data.completed) {
        setCompleted(true)
        router.push("/dashboard")
        return
      }

      if (data.messages?.length > 0) {
        setMessages(data.messages)
      } else {
        // Start onboarding
        startOnboarding()
      }
    } catch (error) {
      console.error(error)
    }
  }

  const startOnboarding = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "Bonjour, je suis prêt à créer mon profil santé !" })
      })
      const data = await res.json()
      
      setMessages([
        { id: "1", role: "user", content: "Bonjour, je suis prêt à créer mon profil santé !" },
        { id: "2", role: "assistant", content: data.message }
      ])
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMessage = input.trim()
    setInput("")
    setLoading(true)

    setMessages(prev => [...prev, { id: "temp", role: "user", content: userMessage }])

    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage })
      })

      const data = await res.json()

      setMessages(prev => [
        ...prev.filter(m => m.id !== "temp"),
        { id: Date.now().toString(), role: "user", content: userMessage },
        { id: (Date.now() + 1).toString(), role: "assistant", content: data.message }
      ])

      if (data.completed) {
        setCompleted(true)
        setGenerating(true)
        
        // Generate recommendations
        await fetch("/api/recommendations", { method: "POST" })
        
        setTimeout(() => {
          router.push("/dashboard")
        }, 2000)
      }
    } catch (error) {
      console.error(error)
      setMessages(prev => prev.filter(m => m.id !== "temp"))
    } finally {
      setLoading(false)
    }
  }

  const resetOnboarding = async () => {
    if (!confirm("Recommencer l'onboarding ?")) return
    await fetch("/api/onboarding", { method: "DELETE" })
    setMessages([])
    setCompleted(false)
    startOnboarding()
  }

  if (generating) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] p-4">
        <div className="text-6xl mb-4 animate-pulse">🧬</div>
        <h2 className="text-xl font-bold mb-2">Profil créé !</h2>
        <p className="text-gray-500 text-center">Je génère tes recommandations personnalisées...</p>
        <div className="mt-4 flex gap-2">
          <div className="w-3 h-3 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
          <div className="w-3 h-3 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
          <div className="w-3 h-3 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] max-w-lg mx-auto">
      {/* Header */}
      <div className="p-4 border-b dark:border-gray-700 bg-gradient-to-r from-emerald-500 to-teal-500 text-white">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-lg font-bold">🧬 Profil Santé</h1>
            <p className="text-sm opacity-80">Onboarding personnalisé</p>
          </div>
          <button onClick={resetOnboarding} className="text-sm opacity-70 hover:opacity-100">
            ↻ Reset
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-5xl mb-4">🤖</div>
            <p className="text-gray-500">Chargement...</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                  msg.role === "user"
                    ? "bg-emerald-500 text-white rounded-br-md"
                    : "bg-white dark:bg-gray-800 shadow-sm rounded-bl-md"
                }`}
              >
                {msg.role === "assistant" && (
                  <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mb-1">🧬 Jarvis</div>
                )}
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))
        )}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-gray-800 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="p-4 border-t dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ta réponse..."
            className="flex-1 px-4 py-3 rounded-full border dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            disabled={loading || completed}
          />
          <button
            type="submit"
            disabled={loading || !input.trim() || completed}
            className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center disabled:opacity-50 hover:bg-emerald-600 transition-colors"
          >
            ↑
          </button>
        </div>
      </form>
    </div>
  )
}
