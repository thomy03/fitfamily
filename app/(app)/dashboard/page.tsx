"use client"

import { useSession } from "next-auth/react"
import { useState, useEffect } from "react"
import Link from "next/link"

type Profile = {
  height: number | null
  weight: number | null
  bmi: number | null
  bmr: number | null
  tdee: number | null
  dailyCalories: number | null
  goal: string
}

type DayStats = {
  caloriesEaten: number
  caloriesBurned: number
  workoutsCompleted: number
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [stats, setStats] = useState<DayStats>({ caloriesEaten: 0, caloriesBurned: 0, workoutsCompleted: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileRes, statsRes] = await Promise.all([
          fetch("/api/profile"),
          fetch("/api/stats/today")
        ])
        
        if (profileRes.ok) {
          const data = await profileRes.json()
          setProfile(data.profile)
        }
        
        if (statsRes.ok) {
          const data = await statsRes.json()
          setStats(data)
        }
      } catch (error) {
        console.error("Error fetching data:", error)
      }
      setLoading(false)
    }
    
    if (session) fetchData()
  }, [session])

  const caloriesRemaining = (profile?.dailyCalories || 2000) - stats.caloriesEaten + stats.caloriesBurned
  const caloriesPercent = Math.min(100, (stats.caloriesEaten / (profile?.dailyCalories || 2000)) * 100)

  return (
    <div className="space-y-6 animate-slideUp">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-800">
          Salut {session?.user?.name?.split(" ")[0] || "Champion"} ! 💪
        </h1>
        <p className="text-gray-500">Prêt pour une journée en forme ?</p>
      </div>

      {/* Calories Card */}
      <div className="card bg-gradient-to-br from-emerald-500 to-green-600 text-white">
        <div className="text-center">
          <p className="text-sm opacity-80">Calories restantes</p>
          <p className="text-5xl font-bold my-2">{Math.max(0, caloriesRemaining)}</p>
          <div className="flex justify-center gap-8 text-sm mt-4">
            <div>
              <p className="opacity-70">Objectif</p>
              <p className="font-bold">{profile?.dailyCalories || 2000}</p>
            </div>
            <div>
              <p className="opacity-70">Mangé</p>
              <p className="font-bold">{stats.caloriesEaten}</p>
            </div>
            <div>
              <p className="opacity-70">Brûlé</p>
              <p className="font-bold text-yellow-300">+{stats.caloriesBurned}</p>
            </div>
          </div>
          {/* Progress bar */}
          <div className="mt-4 bg-white/20 rounded-full h-2">
            <div 
              className="bg-white rounded-full h-2 transition-all"
              style={{ width: `${caloriesPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/meals/add" className="card text-center hover:shadow-md transition-shadow">
          <div className="text-4xl mb-2">🍽️</div>
          <p className="font-medium text-gray-800">Ajouter repas</p>
          <p className="text-xs text-gray-500">Photo ou manuel</p>
        </Link>
        
        <Link href="/workout" className="card text-center hover:shadow-md transition-shadow">
          <div className="text-4xl mb-2">🏋️</div>
          <p className="font-medium text-gray-800">Entraînement</p>
          <p className="text-xs text-gray-500">{stats.workoutsCompleted} fait(s) auj.</p>
        </Link>
      </div>

      {/* Profile Setup Prompt */}
      {!loading && (!profile?.height || !profile?.weight) && (
        <Link href="/profile/setup" className="card border-2 border-dashed border-emerald-300 bg-emerald-50 block">
          <div className="flex items-center gap-3">
            <div className="text-3xl">⚙️</div>
            <div>
              <p className="font-medium text-emerald-800">Configure ton profil</p>
              <p className="text-sm text-emerald-600">Taille, poids, objectifs...</p>
            </div>
          </div>
        </Link>
      )}

      {/* Stats */}
      {profile && (
        <div className="grid grid-cols-3 gap-3">
          <div className="card text-center">
            <p className="text-2xl font-bold text-gray-800">{profile.weight || "?"}</p>
            <p className="text-xs text-gray-500">kg</p>
          </div>
          <div className="card text-center">
            <p className="text-2xl font-bold text-gray-800">{profile.bmi?.toFixed(1) || "?"}</p>
            <p className="text-xs text-gray-500">IMC</p>
          </div>
          <div className="card text-center">
            <p className="text-2xl font-bold text-emerald-600">{profile.goal === "LOSE" ? "📉" : profile.goal === "GAIN" ? "📈" : "⚖️"}</p>
            <p className="text-xs text-gray-500">{profile.goal === "LOSE" ? "Perdre" : profile.goal === "GAIN" ? "Prendre" : "Maintenir"}</p>
          </div>
        </div>
      )}
    </div>
  )
}
