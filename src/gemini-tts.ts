import {GoogleGenAI} from "@google/genai"
import fs from "fs"
import path from "path"
import {promisify} from "util"
import wav from "wav"

const writeFile = promisify(fs.writeFile)

interface TTSConfig {
    text: string
    voice: string
    style?: string
    multiSpeaker?: boolean
    speakers?: Array<{
        name: string
        voice: string
    }>
    apiKey: string // <-- Nuevo campo para la API key
}

export async function generateTTSAudio(config: TTSConfig): Promise<string> {
    // Obtener la API key del parámetro config
    const apiKey = config.apiKey
    if (!apiKey) {
        throw new Error("La API key es requerida")
    }
    let ai = null
    try {
        ai = new GoogleGenAI({apiKey})
    } catch (error) {
        console.error("Error initializing GoogleGenAI:", error)
        throw new Error("Error initializing GoogleGenAI: " + (error as Error).message)
    }


    let speechConfig

    if (config.multiSpeaker && config.speakers) {
        // Multi-speaker configuration
        speechConfig = {
            multiSpeakerVoiceConfig: {
                speakerVoiceConfigs: config.speakers.map((speaker) => ({
                    speaker: speaker.name,
                    voiceConfig: {
                        prebuiltVoiceConfig: {voiceName: speaker.voice},
                    },
                })),
            },
        }
    } else {
        // Single speaker configuration
        speechConfig = {
            voiceConfig: {
                prebuiltVoiceConfig: {voiceName: config.voice},
            },
        }
    }

    console.log("[v0] Making API request to Gemini TTS...")

    let response
    try {
        response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{parts: [{text: config.text}]}],
            config: {
                responseModalities: ["AUDIO"],
                speechConfig,
            },
        })
    } catch (error) {
        throw new Error(JSON.parse(error?.message).error.message)
    }

    const data = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data

    if (!data) {
        throw new Error("No audio data received from API")
    }

    console.log("[v0] Audio data received, processing...")

    // Convertir base64 a buffer
    const audioBuffer = Buffer.from(data, "base64")

    // Guardar el buffer PCM como WAV usando saveWaveFile
    const tempDir = path.join(__dirname, "..", "temp")
    await fs.promises.mkdir(tempDir, {recursive: true})

    const tempFilePath = path.join(tempDir, `audio-${Date.now()}.wav`)
    await saveWaveFile(tempFilePath, audioBuffer)

    // Leer el archivo y convertir a base64 data URL
    const fileBuffer = await fs.promises.readFile(tempFilePath)
    const base64Audio = fileBuffer.toString("base64")
    const dataUrl = `data:audio/wav;base64,${base64Audio}`

    // Eliminar el archivo temporal
    await fs.promises.unlink(tempFilePath)

    console.log("[v0] Audio processing complete")

    return dataUrl

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
