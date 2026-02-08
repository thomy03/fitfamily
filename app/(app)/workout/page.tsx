"use client"

import { useState, useEffect } from "react"
import Link from "next/link"

type Workout = {
  id: string
  name: string
  type: string
  duration: number
  calories: number | null
  date: string
  completed: boolean
}

const workoutTypeEmoji: Record<string, string> = {
  CARDIO: "🏃",
  STRENGTH: "🏋️",
  FLEXIBILITY: "🧘",
  HIIT: "🔥",
  YOGA: "🧘‍♀️",
  WALKING: "🚶",
  RUNNING: "🏃‍♂️",
  CYCLING: "🚴",
  SWIMMING: "🏊",
  OTHER: "💪",
}

const workoutTypeLabel: Record<string, string> = {
  CARDIO: "Cardio",
  STRENGTH: "Musculation",
  FLEXIBILITY: "Étirements",
  HIIT: "HIIT",
  YOGA: "Yoga",
  WALKING: "Marche",
  RUNNING: "Course",
  CYCLING: "Vélo",
  SWIMMING: "Natation",
  OTHER: "Autre",
}

export default function WorkoutPage() {
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [stats, setStats] = useState({ todayCalories: 0, todayDuration: 0, todayCount: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/workouts")
      .then(res => res.json())
      .then(data => {
        setWorkouts(data.workouts || [])
        setStats(data.stats || { todayCalories: 0, todayDuration: 0, todayCount: 0 })
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  // Group workouts by date
  const workoutsByDate = workouts.reduce((acc, workout) => {
    const date = new Date(workout.date).toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long"
    })
    if (!acc[date]) acc[date] = []
    acc[date].push(workout)
    return acc
  }, {} as Record<string, Workout[]>)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">
          Mes entraînements 💪
        </h1>
        <Link 
          href="/workout/add"
          className="bg-emerald-500 text-white px-4 py-2 rounded-xl font-semibold text-sm hover:bg-emerald-600 transition-colors"
        >
          + Ajouter
        </Link>
      </div>

      {/* Stats du jour */}
      <div className="bg-gradient-to-r from-emerald-500 to-green-500 rounded-2xl p-5 text-white">
        <p className="text-emerald-100 text-sm">Calories brûlées aujourd'hui</p>
        <p className="text-4xl font-bold mt-1">{stats.todayCalories} kcal</p>
        <div className="flex gap-4 mt-3 text-sm">
          <span>⏱️ {stats.todayDuration} min</span>
          <span>🎯 {stats.todayCount} séance{stats.todayCount > 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Liste des workouts */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Chargement...</div>
      ) : workouts.length === 0 ? (
        <div className="text-center py-12">
          <span className="text-6xl">🏋️</span>
          <p className="mt-4 text-gray-500">Aucun entraînement enregistré</p>
          <Link 
            href="/workout/add"
            className="inline-block mt-4 bg-emerald-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-emerald-600 transition-colors"
          >
            Ajouter mon premier entraînement
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(workoutsByDate).map(([date, dateWorkouts]) => (
            <div key={date}>
              <h2 className="text-sm font-semibold text-gray-500 mb-2 capitalize">{date}</h2>
              <div className="space-y-2">
                {dateWorkouts.map(workout => (
                  <div 
                    key={workout.id}
                    className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{workoutTypeEmoji[workout.type] || "💪"}</span>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800">{workout.name}</h3>
                        <p className="text-sm text-gray-500">
                          {workoutTypeLabel[workout.type] || workout.type} • {workout.duration} min
                        </p>
                      </div>
                      {workout.calories && (
                        <div className="text-right">
                          <p className="font-bold text-emerald-600">-{workout.calories}</p>
                          <p className="text-xs text-gray-400">kcal</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
