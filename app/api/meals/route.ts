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

    const meals = await prisma.meal.findMany({
      where: { userId: user.id },
      orderBy: { date: "desc" },
      take: 50
    })

    return NextResponse.json({ meals })
  } catch (error) {
    console.error("Get meals error:", error)
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

    const data = await request.json()

    const meal = await prisma.meal.create({
      data: {
        userId: user.id,
        name: data.name,
        description: data.description,
        mealType: data.mealType || "SNACK",
        calories: data.calories,
        protein: data.protein,
        carbs: data.carbs,
        fat: data.fat,
        imageUrl: data.imageUrl,
        aiAnalysis: data.aiAnalysis,
      }
    })

    return NextResponse.json({ meal })
  } catch (error) {
    console.error("Create meal error:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
