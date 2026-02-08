import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/db"
import Groq from "groq-sdk"

const LONGEVITY_SUPPLEMENTS = {
  base: [
    { name: "Vitamine D3", dosage: "4000-5000 UI/jour", timing: "morning", reason: "Immunité, os, humeur", price: 15 },
    { name: "Omega-3 (EPA/DHA)", dosage: "2-3g/jour", timing: "with-meal", reason: "Inflammation, cerveau, cœur", price: 25 },
    { name: "Magnésium Bisglycinate", dosage: "400mg/jour", timing: "evening", reason: "Sommeil, muscles, stress", price: 20 }
  ],
  intermediate: [
    { name: "CoQ10 (Ubiquinol)", dosage: "100-200mg/jour", timing: "morning", reason: "Énergie cellulaire, cœur", price: 35 },
    { name: "Resvératrol", dosage: "500mg/jour", timing: "morning", reason: "Activation SIRT1, anti-âge", price: 30 },
    { name: "Curcumine (+ pipérine)", dosage: "500mg/jour", timing: "with-meal", reason: "Anti-inflammatoire puissant", price: 25 }
  ],
  advanced: [
    { name: "NMN (Nicotinamide Mononucléotide)", dosage: "500-1000mg/jour", timing: "morning", reason: "Boost NAD+, rajeunissement cellulaire", price: 80 },
    { name: "Spermidine", dosage: "1-2mg/jour", timing: "morning", reason: "Autophagie, longévité", price: 50 },
    { name: "Fisetin", dosage: "100-500mg/jour", timing: "with-meal", reason: "Sénolytique, élimine cellules vieillissantes", price: 40 }
  ],
  cognitive: [
    { name: "Lion's Mane", dosage: "1000mg/jour", timing: "morning", reason: "Neurogenèse, mémoire", price: 30 },
    { name: "Alpha-GPC", dosage: "300mg/jour", timing: "morning", reason: "Acétylcholine, cognition", price: 35 },
    { name: "Bacopa Monnieri", dosage: "300mg/jour", timing: "evening", reason: "Mémoire, anxiété", price: 20 }
  ],
  sleep: [
    { name: "Glycine", dosage: "3g avant coucher", timing: "evening", reason: "Qualité sommeil profond", price: 15 },
    { name: "L-Théanine", dosage: "200mg", timing: "evening", reason: "Relaxation sans somnolence", price: 20 },
    { name: "Apigénine", dosage: "50mg", timing: "evening", reason: "Anxiolytique naturel", price: 25 }
  ]
}

const RECOMMENDATION_PROMPT = `Tu es un expert en longévité et nutrition personnalisée.

Basé sur le profil santé suivant, génère des recommandations TRÈS personnalisées:

PROFIL:
{PROFILE_JSON}

GÉNÈRE des recommandations au format JSON:
{
  "supplements": [
    {
      "name": "Nom du complément",
      "dosage": "Dosage recommandé",
      "timing": "morning|evening|with-meal",
      "priority": 1-5 (1=essentiel),
      "reason": "Pourquoi pour CE profil spécifiquement",
      "monthlyPrice": prix estimé
    }
  ],
  "diet": {
    "type": "Type de régime recommandé",
    "keyPrinciples": ["principe 1", "principe 2"],
    "avoid": ["aliment 1", "aliment 2"],
    "prioritize": ["aliment 1", "aliment 2"]
  },
  "exercise": {
    "weeklyPlan": [
      {"day": "Lundi", "activity": "...", "duration": 30}
    ],
    "keyPrinciples": ["Zone 2 cardio", "Musculation"]
  },
  "lifestyle": [
    {"tip": "Conseil lifestyle", "priority": 1}
  ]
}

IMPORTANT: 
- Adapte au budget mensuel si spécifié
- Priorise selon l'objectif principal (LONGEVITY = NMN, resveratrol...)
- Si cholestérol élevé, recommande Omega-3, CoQ10
- Si vitamine D basse, priorité absolue
- Si stress élevé, ajoute adaptogènes`

export async function GET() {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { recommendations: { orderBy: { priority: "asc" } } }
    })

    if (!user) return NextResponse.json({ error: "Non trouvé" }, { status: 404 })

    return NextResponse.json({ recommendations: user.recommendations })
  } catch (error) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { healthProfile: true, profile: true, settings: true }
    })

    if (!user) return NextResponse.json({ error: "Non trouvé" }, { status: 404 })
    if (!user.healthProfile) {
      return NextResponse.json({ error: "Profil santé requis" }, { status: 400 })
    }

    // Build profile for AI
    const profileData = {
      age: user.profile?.birthDate 
        ? new Date().getFullYear() - new Date(user.profile.birthDate).getFullYear()
        : null,
      gender: user.profile?.gender,
      weight: user.profile?.weight,
      height: user.profile?.height,
      activityLevel: user.profile?.activityLevel,
      primaryGoal: user.healthProfile.primaryGoal,
      budget: user.healthProfile.monthlyBudget,
      sleepHours: user.healthProfile.sleepHours,
      stressLevel: user.healthProfile.stressLevel,
      dietType: user.healthProfile.dietType,
      allergies: user.healthProfile.allergies,
      conditions: user.healthProfile.conditions,
      cholesterolTotal: user.healthProfile.cholesterolTotal,
      cholesterolHDL: user.healthProfile.cholesterolHDL,
      cholesterolLDL: user.healthProfile.cholesterolLDL,
      vitaminD: user.healthProfile.vitaminD,
      vitaminB12: user.healthProfile.vitaminB12
    }

    const apiKey = user.settings?.groqApiKey || process.env.GROQ_API_KEY
    const groq = new Groq({ apiKey })

    const prompt = RECOMMENDATION_PROMPT.replace("{PROFILE_JSON}", JSON.stringify(profileData, null, 2))

    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 2000,
      temperature: 0.5
    })

    const content = response.choices[0]?.message?.content || "{}"
    
    // Parse recommendations
    let recommendations: any = {}
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        recommendations = JSON.parse(jsonMatch[0])
      }
    } catch (e) {
      console.error("Failed to parse recommendations:", e)
      // Use fallback recommendations
      recommendations = {
        supplements: LONGEVITY_SUPPLEMENTS.base,
        diet: { type: "Méditerranéen", keyPrinciples: ["Légumes", "Poisson", "Huile d'olive"] },
        exercise: { keyPrinciples: ["30min marche/jour", "Musculation 2x/sem"] }
      }
    }

    // Clear old recommendations
    await prisma.recommendation.deleteMany({ where: { userId: user.id } })

    // Save new recommendations
    const savedRecs = []

    // Supplements
    for (const supp of (recommendations.supplements || [])) {
      const rec = await prisma.recommendation.create({
        data: {
          userId: user.id,
          type: "SUPPLEMENT",
          category: "supplements",
          title: supp.name,
          description: supp.reason || "Recommandé pour votre profil",
          priority: supp.priority || 1,
          supplementName: supp.name,
          dosage: supp.dosage,
          timing: supp.timing,
          monthlyPrice: supp.monthlyPrice || supp.price,
          reasoning: supp.reason
        }
      })
      savedRecs.push(rec)
    }

    // Diet
    if (recommendations.diet) {
      await prisma.recommendation.create({
        data: {
          userId: user.id,
          type: "MEAL",
          category: "diet",
          title: `Régime ${recommendations.diet.type}`,
          description: recommendations.diet.keyPrinciples?.join(", ") || "",
          priority: 1,
          mealPlan: recommendations.diet
        }
      })
    }

    // Exercise
    if (recommendations.exercise) {
      await prisma.recommendation.create({
        data: {
          userId: user.id,
          type: "EXERCISE",
          category: "exercise",
          title: "Programme d'entraînement personnalisé",
          description: recommendations.exercise.keyPrinciples?.join(", ") || "",
          priority: 1,
          exercisePlan: recommendations.exercise
        }
      })
    }

    return NextResponse.json({ 
      success: true,
      recommendations: savedRecs,
      raw: recommendations
    })
  } catch (error) {
    console.error("Recommendations error:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
