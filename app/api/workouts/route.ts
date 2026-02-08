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

    const workouts = await prisma.workout.findMany({
      where: { userId: user.id },
      orderBy: { date: "desc" },
      take: 50,
    })

    // Stats du jour
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const todayWorkouts = workouts.filter(w => new Date(w.date) >= today)
    const todayCalories = todayWorkouts.reduce((sum, w) => sum + (w.calories || 0), 0)
    const todayDuration = todayWorkouts.reduce((sum, w) => sum + w.duration, 0)

    return NextResponse.json({
      workouts,
      stats: {
        todayCalories,
        todayDuration,
        todayCount: todayWorkouts.length,
      }
    })
  } catch (error) {
    console.error("GET /api/workouts error:", error)
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
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 })
    }

    const body = await request.json()
    const { name, type, duration, calories } = body

    if (!name || !type || !duration) {
      return NextResponse.json({ error: "Données manquantes" }, { status: 400 })
    }

    const workout = await prisma.workout.create({
      data: {
        userId: user.id,
        name,
        type,
        duration: parseInt(duration),
        calories: calories ? parseInt(calories) : null,
        completed: true,
      }
    })

    return NextResponse.json({ workout })
  } catch (error) {
    console.error("POST /api/workouts error:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
