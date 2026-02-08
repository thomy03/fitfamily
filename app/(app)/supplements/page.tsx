"use client"

import { useState, useEffect } from "react"
import Link from "next/link"

interface Supplement {
  id: string
  name: string
  brand: string | null
  dosage: string | null
  frequency: string
  timeOfDay: string | null
  purchaseUrl: string | null
  notes: string | null
  isRecommended: boolean
  logs: { id: string; takenAt: string }[]
}

interface Recommendation {
  id: string
  supplementName: string
  dosage: string
  timing: string
  description: string
  monthlyPrice: number
  priority: number
  accepted: boolean
}

export default function SupplementsPage() {
  const [supplements, setSupplements] = useState<Supplement[]>([])
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [loading, setLoading] = useState(true)
  const [showRecs, setShowRecs] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [suppsRes, recsRes] = await Promise.all([
        fetch("/api/supplements"),
        fetch("/api/recommendations")
      ])
      
      const suppsData = await suppsRes.json()
      setSupplements(suppsData.supplements || [])

      const recsData = await recsRes.json()
      const suppRecs = (recsData.recommendations || [])
        .filter((r: any) => r.type === "SUPPLEMENT" && !r.accepted)
      setRecommendations(suppRecs)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const toggleTaken = async (id: string, taken: boolean) => {
    try {
      if (taken) {
        await fetch(`/api/supplements/${id}/log`, { method: "DELETE" })
      } else {
        await fetch(`/api/supplements/${id}/log`, { method: "POST" })
      }
      fetchData()
    } catch (error) {
      console.error(error)
    }
  }

  const acceptRecommendation = async (rec: Recommendation) => {
    try {
      // Create supplement from recommendation
      await fetch("/api/supplements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: rec.supplementName,
          dosage: rec.dosage,
          timeOfDay: rec.timing,
          notes: rec.description,
          isRecommended: true
        })
      })
      fetchData()
    } catch (error) {
      console.error(error)
    }
  }

  const deleteSupplement = async (id: string) => {
    if (!confirm("Supprimer ce complément ?")) return
    try {
      await fetch(`/api/supplements/${id}`, { method: "DELETE" })
      fetchData()
    } catch (error) {
      console.error(error)
    }
  }

  const takenCount = supplements.filter(s => s.logs.length > 0).length
  const totalCost = recommendations.reduce((sum, r) => sum + (r.monthlyPrice || 0), 0)

  if (loading) {
    return <div className="p-4 text-center">Chargement...</div>
  }

  return (
    <div className="p-4 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-bold">💊 Compléments</h1>
          <p className="text-sm text-gray-500">{takenCount}/{supplements.length} pris aujourd'hui</p>
        </div>
        <Link 
          href="/supplements/add"
          className="bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-emerald-600"
        >
          + Ajouter
        </Link>
      </div>

      {/* AI Recommendations */}
      {recommendations.length > 0 && showRecs && (
        <div className="mb-6 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30 rounded-xl p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-emerald-800 dark:text-emerald-200">
              🧬 Recommandés pour toi
            </h3>
            <button onClick={() => setShowRecs(false)} className="text-xs text-gray-500">
              Masquer
            </button>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
            Budget estimé: ~{totalCost}€/mois
          </p>
          <div className="space-y-2">
            {recommendations.slice(0, 5).map((rec) => (
              <div key={rec.id} className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 bg-emerald-500 text-white rounded-full text-xs flex items-center justify-center">
                        {rec.priority}
                      </span>
                      <span className="font-medium">{rec.supplementName}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{rec.dosage}</p>
                    <p className="text-xs text-gray-400 mt-1">{rec.description}</p>
                  </div>
                  <button
                    onClick={() => acceptRecommendation(rec)}
                    className="text-xs bg-emerald-500 text-white px-3 py-1 rounded-full hover:bg-emerald-600"
                  >
                    Ajouter
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* My Supplements */}
      {supplements.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-4xl mb-4">💊</p>
          <p>Aucun complément</p>
          <p className="text-sm">Ajoutez vos compléments ou acceptez les recommandations</p>
        </div>
      ) : (
        <div className="space-y-3">
          {supplements.map((supp) => {
            const takenToday = supp.logs.length > 0
            return (
              <div 
                key={supp.id} 
                className={`bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border-2 ${
                  takenToday ? "border-emerald-500" : "border-transparent"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg">{supp.name}</h3>
                      {supp.isRecommended && (
                        <span className="text-xs bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded">
                          🧬 IA
                        </span>
                      )}
                    </div>
                    {supp.brand && (
                      <p className="text-sm text-gray-500">{supp.brand}</p>
                    )}
                    <div className="flex flex-wrap gap-2 mt-2">
                      {supp.dosage && (
                        <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                          {supp.dosage}
                        </span>
                      )}
                      {supp.timeOfDay && (
                        <span className="text-xs bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-2 py-1 rounded">
                          {supp.timeOfDay === "morning" ? "🌅 Matin" : supp.timeOfDay === "evening" ? "🌙 Soir" : supp.timeOfDay}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => toggleTaken(supp.id, takenToday)}
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl transition-all ${
                      takenToday 
                        ? "bg-emerald-500 text-white" 
                        : "bg-gray-100 dark:bg-gray-700"
                    }`}
                  >
                    {takenToday ? "✓" : "○"}
                  </button>
                </div>

                <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                  {supp.purchaseUrl && (
                    <a
                      href={supp.purchaseUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-500 hover:underline"
                    >
                      🛒 Acheter
                    </a>
                  )}
                  <button
                    onClick={() => deleteSupplement(supp.id)}
                    className="text-xs text-red-500 hover:underline ml-auto"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
