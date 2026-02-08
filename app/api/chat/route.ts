import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/db"
import Groq from "groq-sdk"

export async function GET() {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })
    if (!user) return NextResponse.json({ error: "Non trouvé" }, { status: 404 })

    const messages = await prisma.chatMessage.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "asc" },
      take: 50
    })

    return NextResponse.json({ messages })
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
      include: { settings: true, profile: true }
    })
    if (!user) return NextResponse.json({ error: "Non trouvé" }, { status: 404 })

    const body = await request.json()
    const { message } = body

    if (!message) {
      return NextResponse.json({ error: "Message requis" }, { status: 400 })
    }

    // Save user message
    await prisma.chatMessage.create({
      data: { userId: user.id, role: "user", content: message }
    })

    // Get recent messages for context
    const recentMessages = await prisma.chatMessage.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 10
    })

    // Get API key (user's or default)
    const apiKey = user.settings?.groqApiKey || process.env.GROQ_API_KEY

    if (!apiKey) {
      return NextResponse.json({ error: "Aucune clé API configurée" }, { status: 400 })
    }

    const groq = new Groq({ apiKey })

    // Build context
    const systemPrompt = `Tu es Jarvis, un assistant santé et fitness personnel pour ${user.name || "l'utilisateur"}.
Tu aides avec: nutrition, compléments alimentaires, entraînement, perte/prise de poids.
Sois concis, amical et pratique. Réponds en français.
${user.profile ? `Profil: ${user.profile.weight}kg, objectif: ${user.profile.goal}` : ""}`

    const chatHistory = recentMessages.reverse().map(m => ({
      role: m.role as "user" | "assistant",
      content: m.content
    }))

    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        ...chatHistory
      ],
      max_tokens: 1000,
      temperature: 0.7
    })

    const assistantMessage = response.choices[0]?.message?.content || "Désolé, je n'ai pas pu répondre."

    // Save assistant message
    await prisma.chatMessage.create({
      data: { userId: user.id, role: "assistant", content: assistantMessage, provider: "groq" }
    })

    return NextResponse.json({ message: assistantMessage })
  } catch (error) {
    console.error("Chat error:", error)
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

    await prisma.chatMessage.deleteMany({ where: { userId: user.id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
