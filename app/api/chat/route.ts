import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/db"
import Groq from "groq-sdk"

const SMART_ASSISTANT_PROMPT = `Tu es Jarvis, un assistant santé intelligent pour l'app FitFamily.

IMPORTANT: Tu ne dois pas juste répondre, tu dois AGIR sur le profil de l'utilisateur.

Quand l'utilisateur te donne des informations (âge, poids, objectifs, etc.), tu dois:
1. Les EXTRAIRE et les SAUVEGARDER
2. GÉNÉRER des recommandations personnalisées
3. Confirmer ce que tu as fait

EXTRACTION DES DONNÉES:
Cherche dans le message: âge, poids, taille, sexe, objectifs (longévité, perte poids, muscle, énergie), niveau stress, heures sommeil, allergies, budget compléments, conditions médicales.

FORMAT DE RÉPONSE:
Réponds TOUJOURS avec ce format JSON suivi de ta réponse textuelle:

<<<ACTIONS>>>
{
  "updateProfile": true/false,
  "profileData": {
    "age": number ou null,
    "weight": number ou null,
    "height": number ou null,
    "gender": "MALE"/"FEMALE" ou null,
    "primaryGoal": "LONGEVITY"/"WEIGHT_LOSS"/"MUSCLE_GAIN"/"ENERGY"/"COGNITIVE"/"SLEEP" ou null,
    "stressLevel": "LOW"/"MODERATE"/"HIGH" ou null,
    "sleepHours": number ou null,
    "monthlyBudget": number ou null
  },
  "generateRecommendations": true/false
}
<<<END_ACTIONS>>>

Ta réponse textuelle ici...

EXEMPLE:
User: "J'ai 40 ans, 82kg, je veux optimiser ma longévité"

<<<ACTIONS>>>
{
  "updateProfile": true,
  "profileData": {
    "age": 40,
    "weight": 82,
    "primaryGoal": "LONGEVITY"
  },
  "generateRecommendations": true
}
<<<END_ACTIONS>>>

Parfait ! J'ai enregistré ton profil :
- 📅 40 ans
- ⚖️ 82 kg  
- 🎯 Objectif : Longévité

Je génère maintenant tes recommandations personnalisées... Tu les trouveras dans :
- 💊 Section Compléments (stack longévité adapté)
- 🏋️ Section Sport (programme anti-âge)
- 🍽️ Section Repas (alimentation longévité)

Si tu n'extrais AUCUNE donnée du message, mets updateProfile: false et réponds normalement.
Sois concis et amical. Tutoie l'utilisateur.`

const LONGEVITY_SUPPLEMENTS = [
  { name: "Vitamine D3", dosage: "4000-5000 UI/jour", timing: "morning", priority: 1, reason: "Base essentielle - immunité, os, humeur", price: 15 },
  { name: "Omega-3 EPA/DHA", dosage: "2-3g/jour", timing: "with-meal", priority: 1, reason: "Anti-inflammatoire, cerveau, cœur", price: 25 },
  { name: "Magnésium Bisglycinate", dosage: "400mg/jour", timing: "evening", priority: 1, reason: "Sommeil, muscles, stress, 300+ réactions enzymatiques", price: 20 },
  { name: "NMN (Nicotinamide Mononucléotide)", dosage: "500-1000mg/jour", timing: "morning", priority: 2, reason: "Boost NAD+, rajeunissement cellulaire, énergie", price: 80 },
  { name: "Resvératrol", dosage: "500mg/jour", timing: "morning", priority: 2, reason: "Activation SIRT1, anti-âge, cardiovasculaire", price: 30 },
  { name: "CoQ10 Ubiquinol", dosage: "100-200mg/jour", timing: "morning", priority: 2, reason: "Énergie mitochondriale, cœur, anti-oxydant", price: 35 },
  { name: "Curcumine + Pipérine", dosage: "500mg/jour", timing: "with-meal", priority: 3, reason: "Anti-inflammatoire puissant", price: 25 },
  { name: "Spermidine", dosage: "1-2mg/jour", timing: "morning", priority: 3, reason: "Autophagie, renouvellement cellulaire", price: 50 },
]

const WEIGHT_LOSS_SUPPLEMENTS = [
  { name: "Omega-3 EPA/DHA", dosage: "2g/jour", timing: "with-meal", priority: 1, reason: "Métabolisme lipidique, satiété", price: 25 },
  { name: "Magnésium", dosage: "400mg/jour", timing: "evening", priority: 1, reason: "Métabolisme glucidique, sommeil", price: 20 },
  { name: "Vitamine D3", dosage: "4000 UI/jour", timing: "morning", priority: 1, reason: "Métabolisme, humeur", price: 15 },
  { name: "Berbérine", dosage: "500mg 2x/jour", timing: "with-meal", priority: 2, reason: "Régulation glycémie, comparable à metformine", price: 30 },
  { name: "L-Carnitine", dosage: "1-2g/jour", timing: "morning", priority: 2, reason: "Transport des graisses vers mitochondries", price: 25 },
]

const EXERCISE_PLANS: Record<string, any> = {
  LONGEVITY: {
    title: "Programme Longévité",
    weeklyPlan: [
      { day: "Lundi", activity: "Zone 2 Cardio (marche rapide/vélo)", duration: 45, notes: "Fréquence cardiaque 60-70% max" },
      { day: "Mardi", activity: "Musculation full body", duration: 45, notes: "Charges modérées, 3 séries" },
      { day: "Mercredi", activity: "Repos actif / Yoga", duration: 30, notes: "Mobilité et récupération" },
      { day: "Jeudi", activity: "Zone 2 Cardio", duration: 45, notes: "Maintien base aérobie" },
      { day: "Vendredi", activity: "Musculation full body", duration: 45, notes: "Focus posture et équilibre" },
      { day: "Samedi", activity: "HIIT léger ou natation", duration: 30, notes: "Intensité variable" },
      { day: "Dimanche", activity: "Repos / Marche légère", duration: 30, notes: "Récupération active" },
    ],
    keyPrinciples: ["Zone 2 cardio (base aérobie)", "Musculation 2x/sem (préserver muscle)", "Mobilité quotidienne", "Éviter le surentraînement"]
  },
  WEIGHT_LOSS: {
    title: "Programme Perte de Poids",
    weeklyPlan: [
      { day: "Lundi", activity: "HIIT", duration: 30, notes: "Intervalles haute intensité" },
      { day: "Mardi", activity: "Musculation haut du corps", duration: 45, notes: "Préserver la masse musculaire" },
      { day: "Mercredi", activity: "Cardio modéré", duration: 40, notes: "Marche rapide ou vélo" },
      { day: "Jeudi", activity: "Musculation bas du corps", duration: 45, notes: "Squats, fentes, deadlifts" },
      { day: "Vendredi", activity: "HIIT ou Circuit training", duration: 30, notes: "Brûler un max de calories" },
      { day: "Samedi", activity: "Activité plaisir", duration: 60, notes: "Randonnée, natation, vélo" },
      { day: "Dimanche", activity: "Repos", duration: 0, notes: "Récupération" },
    ],
    keyPrinciples: ["Déficit calorique modéré", "Musculation pour préserver le muscle", "HIIT 2-3x/sem", "10000 pas/jour"]
  },
  MUSCLE_GAIN: {
    title: "Programme Prise de Muscle",
    weeklyPlan: [
      { day: "Lundi", activity: "Push (pectoraux, épaules, triceps)", duration: 60, notes: "Charges lourdes, 4 séries" },
      { day: "Mardi", activity: "Pull (dos, biceps)", duration: 60, notes: "Tractions, rowing" },
      { day: "Mercredi", activity: "Repos ou cardio léger", duration: 20, notes: "Récupération" },
      { day: "Jeudi", activity: "Legs (jambes complètes)", duration: 60, notes: "Squats, leg press, mollets" },
      { day: "Vendredi", activity: "Upper body", duration: 60, notes: "Mix push/pull" },
      { day: "Samedi", activity: "Points faibles", duration: 45, notes: "Cibler les retards" },
      { day: "Dimanche", activity: "Repos complet", duration: 0, notes: "Croissance musculaire" },
    ],
    keyPrinciples: ["Surcharge progressive", "Protéines 1.6-2g/kg", "Sommeil 7-9h", "Surplus calorique modéré"]
  }
}

export async function GET() {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })
    if (!user) return NextResponse.json({ error: "Non trouvé" }, { status: 404 })

    const messages = await prisma.chatMessage.findMany({
      where: { userId: user.id, isOnboarding: false },
      orderBy: { createdAt: "asc" },
      take: 50
    })

    return NextResponse.json({ messages })
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

    const body = await request.json()
    const { message } = body

    if (!message) {
      return NextResponse.json({ error: "Message requis" }, { status: 400 })
    }

    // Save user message
    await prisma.chatMessage.create({
      data: { userId: user.id, role: "user", content: message, isOnboarding: false }
    })

    // Get recent messages for context
    const recentMessages = await prisma.chatMessage.findMany({
      where: { userId: user.id, isOnboarding: false },
      orderBy: { createdAt: "desc" },
      take: 10
    })

    const apiKey = user.settings?.groqApiKey || process.env.GROQ_API_KEY
    const groq = new Groq({ apiKey })

    const chatHistory = recentMessages.reverse().map(m => ({
      role: m.role as "user" | "assistant",
      content: m.content
    }))

    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: SMART_ASSISTANT_PROMPT },
        ...chatHistory
      ],
      max_tokens: 1500,
      temperature: 0.7
    })

    let assistantMessage = response.choices[0]?.message?.content || "Désolé, je n'ai pas compris."

    // Parse actions from response
    const actionsMatch = assistantMessage.match(/<<<ACTIONS>>>([\s\S]*?)<<<END_ACTIONS>>>/)
    let actions: any = null
    let cleanMessage = assistantMessage

    if (actionsMatch) {
      try {
        actions = JSON.parse(actionsMatch[1].trim())
        cleanMessage = assistantMessage.replace(/<<<ACTIONS>>>[\s\S]*?<<<END_ACTIONS>>>/, "").trim()
      } catch (e) {
        console.error("Failed to parse actions:", e)
      }
    }

    // Execute actions
    if (actions?.updateProfile && actions.profileData) {
      const pd = actions.profileData

      // Update basic profile
      if (pd.weight || pd.height || pd.gender || pd.age) {
        const birthDate = pd.age ? new Date(new Date().getFullYear() - pd.age, 0, 1) : undefined
        
        await prisma.profile.upsert({
          where: { userId: user.id },
          update: {
            ...(pd.weight && { weight: pd.weight }),
            ...(pd.height && { height: pd.height }),
            ...(pd.gender && { gender: pd.gender }),
            ...(birthDate && { birthDate })
          },
          create: {
            userId: user.id,
            weight: pd.weight,
            height: pd.height,
            gender: pd.gender,
            birthDate
          }
        })
      }

      // Update health profile
      await prisma.healthProfile.upsert({
        where: { userId: user.id },
        update: {
          ...(pd.primaryGoal && { primaryGoal: pd.primaryGoal }),
          ...(pd.stressLevel && { stressLevel: pd.stressLevel }),
          ...(pd.sleepHours && { sleepHours: pd.sleepHours }),
          ...(pd.monthlyBudget && { monthlyBudget: pd.monthlyBudget }),
          onboardingCompleted: true
        },
        create: {
          userId: user.id,
          primaryGoal: pd.primaryGoal || "GENERAL_HEALTH",
          stressLevel: pd.stressLevel || "MODERATE",
          sleepHours: pd.sleepHours,
          monthlyBudget: pd.monthlyBudget,
          onboardingCompleted: true
        }
      })
    }

    // Generate recommendations
    if (actions?.generateRecommendations) {
      const goal = actions.profileData?.primaryGoal || user.healthProfile?.primaryGoal || "GENERAL_HEALTH"
      
      // Clear old recommendations
      await prisma.recommendation.deleteMany({ where: { userId: user.id } })

      // Get supplements based on goal
      let supplements = LONGEVITY_SUPPLEMENTS
      if (goal === "WEIGHT_LOSS") supplements = WEIGHT_LOSS_SUPPLEMENTS
      
      // Create supplement recommendations
      for (const supp of supplements) {
        await prisma.recommendation.create({
          data: {
            userId: user.id,
            type: "SUPPLEMENT",
            category: "supplements",
            title: supp.name,
            description: supp.reason,
            priority: supp.priority,
            supplementName: supp.name,
            dosage: supp.dosage,
            timing: supp.timing,
            monthlyPrice: supp.price,
            reasoning: supp.reason
          }
        })
      }

      // Create exercise plan
      const exercisePlan = EXERCISE_PLANS[goal] || EXERCISE_PLANS.LONGEVITY
      await prisma.recommendation.create({
        data: {
          userId: user.id,
          type: "EXERCISE",
          category: "exercise",
          title: exercisePlan.title,
          description: exercisePlan.keyPrinciples.join(", "),
          priority: 1,
          exercisePlan: exercisePlan
        }
      })

      // Create diet recommendation
      const dietRec = goal === "WEIGHT_LOSS" 
        ? { title: "Régime Hypocalorique Équilibré", desc: "Déficit 500kcal, protéines élevées, légumes à volonté" }
        : goal === "MUSCLE_GAIN"
        ? { title: "Régime Hypercalorique", desc: "Surplus 300kcal, 2g protéines/kg, glucides autour de l'entraînement" }
        : { title: "Régime Méditerranéen", desc: "Légumes, poisson, huile d'olive, noix, peu de viande rouge" }

      await prisma.recommendation.create({
        data: {
          userId: user.id,
          type: "MEAL",
          category: "diet",
          title: dietRec.title,
          description: dietRec.desc,
          priority: 1
        }
      })
    }

    // Save assistant response
    await prisma.chatMessage.create({
      data: { userId: user.id, role: "assistant", content: cleanMessage, provider: "groq", isOnboarding: false }
    })

    return NextResponse.json({ 
      message: cleanMessage,
      actionsExecuted: actions ? true : false,
      profileUpdated: actions?.updateProfile || false,
      recommendationsGenerated: actions?.generateRecommendations || false
    })
  } catch (error) {
    console.error("Chat error:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })
    if (!user) return NextResponse.json({ error: "Non trouvé" }, { status: 404 })

    await prisma.chatMessage.deleteMany({ where: { userId: user.id, isOnboarding: false } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
