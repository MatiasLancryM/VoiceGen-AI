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
    contents: [{ role: "user", parts: [{ text }] }],
    speech_config: {
      voice_config: {
        name: voice,
      },
    },
  });
  // Obtener el audio de la respuesta (usando inlineData.data)
  const part = response.candidates?.[0]?.content?.parts?.[0];
  const audioBase64 = part?.inlineData?.data;
  if (!audioBase64) throw new Error("No se recibió audio de Gemini");
  await saveWaveFile(outputFile, Buffer.from(audioBase64, 'base64'));
}
