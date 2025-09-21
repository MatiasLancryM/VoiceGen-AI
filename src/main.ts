import { app, BrowserWindow, ipcMain, dialog } from "electron"
import path from "node:path"
import started from "electron-squirrel-startup"
import fs from "fs/promises"

// Declare global variables
declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string
declare const MAIN_WINDOW_VITE_NAME: string

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit()
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL)
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`))
  }

  if (process.env.NODE_ENV === "development") {
    mainWindow.webContents.openDevTools()
  }
}

ipcMain.handle("generate-tts", async (event, config) => {
  try {
    console.log("[v0] Generating TTS with config:", { ...config, apiKey: "***" })

    process.env.GOOGLE_GENAI_API_KEY = config.apiKey

    // Import the TTS service with correct path
    const { generateTTSAudio } = await import("./gemini-tts")

    // Generate the audio
    const audioData = await generateTTSAudio(config)

    return { success: true, audioData }
  } catch (error) {
    console.error("[v0] TTS generation error:", error)

    let errorMessage = "Error desconocido al generar audio"

    if (error instanceof Error) {
      errorMessage = error.message

      // Handle specific Google AI API errors
      if (error.message.includes("API_KEY_INVALID")) {
        errorMessage = "API key inválida. Verifica tu clave de Google AI."
      } else if (error.message.includes("QUOTA_EXCEEDED")) {
        errorMessage = "Cuota de API excedida. Verifica tu límite de uso."
      } else if (error.message.includes("bufferutil")) {
        errorMessage = "Error de dependencias. Reinstala las dependencias del proyecto."
      } else if (error.message.includes("fetch")) {
        errorMessage = "Error de conexión. Verifica tu conexión a internet."
      }
    }

    return { success: false, error: errorMessage }
  }
})

ipcMain.handle("save-audio-file", async (event, audioData, filename) => {
  try {
    const { filePath } = await dialog.showSaveDialog({
      defaultPath: filename,
      filters: [
        { name: "Audio Files", extensions: ["wav"] },
        { name: "All Files", extensions: ["*"] },
      ],
    })

    if (filePath) {
      // Convert base64 to buffer and save
      const buffer = Buffer.from(audioData.split(",")[1], "base64")
      await fs.writeFile(filePath, buffer)
      return filePath
    }

    return null
  } catch (error) {
    console.error("[v0] Save file error:", error)
    throw error
  }
})

ipcMain.handle("show-save-dialog", async (event, options) => {
  return await dialog.showSaveDialog(options)
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", createWindow)

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit()
  }
})

app.on("activate", () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
