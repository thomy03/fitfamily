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
  logs: { id: string; takenAt: string }[]
}

export default function SupplementsPage() {
  const [supplements, setSupplements] = useState<Supplement[]>([])
  const [loading, setLoading] = useState(true)

  const fetchSupplements = async () => {
    try {
      const res = await fetch("/api/supplements")
      const data = await res.json()
      setSupplements(data.supplements || [])
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSupplements()
  }, [])

  const toggleTaken = async (id: string, taken: boolean) => {
    try {
      if (taken) {
        await fetch(`/api/supplements/${id}/log`, { method: "DELETE" })
      } else {
        await fetch(`/api/supplements/${id}/log`, { method: "POST" })
      }
      fetchSupplements()
    } catch (error) {
      console.error(error)
    }
  }

  const deleteSupplement = async (id: string) => {
    if (!confirm("Supprimer ce complément ?")) return
    try {
      await fetch(`/api/supplements/${id}`, { method: "DELETE" })
      fetchSupplements()
    } catch (error) {
      console.error(error)
    }
  }

  if (loading) {
    return <div className="p-4 text-center">Chargement...</div>
  }

  return (
    <div className="p-4 max-w-lg mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">💊 Compléments</h1>
        <Link 
          href="/supplements/add"
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
        >
          + Ajouter
        </Link>
      </div>

      {supplements.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-4xl mb-4">💊</p>
          <p>Aucun complément</p>
          <p className="text-sm">Ajoutez vos compléments alimentaires</p>
        </div>
      ) : (
        <div className="space-y-3">
          {supplements.map((supp) => {
            const takenToday = supp.logs.length > 0
            return (
              <div 
                key={supp.id} 
                className={`bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border-2 ${
                  takenToday ? "border-green-500" : "border-transparent"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{supp.name}</h3>
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
                          {supp.timeOfDay}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleTaken(supp.id, takenToday)}
                      className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl transition-all ${
                        takenToday 
                          ? "bg-green-500 text-white" 
                          : "bg-gray-100 dark:bg-gray-700"
                      }`}
                    >
                      {takenToday ? "✓" : "○"}
                    </button>
                  </div>
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
