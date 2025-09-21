# VoiceGen AI - Text to Speech Electron App

Una aplicación de escritorio para convertir texto a voz utilizando la API de Google Gemini.

## Características

- 🎙️ Conversión de texto a voz con IA de Google Gemini
- 🎨 Interfaz moderna y responsive
- 🌙 Modo oscuro/claro
- 🔊 30+ voces disponibles
- 💾 Descarga de archivos de audio
- 🎯 Control de estilo de voz con lenguaje natural

## Configuración

### Prerrequisitos

- Node.js (versión 18 o superior)
- npm o yarn
- API Key de Google AI

### Instalación

1. Clona el repositorio:
\`\`\`bash
git clone <repository-url>
cd voicegen-ai
\`\`\`

2. Instala las dependencias:
\`\`\`bash
npm install
\`\`\`

3. Configura tu API Key de Google AI:
\`\`\`bash
export GOOGLE_AI_API_KEY="tu-api-key-aqui"
\`\`\`

### Desarrollo

Para ejecutar la aplicación en modo desarrollo:

\`\`\`bash
npm start
\`\`\`

### Construcción

Para crear un ejecutable:

\`\`\`bash
npm run make
\`\`\`

## Uso

1. Ingresa el texto que quieres convertir a voz
2. Selecciona una voz de la lista desplegable
3. Opcionalmente, agrega un estilo (ej: "alegre", "susurrando")
4. Haz clic en "Generar Audio"
5. Reproduce el audio generado
6. Descarga el archivo si lo deseas

## Voces Disponibles

La aplicación incluye 30+ voces con diferentes características:
- Kore (Firme)
- Puck (Optimista)
- Zephyr (Iluminación)
- Fenrir (Excitabilidad)
- Y muchas más...

## Tecnologías

- Electron
- TypeScript
- Google Gemini AI API
- Vite
- CSS personalizado con variables de diseño

## Licencia

MIT License
