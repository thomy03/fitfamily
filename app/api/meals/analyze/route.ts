import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import Groq from "groq-sdk"

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
})

// Analyse d'IMAGE
async function analyzeImage(imageBase64: string) {
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

  return response.choices[0]?.message?.content || "{}"
}

// Analyse de TEXTE (description naturelle)
async function analyzeText(description: string) {
  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content: `Tu es un nutritionniste expert. Analyse les descriptions de repas et estime les calories et macronutriments.
Réponds TOUJOURS en JSON valide, rien d'autre.`
      },
      {
        role: "user",
        content: `Analyse ce repas et estime les informations nutritionnelles:

"${description}"

Réponds UNIQUEMENT en JSON avec ce format exact:
{
  "name": "nom résumé du repas",
  "description": "description détaillée",
  "calories": nombre total,
  "protein": grammes de protéines,
  "carbs": grammes de glucides,
  "fat": grammes de lipides,
  "confidence": "high" ou "medium" ou "low",
  "items": ["aliment 1 (Xcal)", "aliment 2 (Xcal)", ...]
}

Sois précis dans tes estimations basées sur des portions standard françaises.`
      }
    ],
    max_tokens: 500,
    temperature: 0.3,
  })

  return response.choices[0]?.message?.content || "{}"
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    const body = await request.json()
    const { imageBase64, text } = body

    if (!imageBase64 && !text) {
      return NextResponse.json({ error: "Image ou description requise" }, { status: 400 })
    }

    let content: string

    if (text) {
      // Mode texte : description naturelle
      content = await analyzeText(text)
    } else {
      // Mode image
      content = await analyzeImage(imageBase64)
    }
    
    // Parse JSON from response
    let analysis
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : { error: "Impossible d'analyser" }
    } catch {
      analysis = { 
        name: "Repas",
        description: text || "Repas non identifié",
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
