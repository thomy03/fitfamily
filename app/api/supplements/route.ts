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
    if (!user) return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 })

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const supplements = await prisma.supplement.findMany({
      where: { userId: user.id, active: true },
      include: {
        logs: {
          where: {
            takenAt: { gte: today, lt: tomorrow }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    })

    return NextResponse.json({ supplements })
  } catch (error) {
    console.error("Get supplements error:", error)
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
    if (!user) return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 })

    const body = await request.json()
    const { name, brand, dosage, frequency, timeOfDay, purchaseUrl, notes } = body

    if (!name) {
      return NextResponse.json({ error: "Nom requis" }, { status: 400 })
    }

    const supplement = await prisma.supplement.create({
      data: {
        userId: user.id,
        name,
        brand,
        dosage,
        frequency: frequency || "daily",
        timeOfDay,
        purchaseUrl,
        notes
      }
    })

    return NextResponse.json({ supplement }, { status: 201 })
  } catch (error) {
    console.error("Create supplement error:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
