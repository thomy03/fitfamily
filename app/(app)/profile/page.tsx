"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { signOut } from "next-auth/react"

type Profile = {
  name: string | null
  email: string
  avatar: string | null
  profile: {
    height: number | null
    weight: number | null
    gender: string | null
    goal: string | null
    dailyCalories: number | null
    bmi: number | null
  } | null
}

const goalLabels: Record<string, string> = {
  LOSE: "Perdre du poids",
  MAINTAIN: "Maintenir",
  GAIN: "Prendre du muscle",
}

const genderLabels: Record<string, string> = {
  MALE: "Homme",
  FEMALE: "Femme",
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/profile")
      .then(res => res.json())
      .then(data => {
        setProfile(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-gray-400">Chargement...</div>
      </div>
    )
  }

  const hasProfile = profile?.profile?.height && profile?.profile?.weight

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="text-6xl mb-2">{profile?.avatar || "👤"}</div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
          {profile?.name || "Mon profil"}
        </h1>
        <p className="text-gray-500 text-sm">{profile?.email}</p>
      </div>

      {/* Stats */}
      {hasProfile ? (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-emerald-600">{profile?.profile?.weight}</p>
            <p className="text-xs text-gray-500">kg</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-emerald-600">{profile?.profile?.height}</p>
            <p className="text-xs text-gray-500">cm</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-emerald-600">
              {profile?.profile?.bmi?.toFixed(1) || "--"}
            </p>
            <p className="text-xs text-gray-500">IMC</p>
          </div>
        </div>
      ) : (
        <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-xl p-4 text-center">
          <p className="text-amber-700 dark:text-amber-300">Profil non configuré</p>
          <Link 
            href="/profile/setup"
            className="inline-block mt-2 bg-amber-500 text-white px-4 py-2 rounded-lg text-sm font-semibold"
          >
            Configurer mon profil
          </Link>
        </div>
      )}

      {/* Infos */}
      {hasProfile && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-500">Genre</span>
            <span className="font-medium">{genderLabels[profile?.profile?.gender || ""] || "--"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Objectif</span>
            <span className="font-medium">{goalLabels[profile?.profile?.goal || ""] || "--"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Calories/jour</span>
            <span className="font-medium text-emerald-600">{profile?.profile?.dailyCalories || "--"} kcal</span>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="space-y-2">
        <Link 
          href="/profile/setup"
          className="block w-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 py-3 rounded-xl text-center font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          ✏️ Modifier mon profil
        </Link>
        <Link 
          href="/settings"
          className="block w-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 py-3 rounded-xl text-center font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          ⚙️ Paramètres & API
        </Link>
        <Link 
          href="/workout"
          className="block w-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 py-3 rounded-xl text-center font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          💪 Entraînements
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="block w-full bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 py-3 rounded-xl text-center font-medium hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
        >
          🚪 Se déconnecter
        </button>
      </div>
    </div>
  )
}
