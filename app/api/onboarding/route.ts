import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/db"
import Groq from "groq-sdk"

const ONBOARDING_SYSTEM_PROMPT = `Tu es Jarvis, un expert en santé, nutrition et longévité. Tu guides l'utilisateur pour créer son profil santé personnalisé.

OBJECTIF: Collecter les informations suivantes de manière conversationnelle et naturelle:
1. Objectif principal (perte poids, muscle, énergie, longévité/anti-âge, santé cognitive, sommeil)
2. Âge, taille, poids, genre
3. Niveau d'activité physique
4. Qualité du sommeil
5. Niveau de stress
6. Type d'alimentation actuel
7. Allergies alimentaires
8. Conditions de santé / médicaments
9. Derniers bilans sanguins (si disponibles): cholestérol, vitamine D, etc.
10. Budget mensuel pour les compléments

RÈGLES:
- Pose 1-2 questions à la fois maximum
- Sois encourageant et bienveillant
- Adapte ton langage au contexte (longévité = plus technique possible)
- Quand tu as assez d'infos, dis PROFIL_COMPLET suivi d'un JSON avec toutes les données

FORMAT QUAND COMPLET:
PROFIL_COMPLET
{
  "primaryGoal": "LONGEVITY",
  "birthYear": 1986,
  "height": 180,
  "weight": 82,
  "gender": "MALE",
  "activityLevel": "MODERATE",
  "sleepHours": 7,
  "stressLevel": "MODERATE",
  "dietType": "OMNIVORE",
  "allergies": [],
  "conditions": [],
  "medications": [],
  "cholesterolTotal": 210,
  "vitaminD": 32,
  "monthlyBudget": 100
}

Commence par te présenter et demander l'objectif principal.`

export async function GET() {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { healthProfile: true }
    })

    if (!user) return NextResponse.json({ error: "Non trouvé" }, { status: 404 })

    // Get onboarding messages
    const messages = await prisma.chatMessage.findMany({
      where: { userId: user.id, isOnboarding: true },
      orderBy: { createdAt: "asc" }
    })

    return NextResponse.json({ 
      messages,
      healthProfile: user.healthProfile,
      completed: user.healthProfile?.onboardingCompleted || false
    })
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
      include: { healthProfile: true, settings: true }
    })

    if (!user) return NextResponse.json({ error: "Non trouvé" }, { status: 404 })

    const body = await request.json()
    const { message } = body

    // Save user message
    await prisma.chatMessage.create({
      data: { userId: user.id, role: "user", content: message, isOnboarding: true }
    })

    // Get conversation history
    const history = await prisma.chatMessage.findMany({
      where: { userId: user.id, isOnboarding: true },
      orderBy: { createdAt: "asc" },
      take: 20
    })

    const apiKey = user.settings?.groqApiKey || process.env.GROQ_API_KEY
    const groq = new Groq({ apiKey })

    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: ONBOARDING_SYSTEM_PROMPT },
        ...history.map(m => ({ role: m.role as "user" | "assistant", content: m.content }))
      ],
      max_tokens: 1000,
      temperature: 0.7
    })

    const assistantMessage = response.choices[0]?.message?.content || ""

    // Check if profile is complete
    if (assistantMessage.includes("PROFIL_COMPLET")) {
      const jsonMatch = assistantMessage.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        try {
          const profileData = JSON.parse(jsonMatch[0])
          
          // Calculate age from birthYear
          const currentYear = new Date().getFullYear()
          const birthDate = profileData.birthYear 
            ? new Date(profileData.birthYear, 0, 1)
            : null

          // Create/update health profile
          await prisma.healthProfile.upsert({
            where: { userId: user.id },
            update: {
              primaryGoal: profileData.primaryGoal || "GENERAL_HEALTH",
              monthlyBudget: profileData.monthlyBudget,
              sleepHours: profileData.sleepHours,
              stressLevel: profileData.stressLevel || "MODERATE",
              dietType: profileData.dietType || "OMNIVORE",
              allergies: profileData.allergies || [],
              cholesterolTotal: profileData.cholesterolTotal,
              vitaminD: profileData.vitaminD,
              conditions: profileData.conditions || [],
              medications: profileData.medications || [],
              onboardingCompleted: true
            },
            create: {
              userId: user.id,
              primaryGoal: profileData.primaryGoal || "GENERAL_HEALTH",
              monthlyBudget: profileData.monthlyBudget,
              sleepHours: profileData.sleepHours,
              stressLevel: profileData.stressLevel || "MODERATE",
              dietType: profileData.dietType || "OMNIVORE",
              allergies: profileData.allergies || [],
              cholesterolTotal: profileData.cholesterolTotal,
              vitaminD: profileData.vitaminD,
              conditions: profileData.conditions || [],
              medications: profileData.medications || [],
              onboardingCompleted: true
            }
          })

          // Update basic profile too
          if (profileData.height || profileData.weight) {
            await prisma.profile.upsert({
              where: { userId: user.id },
              update: {
                height: profileData.height,
                weight: profileData.weight,
                gender: profileData.gender,
                activityLevel: profileData.activityLevel || "MODERATE",
                birthDate: birthDate
              },
              create: {
                userId: user.id,
                height: profileData.height,
                weight: profileData.weight,
                gender: profileData.gender,
                activityLevel: profileData.activityLevel || "MODERATE",
                birthDate: birthDate
              }
            })
          }
        } catch (e) {
          console.error("Failed to parse profile JSON:", e)
        }
      }
    }

    // Save assistant response (clean version without JSON)
    const cleanMessage = assistantMessage.replace(/PROFIL_COMPLET[\s\S]*/, "Super ! J'ai bien enregistré ton profil. Je prépare tes recommandations personnalisées... 🎯")

    await prisma.chatMessage.create({
      data: { userId: user.id, role: "assistant", content: cleanMessage, isOnboarding: true }
    })

    return NextResponse.json({ 
      message: cleanMessage,
      completed: assistantMessage.includes("PROFIL_COMPLET")
    })
  } catch (error) {
    console.error("Onboarding error:", error)
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

    // Reset onboarding
    await prisma.chatMessage.deleteMany({
      where: { userId: user.id, isOnboarding: true }
    })

    await prisma.healthProfile.deleteMany({
      where: { userId: user.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
