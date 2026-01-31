import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import Groq from "groq-sdk"

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
})

export async function POST(request: Request) {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    const { imageBase64 } = await request.json()

    if (!imageBase64) {
      return NextResponse.json({ error: "Image requise" }, { status: 400 })
    }

    const response = await groq.chat.completions.create({
      model: "llama-3.2-90b-vision-preview",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyse cette image de repas et estime les informations nutritionnelles.
              
Réponds UNIQUEMENT en JSON valide avec ce format exact:
{
  "name": "nom du plat",
  "description": "description courte",
  "calories": nombre,
  "protein": nombre en grammes,
  "carbs": nombre en grammes,
  "fat": nombre en grammes,
  "confidence": "high" | "medium" | "low",
  "items": ["ingrédient 1", "ingrédient 2"]
}

Si tu ne peux pas identifier le repas, utilise des estimations raisonnables.`
            },
            {
              type: "image_url",
              image_url: {
                url: imageBase64.startsWith("data:") ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`
              }
            }
          ]
        }
      ],
      max_tokens: 500,
      temperature: 0.3,
    })

    const content = response.choices[0]?.message?.content || "{}"
    
    // Try to parse JSON from response
    let analysis
    try {
      // Extract JSON from response (in case there's extra text)
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : { error: "Impossible d'analyser" }
    } catch {
      analysis = { 
        name: "Repas non identifié",
        calories: 400,
        protein: 20,
        carbs: 40,
        fat: 15,
        confidence: "low"
      }
    }

    return NextResponse.json({ analysis })
  } catch (error) {
    console.error("Analyze meal error:", error)
    return NextResponse.json({ error: "Erreur d'analyse" }, { status: 500 })
  }
}
