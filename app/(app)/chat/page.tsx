"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"

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
  const [lastAction, setLastAction] = useState<string | null>(null)
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
    setLastAction(null)

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

        // Show action notification
        if (data.profileUpdated && data.recommendationsGenerated) {
          setLastAction("✅ Profil mis à jour et recommandations générées !")
        } else if (data.profileUpdated) {
          setLastAction("✅ Profil mis à jour !")
        } else if (data.recommendationsGenerated) {
          setLastAction("✅ Recommandations générées !")
        }
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
      setLastAction(null)
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] max-w-lg mx-auto bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="flex justify-between items-center p-4 bg-emerald-500 text-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-xl">
            🤖
          </div>
          <div>
            <h1 className="font-bold">Jarvis</h1>
            <p className="text-xs opacity-80">Dis-moi tes objectifs, je crée ton profil</p>
          </div>
        </div>
        <button 
          onClick={clearChat}
          className="text-sm bg-white/20 px-3 py-1 rounded-full hover:bg-white/30"
        >
          🗑️
        </button>
      </div>

      {/* Action notification */}
      {lastAction && (
        <div className="bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-200 px-4 py-2 text-sm flex items-center justify-between">
          <span>{lastAction}</span>
          <div className="flex gap-2">
            <Link href="/supplements" className="underline text-xs">💊 Compléments</Link>
            <Link href="/workout" className="underline text-xs">🏋️ Sport</Link>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-800">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900 rounded-full flex items-center justify-center text-4xl mx-auto mb-4">
              🤖
            </div>
            <h2 className="font-bold text-xl text-gray-800 dark:text-white mb-2">Salut ! Je suis Jarvis</h2>
            <p className="text-gray-600 dark:text-gray-300 max-w-xs mx-auto mb-4">
              <strong>Dis-moi qui tu es</strong> et je crée ton profil santé personnalisé avec des recommandations adaptées.
            </p>
            <div className="bg-white dark:bg-gray-700 rounded-xl p-4 max-w-sm mx-auto text-left">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">💡 Exemple :</p>
              <button
                onClick={() => setInput("J'ai 40 ans, 82kg pour 1m78, homme. Mon objectif c'est la longévité et l'anti-âge. Budget compléments environ 100€/mois.")}
                className="text-sm text-gray-700 dark:text-gray-200 italic hover:text-emerald-600 dark:hover:text-emerald-400"
              >
                "J'ai 40 ans, 82kg pour 1m78, homme. Mon objectif c'est la longévité et l'anti-âge. Budget compléments environ 100€/mois."
              </button>
            </div>
            <div className="mt-6 flex flex-wrap gap-2 justify-center">
              {[
                "Je veux perdre 10kg",
                "Objectif prise de muscle",
                "Améliorer mon sommeil",
              ].map((q, i) => (
                <button
                  key={i}
                  onClick={() => setInput(q)}
                  className="text-xs bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-3 py-2 rounded-full border border-gray-200 dark:border-gray-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 hover:border-emerald-300"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${
                  msg.role === "user"
                    ? "bg-emerald-500 text-white rounded-br-md"
                    : "bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-bl-md border border-gray-100 dark:border-gray-600"
                }`}
              >
                {msg.role === "assistant" && (
                  <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-100 dark:border-gray-600">
                    <span className="text-lg">🤖</span>
                    <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Jarvis</span>
                  </div>
                )}
                <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
              </div>
            </div>
          ))
        )}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-gray-700 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm border border-gray-100 dark:border-gray-600">
              <div className="flex items-center gap-2">
                <span className="text-lg">🤖</span>
                <span className="text-xs text-gray-500">Jarvis analyse et crée ton profil...</span>
              </div>
              <div className="flex gap-1 mt-2">
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
      <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
        <form onSubmit={sendMessage} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Décris-toi : âge, poids, objectifs..."
            className="flex-1 px-4 py-3 rounded-full bg-gray-100 dark:bg-gray-800 border-2 border-transparent focus:border-emerald-500 focus:bg-white dark:focus:bg-gray-700 outline-none transition-all text-gray-800 dark:text-white placeholder-gray-400"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center disabled:opacity-50 hover:bg-emerald-600 transition-colors shadow-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  )
}
