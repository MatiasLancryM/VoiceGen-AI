import { GoogleGenAI } from "@google/genai";
import wav from "wav";
import fs from "fs";

export async function saveWaveFile(filename: string, pcmData: Buffer, channels = 1, rate = 24000, sampleWidth = 2): Promise<void> {
  return new Promise((resolve, reject) => {
    const writer = new wav.FileWriter(filename, {
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });
    writer.on("finish", resolve);
    writer.on("error", reject);
    writer.write(pcmData);
    writer.end();
  });
}

export async function ttsGemini(text: string, voice: string, outputFile: string): Promise<void> {
  const ai = new GoogleGenAI({});
  const response = await ai.models.generateContent({
    model: "gemini-2.5-tts", // Ajusta el modelo según disponibilidad
    prompt: text,
    response_modality: "audio",
    speech_config: {
      voice_config: {
        name: voice,
      },
    },
  });
  // Suponiendo que response.audio contiene el buffer PCM
  await saveWaveFile(outputFile, response.audio);
}
