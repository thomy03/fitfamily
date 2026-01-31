import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import webpush from "web-push"

webpush.setVapidDetails(
  process.env.VAPID_EMAIL || "mailto:contact@fitfamily.com",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "",
  process.env.VAPID_PRIVATE_KEY || ""
)

function getParisTime() {
  const now = new Date()
  return new Date(now.toLocaleString("en-US", { timeZone: "Europe/Paris" }))
}

// Meal reminders based on time of day
function getMealReminder(hour: number): { title: string, body: string, mealType: string } | null {
  if (hour === 8) {
    return { title: "🌅 Petit-déjeuner", body: "As-tu pris ton petit-déj ? Note-le !", mealType: "BREAKFAST" }
  }
  if (hour === 12) {
    return { title: "☀️ Déjeuner", body: "Cest lheure de manger ! Noublie pas de noter ton repas.", mealType: "LUNCH" }
  }
  if (hour === 16) {
    return { title: "🍎 Collation", body: "Un petit snack ? Note-le pour suivre tes calories.", mealType: "SNACK" }
  }
  if (hour === 19) {
    return { title: "🌙 Dîner", body: "Bon appétit ! Pense à noter ton dîner.", mealType: "DINNER" }
  }
  return null
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization")
    if (authHeader !== `Bearer ${process.env.CRON_SECRET || "fitfamily-cron"}`) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const now = getParisTime()
    const hour = now.getHours()
    
    const reminder = getMealReminder(hour)
    if (!reminder) {
      return NextResponse.json({ sent: 0, reason: "No reminder at this hour" })
    }

    // Get all users with push subscriptions
    const subscriptions = await prisma.pushSubscription.findMany({
      include: { user: true }
    })

    let sent = 0
    let errors = 0

    const payload = JSON.stringify({
      title: reminder.title,
      body: reminder.body,
      icon: "/icon-192.png",
      tag: `meal-reminder-${reminder.mealType}`,
      url: "/meals/add"
    })

    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification({
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth }
        }, payload)
        sent++
      } catch (err: unknown) {
        const error = err as { statusCode?: number }
        errors++
        if (error.statusCode === 410 || error.statusCode === 404) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } })
        }
      }
    }

    return NextResponse.json({ sent, errors, hour, reminder: reminder.title })
  } catch (error) {
    console.error("Send notifications error:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
