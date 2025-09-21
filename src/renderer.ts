import "./index.css"

interface TTSConfig {
    text: string
    voice: string
    style?: string
    apiKey?: string
}

class TTSApp {
    private textInput: HTMLTextAreaElement
    private voiceSelect: HTMLSelectElement
    private styleInput: HTMLInputElement
    private apiKeyInput: HTMLInputElement
    private generateBtn: HTMLButtonElement
    private clearBtn: HTMLButtonElement
    private audioSection: HTMLElement
    private errorSection: HTMLElement
    private audioPlayer: HTMLAudioElement
    private downloadBtn: HTMLButtonElement
    private themeToggle: HTMLButtonElement
    private errorMessage: HTMLElement

    constructor() {
        this.initializeElements()
        this.setupEventListeners()
        this.initializeTheme()
    }

    private initializeElements(): void {
        this.textInput = document.getElementById("text-input") as HTMLTextAreaElement
        this.voiceSelect = document.getElementById("voice-select") as HTMLSelectElement
        this.styleInput = document.getElementById("style-input") as HTMLInputElement
        this.apiKeyInput = document.getElementById("api-key-input") as HTMLInputElement
        this.generateBtn = document.getElementById("generate-btn") as HTMLButtonElement
        this.clearBtn = document.getElementById("clear-btn") as HTMLButtonElement
        this.audioSection = document.getElementById("audio-section") as HTMLElement
        this.errorSection = document.getElementById("error-section") as HTMLElement
        this.audioPlayer = document.getElementById("audio-player") as HTMLAudioElement
        this.downloadBtn = document.getElementById("download-btn") as HTMLButtonElement
        this.themeToggle = document.getElementById("theme-toggle") as HTMLButtonElement
        this.errorMessage = document.getElementById("error-message") as HTMLElement
    }

    private setupEventListeners(): void {
        this.generateBtn.addEventListener("click", () => this.generateAudio())
        this.clearBtn.addEventListener("click", () => this.clearForm())
        this.downloadBtn.addEventListener("click", () => this.downloadAudio())
        this.themeToggle.addEventListener("click", () => this.toggleTheme())

        // Auto-resize textarea
        this.textInput.addEventListener("input", () => {
            this.textInput.style.height = "auto"
            this.textInput.style.height = this.textInput.scrollHeight + "px"
        })
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
                apiKey: this.apiKeyInput.value.trim(),
            }

            console.log("[v0] Generating audio with config:", config)

            const result = await window.electronAPI.generateTTS(config)

            if (result.success) {
                this.showAudioResult(result.audioData)
                console.log("[v0] Audio generated successfully")
            } else {
                console.log(result)
                throw new Error(result.error || "Unknown error occurred")
            }
        } catch (error) {
            // Mostrar el mensaje real del error si existe
            let errorMsg = "Error al generar el audio."
            if (error instanceof Error && error) {
                errorMsg = error.message
            } else if (typeof error === "string") {
                errorMsg = error
            } else if (error && (error as any).message) {
                errorMsg = (error as any).message
            }
            this.showError(errorMsg)
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

    private async simulateAPICall(config: TTSConfig): Promise<void> {
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 2000))

        // For demo purposes, show a placeholder audio
        // In real implementation, this would be the actual audio from Gemini API
        this.showAudioResult(
            "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT",
        )

        console.log("[v0] Audio generated successfully")
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
                // Could show a success message here
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
