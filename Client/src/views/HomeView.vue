<script setup>
import { onMounted, ref, computed, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useHackStore } from '../stores/index.js'

const router = useRouter()
const hackStore = useHackStore()

// ======================
// Reactive State
// ======================
const displayEnteringToast = ref(false)
const loading = ref(false)
const balance = ref(hackStore.balance)
const spendings = ref(hackStore.spendings)
const savings = ref(hackStore.savings)
const showModal = ref(false)

// Modal & Form State
const savingsPercentage = ref(hackStore.savingPercentage )

// ======================
// Live Clock
// ======================
const currentTime = ref('')

let clockInterval = null

const updateClock = () => {
  const now = new Date()
  currentTime.value = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  })
}

const startLiveClock = () => {
  updateClock() // Initial update
  clockInterval = setInterval(updateClock, 1000)
}

// ======================
// Open Mystery Box
// ======================
const openBox = (boxElement) => {
  if (!boxElement || boxElement.classList.contains('open')) return

  boxElement.classList.add('open')
  spawnBurstParticles(boxElement)
}

// Reactive state
const showToast = ref(false)
const toastMessage = ref('⚡ ENTERING THE ARENA...')

// Optional: Allow dynamic messages in the future
const showEnteringToast = (message = '⚡ ENTERING THE ARENA...') => {
  toastMessage.value = message
  showToast.value = true

  // Auto hide after 2.8 seconds
  setTimeout(() => {
    showToast.value = false
  }, 4000)
}

// Trigger function (replaces handlePlay)
const handlePlay = (e) => {
  // loading.value = true
  // e.stopPropagation()

  // // Trigger the toast with burst effect centered on screen
  // showEnteringToast()

  // // Spawn burst particles at center of screen
  // spawnBurstAtCenter()

  showModal.value = true
}

// Helper to spawn burst at screen center (cleaner than fake element)
// const spawnBurstAtCenter = () => {
//   const centerX = window.innerWidth / 2
//   const centerY = window.innerHeight / 2 - 20   // slight offset like before

//   spawnBurst({
//     getBoundingClientRect: () => ({
//       left: centerX - 70,
//       top: centerY - 20,
//       width: 140,
//       height: 40,
//     })
//   })
// }

// ======================
// Particle Burst Effect (Modern Vue-friendly approach)
// ======================
const spawnBurstParticles = (el) => {
  const rect = el.getBoundingClientRect()
  const centerX = rect.left + rect.width / 2
  const centerY = rect.top + rect.height / 2

  const colors = ['#FFD700', '#C060FF', '#00F5FF', '#FF8C00', '#ffffff']

  for (let i = 0; i < 24; i++) {
    const particle = document.createElement('div')
    particle.className = 'burst-particle'

    const angle = (i / 24) * Math.PI * 2
    const distance = 60 + Math.random() * 80
    const color = colors[i % colors.length]

    particle.style.cssText = `
      left: ${centerX}px;
      top: ${centerY}px;
      background: ${color};
      box-shadow: 0 0 8px ${color};
      --bx: ${Math.cos(angle) * distance}px;
      --by: ${Math.sin(angle) * distance}px;
    `

    document.body.appendChild(particle)

    // Cleanup
    setTimeout(() => particle.remove(), 850)
  }
}

// const isValid = computed(() => {
//   const savings = Number(savingsPercent.value)
//   const spending = Number(spendingPercent.value)
//   return savings >= 0 && spending >= 0 && savings + spending === 100
// })

const openModal = () => {
  showModal.value = true
  // Reset values when opening
  // savingsPercent.value = 40
  // spendingPercent.value = 60
  errorMessage.value = ''
}

const closeModal = () => {
  showModal.value = false
}

const startGame = () => {


  closeModal()

  router.push('/wheel')
}

// ======================
// Lifecycle Hooks
// ======================
onMounted(() => {
  startLiveClock()
})

onUnmounted(() => {
  if (clockInterval) {
    clearInterval(clockInterval)
  }
})

// ======================
// Expose to template (optional but clean)
// ======================
defineExpose({
  openBox,
  balance,
  currentTime,
})
</script>

<template>
  <main>
    <!-- Background layers -->
    <div id="stars"></div>
    <div id="grid"></div>
    <div id="scanlines"></div>
    <div id="vignette"></div>

    <!-- Energy rings -->
    <div
      class="ring"
      style="--rt: 4s; --rd: 0s; width: 300px; height: 300px; border-color: rgba(0, 245, 255, 0.15)"
    ></div>
    <div
      class="ring"
      style="
        --rt: 4s;
        --rd: 1.3s;
        width: 300px;
        height: 300px;
        border-color: rgba(192, 96, 255, 0.12);
      "
    ></div>
    <div
      class="ring"
      style="
        --rt: 4s;
        --rd: 2.6s;
        width: 300px;
        height: 300px;
        border-color: rgba(255, 215, 0, 0.1);
      "
    ></div>

    


    <!-- Toast notification -->
    <div>
      <!-- Toast using v-show + transition for smoother animation -->
      <Transition name="toast">
        <div v-show="showToast" class="toast">
          {{ toastMessage }}
        </div>
      </Transition>
    </div>

    <!-- Main Content -->
    <div id="app">
      <div id="title-section">
        <div id="subtitle">[{{ currentTime }}]</div>
        <div id="main-title">Enter<br />The Arena</div>
        <div id="tagline">Your <span>destiny</span> awaits</div>
      </div>

      <div id="stats-bar">
        <div class="stat-item" style="--sd: 0.4s">
          <div class="stat-value">${{ spendings.toFixed(2) }}</div>
          <div class="stat-label">Spendings</div>
        </div>
        <div class="stat-item" style="--sd: 0.8s">
          <div class="stat-value">${{ savings.toFixed(2) }}</div>
          <div class="stat-label">Savings</div>
        </div>
      </div>

      <!-- Mystery Box -->
      <div id="mystery-container">
        <div id="mystery-box" @click="openBox($event.currentTarget)">
          <div class="box-beam"></div>
          <div class="box-body">
            <div class="box-pattern"></div>
            <div class="box-qmark">?</div>
            <div class="box-ribbon-h"></div>
            <div class="box-ribbon-v"></div>
          </div>
          <div class="box-lid">
            <div class="box-lid-body"></div>
          </div>
          <!-- Play Button inside box -->
          <div id="play-btn">
            <button class="play-btn-inner" @click="showModal = true">
              <span class="play-icon"></span>PLAY NOW
            </button>
          </div>
        </div>
        <div id="click-hint">▼ click to open ▼</div>
      </div>
    </div>

    <!-- Bottom HUD -->
    <div id="bottom-hud">
      <p class="hud-btn">The House Always Wins!!</p>
    </div>

    <!-- Modal -->
    <Transition name="modal">
  <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
    <div class="modal-content">
      <div class="scanlines" aria-hidden="true"/>

      <!-- Corner accents via CSS pseudo-elements -->
      <button class="modal-close" @click="closeModal">✕</button>

      <div class="modal-eyebrow">mission briefing</div>
      <h2>SET YOUR<br/>SAVINGS GOAL</h2>
      <p class="modal-sub">How much of your income will you commit to saving?</p>

      <!-- Slider -->
      <div class="goal-section">
        <div class="goal-label">
          <span>🎯 TARGET</span>
          <span class="goal-value">{{ hackStore.savingPercentage }}%</span>
        </div>
        <input
          v-model.number="hackStore.savingPercentage"
          type="range" min="0" max="100"
          :style="{ background: `linear-gradient(90deg, #00e5ff ${hackStore.savingPercentage}%, #1a1a3a ${hackStore.savingPercentage}%)` }"
        />
        <div class="xp-bar-wrap">
          <span class="xp-bar-label">POWER</span>
          <div class="xp-bar-track">
            <div class="xp-bar-fill" :style="{ width: hackStore.savingPercentage + '%' }"/>
          </div>
        </div>
      </div>

      <!-- Manual input -->
      <div class="input-group">
        <label>💾 OR ENTER EXACT %</label>
        <input
          v-model.number="savingsPercentage"
          type="number" min="0" max="100"
          placeholder="e.g. 40"
        />
      </div>

      <button class="start-game-btn"  @click="startGame">
        ▶ &nbsp; ENTER THE ARENA
      </button>
    </div>
  </div>
</Transition>
  </main>
</template>

<style scoped>
main {
  width: 100%;
  height: 100%;
  background: var(--dark);
  color: #fff;
  font-family: 'Exo 2', sans-serif;
  overflow: hidden;
}

/* ── STAR FIELD ── */
#stars {
  position: fixed;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
}
.star {
  position: absolute;
  border-radius: 50%;
  background: #fff;
  animation: twinkle var(--t) infinite ease-in-out;
  animation-delay: var(--d);
  opacity: 0;
}
@keyframes twinkle {
  0%,
  100% {
    opacity: 0;
    transform: scale(0.5);
  }
  50% {
    opacity: var(--o);
    transform: scale(1);
  }
}

/* ── GRID FLOOR ── */
#grid {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 55vh;
  z-index: 1;
  background:
    linear-gradient(transparent 80%, var(--dark) 100%),
    repeating-linear-gradient(90deg, transparent, transparent 59px, rgba(0, 245, 255, 0.07) 60px),
    repeating-linear-gradient(180deg, transparent, transparent 59px, rgba(0, 245, 255, 0.07) 60px);
  transform: perspective(600px) rotateX(55deg);
  transform-origin: bottom center;
  pointer-events: none;
}

/* ── SCANLINES ── */
#scanlines {
  position: fixed;
  inset: 0;
  z-index: 2;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 3px,
    rgba(0, 0, 0, 0.12) 4px
  );
  pointer-events: none;
}

/* ── VIGNETTE ── */
#vignette {
  position: fixed;
  inset: 0;
  z-index: 2;
  background: radial-gradient(ellipse at center, transparent 40%, rgba(0, 0, 0, 0.8) 100%);
  pointer-events: none;
}

/* ── FLOATING PARTICLES ── */
.particle {
  position: fixed;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  pointer-events: none;
  z-index: 3;
  animation: floatUp var(--pt) linear infinite;
  animation-delay: var(--pd);
}
@keyframes floatUp {
  0% {
    transform: translateY(100vh) scale(0);
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  90% {
    opacity: 0.6;
  }
  100% {
    transform: translateY(-10vh) scale(1);
    opacity: 0;
  }
}

/* ── MAIN LAYOUT ── */
#app {
  position: relative;
  z-index: 10;
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

/* ── HUD TOP BAR ── */
#hud {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 28px;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.7) 0%, transparent 100%);
  border-bottom: 1px solid rgba(0, 245, 255, 0.1);
}

#logo {
  font-size: 22px;
  font-weight: 900;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  background: linear-gradient(90deg, var(--cyan), var(--purple-bright));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  filter: drop-shadow(0 0 12px rgba(0, 245, 255, 0.5));
  animation: logoPulse 3s ease-in-out infinite;
}
@keyframes logoPulse {
  0%,
  100% {
    filter: drop-shadow(0 0 8px rgba(0, 245, 255, 0.4));
  }
  50% {
    filter: drop-shadow(0 0 20px rgba(0, 245, 255, 0.9));
  }
}

#hud-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

#balance-panel {
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(255, 215, 0, 0.07);
  border: 1px solid rgba(255, 215, 0, 0.25);
  border-radius: 8px;
  padding: 7px 16px;
  position: relative;
  overflow: hidden;
  animation: balanceGlow 2s ease-in-out infinite;
}
@keyframes balanceGlow {
  0%,
  100% {
    box-shadow: 0 0 10px rgba(255, 215, 0, 0.1);
  }
  50% {
    box-shadow: 0 0 22px rgba(255, 215, 0, 0.3);
  }
}

.coin-icon {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 35%, #ffe566, var(--gold-dim));
  border: 1.5px solid #ffe566;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  line-height: 1;
  box-shadow: 0 0 8px rgba(255, 215, 0, 0.6);
  animation: coinSpin 4s linear infinite;
}
@keyframes coinSpin {
  0% {
    transform: rotateY(0deg);
  }
  50% {
    transform: rotateY(90deg);
    width: 4px;
  }
  51% {
    transform: rotateY(90deg);
    width: 4px;
  }
  100% {
    transform: rotateY(0deg);
  }
}

#balance-label {
  font-family: 'Share Tech Mono', monospace;
  font-size: 11px;
  color: rgba(255, 215, 0, 0.6);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
#balance-amount {
  font-family: 'Share Tech Mono', monospace;
  font-size: 17px;
  font-weight: 700;
  color: var(--gold);
  letter-spacing: 0.05em;
  text-shadow: 0 0 12px rgba(255, 215, 0, 0.6);
}
#balance-amount .cents {
  font-size: 12px;
  opacity: 0.7;
}

#player-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 6px 12px;
}

.avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--purple), var(--cyan-dim));
  border: 2px solid var(--cyan);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  box-shadow: 0 0 10px rgba(0, 245, 255, 0.4);
}

.player-name {
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: rgba(255, 255, 255, 0.9);
}

.player-level {
  font-family: 'Share Tech Mono', monospace;
  font-size: 10px;
  color: var(--cyan);
  opacity: 0.8;
}

/* ── TITLE SECTION ── */
#title-section {
  text-align: center;
  margin-bottom: 36px;
  animation: titleReveal 1s ease-out both;
}
@keyframes titleReveal {
  from {
    opacity: 0;
    transform: translateY(-30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

#subtitle {
  font-family: 'Share Tech Mono', monospace;
  font-size: 12px;
  letter-spacing: 0.4em;
  text-transform: uppercase;
  color: var(--cyan);
  opacity: 0.8;
  margin-bottom: 10px;
}

#main-title {
  font-size: clamp(42px, 7vw, 82px);
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  line-height: 0.9;
  background: linear-gradient(180deg, #fff 0%, rgba(200, 180, 255, 0.7) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  filter: drop-shadow(0 0 30px rgba(139, 47, 201, 0.4));
}

#tagline {
  margin-top: 10px;
  font-size: 14px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.4);
}
#tagline span {
  color: var(--purple-bright);
}

/* ── STATS BAR ── */
#stats-bar {
  display: flex;
  gap: 24px;
  margin-bottom: 40px;
  animation: titleReveal 1s 0.2s ease-out both;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 20px;
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: 6px;
  position: relative;
  overflow: hidden;
}
.stat-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(0, 245, 255, 0.5), transparent);
  animation: scanBar 2s linear infinite;
  animation-delay: var(--sd);
}
@keyframes scanBar {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

.stat-value {
  font-family: 'Share Tech Mono', monospace;
  font-size: 20px;
  font-weight: 700;
  color: var(--cyan);
  text-shadow: 0 0 10px rgba(0, 245, 255, 0.5);
}
.stat-label {
  font-size: 9px;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.4);
  margin-top: 2px;
}

/* ── MYSTERY BOX + PLAY BUTTON ── */
#mystery-container {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  animation: titleReveal 1s 0.4s ease-out both;
}

#mystery-box {
  position: relative;
  width: 140px;
  height: 140px;
  cursor: pointer;
  transition: transform 0.1s;
  filter: drop-shadow(0 0 30px rgba(192, 96, 255, 0.5));
}
#mystery-box:hover {
  transform: scale(1.05);
}
#mystery-box:active {
  transform: scale(0.97);
}

/* Box body */
.box-body {
  position: absolute;
  bottom: 0;
  left: 10px;
  right: 10px;
  height: 88px;
  background: linear-gradient(135deg, #1e0a40, #2a0d5e);
  border: 2px solid var(--purple-bright);
  border-radius: 4px;
  overflow: hidden;
  box-shadow:
    0 0 30px rgba(192, 96, 255, 0.4),
    inset 0 0 20px rgba(192, 96, 255, 0.1);
  transition: box-shadow 0.3s;
}
#mystery-box:hover .box-body {
  box-shadow:
    0 0 50px rgba(192, 96, 255, 0.7),
    inset 0 0 30px rgba(192, 96, 255, 0.2);
}

/* Box pattern */
.box-pattern {
  position: absolute;
  inset: 0;
  background:
    repeating-linear-gradient(45deg, transparent, transparent 14px, rgba(192, 96, 255, 0.08) 15px),
    repeating-linear-gradient(-45deg, transparent, transparent 14px, rgba(192, 96, 255, 0.08) 15px);
}

/* Question mark */
.box-qmark {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 44px;
  font-weight: 900;
  color: var(--purple-bright);
  text-shadow: 0 0 20px rgba(192, 96, 255, 0.8);
  animation: qmarkPulse 2s ease-in-out infinite;
}
@keyframes qmarkPulse {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.6;
    transform: scale(0.92);
  }
}

/* Box ribbon */
.box-ribbon-h,
.box-ribbon-v {
  position: absolute;
  background: var(--purple-bright);
  opacity: 0.5;
}
.box-ribbon-h {
  top: 50%;
  left: 0;
  right: 0;
  height: 2px;
  transform: translateY(-50%);
}
.box-ribbon-v {
  left: 50%;
  top: 0;
  bottom: 0;
  width: 2px;
  transform: translateX(-50%);
}

/* Box lid */
.box-lid {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 58px;
  transform-origin: bottom center;
  transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.box-lid-body {
  position: absolute;
  bottom: 0;
  left: 5px;
  right: 5px;
  top: 10px;
  background: linear-gradient(135deg, #2a0d5e, #3d1580);
  border: 2px solid var(--purple-bright);
  border-radius: 4px 4px 0 0;
  box-shadow: 0 0 20px rgba(192, 96, 255, 0.3);
  overflow: hidden;
}
.box-lid-body::after {
  content: '';
  position: absolute;
  inset: 0;
  background:
    repeating-linear-gradient(45deg, transparent, transparent 14px, rgba(192, 96, 255, 0.08) 15px),
    repeating-linear-gradient(-45deg, transparent, transparent 14px, rgba(192, 96, 255, 0.08) 15px);
}

/* Open state */
#mystery-box.open .box-lid {
  transform: rotateX(-110deg) translateY(-10px);
  filter: drop-shadow(0 -10px 20px rgba(192, 96, 255, 0.5));
}
#mystery-box.open .box-body {
  box-shadow:
    0 0 60px rgba(192, 96, 255, 0.9),
    inset 0 0 40px rgba(255, 215, 0, 0.2);
}

/* Light beam from box */
.box-beam {
  position: absolute;
  bottom: 88px;
  left: 50%;
  transform: translateX(-50%);
  width: 60px;
  height: 0;
  background: linear-gradient(0deg, rgba(255, 215, 0, 0.5), transparent);
  clip-path: polygon(30% 100%, 70% 100%, 100% 0%, 0% 0%);
  transition:
    height 0.4s ease-out 0.2s,
    opacity 0.4s;
  opacity: 0;
  pointer-events: none;
  z-index: -1;
}
#mystery-box.open .box-beam {
  height: 120px;
  opacity: 1;
}

/* ── PLAY BUTTON emerges from box ── */
#play-btn {
  position: absolute;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%) translateY(40px) scale(0.5);
  opacity: 0;
  pointer-events: none;
  transition:
    transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.15s,
    opacity 0.4s ease 0.15s;
  white-space: nowrap;
  z-index: 20;
}
#mystery-box.open #play-btn {
  transform: translateX(-50%) translateY(-160px) scale(1);
  opacity: 1;
  pointer-events: auto;
}

.play-btn-inner {
  position: relative;
  padding: 18px 48px;
  border: none;
  border-radius: 6px;
  background: linear-gradient(135deg, #ffd700 0%, #ff8c00 100%);
  color: #1a0a00;
  font-family: 'Exo 2', sans-serif;
  font-size: 20px;
  font-weight: 900;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  cursor: pointer;
  outline: none;
  overflow: hidden;
  box-shadow:
    0 0 30px rgba(255, 215, 0, 0.5),
    0 4px 20px rgba(0, 0, 0, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
  transition:
    transform 0.15s,
    box-shadow 0.15s;
  animation: btnFloat 2s ease-in-out infinite 0.8s;
}

@keyframes btnFloat {
  0%,
  100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-6px);
  }
}
.play-btn-inner:hover {
  box-shadow:
    0 0 60px rgba(255, 215, 0, 0.8),
    0 6px 30px rgba(0, 0, 0, 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.4);
  transform: scale(1.05);
  animation: none;
}
.play-btn-inner:active {
  transform: scale(0.97);
}

/* Shimmer sweep on button */
.play-btn-inner::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 60%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
  animation: shimmer 2s infinite 1.5s;
}
@keyframes shimmer {
  0% {
    left: -100%;
  }
  100% {
    left: 200%;
  }
}

/* Play triangle icon */
.play-icon {
  display: inline-block;
  margin-right: 10px;
  vertical-align: middle;
  width: 0;
  height: 0;
  border-top: 10px solid transparent;
  border-bottom: 10px solid transparent;
  border-left: 16px solid rgba(0, 0, 0, 0.7);
}

/* ── BOX SHAKE ANIMATION ── */
#mystery-box:not(.open) {
  animation: boxShake 4s ease-in-out infinite;
}
@keyframes boxShake {
  0%,
  85%,
  100% {
    transform: rotate(0deg);
  }
  87% {
    transform: rotate(-3deg);
  }
  89% {
    transform: rotate(3deg);
  }
  91% {
    transform: rotate(-2deg);
  }
  93% {
    transform: rotate(2deg);
  }
  95% {
    transform: rotate(0deg);
  }
}

/* ── ENERGY RINGS ── */
.ring {
  position: fixed;
  border-radius: 50%;
  border: 1px solid;
  pointer-events: none;
  z-index: 5;
  animation: ringPulse var(--rt) ease-out infinite;
  animation-delay: var(--rd);
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  opacity: 0;
}
@keyframes ringPulse {
  0% {
    transform: translate(-50%, -50%) scale(0.2);
    opacity: 0.6;
  }
  100% {
    transform: translate(-50%, -50%) scale(2.5);
    opacity: 0;
  }
}


/* ── BOTTOM HUD ── */
#bottom-hud {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  gap: 32px;
  padding: 12px 0 16px;
  background: linear-gradient(0deg, rgba(0, 0, 0, 0.7) 0%, transparent 100%);
  border-top: 1px solid rgba(0, 245, 255, 0.08);
  z-index: 30;
}

.hud-btn {
  font-family: 'Share Tech Mono', monospace;
  font-size: 11px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.4);
  background: none;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  padding: 6px 16px;
  cursor: pointer;
  transition: all 0.2s;
}
.hud-btn:hover {
  color: var(--cyan);
  border-color: rgba(0, 245, 255, 0.4);
  background: rgba(0, 245, 255, 0.05);
}

/* ── EXPLOSION BURST ── */
.burst-particle {
  position: fixed;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  pointer-events: none;
  z-index: 100;
  animation: burst 0.8s ease-out forwards;
}
@keyframes burst {
  0% {
    transform: translate(0, 0) scale(1);
    opacity: 1;
  }
  100% {
    transform: translate(var(--bx), var(--by)) scale(0);
    opacity: 0;
  }
}

/* ── CLICK HINT ── */
#click-hint {
  margin-top: 128px;
  font-family: 'Share Tech Mono', monospace;
  font-size: 11px;
  letter-spacing: 0.25em;
  text-transform: uppercase;
  color: rgba(192, 96, 255, 0.6);
  animation: hintBlink 1.8s ease-in-out infinite;
}
@keyframes hintBlink {
  0%,
  100% {
    opacity: 0.4;
  }
  50% {
    opacity: 0.9;
  }
}
#mystery-box.open ~ #click-hint {
  display: none;
}

/* ── NOTIFICATION TOAST ── */
.toast {
  position: fixed;
  top: 80px;
  left: 50%;
  transform: translateX(-50%) translateY(-100px); /* hidden position */
  z-index: 200;
  background: rgba(255, 215, 0, 0.1);
  border: 1px solid rgba(255, 215, 0, 0.4);
  border-radius: 8px;
  padding: 12px 24px;
  font-family: 'Share Tech Mono', monospace;
  font-size: 13px;
  color: var(--gold);
  letter-spacing: 0.08em;
  text-align: center;
  pointer-events: none;
  white-space: nowrap;
  opacity: 0; /* start invisible */
}

/* Enter Animation */
.toast-enter-active {
  transition:
    transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1),
    opacity 0.4s ease;
}

.toast-enter-from {
  transform: translateX(-50%) translateY(-100px);
  opacity: 0;
}

.toast-enter-to {
  transform: translateX(-50%) translateY(0);
  opacity: 1;
}

/* Leave Animation - stays in center until it starts leaving */
.toast-leave-active {
  transition:
    transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1),
    opacity 0.4s ease;
}

.toast-leave-from {
  transform: translateX(-50%) translateY(0);
  opacity: 1;
}

.toast-leave-to {
  transform: translateX(-50%) translateY(-100px);
  opacity: 0;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-content {
  background: #0f0f1a;
  border: 2px solid #c060ff;
  border-radius: 16px;
  padding: 40px 50px;
  width: 90%;
  max-width: 420px;
  position: relative;
  text-align: center;
  box-shadow: 0 0 40px rgba(192, 96, 255, 0.4);
}

.modal-close {
  position: absolute;
  top: 16px;
  right: 20px;
  background: none;
  border: none;
  font-size: 24px;
  color: #aaa;
  cursor: pointer;
  transition: color 0.2s;
}

.modal-close:hover {
  color: white;
}

.modal-content h2 {
  margin: 0 0 16px 0;
  color: #ffd700;
  font-size: 28px;
}

.modal-message {
  color: #ccc;
  margin-bottom: 30px;
  line-height: 1.5;
}

.input-group {
  margin-bottom: 20px;
  text-align: left;
}

.input-group label {
  display: block;
  margin-bottom: 6px;
  color: #aaa;
  font-size: 14px;
}

.input-group input {
  width: 100%;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid #555;
  border-radius: 8px;
  color: white;
  font-size: 18px;
}

.input-group input:focus {
  outline: none;
  border-color: #c060ff;
  box-shadow: 0 0 0 3px rgba(192, 96, 255, 0.2);
}

.error {
  color: #ff3a3a;
  margin: 10px 0 20px;
  font-size: 14px;
}

.start-game-btn {
  width: 100%;
  padding: 14px;
  margin-top: 10px;
  background: linear-gradient(90deg, #c060ff, #00f5ff);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
}

.start-game-btn:hover:not(:disabled) {
  transform: scale(1.03);
  box-shadow: 0 0 20px rgba(192, 96, 255, 0.6);
}

.start-game-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Modal Transition */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-to,
.modal-leave-from {
  opacity: 1;
}
</style>
