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
  confidence?: string
  items?: string[]
}

const mealTypes = [
  { value: "BREAKFAST", label: "Petit-déj", emoji: "🌅" },
  { value: "LUNCH", label: "Déjeuner", emoji: "☀️" },
  { value: "DINNER", label: "Dîner", emoji: "🌙" },
  { value: "SNACK", label: "Collation", emoji: "🍎" },
]

// Base d'aliments courants français
const COMMON_FOODS = [
  { name: "Croissant", calories: 230, protein: 5, carbs: 26, fat: 12 },
  { name: "Pain au chocolat", calories: 270, protein: 5, carbs: 30, fat: 15 },
  { name: "Baguette (1/4)", calories: 140, protein: 5, carbs: 28, fat: 1 },
  { name: "Café noir", calories: 2, protein: 0, carbs: 0, fat: 0 },
  { name: "Café au lait", calories: 50, protein: 3, carbs: 5, fat: 2 },
  { name: "Œuf dur", calories: 78, protein: 6, carbs: 1, fat: 5 },
  { name: "Œufs brouillés (2)", calories: 180, protein: 12, carbs: 2, fat: 14 },
  { name: "Yaourt nature", calories: 60, protein: 4, carbs: 5, fat: 3 },
  { name: "Yaourt aux fruits", calories: 120, protein: 4, carbs: 20, fat: 3 },
  { name: "Pomme", calories: 52, protein: 0, carbs: 14, fat: 0 },
  { name: "Banane", calories: 89, protein: 1, carbs: 23, fat: 0 },
  { name: "Salade verte", calories: 15, protein: 1, carbs: 2, fat: 0 },
  { name: "Poulet grillé (150g)", calories: 250, protein: 40, carbs: 0, fat: 9 },
  { name: "Saumon (150g)", calories: 280, protein: 35, carbs: 0, fat: 15 },
  { name: "Pâtes (200g cuites)", calories: 260, protein: 9, carbs: 52, fat: 2 },
  { name: "Riz (200g cuit)", calories: 260, protein: 5, carbs: 56, fat: 1 },
  { name: "Pizza Margherita (1/4)", calories: 270, protein: 12, carbs: 30, fat: 12 },
  { name: "Sandwich jambon-beurre", calories: 400, protein: 15, carbs: 40, fat: 20 },
  { name: "Soupe de légumes", calories: 80, protein: 3, carbs: 12, fat: 2 },
  { name: "Fromage (30g)", calories: 120, protein: 8, carbs: 0, fat: 10 },
  { name: "Chocolat noir (20g)", calories: 110, protein: 2, carbs: 8, fat: 8 },
  { name: "Compote (100g)", calories: 70, protein: 0, carbs: 17, fat: 0 },
  { name: "Eau", calories: 0, protein: 0, carbs: 0, fat: 0 },
]

export default function AddMealPage() {
  const router = useRouter()
  const [mealType, setMealType] = useState("LUNCH")
  const [mode, setMode] = useState<"description" | "photo" | "manual">("description")
  
  // Mode description
  const [description, setDescription] = useState("")
  const [analyzing, setAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<MealAnalysis | null>(null)
  
  // Mode photo
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Mode manuel
  const [search, setSearch] = useState("")
  const [selectedFoods, setSelectedFoods] = useState<MealAnalysis[]>([])
  
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  // Analyse IA de la description
  const handleAnalyze = async () => {
    if (!description.trim()) {
      setError("Décris ce que tu as mangé")
      return
    }

    setAnalyzing(true)
    setError("")
    setAnalysis(null)

    try {
      const res = await fetch("/api/meals/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: description })
      })

      const data = await res.json()
      
      if (data.error) {
        setError(data.error)
      } else {
        setAnalysis(data.analysis)
      }
    } catch (e) {
      setError("Erreur lors de l'analyse")
    }

    setAnalyzing(false)
  }

  // Analyse photo
  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setAnalyzing(true)
    setError("")
    setAnalysis(null)

    const reader = new FileReader()
    reader.onload = async () => {
      try {
        const res = await fetch("/api/meals/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64: reader.result })
        })

        const data = await res.json()
        if (data.error) {
          setError(data.error)
        } else {
          setAnalysis(data.analysis)
        }
      } catch {
        setError("Erreur lors de l'analyse")
      }
      setAnalyzing(false)
    }
    reader.readAsDataURL(file)
  }

  // Mode manuel
  const filteredFoods = COMMON_FOODS.filter(f => 
    f.name.toLowerCase().includes(search.toLowerCase())
  )

  const addFood = (food: typeof COMMON_FOODS[0]) => {
    setSelectedFoods([...selectedFoods, food])
    setSearch("")
  }

  const removeFood = (index: number) => {
    setSelectedFoods(selectedFoods.filter((_, i) => i !== index))
  }

  const totalNutrition: MealAnalysis = {
    name: "Repas composé",
    calories: selectedFoods.reduce((sum, f) => sum + f.calories, 0),
    protein: selectedFoods.reduce((sum, f) => sum + f.protein, 0),
    carbs: selectedFoods.reduce((sum, f) => sum + f.carbs, 0),
    fat: selectedFoods.reduce((sum, f) => sum + f.fat, 0),
  }

  // Sauvegarde
  const handleSave = async (data: MealAnalysis) => {
    setSaving(true)
    try {
      const res = await fetch("/api/meals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          mealType,
          calories: data.calories,
          protein: data.protein,
          carbs: data.carbs,
          fat: data.fat,
        })
      })

      if (res.ok) {
        router.push("/meals")
      } else {
        setError("Erreur lors de l'enregistrement")
      }
    } catch {
      setError("Erreur lors de l'enregistrement")
    }
    setSaving(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <h1 className="text-2xl font-bold text-gray-800">Ajouter un repas 🍽️</h1>

      {/* Type de repas */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {mealTypes.map(type => (
          <button
            key={type.value}
            onClick={() => setMealType(type.value)}
            className={`flex-shrink-0 px-4 py-2 rounded-xl font-medium transition-all ${
              mealType === type.value
                ? "bg-emerald-500 text-white"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            {type.emoji} {type.label}
          </button>
        ))}
      </div>

      {/* Mode de saisie */}
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={() => { setMode("description"); setAnalysis(null) }}
          className={`p-3 rounded-xl border-2 transition-all ${
            mode === "description" ? "border-emerald-500 bg-emerald-50" : "border-gray-200"
          }`}
        >
          <span className="text-2xl">✍️</span>
          <p className="text-xs mt-1 font-medium">Décrire</p>
        </button>
        <button
          onClick={() => { setMode("photo"); setAnalysis(null) }}
          className={`p-3 rounded-xl border-2 transition-all ${
            mode === "photo" ? "border-emerald-500 bg-emerald-50" : "border-gray-200"
          }`}
        >
          <span className="text-2xl">📸</span>
          <p className="text-xs mt-1 font-medium">Photo</p>
        </button>
        <button
          onClick={() => { setMode("manual"); setAnalysis(null) }}
          className={`p-3 rounded-xl border-2 transition-all ${
            mode === "manual" ? "border-emerald-500 bg-emerald-50" : "border-gray-200"
          }`}
        >
          <span className="text-2xl">📝</span>
          <p className="text-xs mt-1 font-medium">Manuel</p>
        </button>
      </div>

      {/* Mode Description IA */}
      {mode === "description" && (
        <div className="space-y-4">
          <div className="bg-emerald-50 rounded-xl p-4">
            <p className="text-sm text-emerald-700 mb-2">
              💡 Décris ton repas naturellement, l'IA calculera les calories
            </p>
            <p className="text-xs text-emerald-600">
              Ex: "Saumon fumé avec riz et légumes à l'huile d'olive, yaourt et compote en dessert"
            </p>
          </div>

          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Décris ce que tu as mangé..."
            rows={4}
            className="w-full p-4 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none resize-none"
          />

          <button
            onClick={handleAnalyze}
            disabled={analyzing || !description.trim()}
            className="w-full btn btn-primary py-3 disabled:opacity-50"
          >
            {analyzing ? "🔄 Analyse en cours..." : "🧠 Analyser avec l'IA"}
          </button>
        </div>
      )}

      {/* Mode Photo */}
      {mode === "photo" && (
        <div className="space-y-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handlePhoto}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={analyzing}
            className="w-full h-40 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-emerald-500 hover:bg-emerald-50 transition-all"
          >
            {analyzing ? (
              <span className="text-gray-500">🔄 Analyse en cours...</span>
            ) : (
              <>
                <span className="text-4xl">📷</span>
                <span className="text-gray-500">Prendre une photo du repas</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Mode Manuel */}
      {mode === "manual" && (
        <div className="space-y-4">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="🔍 Rechercher un aliment..."
            className="w-full p-3 rounded-xl border border-gray-200 focus:border-emerald-500 outline-none"
          />

          {search && (
            <div className="bg-white rounded-xl border border-gray-200 max-h-48 overflow-auto">
              {filteredFoods.length === 0 ? (
                <p className="p-3 text-gray-500 text-sm">Aucun aliment trouvé</p>
              ) : (
                filteredFoods.slice(0, 10).map(food => (
                  <button
                    key={food.name}
                    onClick={() => addFood(food)}
                    className="w-full p-3 text-left hover:bg-gray-50 flex justify-between border-b last:border-0"
                  >
                    <span>{food.name}</span>
                    <span className="text-gray-400 text-sm">{food.calories} kcal</span>
                  </button>
                ))
              )}
            </div>
          )}

          {selectedFoods.length > 0 && (
            <div className="bg-white rounded-xl p-4 space-y-2">
              {selectedFoods.map((food, i) => (
                <div key={i} className="flex justify-between items-center py-1 border-b last:border-0">
                  <span className="text-sm">{food.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">{food.calories} kcal</span>
                    <button onClick={() => removeFood(i)} className="text-red-500">✕</button>
                  </div>
                </div>
              ))}
              <div className="pt-2 border-t">
                <p className="font-bold text-emerald-600">Total: {totalNutrition.calories} kcal</p>
              </div>
            </div>
          )}

          {selectedFoods.length > 0 && (
            <button
              onClick={() => handleSave(totalNutrition)}
              disabled={saving}
              className="w-full btn btn-primary py-3"
            >
              {saving ? "Enregistrement..." : "✓ Enregistrer"}
            </button>
          )}
        </div>
      )}

      {/* Résultat analyse */}
      {analysis && (
        <div className="bg-white rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-lg text-gray-800">{analysis.name}</h3>
              {analysis.description && (
                <p className="text-sm text-gray-500">{analysis.description}</p>
              )}
            </div>
            {analysis.confidence && (
              <span className={`px-2 py-1 rounded-full text-xs ${
                analysis.confidence === "high" ? "bg-green-100 text-green-700" :
                analysis.confidence === "medium" ? "bg-yellow-100 text-yellow-700" :
                "bg-red-100 text-red-700"
              }`}>
                {analysis.confidence === "high" ? "✓ Précis" : 
                 analysis.confidence === "medium" ? "~ Estimé" : "? Approximatif"}
              </span>
            )}
          </div>

          {/* Détail items */}
          {analysis.items && analysis.items.length > 0 && (
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-500 mb-2">Détail :</p>
              <div className="flex flex-wrap gap-1">
                {analysis.items.map((item, i) => (
                  <span key={i} className="bg-white px-2 py-1 rounded-lg text-xs text-gray-600">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Macros */}
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="bg-orange-50 rounded-xl p-3">
              <p className="text-2xl font-bold text-orange-600">{analysis.calories}</p>
              <p className="text-xs text-gray-500">kcal</p>
            </div>
            <div className="bg-red-50 rounded-xl p-3">
              <p className="text-2xl font-bold text-red-600">{analysis.protein}g</p>
              <p className="text-xs text-gray-500">Prot.</p>
            </div>
            <div className="bg-yellow-50 rounded-xl p-3">
              <p className="text-2xl font-bold text-yellow-600">{analysis.carbs}g</p>
              <p className="text-xs text-gray-500">Gluc.</p>
            </div>
            <div className="bg-purple-50 rounded-xl p-3">
              <p className="text-2xl font-bold text-purple-600">{analysis.fat}g</p>
              <p className="text-xs text-gray-500">Lip.</p>
            </div>
          </div>

          <button
            onClick={() => handleSave(analysis)}
            disabled={saving}
            className="w-full btn btn-primary py-3"
          >
            {saving ? "Enregistrement..." : "✓ Enregistrer ce repas"}
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="text-red-500 text-center text-sm">{error}</p>
      )}
    </div>
  )
}
