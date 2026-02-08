import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/db"

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    const supplement = await prisma.supplement.findUnique({
      where: { id: params.id },
      include: { logs: { orderBy: { takenAt: "desc" }, take: 30 } }
    })

    if (!supplement) {
      return NextResponse.json({ error: "Non trouvé" }, { status: 404 })
    }

    return NextResponse.json({ supplement })
  } catch (error) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    const body = await request.json()
    const { name, brand, dosage, frequency, timeOfDay, purchaseUrl, notes, active } = body

    const supplement = await prisma.supplement.update({
      where: { id: params.id },
      data: { name, brand, dosage, frequency, timeOfDay, purchaseUrl, notes, active }
    })

    return NextResponse.json({ supplement })
  } catch (error) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    await prisma.supplement.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
