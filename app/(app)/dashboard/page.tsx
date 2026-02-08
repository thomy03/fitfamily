"use client"

import { useState, useEffect } from "react"
import Link from "next/link"

interface Stats {
  calories: { consumed: number; target: number }
  protein: number
  water: number
  steps: number
  workoutsThisWeek: number
  supplementsTakenToday: number
  supplementsTotal: number
}

interface HealthProfile {
  primaryGoal: string
  onboardingCompleted: boolean
}

interface Recommendation {
  id: string
  type: string
  title: string
  description: string
  priority: number
  supplementName?: string
  dosage?: string
}

const goalLabels: Record<string, string> = {
  GENERAL_HEALTH: "🏃 Santé Générale",
  WEIGHT_LOSS: "⚖️ Perte de Poids",
  MUSCLE_GAIN: "💪 Prise de Muscle",
  ENERGY: "⚡ Énergie",
  LONGEVITY: "🧬 Longévité",
  COGNITIVE: "🧠 Cognition",
  SLEEP: "😴 Sommeil",
  STRESS: "🧘 Anti-Stress",
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [healthProfile, setHealthProfile] = useState<HealthProfile | null>(null)
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState("")

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Fetch stats
      const statsRes = await fetch("/api/stats/today")
      const statsData = await statsRes.json()
      setStats(statsData)
      setUserName(statsData.userName || "")

      // Fetch health profile
      const profileRes = await fetch("/api/onboarding")
      const profileData = await profileRes.json()
      setHealthProfile(profileData.healthProfile)

      // Fetch recommendations
      const recsRes = await fetch("/api/recommendations")
      const recsData = await recsRes.json()
      setRecommendations(recsData.recommendations || [])
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-gray-400">Chargement...</div>
      </div>
    )
  }

  const supplementRecs = recommendations.filter(r => r.type === "SUPPLEMENT").slice(0, 3)

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
          Salut {userName || ""} 👋
        </h1>
        {healthProfile?.onboardingCompleted && (
          <p className="text-emerald-600 dark:text-emerald-400 text-sm">
            {goalLabels[healthProfile.primaryGoal] || "Mode Santé"}
          </p>
        )}
      </div>

      {/* Onboarding CTA if not completed */}
      {!healthProfile?.onboardingCompleted && (
        <Link href="/onboarding" className="block">
          <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl p-4 text-white">
            <div className="flex items-center gap-3">
              <div className="text-3xl">🧬</div>
              <div className="flex-1">
                <h3 className="font-bold">Crée ton profil santé</h3>
                <p className="text-sm opacity-90">Reçois des recommandations personnalisées</p>
              </div>
              <div className="text-2xl">→</div>
            </div>
          </div>
        </Link>
      )}

      {/* Today's Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <p className="text-xs text-gray-500 mb-1">Calories</p>
          <p className="text-2xl font-bold text-gray-800 dark:text-white">
            {stats?.calories?.consumed || 0}
            <span className="text-sm text-gray-400">/{stats?.calories?.target || 2000}</span>
          </p>
          <div className="mt-2 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-emerald-500 rounded-full"
              style={{ width: `${Math.min(100, ((stats?.calories?.consumed || 0) / (stats?.calories?.target || 2000)) * 100)}%` }}
            />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <p className="text-xs text-gray-500 mb-1">Compléments</p>
          <p className="text-2xl font-bold text-emerald-600">
            {stats?.supplementsTakenToday || 0}
            <span className="text-sm text-gray-400">/{stats?.supplementsTotal || 0}</span>
          </p>
          <Link href="/supplements" className="text-xs text-emerald-500 hover:underline">
            Voir tout →
          </Link>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <p className="text-xs text-gray-500 mb-1">Protéines</p>
          <p className="text-2xl font-bold text-blue-600">{stats?.protein || 0}g</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <p className="text-xs text-gray-500 mb-1">Entraînements</p>
          <p className="text-2xl font-bold text-purple-600">{stats?.workoutsThisWeek || 0}/sem</p>
        </div>
      </div>

      {/* AI Recommendations */}
      {healthProfile?.onboardingCompleted && supplementRecs.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-gray-800 dark:text-white">💊 Compléments recommandés</h3>
            <Link href="/supplements" className="text-xs text-emerald-500">Voir tout</Link>
          </div>
          <div className="space-y-2">
            {supplementRecs.map(rec => (
              <div key={rec.id} className="flex items-center gap-3 p-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg">
                <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-white text-sm">
                  {rec.priority}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">{rec.supplementName || rec.title}</p>
                  <p className="text-xs text-gray-500">{rec.dosage}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/meals/add" className="bg-orange-50 dark:bg-orange-900/30 rounded-xl p-4 text-center hover:bg-orange-100 dark:hover:bg-orange-900/50 transition-colors">
          <div className="text-3xl mb-1">📸</div>
          <p className="text-sm font-medium text-orange-700 dark:text-orange-300">Scanner repas</p>
        </Link>
        <Link href="/workout/add" className="bg-purple-50 dark:bg-purple-900/30 rounded-xl p-4 text-center hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors">
          <div className="text-3xl mb-1">🏋️</div>
          <p className="text-sm font-medium text-purple-700 dark:text-purple-300">Entraînement</p>
        </Link>
        <Link href="/chat" className="bg-blue-50 dark:bg-blue-900/30 rounded-xl p-4 text-center hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors">
          <div className="text-3xl mb-1">🤖</div>
          <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Parler à Jarvis</p>
        </Link>
        <Link href="/onboarding" className="bg-teal-50 dark:bg-teal-900/30 rounded-xl p-4 text-center hover:bg-teal-100 dark:hover:bg-teal-900/50 transition-colors">
          <div className="text-3xl mb-1">🧬</div>
          <p className="text-sm font-medium text-teal-700 dark:text-teal-300">Mon profil</p>
        </Link>
      </div>
    </div>
  )
}
