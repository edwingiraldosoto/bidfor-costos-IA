import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY")
const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages"

interface InvoiceRequest {
  base64: string
  motors: string[]
  temperatura: number
  prompt: string
}

serve(async (req) => {
  // CORS headers
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    })
  }

  try {
    const { base64, motors, temperatura, prompt } = (await req.json()) as InvoiceRequest

    if (!ANTHROPIC_API_KEY) {
      return new Response(JSON.stringify({ error: "API key not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    }

    const errors: Array<{ motor: string; error: string }> = []

    // Intentar con cada motor en orden
    for (const motor of motors) {
      try {
        console.log(`[${motor}] Intentando análisis...`)

        const response = await fetch(ANTHROPIC_API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": ANTHROPIC_API_KEY,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: motor,
            max_tokens: 1024,
            temperature: temperatura,
            messages: [
              {
                role: "user",
                content: [
                  {
                    type: "image",
                    source: {
                      type: "base64",
                      media_type: "application/pdf",
                      data: base64,
                    },
                  },
                  {
                    type: "text",
                    text: prompt,
                  },
                ],
              },
            ],
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          const errorMsg = errorData.error?.message || "Unknown error"
          errors.push({ motor, error: errorMsg })
          console.warn(`[${motor}] Falló: ${errorMsg}`)
          continue
        }

        const data = await response.json()
        const extractedText = data.content[0].text

        // Parsear JSON
        const jsonMatch = extractedText.match(/\{[\s\S]*\}/)
        if (!jsonMatch) {
          errors.push({ motor, error: "No JSON found in response" })
          continue
        }

        const extractedData = JSON.parse(jsonMatch[0])
        extractedData._motorUsado = motor

        console.log(`[${motor}] ✅ Éxito`)

        return new Response(JSON.stringify(extractedData), {
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        })
      } catch (motorError) {
        const errorMsg = motorError instanceof Error ? motorError.message : String(motorError)
        errors.push({ motor, error: errorMsg })
        console.warn(`[${motor}] Error: ${errorMsg}`)
      }
    }

    // Si llegamos aquí, todos los motores fallaron
    const errorMessage = `Todos los motores fallaron:\n${errors.map((e) => `- ${e.motor}: ${e.error}`).join("\n")}`

    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 400,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error("Function error:", errorMsg)

    return new Response(JSON.stringify({ error: errorMsg }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    })
  }
})
