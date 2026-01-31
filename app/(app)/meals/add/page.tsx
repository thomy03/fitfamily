"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"

type MealAnalysis = {
  name: string
  description?: string
  calories: number
  protein: number
  carbs: number
  fat: number
  confidence: string
  items?: string[]
}

export default function AddMealPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<MealAnalysis | null>(null)
  const [mealType, setMealType] = useState("LUNCH")
  const [saving, setSaving] = useState(false)

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Preview
    const reader = new FileReader()
    reader.onload = async (e) => {
      const base64 = e.target?.result as string
      setImagePreview(base64)
      
      // Analyze with AI
      setAnalyzing(true)
      try {
        const res = await fetch("/api/meals/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64: base64 })
        })
        
        if (res.ok) {
          const data = await res.json()
          setAnalysis(data.analysis)
        }
      } catch (error) {
        console.error("Analysis error:", error)
      }
      setAnalyzing(false)
    }
    reader.readAsDataURL(file)
  }

  const handleSave = async () => {
    if (!analysis) return
    
    setSaving(true)
    try {
      const res = await fetch("/api/meals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: analysis.name,
          description: analysis.description,
          mealType,
          calories: analysis.calories,
          protein: analysis.protein,
          carbs: analysis.carbs,
          fat: analysis.fat,
          imageUrl: imagePreview,
          aiAnalysis: JSON.stringify(analysis)
        })
      })

      if (res.ok) {
        router.push("/dashboard")
      }
    } catch (error) {
      console.error("Save error:", error)
    }
    setSaving(false)
  }

  return (
    <div className="space-y-6 animate-slideUp">
      <h1 className="text-2xl font-bold text-gray-800">Ajouter un repas 🍽️</h1>

      {/* Meal Type */}
      <div className="flex gap-2">
        {[
          { value: "BREAKFAST", emoji: "🌅", label: "Petit-déj" },
          { value: "LUNCH", emoji: "☀️", label: "Déjeuner" },
          { value: "DINNER", emoji: "🌙", label: "Dîner" },
          { value: "SNACK", emoji: "🍎", label: "Snack" },
        ].map(type => (
          <button
            key={type.value}
            onClick={() => setMealType(type.value)}
            className={`flex-1 py-2 rounded-xl text-center transition-all ${
              mealType === type.value 
                ? "bg-emerald-500 text-white" 
                : "bg-gray-100 text-gray-600"
            }`}
          >
            <div className="text-xl">{type.emoji}</div>
            <div className="text-xs">{type.label}</div>
          </button>
        ))}
      </div>

      {/* Photo Upload */}
      <div 
        onClick={() => fileInputRef.current?.click()}
        className="card border-2 border-dashed border-emerald-300 cursor-pointer hover:bg-emerald-50 transition-colors"
      >
        {imagePreview ? (
          <img src={imagePreview} alt="Repas" className="w-full h-48 object-cover rounded-xl" />
        ) : (
          <div className="text-center py-8">
            <div className="text-5xl mb-2">📸</div>
            <p className="text-emerald-600 font-medium">Prendre une photo</p>
            <p className="text-sm text-gray-500">ou choisir une image</p>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleImageSelect}
          className="hidden"
        />
      </div>

      {/* Analysis Results */}
      {analyzing && (
        <div className="card text-center">
          <div className="animate-pulse">
            <div className="text-4xl mb-2">🤖</div>
            <p className="text-gray-600">Analyse en cours...</p>
          </div>
        </div>
      )}

      {analysis && (
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-lg text-gray-800">{analysis.name}</h3>
              {analysis.description && (
                <p className="text-sm text-gray-500">{analysis.description}</p>
              )}
            </div>
            <span className={`px-2 py-1 rounded-full text-xs ${
              analysis.confidence === "high" ? "bg-green-100 text-green-700" :
              analysis.confidence === "medium" ? "bg-yellow-100 text-yellow-700" :
              "bg-red-100 text-red-700"
            }`}>
              {analysis.confidence === "high" ? "✓ Sûr" : 
               analysis.confidence === "medium" ? "~ Estimé" : "? Approximatif"}
            </span>
          </div>

          {/* Nutritional Info */}
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="bg-orange-50 rounded-xl p-3">
              <p className="text-2xl font-bold text-orange-600">{analysis.calories}</p>
              <p className="text-xs text-gray-500">kcal</p>
            </div>
            <div className="bg-red-50 rounded-xl p-3">
              <p className="text-2xl font-bold text-red-600">{analysis.protein}g</p>
              <p className="text-xs text-gray-500">Protéines</p>
            </div>
            <div className="bg-yellow-50 rounded-xl p-3">
              <p className="text-2xl font-bold text-yellow-600">{analysis.carbs}g</p>
              <p className="text-xs text-gray-500">Glucides</p>
            </div>
            <div className="bg-purple-50 rounded-xl p-3">
              <p className="text-2xl font-bold text-purple-600">{analysis.fat}g</p>
              <p className="text-xs text-gray-500">Lipides</p>
            </div>
          </div>

          {analysis.items && analysis.items.length > 0 && (
            <div>
              <p className="text-sm text-gray-500 mb-2">Ingrédients détectés:</p>
              <div className="flex flex-wrap gap-2">
                {analysis.items.map((item, i) => (
                  <span key={i} className="bg-gray-100 px-2 py-1 rounded-full text-xs text-gray-600">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            className="btn btn-primary w-full py-3"
          >
            {saving ? "Enregistrement..." : "✓ Enregistrer ce repas"}
          </button>
        </div>
      )}
    </div>
  )
}
