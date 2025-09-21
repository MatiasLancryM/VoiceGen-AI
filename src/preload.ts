import { contextBridge, ipcRenderer } from "electron"

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld("electronAPI", {
  generateTTS: (config: any) => ipcRenderer.invoke("generate-tts", config),
  saveAudioFile: (audioData: string, filename: string) => ipcRenderer.invoke("save-audio-file", audioData, filename),
  openFileDialog: () => ipcRenderer.invoke("open-file-dialog"),
  showSaveDialog: (options: any) => ipcRenderer.invoke("show-save-dialog", options),
})

// Type definitions for the exposed API
declare global {
  interface Window {
    electronAPI: {
      generateTTS: (config: any) => Promise<any>
      saveAudioFile: (audioData: string, filename: string) => Promise<string>
      openFileDialog: () => Promise<any>
      showSaveDialog: (options: any) => Promise<any>
    }
  }
}
