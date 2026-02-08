import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/db"

export async function GET() {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { profile: true }
    })

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 })
    }

    return NextResponse.json({
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      profile: user.profile
    })
  } catch (error) {
    console.error("Get profile error:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 })
    }

    const body = await request.json()
    const { height, weight, gender, goal, birthDate, activityLevel, targetWeight } = body

    // Calculate BMI, BMR, TDEE
    let bmi = null
    let bmr = null
    let tdee = null
    let dailyCalories = null

    if (height && weight) {
      bmi = weight / Math.pow(height / 100, 2)
      
      // BMR (Mifflin-St Jeor)
      if (gender === "MALE") {
        bmr = 10 * weight + 6.25 * height - 5 * 30 + 5
      } else {
        bmr = 10 * weight + 6.25 * height - 5 * 30 - 161
      }

      // TDEE multiplier
      const activityMultipliers: Record<string, number> = {
        SEDENTARY: 1.2,
        LIGHT: 1.375,
        MODERATE: 1.55,
        ACTIVE: 1.725,
        VERY_ACTIVE: 1.9,
      }
      tdee = bmr * (activityMultipliers[activityLevel] || 1.55)

      // Daily calories based on goal
      if (goal === "LOSE") {
        dailyCalories = Math.round(tdee - 500)
      } else if (goal === "GAIN") {
        dailyCalories = Math.round(tdee + 300)
      } else {
        dailyCalories = Math.round(tdee)
      }
    }

    const profile = await prisma.profile.upsert({
      where: { userId: user.id },
      update: {
        height,
        weight,
        gender,
        goal,
        birthDate: birthDate ? new Date(birthDate) : null,
        activityLevel,
        targetWeight,
        bmi,
        bmr,
        tdee,
        dailyCalories,
      },
      create: {
        userId: user.id,
        height,
        weight,
        gender,
        goal,
        birthDate: birthDate ? new Date(birthDate) : null,
        activityLevel,
        targetWeight,
        bmi,
        bmr,
        tdee,
        dailyCalories,
      },
    })

    return NextResponse.json({ profile })
  } catch (error) {
    console.error("Update profile error:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
