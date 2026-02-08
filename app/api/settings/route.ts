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
      include: { settings: true }
    })
    if (!user) return NextResponse.json({ error: "Non trouvé" }, { status: 404 })

    // Mask API keys
    const settings = user.settings ? {
      ...user.settings,
      groqApiKey: user.settings.groqApiKey ? "••••••••" + user.settings.groqApiKey.slice(-4) : null,
      openaiApiKey: user.settings.openaiApiKey ? "••••••••" + user.settings.openaiApiKey.slice(-4) : null,
      claudeApiKey: user.settings.claudeApiKey ? "••••••••" + user.settings.claudeApiKey.slice(-4) : null,
      geminiApiKey: user.settings.geminiApiKey ? "••••••••" + user.settings.geminiApiKey.slice(-4) : null
    } : null

    return NextResponse.json({ settings })
  } catch (error) {
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
    if (!user) return NextResponse.json({ error: "Non trouvé" }, { status: 404 })

    const body = await request.json()
    const { groqApiKey, openaiApiKey, claudeApiKey, geminiApiKey, defaultProvider } = body

    // Only update non-masked values
    const updateData: any = {}
    if (groqApiKey && !groqApiKey.startsWith("••")) updateData.groqApiKey = groqApiKey
    if (openaiApiKey && !openaiApiKey.startsWith("••")) updateData.openaiApiKey = openaiApiKey
    if (claudeApiKey && !claudeApiKey.startsWith("••")) updateData.claudeApiKey = claudeApiKey
    if (geminiApiKey && !geminiApiKey.startsWith("••")) updateData.geminiApiKey = geminiApiKey
    if (defaultProvider) updateData.defaultProvider = defaultProvider

    const settings = await prisma.userSettings.upsert({
      where: { userId: user.id },
      update: updateData,
      create: { userId: user.id, ...updateData }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Settings error:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
