"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function AddSupplementPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: "",
    brand: "",
    dosage: "",
    frequency: "daily",
    timeOfDay: "morning",
    purchaseUrl: "",
    notes: ""
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name) return alert("Le nom est requis")

    setLoading(true)
    try {
      const res = await fetch("/api/supplements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      })

      if (res.ok) {
        router.push("/supplements")
      } else {
        alert("Erreur lors de l'ajout")
      }
    } catch (error) {
      alert("Erreur réseau")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-6">➕ Nouveau complément</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Nom *</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Vitamine D3, Omega-3..."
            className="w-full px-4 py-3 rounded-lg border dark:bg-gray-800 dark:border-gray-700"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Marque</label>
          <input
            type="text"
            value={form.brand}
            onChange={(e) => setForm({ ...form, brand: e.target.value })}
            placeholder="Solgar, NOW Foods..."
            className="w-full px-4 py-3 rounded-lg border dark:bg-gray-800 dark:border-gray-700"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Dosage</label>
          <input
            type="text"
            value={form.dosage}
            onChange={(e) => setForm({ ...form, dosage: e.target.value })}
            placeholder="2000 UI, 1000mg..."
            className="w-full px-4 py-3 rounded-lg border dark:bg-gray-800 dark:border-gray-700"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Fréquence</label>
            <select
              value={form.frequency}
              onChange={(e) => setForm({ ...form, frequency: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border dark:bg-gray-800 dark:border-gray-700"
            >
              <option value="daily">Quotidien</option>
              <option value="weekly">Hebdomadaire</option>
              <option value="as-needed">Si besoin</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Moment</label>
            <select
              value={form.timeOfDay}
              onChange={(e) => setForm({ ...form, timeOfDay: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border dark:bg-gray-800 dark:border-gray-700"
            >
              <option value="morning">🌅 Matin</option>
              <option value="noon">☀️ Midi</option>
              <option value="evening">🌙 Soir</option>
              <option value="with-meal">🍽️ Avec repas</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Lien d'achat</label>
          <input
            type="url"
            value={form.purchaseUrl}
            onChange={(e) => setForm({ ...form, purchaseUrl: e.target.value })}
            placeholder="https://amazon.fr/..."
            className="w-full px-4 py-3 rounded-lg border dark:bg-gray-800 dark:border-gray-700"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Notes</label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="Notes personnelles..."
            rows={3}
            className="w-full px-4 py-3 rounded-lg border dark:bg-gray-800 dark:border-gray-700"
          />
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 px-4 py-3 rounded-lg border dark:border-gray-700"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-4 py-3 rounded-lg bg-blue-500 text-white font-medium disabled:opacity-50"
          >
            {loading ? "..." : "Ajouter"}
          </button>
        </div>
      </form>
    </div>
  )
}
