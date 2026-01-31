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

    return NextResponse.json({ profile: user?.profile })
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

    const data = await request.json()
    
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 })
    }

    // Calculate BMI, BMR, TDEE
    let bmi = null, bmr = null, tdee = null, dailyCalories = null

    if (data.height && data.weight) {
      const heightM = data.height / 100
      bmi = data.weight / (heightM * heightM)

      // Mifflin-St Jeor Equation for BMR
      if (data.birthDate) {
        const age = Math.floor((Date.now() - new Date(data.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
        if (data.gender === "MALE") {
          bmr = 10 * data.weight + 6.25 * data.height - 5 * age + 5
        } else {
          bmr = 10 * data.weight + 6.25 * data.height - 5 * age - 161
        }

        // TDEE based on activity level
        const activityMultipliers: Record<string, number> = {
          SEDENTARY: 1.2,
          LIGHT: 1.375,
          MODERATE: 1.55,
          ACTIVE: 1.725,
          VERY_ACTIVE: 1.9,
        }
        tdee = bmr * (activityMultipliers[data.activityLevel] || 1.55)

        // Daily calories based on goal
        if (data.goal === "LOSE") {
          dailyCalories = Math.round(tdee - 500) // 500 cal deficit
        } else if (data.goal === "GAIN") {
          dailyCalories = Math.round(tdee + 300) // 300 cal surplus
        } else {
          dailyCalories = Math.round(tdee)
        }
      }
    }

    const profile = await prisma.profile.upsert({
      where: { userId: user.id },
      update: {
        ...data,
        birthDate: data.birthDate ? new Date(data.birthDate) : undefined,
        bmi,
        bmr,
        tdee,
        dailyCalories,
      },
      create: {
        userId: user.id,
        ...data,
        birthDate: data.birthDate ? new Date(data.birthDate) : undefined,
        bmi,
        bmr,
        tdee,
        dailyCalories,
      }
    })

    // Log weight if changed
    if (data.weight) {
      await prisma.weightLog.create({
        data: {
          userId: user.id,
          weight: data.weight,
        }
      })
    }

    return NextResponse.json({ profile })
  } catch (error) {
    console.error("Update profile error:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
