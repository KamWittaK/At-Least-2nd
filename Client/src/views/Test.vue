<script setup>
import { ref } from "vue"

const loading = ref(false)

const playTTS = async () => {
  loading.value = true

  try {
    // 1️⃣ Fetch a random trash talk message
    const trashRes = await fetch("http://localhost:8000/trashtalk")
    if (!trashRes.ok) throw new Error(`HTTP error! status: ${trashRes.status}`)
    const { message } = await trashRes.json()

    // 2️⃣ Fetch TTS audio for that message
    const ttsRes = await fetch(`http://localhost:8000/tts?text=${encodeURIComponent(message)}`)
    if (!ttsRes.ok) throw new Error(`HTTP error! status: ${ttsRes.status}`)
    const blob = await ttsRes.blob()
    const audioUrl = URL.createObjectURL(blob)

    // 3️⃣ Play the audio
    const audio = new Audio(audioUrl)
    await audio.play()

    // 4️⃣ Revoke URL after playback to free memory
    audio.onended = () => URL.revokeObjectURL(audioUrl)

  } catch (err) {
    console.error("Error playing TTS:", err)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <button class="getMessage" @click="playTTS">
    {{ loading ? "Talking..." : "Trash Talk!" }}
  </button>
</template>

<style scoped>
.getMessage {
  background-color: #4CAF50;
  border: none;
  color: white;
  padding: 15px 32px;
  text-align: center;
  font-size: 16px;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  cursor: pointer;
}
.getMessage:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>