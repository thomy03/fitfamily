"use client"

import { useState, useEffect } from "react"

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    groqApiKey: "",
    openaiApiKey: "",
    claudeApiKey: "",
    geminiApiKey: "",
    defaultProvider: "groq"
  })

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/settings")
      const data = await res.json()
      if (data.settings) {
        setForm({
          groqApiKey: data.settings.groqApiKey || "",
          openaiApiKey: data.settings.openaiApiKey || "",
          claudeApiKey: data.settings.claudeApiKey || "",
          geminiApiKey: data.settings.geminiApiKey || "",
          defaultProvider: data.settings.defaultProvider || "groq"
        })
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      })

      if (res.ok) {
        alert("Paramètres sauvegardés !")
        fetchSettings()
      } else {
        alert("Erreur lors de la sauvegarde")
      }
    } catch (error) {
      alert("Erreur réseau")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="p-4 text-center">Chargement...</div>
  }

  return (
    <div className="p-4 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-6">⚙️ Paramètres</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* API Keys */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <h2 className="font-semibold mb-4">🔑 Clés API</h2>
          <p className="text-sm text-gray-500 mb-4">
            Configurez vos propres clés API pour le chat IA. Laissez vide pour utiliser les clés par défaut.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Groq API Key</label>
              <input
                type="password"
                value={form.groqApiKey}
                onChange={(e) => setForm({ ...form, groqApiKey: e.target.value })}
                placeholder="gsk_..."
                className="w-full px-4 py-3 rounded-lg border dark:bg-gray-700 dark:border-gray-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">OpenAI API Key</label>
              <input
                type="password"
                value={form.openaiApiKey}
                onChange={(e) => setForm({ ...form, openaiApiKey: e.target.value })}
                placeholder="sk-..."
                className="w-full px-4 py-3 rounded-lg border dark:bg-gray-700 dark:border-gray-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Claude API Key</label>
              <input
                type="password"
                value={form.claudeApiKey}
                onChange={(e) => setForm({ ...form, claudeApiKey: e.target.value })}
                placeholder="sk-ant-..."
                className="w-full px-4 py-3 rounded-lg border dark:bg-gray-700 dark:border-gray-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Gemini API Key</label>
              <input
                type="password"
                value={form.geminiApiKey}
                onChange={(e) => setForm({ ...form, geminiApiKey: e.target.value })}
                placeholder="AI..."
                className="w-full px-4 py-3 rounded-lg border dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
          </div>
        </div>

        {/* Default Provider */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <h2 className="font-semibold mb-4">🤖 Fournisseur par défaut</h2>
          
          <select
            value={form.defaultProvider}
            onChange={(e) => setForm({ ...form, defaultProvider: e.target.value })}
            className="w-full px-4 py-3 rounded-lg border dark:bg-gray-700 dark:border-gray-600"
          >
            <option value="groq">Groq (Llama 3.3 - Rapide)</option>
            <option value="openai">OpenAI (GPT-4)</option>
            <option value="claude">Anthropic (Claude)</option>
            <option value="gemini">Google (Gemini)</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full px-4 py-3 rounded-lg bg-blue-500 text-white font-medium disabled:opacity-50"
        >
          {saving ? "Sauvegarde..." : "Sauvegarder"}
        </button>
      </form>
    </div>
  )
}
