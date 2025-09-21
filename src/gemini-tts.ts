import { GoogleGenAI } from "@google/genai"
import wav from "wav"
import fs from "fs"
import path from "path"

interface TTSConfig {
  text: string
  voice: string
  style?: string
  apiKey: string
  multiSpeaker?: boolean
  speakers?: Array<{
    name: string
    voice: string
  }>
}

async function saveWaveFile(
  filename: string,
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const writer = new wav.FileWriter(filename, {
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    })

    writer.on("finish", resolve)
    writer.on("error", reject)

    writer.write(pcmData)
    writer.end()
  })
}

export async function generateTTSAudio(config: TTSConfig): Promise<string> {
  try {
    if (!config.apiKey) {
      throw new Error("API key is required")
    }

    console.log("[v0] Initializing Google GenAI client...")

    const ai = new GoogleGenAI({ apiKey: config.apiKey })

    let speechConfig
    if (config.multiSpeaker && config.speakers) {
      // Multi-speaker configuration
      speechConfig = {
        multiSpeakerVoiceConfig: {
          speakerVoiceConfigs: config.speakers.map((speaker) => ({
            speaker: speaker.name,
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: speaker.voice },
            },
          })),
        },
      }
    } else {
      // Single speaker configuration
      speechConfig = {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: config.voice },
        },
      }
    }

    console.log("[v0] Making API request to Gemini TTS...")

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: config.text }] }],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig,
      },
    })

    console.log("[v0] API response received, processing...")

    if (!response.candidates || response.candidates.length === 0) {
      throw new Error(
        "No candidates returned from Google AI API. This might indicate an issue with your API key or the request format.",
      )
    }

    const candidate = response.candidates[0]
    if (!candidate.content) {
      throw new Error("No content in API response. The request may have been blocked or filtered.")
    }

    const data = candidate.content.parts?.[0]?.inlineData?.data

    if (!data) {
      throw new Error(
        "No audio data received from API. The response format may be unexpected or the audio generation failed.",
      )
    }

    console.log("[v0] Audio data received, processing...")

    const audioBuffer = Buffer.from(data, "base64")

    // Create temporary file path
    const tempDir = path.join(__dirname, "..", "temp")
    await fs.promises.mkdir(tempDir, { recursive: true })
    const tempFilePath = path.join(tempDir, `audio-${Date.now()}.wav`)

    // Save the PCM data directly as WAV file using Google's recommended approach
    await saveWaveFile(tempFilePath, audioBuffer)

    // Read the properly formatted WAV file and convert to data URL
    const wavFileBuffer = await fs.promises.readFile(tempFilePath)
    const base64Audio = wavFileBuffer.toString("base64")
    const dataUrl = `data:audio/wav;base64,${base64Audio}`

    // Clean up temp file
    await fs.promises.unlink(tempFilePath)

    console.log("[v0] Audio processing complete")

    return dataUrl
  } catch (error) {
    console.error("[v0] TTS generation error:", error)

    if (error instanceof Error) {
      let errorMessage = error.message
      try {
        const errorObj = JSON.parse(error.message)
        if (errorObj.error) {
          errorMessage = `${errorObj.error.code}: ${errorObj.error.message}`
        }
      } catch {
        // If it's not JSON, use the original message
      }

      if (errorMessage.includes("API_KEY_INVALID") || errorMessage.includes("invalid API key")) {
        throw new Error(`Error de API Key: Verifica que tu API key sea válida y tenga permisos para usar Gemini TTS.`)
      } else if (errorMessage.includes("QUOTA_EXCEEDED") || errorMessage.includes("quota")) {
        throw new Error(`Límite de cuota excedido: Has alcanzado el límite de uso de tu API key.`)
      } else if (errorMessage.includes("PERMISSION_DENIED") || errorMessage.includes("permission")) {
        throw new Error(`Error de permisos: Tu API key no tiene permisos para usar esta función.`)
      } else if (errorMessage.includes("network") || errorMessage.includes("fetch")) {
        throw new Error(`Error de conexión: Verifica tu conexión a internet.`)
      } else {
        throw new Error(`Error del servicio TTS: ${errorMessage}`)
      }
    } else {
      throw new Error(`Error desconocido: ${String(error)}`)
    }
  }
}
