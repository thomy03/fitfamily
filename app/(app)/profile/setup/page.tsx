"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function ProfileSetupPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState({
    gender: "",
    birthDate: "",
    height: "",
    weight: "",
    activityLevel: "MODERATE",
    goal: "MAINTAIN",
    targetWeight: ""
  })

  const handleSave = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          height: parseFloat(data.height),
          weight: parseFloat(data.weight),
          targetWeight: data.targetWeight ? parseFloat(data.targetWeight) : null
        })
      })

      if (res.ok) {
        router.push("/dashboard")
      }
    } catch (error) {
      console.error("Save error:", error)
    }
    setLoading(false)
  }

  return (
    <div className="space-y-6 animate-slideUp">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-800">Configure ton profil</h1>
        <p className="text-gray-500">Étape {step}/4</p>
      </div>

      {step === 1 && (
        <div className="space-y-4">
          <p className="text-lg font-medium text-gray-700">Tu es...</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: "MALE", emoji: "👨", label: "Un homme" },
              { value: "FEMALE", emoji: "👩", label: "Une femme" },
            ].map(g => (
              <button
                key={g.value}
                onClick={() => { setData({...data, gender: g.value}); setStep(2) }}
                className={`card text-center py-6 ${data.gender === g.value ? "ring-2 ring-emerald-500" : ""}`}
              >
                <div className="text-4xl mb-2">{g.emoji}</div>
                <p className="font-medium">{g.label}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <p className="text-lg font-medium text-gray-700">Tes mensurations</p>
          
          <div>
            <label className="text-sm text-gray-500">Date de naissance</label>
            <input
              type="date"
              value={data.birthDate}
              onChange={(e) => setData({...data, birthDate: e.target.value})}
              className="input mt-1"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-gray-500">Taille (cm)</label>
              <input
                type="number"
                placeholder="175"
                value={data.height}
                onChange={(e) => setData({...data, height: e.target.value})}
                className="input mt-1"
              />
            </div>
            <div>
              <label className="text-sm text-gray-500">Poids (kg)</label>
              <input
                type="number"
                placeholder="70"
                value={data.weight}
                onChange={(e) => setData({...data, weight: e.target.value})}
                className="input mt-1"
              />
            </div>
          </div>
          
          <button 
            onClick={() => setStep(3)}
            disabled={!data.birthDate || !data.height || !data.weight}
            className="btn btn-primary w-full py-3"
          >
            Continuer
          </button>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <p className="text-lg font-medium text-gray-700">Ton niveau d'activité</p>
          
          {[
            { value: "SEDENTARY", emoji: "🛋️", label: "Sédentaire", desc: "Peu ou pas d'exercice" },
            { value: "LIGHT", emoji: "🚶", label: "Légèrement actif", desc: "1-3 jours/semaine" },
            { value: "MODERATE", emoji: "🏃", label: "Modérément actif", desc: "3-5 jours/semaine" },
            { value: "ACTIVE", emoji: "💪", label: "Très actif", desc: "6-7 jours/semaine" },
          ].map(level => (
            <button
              key={level.value}
              onClick={() => { setData({...data, activityLevel: level.value}); setStep(4) }}
              className={`card w-full text-left flex items-center gap-4 ${data.activityLevel === level.value ? "ring-2 ring-emerald-500" : ""}`}
            >
              <div className="text-3xl">{level.emoji}</div>
              <div>
                <p className="font-medium">{level.label}</p>
                <p className="text-sm text-gray-500">{level.desc}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {step === 4 && (
        <div className="space-y-4">
          <p className="text-lg font-medium text-gray-700">Ton objectif</p>
          
          {[
            { value: "LOSE", emoji: "📉", label: "Perdre du poids", desc: "-500 kcal/jour" },
            { value: "MAINTAIN", emoji: "⚖️", label: "Maintenir", desc: "Garder mon poids" },
            { value: "GAIN", emoji: "📈", label: "Prendre du muscle", desc: "+300 kcal/jour" },
          ].map(goal => (
            <button
              key={goal.value}
              onClick={() => setData({...data, goal: goal.value})}
              className={`card w-full text-left flex items-center gap-4 ${data.goal === goal.value ? "ring-2 ring-emerald-500" : ""}`}
            >
              <div className="text-3xl">{goal.emoji}</div>
              <div>
                <p className="font-medium">{goal.label}</p>
                <p className="text-sm text-gray-500">{goal.desc}</p>
              </div>
            </button>
          ))}
          
          <button 
            onClick={handleSave}
            disabled={loading}
            className="btn btn-primary w-full py-3 mt-4"
          >
            {loading ? "Enregistrement..." : "🎯 Commencer !"}
          </button>
        </div>
      )}
    </div>
  )
}
