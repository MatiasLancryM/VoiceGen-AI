Generación
de
voz (texto a voz)

\
La API de Gemini puede transformar la entrada de texto en audio de un solo orador o varios oradores con capacidades nativas de generación de texto a voz (TTS). La generación de texto a voz (TTS) es controlable, lo que significa que puedes usar el lenguaje natural para estructurar las interacciones y guiar el estilo, el acento, el ritmo y el tono del audio.

La capacidad de TTS difiere de la generación de voz que se proporciona a través de la API en vivo, que está diseñada para audio interactivo y no estructurado, y entradas y salidas multimodales. Si bien la API de Live se destaca en contextos conversacionales dinámicos, la API de Gemini ofrece TTS diseñado para situaciones que requieren una recitación de texto exacta con un control detallado sobre el estilo y el sonido, como la generación de podcasts o audiolibros.

En esta guía, se muestra cómo generar audio de un solo interlocutor y de varios interlocutores a partir de texto.

Vista previa: La función de texto a voz (TTS) nativa está en vista previa.
Antes de comenzar
Asegúrate de usar una variante del modelo Gemini 2.5 con capacidades nativas de texto a voz (TTS), como se indica en la sección Modelos compatibles. Para obtener resultados óptimos, considera qué modelo se adapta mejor a tu caso de uso específico.

Antes de comenzar a compilar, te recomendamos que pruebes los modelos de TTS de Gemini 2.5 en AI Studio.

Nota: Los modelos de TTS aceptan entradas solo de texto y producen salidas solo de audio. Para obtener una lista completa de las restricciones específicas de los modelos de TTS, consulta la sección Limitaciones.
Texto a voz con un solo interlocutor
Para convertir texto en audio de un solo orador, establece la modalidad de respuesta en "audio" y pasa un objeto SpeechConfig con VoiceConfig establecido. Deberás elegir un nombre de voz de las voces de salida prediseñadas.

En este ejemplo, se guarda el audio de salida del modelo en un archivo wave:

Python
JavaScript
REST

import { GoogleGenAI } from "@google/genai"
import wav from "wav"

async function saveWaveFile(filename, pcmData, channels = 1, rate = 24000, sampleWidth = 2) {
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

async function main() {
  const ai = new GoogleGenAI({})

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: "Say cheerfully: Have a wonderful day!" }] }],
    config: {
      responseModalities: ["AUDIO"],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: "Kore" },
        },
      },
    },
  })

  const data = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data
  const audioBuffer = Buffer.from(data, "base64")

  const fileName = "out.wav"
  await saveWaveFile(fileName, audioBuffer)
}
await main()
\
Texto a voz con varios oradores
Para el audio con varios oradores, necesitarás un objeto MultiSpeakerVoiceConfig con cada orador (hasta 2) configurado como un SpeakerVoiceConfig. Deberás definir cada speaker con los mismos nombres que se usan en la instrucción:

Python
JavaScript
REST

import { GoogleGenAI } from "@google/genai"
import wav from "wav"

async function saveWaveFile(filename, pcmData, channels = 1, rate = 24000, sampleWidth = 2) {
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

async function main() {
  const ai = new GoogleGenAI({})

  const prompt = `TTS the following conversation between Joe and Jane:
         Joe: How's it going today Jane?
         Jane: Not too bad, how about you?`

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: prompt }] }],
    config: {
      responseModalities: ["AUDIO"],
      speechConfig: {
        multiSpeakerVoiceConfig: {
          speakerVoiceConfigs: [
            {
              speaker: "Joe",
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: "Kore" },
              },
            },
            {
              speaker: "Jane",
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: "Puck" },
              },
            },
          ],
        },
      },
    },
  })

  const data = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data
  const audioBuffer = Buffer.from(data, "base64")

  const fileName = "out.wav"
  await saveWaveFile(fileName, audioBuffer)
}

await main()
\
Cómo controlar el estilo de voz con instrucciones
Puedes controlar el estilo, el tono, el acento y el ritmo con instrucciones en lenguaje natural para la función de TTS de un solo orador y de varios oradores. Por ejemplo, en una instrucción de un solo orador, puedes decir lo siguiente:


Say in an spooky whisper:
\"By the pricking of my thumbs...
Something wicked this way comes"
\
En una instrucción con varios oradores, proporciona al modelo el nombre de cada orador y la transcripción correspondiente. También puedes brindar orientación para cada orador de forma individual:


Make Speaker1 sound tired and bored, and Speaker2 sound excited and happy:

Speaker1: So... what's on the agenda today?
\
Speaker2: You're never going to guess!
\
Intenta usar una opción de voz que corresponda al estilo o la emoción que quieres transmitir para enfatizarlo aún más. En la instrucción anterior, por ejemplo, el tono jadeante de Enceladus podría enfatizar "cansado" y "aburrido", mientras que el tono alegre de Puck podría complementar "emocionado" y "feliz".

Generar una instrucción para convertirla en audio
Los modelos de TTS solo generan audio, pero puedes usar otros modelos para generar primero una transcripción y, luego, pasarla al modelo de TTS para que la lea en voz alta.

Python
JavaScript

import { GoogleGenAI } from "@google/genai"

const ai = new GoogleGenAI({})

async function main() {
  const transcript = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents:
      "Generate a short transcript around 100 words that reads like it was clipped from a podcast by excited herpetologists. The hosts names are Dr. Anya and Liam.",
  })

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: transcript,
    config: {
      responseModalities: ["AUDIO"],
      speechConfig: {
        multiSpeakerVoiceConfig: {
          speakerVoiceConfigs: [
            {
              speaker: "Dr. Anya",
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: "Kore" },
              },
            },
            {
              speaker: "Liam",
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: "Puck" },
              },
            },
          ],
        },
      },
    },
  })
}
// ..JavaScript code for exporting .wav file for output audio

await main()
Opciones
de
voz
\
Los modelos de TTS admiten las siguientes 30 opciones de voz en el campo voice_name:

Zephyr: Iluminación	Puck: Optimista	Charon: Informativa
Kore, Firme	Fenrir: Excitabilidad	Leda: Juvenil
Orus, Firme	Aoede: Breezy	Callirrhoe: Voz tranquila
Autonoe: Brillante	Enceladus: Respiración	Iapetus: Claro
Umbriel: Relajado	Algieba: Suave	Despina: Suave
Erinome: Despejado	Algenib: Arenosa	Rasalgethi: Informativa
Laomedeia: Optimista	Achernar: Suave	Alnilam: Firme
Schedar: Par	Gacrux: Contenido para mayores	Pulcherrima: Hacia adelante
Achird: Amistoso	Zubenelgenubi: Casual	Vindemiatrix: Suave
Sadachbia: Animada	Sadaltager: Conocimiento	Sulafat: Cálida
Puedes escuchar todas las opciones de voz en AI Studio.

Idiomas admitidos
Los modelos de TTS detectan automáticamente el idioma de entrada. Admiten los siguientes 24 idiomas:

Idioma	Código BCP-47	Idioma	Código BCP-47
Árabe (Egipto)	ar-EG	Alemán (Alemania)	de-DE
Inglés (EE.UU.)	en-US	Español (EE.UU.)	es-US
Francés (Francia)	fr-FR	Hindi (India)	hi-IN
Indonesio (Indonesia)	id-ID	Italiano (Italia)	it-IT
Japonés (Japón)	ja-JP	Coreano (Corea)	ko-KR
Portugués (Brasil)	pt-BR	Ruso (Rusia)	ru-RU
Neerlandés (Países Bajos)	nl-NL	Polaco (Polonia)	pl-PL
Tailandés (Tailandia)	th-TH	Turco (Türkiye)	tr-TR
Vietnamita (Vietnam)	vi-VN	Rumano (Rumania)	ro-RO
Ucraniano (Ucrania)	uk-UA	Bengalí (Bangladés)	bn-BD
Inglés (India)	Paquete de en-IN y hi-IN	Maratí (India)	mr-IN
Tamil (India)	ta-IN	Telugu (India)	te-IN
Modelos compatibles
Modelo	Interlocutor único	Varios oradores
Gemini 2.5 Flash Preview TTS	✔️	✔️
Vista previa de TTS de Gemini 2.5 Pro	✔️	✔️
Limitaciones
Los modelos de TTS solo pueden recibir entradas de texto y generar salidas de audio.
Una sesión de TTS tiene un límite de ventana de contexto de 32,000 tokens.
Revisa la sección Idiomas para conocer los idiomas admitidos.
