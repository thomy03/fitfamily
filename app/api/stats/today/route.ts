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
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 })
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const meals = await prisma.meal.findMany({
      where: {
        userId: user.id,
        date: { gte: today, lt: tomorrow }
      }
    })

    const workouts = await prisma.workout.findMany({
      where: {
        userId: user.id,
        date: { gte: today, lt: tomorrow },
        completed: true
      }
    })

    const caloriesEaten = meals.reduce((sum, m) => sum + (m.calories || 0), 0)
    const caloriesBurned = workouts.reduce((sum, w) => sum + (w.calories || 0), 0)

    return NextResponse.json({
      caloriesEaten,
      caloriesBurned,
      workoutsCompleted: workouts.length,
      mealsLogged: meals.length
    })
  } catch (error) {
    console.error("Get stats error:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
