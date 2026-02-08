"use client"

import { useState, useEffect } from "react"
import Link from "next/link"

type Meal = {
  id: string
  name: string
  mealType: string
  calories: number | null
  protein: number | null
  carbs: number | null
  fat: number | null
  date: string
  imageUrl: string | null
}

const mealTypeEmoji: Record<string, string> = {
  BREAKFAST: "🌅",
  LUNCH: "☀️",
  DINNER: "🌙",
  SNACK: "🍎",
}

export default function MealsPage() {
  const [meals, setMeals] = useState<Meal[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/meals")
      .then(res => res.json())
      .then(data => {
        setMeals(data.meals || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  // Group meals by date
  const mealsByDate = meals.reduce((acc, meal) => {
    const date = new Date(meal.date).toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long"
    })
    if (!acc[date]) acc[date] = []
    acc[date].push(meal)
    return acc
  }, {} as Record<string, Meal[]>)

  const todayTotal = meals
    .filter(m => new Date(m.date).toDateString() === new Date().toDateString())
    .reduce((sum, m) => sum + (m.calories || 0), 0)

  return (
    <div className="space-y-6 animate-slideUp">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Mes repas 🍽️</h1>
        <Link href="/meals/add" className="btn btn-primary">
          + Ajouter
        </Link>
      </div>

      {/* Today's summary */}
      <div className="card bg-gradient-to-r from-emerald-500 to-green-600 text-white">
        <p className="text-sm opacity-80">Calories aujourd'hui</p>
        <p className="text-4xl font-bold">{todayTotal} kcal</p>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-pulse text-4xl">🍽️</div>
          <p className="text-gray-500 mt-2">Chargement...</p>
        </div>
      ) : meals.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🥗</div>
          <p className="text-gray-500">Aucun repas enregistré</p>
          <Link href="/meals/add" className="btn btn-primary mt-4 inline-block">
            Ajouter mon premier repas
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(mealsByDate).map(([date, dayMeals]) => (
            <div key={date}>
              <h2 className="text-sm font-medium text-gray-500 mb-2 capitalize">{date}</h2>
              <div className="space-y-2">
                {dayMeals.map(meal => (
                  <div key={meal.id} className="card flex items-center gap-3">
                    <div className="text-2xl">{mealTypeEmoji[meal.mealType] || "🍽️"}</div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">{meal.name}</p>
                      <p className="text-sm text-gray-500">
                        {meal.calories} kcal
                        {meal.protein && ` • ${meal.protein}g prot`}
                      </p>
                    </div>
                    {meal.imageUrl && (
                      <img 
                        src={meal.imageUrl} 
                        alt={meal.name}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    )}
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
