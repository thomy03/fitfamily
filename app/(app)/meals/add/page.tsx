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
  { name: "Orange", calories: 47, protein: 1, carbs: 12, fat: 0 },
  { name: "Salade verte", calories: 15, protein: 1, carbs: 2, fat: 0 },
  { name: "Tomate", calories: 18, protein: 1, carbs: 4, fat: 0 },
  { name: "Poulet grillé (150g)", calories: 250, protein: 40, carbs: 0, fat: 9 },
  { name: "Steak haché (100g)", calories: 250, protein: 20, carbs: 0, fat: 18 },
  { name: "Saumon (150g)", calories: 280, protein: 35, carbs: 0, fat: 15 },
  { name: "Pâtes (200g cuites)", calories: 260, protein: 9, carbs: 52, fat: 2 },
  { name: "Riz (200g cuit)", calories: 260, protein: 5, carbs: 56, fat: 1 },
  { name: "Pommes de terre (200g)", calories: 160, protein: 4, carbs: 36, fat: 0 },
  { name: "Frites (150g)", calories: 450, protein: 5, carbs: 50, fat: 25 },
  { name: "Pizza Margherita (1/4)", calories: 270, protein: 12, carbs: 30, fat: 12 },
  { name: "Hamburger", calories: 540, protein: 25, carbs: 40, fat: 30 },
  { name: "Sandwich jambon-beurre", calories: 400, protein: 15, carbs: 40, fat: 20 },
  { name: "Croque-monsieur", calories: 350, protein: 18, carbs: 25, fat: 20 },
  { name: "Soupe de légumes", calories: 80, protein: 3, carbs: 12, fat: 2 },
  { name: "Salade César", calories: 350, protein: 20, carbs: 15, fat: 25 },
  { name: "Fromage (30g)", calories: 120, protein: 8, carbs: 0, fat: 10 },
  { name: "Jambon (2 tranches)", calories: 60, protein: 10, carbs: 1, fat: 2 },
  { name: "Chocolat noir (20g)", calories: 110, protein: 2, carbs: 8, fat: 8 },
  { name: "Glace (1 boule)", calories: 140, protein: 2, carbs: 18, fat: 7 },
  { name: "Tarte aux pommes (part)", calories: 280, protein: 3, carbs: 40, fat: 12 },
  { name: "Tiramisu (part)", calories: 350, protein: 6, carbs: 35, fat: 20 },
  { name: "Coca-Cola (33cl)", calories: 140, protein: 0, carbs: 35, fat: 0 },
  { name: "Jus d'orange (25cl)", calories: 110, protein: 2, carbs: 26, fat: 0 },
  { name: "Bière (33cl)", calories: 150, protein: 1, carbs: 13, fat: 0 },
  { name: "Vin rouge (15cl)", calories: 125, protein: 0, carbs: 4, fat: 0 },
  { name: "Eau", calories: 0, protein: 0, carbs: 0, fat: 0 },
]

export default function AddMealPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [mode, setMode] = useState<"choose" | "photo" | "manual">("choose")
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<MealAnalysis | null>(null)
  const [mealType, setMealType] = useState("LUNCH")
  const [saving, setSaving] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedFoods, setSelectedFoods] = useState<MealAnalysis[]>([])
  const [customFood, setCustomFood] = useState({ name: "", calories: "" })

  const filteredFoods = COMMON_FOODS.filter(f => 
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 8)

  const totalNutrition = selectedFoods.reduce((acc, f) => ({
    name: selectedFoods.map(f => f.name).join(", "),
    calories: acc.calories + f.calories,
    protein: acc.protein + f.protein,
    carbs: acc.carbs + f.carbs,
    fat: acc.fat + f.fat,
  }), { name: "", calories: 0, protein: 0, carbs: 0, fat: 0 })

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (e) => {
      const base64 = e.target?.result as string
      setImagePreview(base64)
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

  const addFood = (food: typeof COMMON_FOODS[0]) => {
    setSelectedFoods([...selectedFoods, food])
    setSearchQuery("")
  }

  const addCustomFood = () => {
    if (customFood.name && customFood.calories) {
      setSelectedFoods([...selectedFoods, {
        name: customFood.name,
        calories: parseInt(customFood.calories),
        protein: 0, carbs: 0, fat: 0
      }])
      setCustomFood({ name: "", calories: "" })
    }
  }

  const removeFood = (index: number) => {
    setSelectedFoods(selectedFoods.filter((_, i) => i !== index))
  }

  const handleSave = async () => {
    const mealData = mode === "photo" ? analysis : (selectedFoods.length > 0 ? totalNutrition : null)
    if (!mealData) return
    
    setSaving(true)
    try {
      const res = await fetch("/api/meals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: mealData.name || "Repas",
          mealType,
          calories: mealData.calories,
          protein: mealData.protein,
          carbs: mealData.carbs,
          fat: mealData.fat,
          imageUrl: imagePreview,
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
          { value: "SNACK", emoji: "🍎", label: "Collation" },
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

      {/* Mode Selection */}
      {mode === "choose" && (
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setMode("photo")}
            className="card text-center py-8 hover:shadow-md transition-shadow border-2 border-transparent hover:border-emerald-300"
          >
            <div className="text-5xl mb-3">📸</div>
            <p className="font-bold text-gray-800">Photo</p>
            <p className="text-sm text-gray-500">Analyse IA automatique</p>
          </button>
          
          <button
            onClick={() => setMode("manual")}
            className="card text-center py-8 hover:shadow-md transition-shadow border-2 border-transparent hover:border-emerald-300"
          >
            <div className="text-5xl mb-3">✍️</div>
            <p className="font-bold text-gray-800">Manuel</p>
            <p className="text-sm text-gray-500">Recherche ou saisie</p>
          </button>
        </div>
      )}

      {/* Photo Mode */}
      {mode === "photo" && (
        <>
          <button onClick={() => setMode("choose")} className="text-emerald-600 text-sm">
            ← Retour
          </button>
          
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

          {analyzing && (
            <div className="card text-center">
              <div className="animate-pulse">
                <div className="text-4xl mb-2">🤖</div>
                <p className="text-gray-600">Analyse en cours...</p>
              </div>
            </div>
          )}

          {analysis && (
            <NutritionCard 
              data={analysis} 
              onSave={handleSave}
              saving={saving}
            />
          )}
        </>
      )}

      {/* Manual Mode */}
      {mode === "manual" && (
        <>
          <button onClick={() => setMode("choose")} className="text-emerald-600 text-sm">
            ← Retour
          </button>

          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="🔍 Rechercher un aliment..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input"
            />
            
            {searchQuery && filteredFoods.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-white rounded-xl shadow-lg border mt-1 z-10 max-h-64 overflow-auto">
                {filteredFoods.map((food, i) => (
                  <button
                    key={i}
                    onClick={() => addFood(food)}
                    className="w-full px-4 py-3 text-left hover:bg-emerald-50 flex justify-between items-center border-b last:border-0"
                  >
                    <span className="font-medium">{food.name}</span>
                    <span className="text-sm text-gray-500">{food.calories} kcal</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Custom food input */}
          <div className="card">
            <p className="text-sm text-gray-500 mb-2">Ajouter un aliment personnalisé</p>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Nom"
                value={customFood.name}
                onChange={(e) => setCustomFood({...customFood, name: e.target.value})}
                className="input flex-1"
              />
              <input
                type="number"
                placeholder="kcal"
                value={customFood.calories}
                onChange={(e) => setCustomFood({...customFood, calories: e.target.value})}
                className="input w-24"
              />
              <button
                onClick={addCustomFood}
                disabled={!customFood.name || !customFood.calories}
                className="btn btn-primary"
              >
                +
              </button>
            </div>
          </div>

          {/* Selected foods */}
          {selectedFoods.length > 0 && (
            <div className="card space-y-3">
              <p className="font-medium text-gray-700">Aliments sélectionnés</p>
              {selectedFoods.map((food, i) => (
                <div key={i} className="flex justify-between items-center py-2 border-b last:border-0">
                  <span>{food.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500">{food.calories} kcal</span>
                    <button 
                      onClick={() => removeFood(i)}
                      className="text-red-500 text-sm"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
              
              <div className="pt-3 border-t">
                <NutritionCard 
                  data={totalNutrition}
                  onSave={handleSave}
                  saving={saving}
                  compact
                />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function NutritionCard({ data, onSave, saving, compact = false }: { 
  data: MealAnalysis, 
  onSave: () => void, 
  saving: boolean,
  compact?: boolean 
}) {
  return (
    <div className={compact ? "" : "card space-y-4"}>
      {!compact && (
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg text-gray-800">{data.name}</h3>
            {data.description && (
              <p className="text-sm text-gray-500">{data.description}</p>
            )}
          </div>
          {data.confidence && (
            <span className={`px-2 py-1 rounded-full text-xs ${
              data.confidence === "high" ? "bg-green-100 text-green-700" :
              data.confidence === "medium" ? "bg-yellow-100 text-yellow-700" :
              "bg-red-100 text-red-700"
            }`}>
              {data.confidence === "high" ? "✓ Sûr" : 
               data.confidence === "medium" ? "~ Estimé" : "? Approximatif"}
            </span>
          )}
        </div>
      )}

      <div className="grid grid-cols-4 gap-2 text-center">
        <div className="bg-orange-50 rounded-xl p-3">
          <p className="text-2xl font-bold text-orange-600">{data.calories}</p>
          <p className="text-xs text-gray-500">kcal</p>
        </div>
        <div className="bg-red-50 rounded-xl p-3">
          <p className="text-2xl font-bold text-red-600">{data.protein}g</p>
          <p className="text-xs text-gray-500">Prot.</p>
        </div>
        <div className="bg-yellow-50 rounded-xl p-3">
          <p className="text-2xl font-bold text-yellow-600">{data.carbs}g</p>
          <p className="text-xs text-gray-500">Gluc.</p>
        </div>
        <div className="bg-purple-50 rounded-xl p-3">
          <p className="text-2xl font-bold text-purple-600">{data.fat}g</p>
          <p className="text-xs text-gray-500">Lip.</p>
        </div>
      </div>

      <button
        onClick={onSave}
        disabled={saving}
        className="btn btn-primary w-full py-3"
      >
        {saving ? "Enregistrement..." : "✓ Enregistrer ce repas"}
      </button>
    </div>
  )
}
