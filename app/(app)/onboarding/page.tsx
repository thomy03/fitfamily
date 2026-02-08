"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

type Step = 1 | 2 | 3

const GOALS = [
  { id: "GENERAL_HEALTH", label: "🏃 Santé générale", desc: "Rester en forme" },
  { id: "WEIGHT_LOSS", label: "⚖️ Perte de poids", desc: "Perdre du gras" },
  { id: "MUSCLE_GAIN", label: "💪 Prise de muscle", desc: "Gagner en force" },
  { id: "ENERGY", label: "⚡ Plus d'énergie", desc: "Combattre la fatigue" },
  { id: "LONGEVITY", label: "🧬 Longévité", desc: "Anti-âge, rajeunissement cellulaire" },
  { id: "COGNITIVE", label: "🧠 Cognition", desc: "Mémoire, concentration" },
  { id: "SLEEP", label: "😴 Meilleur sommeil", desc: "Dormir mieux" },
  { id: "STRESS", label: "🧘 Réduire le stress", desc: "Calme et sérénité" },
]

const DIETS = [
  { id: "OMNIVORE", label: "🍖 Omnivore" },
  { id: "VEGETARIAN", label: "🥗 Végétarien" },
  { id: "VEGAN", label: "🌱 Vegan" },
  { id: "KETO", label: "🥑 Keto/Low-carb" },
  { id: "MEDITERRANEAN", label: "🫒 Méditerranéen" },
  { id: "INTERMITTENT_FASTING", label: "⏰ Jeûne intermittent" },
]

const ACTIVITY_LEVELS = [
  { id: "SEDENTARY", label: "🪑 Sédentaire", desc: "Peu ou pas d'exercice" },
  { id: "LIGHT", label: "🚶 Léger", desc: "1-2x/semaine" },
  { id: "MODERATE", label: "🏃 Modéré", desc: "3-4x/semaine" },
  { id: "ACTIVE", label: "💪 Actif", desc: "5-6x/semaine" },
  { id: "VERY_ACTIVE", label: "🏋️ Très actif", desc: "Tous les jours" },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>(1)
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  
  // Step 1 - Required
  const [gender, setGender] = useState("")
  const [birthYear, setBirthYear] = useState("")
  const [height, setHeight] = useState("")
  const [weight, setWeight] = useState("")
  
  // Step 2 - Optional goals
  const [primaryGoal, setPrimaryGoal] = useState("")
  const [activityLevel, setActivityLevel] = useState("MODERATE")
  const [dietType, setDietType] = useState("OMNIVORE")
  
  // Step 3 - Optional health data
  const [monthlyBudget, setMonthlyBudget] = useState("")
  const [cholesterolTotal, setCholesterolTotal] = useState("")
  const [vitaminD, setVitaminD] = useState("")
  const [sleepHours, setSleepHours] = useState("")
  const [stressLevel, setStressLevel] = useState("MODERATE")

  const isStep1Valid = gender && birthYear && height && weight

  const handleSubmit = async () => {
    setLoading(true)
    try {
      // Update basic profile
      await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gender,
          birthDate: new Date(parseInt(birthYear), 0, 1).toISOString(),
          height: parseFloat(height),
          weight: parseFloat(weight),
          activityLevel
        })
      })

      // Create/update health profile
      await fetch("/api/onboarding/form", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          primaryGoal: primaryGoal || "GENERAL_HEALTH",
          dietType,
          monthlyBudget: monthlyBudget ? parseInt(monthlyBudget) : null,
          cholesterolTotal: cholesterolTotal ? parseFloat(cholesterolTotal) : null,
          vitaminD: vitaminD ? parseFloat(vitaminD) : null,
          sleepHours: sleepHours ? parseFloat(sleepHours) : null,
          stressLevel
        })
      })

      setGenerating(true)

      // Generate recommendations
      await fetch("/api/recommendations", { method: "POST" })

      setTimeout(() => {
        router.push("/dashboard")
      }, 1500)
    } catch (error) {
      console.error(error)
      alert("Erreur lors de la sauvegarde")
    } finally {
      setLoading(false)
    }
  }

  if (generating) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] p-4">
        <div className="text-6xl mb-4 animate-pulse">🧬</div>
        <h2 className="text-xl font-bold mb-2">Profil créé !</h2>
        <p className="text-gray-500 text-center">Je génère tes recommandations personnalisées...</p>
        <div className="mt-4 flex gap-2">
          <div className="w-3 h-3 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
          <div className="w-3 h-3 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
          <div className="w-3 h-3 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 max-w-lg mx-auto">
      {/* Progress */}
      <div className="flex gap-2 mb-6">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`flex-1 h-2 rounded-full ${
              s <= step ? "bg-emerald-500" : "bg-gray-200 dark:bg-gray-700"
            }`}
          />
        ))}
      </div>

      {/* Step 1: Required Info */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="text-center mb-8">
            <div className="text-5xl mb-3">👤</div>
            <h1 className="text-2xl font-bold">Informations de base</h1>
            <p className="text-gray-500 text-sm mt-1">Ces infos sont nécessaires</p>
          </div>

          {/* Gender */}
          <div>
            <label className="block text-sm font-medium mb-2">Sexe *</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: "MALE", label: "👨 Homme" },
                { id: "FEMALE", label: "👩 Femme" }
              ].map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setGender(g.id)}
                  className={`p-4 rounded-xl border-2 text-center transition-all ${
                    gender === g.id
                      ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30"
                      : "border-gray-200 dark:border-gray-700"
                  }`}
                >
                  <span className="text-lg">{g.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Birth Year */}
          <div>
            <label className="block text-sm font-medium mb-2">Année de naissance *</label>
            <input
              type="number"
              value={birthYear}
              onChange={(e) => setBirthYear(e.target.value)}
              placeholder="1986"
              min="1920"
              max="2010"
              className="w-full px-4 py-3 rounded-xl border dark:bg-gray-800 dark:border-gray-700 text-lg"
            />
          </div>

          {/* Height & Weight */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Taille (cm) *</label>
              <input
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                placeholder="175"
                className="w-full px-4 py-3 rounded-xl border dark:bg-gray-800 dark:border-gray-700 text-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Poids (kg) *</label>
              <input
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="75"
                className="w-full px-4 py-3 rounded-xl border dark:bg-gray-800 dark:border-gray-700 text-lg"
              />
            </div>
          </div>

          <button
            onClick={() => setStep(2)}
            disabled={!isStep1Valid}
            className="w-full py-4 rounded-xl bg-emerald-500 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continuer →
          </button>
        </div>
      )}

      {/* Step 2: Goals */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="text-center mb-6">
            <div className="text-5xl mb-3">🎯</div>
            <h1 className="text-2xl font-bold">Ton objectif</h1>
            <p className="text-gray-500 text-sm mt-1">Optionnel mais recommandé</p>
          </div>

          {/* Primary Goal */}
          <div>
            <label className="block text-sm font-medium mb-2">Objectif principal</label>
            <div className="grid grid-cols-2 gap-2">
              {GOALS.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setPrimaryGoal(g.id)}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${
                    primaryGoal === g.id
                      ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30"
                      : "border-gray-200 dark:border-gray-700"
                  }`}
                >
                  <div className="text-sm font-medium">{g.label}</div>
                  <div className="text-xs text-gray-500">{g.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Activity Level */}
          <div>
            <label className="block text-sm font-medium mb-2">Niveau d'activité</label>
            <select
              value={activityLevel}
              onChange={(e) => setActivityLevel(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border dark:bg-gray-800 dark:border-gray-700"
            >
              {ACTIVITY_LEVELS.map((a) => (
                <option key={a.id} value={a.id}>{a.label} - {a.desc}</option>
              ))}
            </select>
          </div>

          {/* Diet */}
          <div>
            <label className="block text-sm font-medium mb-2">Type d'alimentation</label>
            <select
              value={dietType}
              onChange={(e) => setDietType(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border dark:bg-gray-800 dark:border-gray-700"
            >
              {DIETS.map((d) => (
                <option key={d.id} value={d.id}>{d.label}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep(1)}
              className="flex-1 py-4 rounded-xl border dark:border-gray-700"
            >
              ← Retour
            </button>
            <button
              onClick={() => setStep(3)}
              className="flex-1 py-4 rounded-xl bg-emerald-500 text-white font-semibold"
            >
              Continuer →
            </button>
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-3 text-emerald-600 dark:text-emerald-400 text-sm"
          >
            Passer et terminer
          </button>
        </div>
      )}

      {/* Step 3: Advanced (Optional) */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="text-center mb-6">
            <div className="text-5xl mb-3">🔬</div>
            <h1 className="text-2xl font-bold">Données santé</h1>
            <p className="text-gray-500 text-sm mt-1">100% optionnel - pour des recos plus précises</p>
          </div>

          {/* Budget */}
          <div>
            <label className="block text-sm font-medium mb-2">💰 Budget compléments (€/mois)</label>
            <input
              type="number"
              value={monthlyBudget}
              onChange={(e) => setMonthlyBudget(e.target.value)}
              placeholder="50"
              className="w-full px-4 py-3 rounded-xl border dark:bg-gray-800 dark:border-gray-700"
            />
          </div>

          {/* Sleep */}
          <div>
            <label className="block text-sm font-medium mb-2">😴 Heures de sommeil (moyenne)</label>
            <input
              type="number"
              value={sleepHours}
              onChange={(e) => setSleepHours(e.target.value)}
              placeholder="7"
              step="0.5"
              className="w-full px-4 py-3 rounded-xl border dark:bg-gray-800 dark:border-gray-700"
            />
          </div>

          {/* Stress */}
          <div>
            <label className="block text-sm font-medium mb-2">🧘 Niveau de stress</label>
            <select
              value={stressLevel}
              onChange={(e) => setStressLevel(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border dark:bg-gray-800 dark:border-gray-700"
            >
              <option value="LOW">😌 Faible</option>
              <option value="MODERATE">😐 Modéré</option>
              <option value="HIGH">😰 Élevé</option>
              <option value="VERY_HIGH">🤯 Très élevé</option>
            </select>
          </div>

          {/* Blood markers */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
            <h3 className="font-medium mb-3">🩸 Bilans sanguins (si connus)</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Cholestérol total</label>
                <input
                  type="number"
                  value={cholesterolTotal}
                  onChange={(e) => setCholesterolTotal(e.target.value)}
                  placeholder="200"
                  className="w-full px-3 py-2 rounded-lg border dark:bg-gray-700 dark:border-gray-600 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Vitamine D (ng/mL)</label>
                <input
                  type="number"
                  value={vitaminD}
                  onChange={(e) => setVitaminD(e.target.value)}
                  placeholder="30"
                  className="w-full px-3 py-2 rounded-lg border dark:bg-gray-700 dark:border-gray-600 text-sm"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep(2)}
              className="flex-1 py-4 rounded-xl border dark:border-gray-700"
            >
              ← Retour
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 py-4 rounded-xl bg-emerald-500 text-white font-semibold disabled:opacity-50"
            >
              {loading ? "..." : "Terminer ✓"}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
