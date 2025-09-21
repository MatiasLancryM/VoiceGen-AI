import "./index.css"

interface TTSConfig {
  text: string
  voice: string
  style?: string
  apiKey: string // Added apiKey to config interface
}

class TTSApp {
  private textInput: HTMLTextAreaElement
  private voiceSelect: HTMLSelectElement
  private styleInput: HTMLInputElement
  private generateBtn: HTMLButtonElement
  private clearBtn: HTMLButtonElement
  private audioSection: HTMLElement
  private errorSection: HTMLElement
  private audioPlayer: HTMLAudioElement
  private downloadBtn: HTMLButtonElement
  private themeToggle: HTMLButtonElement
  private errorMessage: HTMLElement
  private settingsBtn: HTMLButtonElement
  private settingsModal: HTMLElement
  private closeSettingsBtn: HTMLButtonElement
  private apiKeyInput: HTMLInputElement
  private saveApiKeyBtn: HTMLButtonElement
  private apiStatus: HTMLElement
  private configureApiBtn: HTMLButtonElement

  constructor() {
    this.initializeElements()
    this.setupEventListeners()
    this.initializeTheme()
    this.checkApiKeyStatus() // Check API key on startup
  }

  private initializeElements(): void {
    this.textInput = document.getElementById("text-input") as HTMLTextAreaElement
    this.voiceSelect = document.getElementById("voice-select") as HTMLSelectElement
    this.styleInput = document.getElementById("style-input") as HTMLInputElement
    this.generateBtn = document.getElementById("generate-btn") as HTMLButtonElement
    this.clearBtn = document.getElementById("clear-btn") as HTMLButtonElement
    this.audioSection = document.getElementById("audio-section") as HTMLElement
    this.errorSection = document.getElementById("error-section") as HTMLElement
    this.audioPlayer = document.getElementById("audio-player") as HTMLAudioElement
    this.downloadBtn = document.getElementById("download-btn") as HTMLButtonElement
    this.themeToggle = document.getElementById("theme-toggle") as HTMLButtonElement
    this.errorMessage = document.getElementById("error-message") as HTMLElement
    this.settingsBtn = document.getElementById("settings-btn") as HTMLButtonElement
    this.settingsModal = document.getElementById("settings-modal") as HTMLElement
    this.closeSettingsBtn = document.getElementById("close-settings") as HTMLButtonElement
    this.apiKeyInput = document.getElementById("api-key-input") as HTMLInputElement
    this.saveApiKeyBtn = document.getElementById("save-api-key") as HTMLButtonElement
    this.apiStatus = document.getElementById("api-status") as HTMLElement
    this.configureApiBtn = document.getElementById("configure-api") as HTMLButtonElement
  }

  private setupEventListeners(): void {
    this.generateBtn.addEventListener("click", () => this.generateAudio())
    this.clearBtn.addEventListener("click", () => this.clearForm())
    this.downloadBtn.addEventListener("click", () => this.downloadAudio())
    this.themeToggle.addEventListener("click", () => this.toggleTheme())

    this.settingsBtn.addEventListener("click", () => this.openSettings())
    this.closeSettingsBtn.addEventListener("click", () => this.closeSettings())
    this.saveApiKeyBtn.addEventListener("click", () => this.saveApiKey())
    this.configureApiBtn.addEventListener("click", () => this.openSettings())

    // Close modal when clicking outside
    this.settingsModal.addEventListener("click", (e) => {
      if (e.target === this.settingsModal) {
        this.closeSettings()
      }
    })

    // Auto-resize textarea
    this.textInput.addEventListener("input", () => {
      this.textInput.style.height = "auto"
      this.textInput.style.height = this.textInput.scrollHeight + "px"
    })
  }

  private checkApiKeyStatus(): void {
    const apiKey = localStorage.getItem("google-ai-api-key")
    if (!apiKey) {
      this.apiStatus.style.display = "block"
      this.generateBtn.disabled = true
    } else {
      this.apiStatus.style.display = "none"
      this.generateBtn.disabled = false
    }
  }

  private openSettings(): void {
    const apiKey = localStorage.getItem("google-ai-api-key")
    if (apiKey) {
      this.apiKeyInput.value = apiKey
    }
    this.settingsModal.style.display = "flex"
  }

  private closeSettings(): void {
    this.settingsModal.style.display = "none"
    this.apiKeyInput.value = ""
  }

  private saveApiKey(): void {
    const apiKey = this.apiKeyInput.value.trim()
    if (!apiKey) {
      this.showError("Por favor, ingresa una API key válida.")
      return
    }

    localStorage.setItem("google-ai-api-key", apiKey)
    this.closeSettings()
    this.checkApiKeyStatus()
    console.log("[v0] API key saved successfully")
  }

  private initializeTheme(): void {
    const savedTheme = localStorage.getItem("theme") || "light"
    if (savedTheme === "dark") {
      document.body.classList.add("dark")
      this.themeToggle.textContent = "☀️"
    }
  }

  private toggleTheme(): void {
    const isDark = document.body.classList.toggle("dark")
    this.themeToggle.textContent = isDark ? "☀️" : "🌙"
    localStorage.setItem("theme", isDark ? "dark" : "light")
  }

  private clearForm(): void {
    this.textInput.value = ""
    this.styleInput.value = ""
    this.hideAudioSection()
    this.hideErrorSection()
    this.textInput.focus()
  }

  private async generateAudio(): Promise<void> {
    const text = this.textInput.value.trim()
    const apiKey = localStorage.getItem("google-ai-api-key")

    if (!apiKey) {
      this.showError("Por favor, configura tu API key de Google AI primero.")
      this.openSettings()
      return
    }

    if (!text) {
      this.showError("Por favor, ingresa el texto que quieres convertir a audio.")
      return
    }

    this.setLoading(true)
    this.hideErrorSection()
    this.hideAudioSection()

    try {
      const config: TTSConfig = {
        text: this.buildPrompt(text),
        voice: this.voiceSelect.value,
        style: this.styleInput.value.trim(),
        apiKey: apiKey,
      }

      console.log("[v0] Generating audio with config:", { ...config, apiKey: "***" })

      const result = await window.electronAPI.generateTTS(config)

      if (result.success) {
        this.showAudioResult(result.audioData)
        console.log("[v0] Audio generated successfully")
      } else {
        throw new Error(result.error || "Unknown error occurred")
      }
    } catch (error) {
      console.error("[v0] Error generating audio:", error)
      const errorMessage = error instanceof Error ? error.message : String(error)
      this.showError(errorMessage)
    } finally {
      this.setLoading(false)
    }
  }

  private buildPrompt(text: string): string {
    const style = this.styleInput.value.trim()
    if (style) {
      return `Say in a ${style} way: ${text}`
    }
    return text
  }

  private showAudioResult(audioData: string): void {
    this.audioPlayer.src = audioData
    this.audioSection.style.display = "block"
    this.audioSection.scrollIntoView({ behavior: "smooth" })
  }

  private async downloadAudio(): Promise<void> {
    try {
      const audioData = this.audioPlayer.src
      const filename = `audio-${Date.now()}.wav`

      const savedPath = await window.electronAPI.saveAudioFile(audioData, filename)

      if (savedPath) {
        console.log("[v0] Audio saved to:", savedPath)
      }
    } catch (error) {
      console.error("[v0] Error saving audio:", error)
      this.showError("Error al guardar el archivo de audio.")
    }
  }

  private setLoading(loading: boolean): void {
    this.generateBtn.disabled = loading
    this.generateBtn.classList.toggle("loading", loading)
  }

  private showError(message: string): void {
    this.errorMessage.textContent = message
    this.errorSection.style.display = "block"
    this.errorSection.scrollIntoView({ behavior: "smooth" })

    console.error("[v0] Displaying error to user:", message)
  }

  private hideAudioSection(): void {
    this.audioSection.style.display = "none"
  }

  private hideErrorSection(): void {
    this.errorSection.style.display = "none"
  }
}

// Initialize the app when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  console.log("[v0] TTS App initializing...")
  new TTSApp()
  console.log("[v0] TTS App initialized successfully")
})
