import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/db"

export async function POST(request: Request) {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) return NextResponse.json({ error: "Non trouvé" }, { status: 404 })

    const body = await request.json()
    const {
      primaryGoal,
      dietType,
      monthlyBudget,
      cholesterolTotal,
      vitaminD,
      sleepHours,
      stressLevel
    } = body

    // Create/update health profile
    const healthProfile = await prisma.healthProfile.upsert({
      where: { userId: user.id },
      update: {
        primaryGoal: primaryGoal || "GENERAL_HEALTH",
        dietType: dietType || "OMNIVORE",
        monthlyBudget: monthlyBudget || null,
        cholesterolTotal: cholesterolTotal || null,
        vitaminD: vitaminD || null,
        sleepHours: sleepHours || null,
        stressLevel: stressLevel || "MODERATE",
        onboardingCompleted: true
      },
      create: {
        userId: user.id,
        primaryGoal: primaryGoal || "GENERAL_HEALTH",
        dietType: dietType || "OMNIVORE",
        monthlyBudget: monthlyBudget || null,
        cholesterolTotal: cholesterolTotal || null,
        vitaminD: vitaminD || null,
        sleepHours: sleepHours || null,
        stressLevel: stressLevel || "MODERATE",
        onboardingCompleted: true
      }
    })

    return NextResponse.json({ success: true, healthProfile })
  } catch (error) {
    console.error("Onboarding form error:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
