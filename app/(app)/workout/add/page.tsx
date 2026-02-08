"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

const workoutTypes = [
  { value: "CARDIO", label: "Cardio", emoji: "🏃", calories: 400 },
  { value: "STRENGTH", label: "Musculation", emoji: "🏋️", calories: 300 },
  { value: "HIIT", label: "HIIT", emoji: "🔥", calories: 500 },
  { value: "YOGA", label: "Yoga", emoji: "🧘", calories: 150 },
  { value: "WALKING", label: "Marche", emoji: "🚶", calories: 200 },
  { value: "RUNNING", label: "Course", emoji: "🏃‍♂️", calories: 450 },
  { value: "CYCLING", label: "Vélo", emoji: "🚴", calories: 350 },
  { value: "SWIMMING", label: "Natation", emoji: "🏊", calories: 400 },
  { value: "FLEXIBILITY", label: "Étirements", emoji: "🤸", calories: 100 },
  { value: "OTHER", label: "Autre", emoji: "💪", calories: 250 },
]

const durations = [15, 20, 30, 45, 60, 90]

export default function AddWorkoutPage() {
  const router = useRouter()
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [duration, setDuration] = useState(30)
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const selectedWorkout = workoutTypes.find(w => w.value === selectedType)
  const estimatedCalories = selectedWorkout 
    ? Math.round((selectedWorkout.calories / 60) * duration)
    : 0

  const handleSubmit = async () => {
    if (!selectedType) {
      setError("Choisis un type d'entraînement")
      return
    }

    setLoading(true)
    setError("")

    const workoutName = name || selectedWorkout?.label || "Entraînement"

    try {
      const res = await fetch("/api/workouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: workoutName,
          type: selectedType,
          duration,
          calories: estimatedCalories,
        })
      })

      if (!res.ok) throw new Error("Erreur")

      router.push("/workout")
    } catch (e) {
      setError("Erreur lors de l'enregistrement")
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/workout" className="text-2xl">←</Link>
        <h1 className="text-2xl font-bold text-gray-800">
          Ajouter un entraînement 💪
        </h1>
      </div>

      {/* Type selection */}
      <div>
        <h2 className="text-sm font-semibold text-gray-600 mb-3">Type d'entraînement</h2>
        <div className="grid grid-cols-2 gap-2">
          {workoutTypes.map(type => (
            <button
              key={type.value}
              onClick={() => setSelectedType(type.value)}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                selectedType === type.value
                  ? "border-emerald-500 bg-emerald-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <span className="text-2xl">{type.emoji}</span>
              <p className="font-medium text-gray-800 mt-1">{type.label}</p>
              <p className="text-xs text-gray-500">~{type.calories} kcal/h</p>
            </button>
          ))}
        </div>
      </div>

      {/* Duration */}
      <div>
        <h2 className="text-sm font-semibold text-gray-600 mb-3">Durée</h2>
        <div className="flex flex-wrap gap-2">
          {durations.map(d => (
            <button
              key={d}
              onClick={() => setDuration(d)}
              className={`px-4 py-2 rounded-xl font-medium transition-all ${
                duration === d
                  ? "bg-emerald-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {d} min
            </button>
          ))}
        </div>
      </div>

      {/* Name (optional) */}
      <div>
        <h2 className="text-sm font-semibold text-gray-600 mb-3">Nom (optionnel)</h2>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder={selectedWorkout?.label || "Ex: Séance du matin"}
          className="w-full p-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none"
        />
      </div>

      {/* Estimated calories */}
      {selectedType && (
        <div className="bg-emerald-50 rounded-xl p-4 text-center">
          <p className="text-sm text-emerald-600">Calories estimées</p>
          <p className="text-3xl font-bold text-emerald-700">-{estimatedCalories} kcal</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="text-red-500 text-center text-sm">{error}</p>
      )}

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={loading || !selectedType}
        className="w-full bg-emerald-500 text-white py-4 rounded-xl font-semibold text-lg hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? "Enregistrement..." : "✓ Enregistrer l'entraînement"}
      </button>
    </div>
  )
}
