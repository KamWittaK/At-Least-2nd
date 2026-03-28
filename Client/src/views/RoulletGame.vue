<template>
  <main>
    <!-- ambient bg -->
    <div class="felt-bg" aria-hidden="true" />
    <div class="vignette" aria-hidden="true" />

    <!-- wheel section -->
    <section class="wheel-section">
      <!-- outer decorative ring -->
      <div class="wheel-outer">
        <div class="wheel-track">
          <canvas ref="canvasRef" width="420" height="420" class="wheel-canvas" />
          <!-- ball -->
          <div class="ball" :style="ballStyle" :class="{ rolling: isSpinning }" />
        </div>
        <!-- pointer -->
        <div class="needle">▼</div>
      </div>

      <!-- result flash -->
      <Transition name="result">
        <div v-if="lastResult !== null && !isSpinning" class="result-badge" :class="resultColor">
          <span class="result-num">{{ lastResult }}</span>
          <span class="result-label">{{ resultLabel }}</span>
        </div>
      </Transition>
    </section>

    <!-- betting board -->
    <section class="betting">
      <div class="bet-controls">
        <div class="chip-row">
          <button
            v-for="chip in chips"
            :key="chip"
            class="chip"
            :class="{ active: selectedChip === chip }"
            :style="{ '--cc': chipColor(chip) }"
            @click="selectedChip = chip"
          >
            {{ chip }}
          </button>
        </div>

        <div class="action-row">
          <button class="clear-btn" @click="clearBets" :disabled="isSpinning">CLEAR</button>
          <button class="spin-btn" @click="spinWheel" :disabled="isSpinning || totalBet === 0">
            <span v-if="!isSpinning">SPIN &nbsp;·&nbsp; {{ totalBet }} 🪙</span>
            <span v-else class="spin-loading"><i /><i /><i /></span>
          </button>
        </div>
      </div>

      <!-- number grid -->
      <div class="grid-wrap">
        <div class="num-grid">
          <!-- zero -->
          <button
            class="cell zero"
            :class="{ betted: getBet('n0') > 0 }"
            @click="placeBet('n0')"
            :disabled="isSpinning"
          >
            0
          </button>

          <!-- 1–36 -->
          <button
            v-for="n in 36"
            :key="n"
            class="cell"
            :class="[numColor(n), { betted: getBet('n' + n) > 0 }]"
            @click="placeBet('n' + n)"
            :disabled="isSpinning"
          >
            {{ n }}
            <span v-if="getBet('n' + n) > 0" class="bet-chip">{{ getBet('n' + n) }}</span>
          </button>
        </div>

        <!-- outside bets -->
        <div class="outside-bets">
          <button
            v-for="ob in outsideBets"
            :key="ob.id"
            class="outside-cell"
            :class="{ betted: getBet(ob.id) > 0 }"
            @click="placeBet(ob.id)"
            :disabled="isSpinning"
          >
            {{ ob.label }}
            <span v-if="getBet(ob.id) > 0" class="bet-chip">{{ getBet(ob.id) }}</span>
          </button>
        </div>
      </div>

      <!-- history -->
      <div class="history">
        <span class="history-label">RECENT</span>
        <div class="history-nums">
          <span v-for="(h, i) in history" :key="i" class="h-num" :class="numColor(h)">{{ h }}</span>
        </div>
      </div>
    </section>

    <!-- win toast -->
    <Transition name="toast">
      <div v-if="toastMsg" class="toast">{{ toastMsg }}</div>
    </Transition>

    <!-- ── Celebration overlay ── -->
    <Transition name="celebrate">
      <div v-if="showCelebration" class="celebration-overlay">
        <canvas ref="confettiCanvas" class="confetti-canvas" />
        <div class="celebrate-content">
          <div class="trophy-bounce">🏆</div>
          <h2 class="celebrate-title">GOAL REACHED!</h2>
          <p class="celebrate-sub">Your savings mission is complete</p>
          <div class="balloon-row" aria-hidden="true">
            <span v-for="b in balloons" :key="b.id" class="balloon" :style="b.style">{{
              b.emoji
            }}</span>
          </div>
          <div class="firework-row" aria-hidden="true">
            <span
              v-for="f in 6"
              :key="f"
              class="firework"
              :style="`--d:${f * 0.18}s;--x:${10 + f * 14}%`"
            />
          </div>
        </div>
      </div>
    </Transition>

    <!-- trash talk -->
    <Transition name="trash">
      <div v-if="showTrashTalk" class="trash-talk">
        <div class="trash-border-tl" />
        <div class="trash-border-br" />
        <span class="trash-icon">💀</span>
        <span class="trash-text">{{ trashTalk }}</span>
        <span class="trash-icon">💀</span>
      </div>
    </Transition>
  </main>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useHackStore } from '../stores/index.js'
import { useRouter } from 'vue-router'

const router = useRouter()
const hackStore = useHackStore()
const showCelebration = ref(false)
const showTrashTalk = ref(false)

const trashTalk = computed(() => {
  // randomly pick a trash talk line from the hack store
  return hackStore.trashTalks[Math.floor(Math.random() * hackStore.trashTalks.length)]
})

// ── Roulette data ──────────────────────────────────────────────
const NUMBERS = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14,
  31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26,
]
const RED_NUMS = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 21, 23, 25, 27, 30, 32, 34, 36])



const confettiCanvas = ref(null)

const balloons = [
  { id: 1, emoji: '🎈', style: '--delay:0s;  --x:8%;  --size:3rem' },
  { id: 2, emoji: '🎉', style: '--delay:.3s; --x:22%; --size:2.4rem' },
  { id: 3, emoji: '🎈', style: '--delay:.6s; --x:40%; --size:3.5rem' },
  { id: 4, emoji: '🥳', style: '--delay:.2s; --x:58%; --size:2.8rem' },
  { id: 5, emoji: '🎊', style: '--delay:.5s; --x:74%; --size:2.4rem' },
  { id: 6, emoji: '🎈', style: '--delay:.1s; --x:88%; --size:3rem' },
]

function launchConfetti() {
  const canvas = confettiCanvas.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight

  const COLORS = ['#f5d060', '#e74c3c', '#2ecc71', '#3498db', '#9b59b6', '#fff', '#ff6b35']
  const pieces = Array.from({ length: 160 }, () => ({
    x: Math.random() * canvas.width,
    y: -20 - Math.random() * 200,
    w: 6 + Math.random() * 10,
    h: 3 + Math.random() * 6,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    rot: Math.random() * Math.PI * 2,
    vx: (Math.random() - 0.5) * 4,
    vy: 2 + Math.random() * 4,
    vr: (Math.random() - 0.5) * 0.2,
    wave: Math.random() * Math.PI * 2,
  }))

  let frame = 0
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    pieces.forEach((p) => {
      p.wave += 0.05
      p.x += p.vx + Math.sin(p.wave) * 0.8
      p.y += p.vy
      p.rot += p.vr
      if (p.y > canvas.height) {
        p.y = -20
        p.x = Math.random() * canvas.width
      }
      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate(p.rot)
      ctx.fillStyle = p.color
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h)
      ctx.restore()
    })
    frame++
    if (frame < 300) requestAnimationFrame(draw)
    else ctx.clearRect(0, 0, canvas.width, canvas.height)
  }
  draw()
}

watch(showCelebration, (v) => {
  if (v) setTimeout(launchConfetti, 50)
})
function numColor(n) {
  if (n === 0) return 'green'
  return RED_NUMS.has(n) ? 'red' : 'black'
}

// ── State ──────────────────────────────────────────────────────
const canvasRef = ref(null)
const balance = ref(5000)
const bets = ref({})
const selectedChip = ref(10)
const isSpinning = ref(false)
const wheelAngle = ref(0)
const lastResult = ref(null)
const history = ref([])
const toastMsg = ref('')
let toastTimer = null

const chips = [5, 10, 25, 50, 100, 500]
const outsideBets = [
  { id: 'red', label: '🔴 RED', payout: 1 },
  { id: 'black', label: '⚫ BLACK', payout: 1 },
  { id: 'even', label: 'EVEN', payout: 1 },
  { id: 'odd', label: 'ODD', payout: 1 },
  { id: '1-18', label: '1–18', payout: 1 },
  { id: '19-36', label: '19–36', payout: 1 },
]

// ── Computed ───────────────────────────────────────────────────
const totalBet = computed(() => Object.values(bets.value).reduce((s, v) => s + v, 0))

const resultColor = computed(() => numColor(lastResult.value))

const resultLabel = computed(() => {
  if (lastResult.value === null) return ''
  if (lastResult.value === 0) return 'ZERO'
  return RED_NUMS.has(lastResult.value) ? 'RED' : 'BLACK'
})

// ── Chip helpers ───────────────────────────────────────────────
function chipColor(c) {
  const m = {
    5: '#e74c3c',
    10: '#3498db',
    25: '#2ecc71',
    50: '#9b59b6',
    100: '#f39c12',
    500: '#1abc9c',
  }
  return m[c] || '#888'
}

function getBet(id) {
  return bets.value[id] || 0
}

function placeBet(id) {
  if (isSpinning.value) return
  const cost = selectedChip.value
  if (balance.value < cost) {
    showToast('Not enough chips!')
    return
  }
  balance.value -= cost
  bets.value = { ...bets.value, [id]: (bets.value[id] || 0) + cost }
}

function clearBets() {
  balance.value += totalBet.value
  bets.value = {}
}

// ── Spin logic ─────────────────────────────────────────────────
function spinWheel() {
  if (isSpinning.value || totalBet.value === 0) return
  isSpinning.value = true

  const winIndex = Math.floor(Math.random() * NUMBERS.length)
  const winNum = NUMBERS[winIndex]
  const segAngle = 360 / NUMBERS.length
  const targetAngle = 360 * (6 + Math.floor(Math.random() * 4)) + winIndex * segAngle + segAngle / 2

  // animate wheel
  animateWheel(wheelAngle.value, wheelAngle.value + targetAngle, 5000, () => {
    wheelAngle.value = (wheelAngle.value + targetAngle) % 360
    lastResult.value = winNum
    history.value = [winNum, ...history.value].slice(0, 12)
    settle(winNum)
    isSpinning.value = false
  })
}

function animateWheel(from, to, duration, onDone) {
  const start = performance.now()
  function frame(now) {
    const t = Math.min((now - start) / duration, 1)
    const ease = 1 - Math.pow(1 - t, 4)
    wheelAngle.value = from + (to - from) * ease
    drawWheel(wheelAngle.value)
    if (t < 1) requestAnimationFrame(frame)
    else onDone()
  }
  requestAnimationFrame(frame)
}

// ── Payout ─────────────────────────────────────────────────────
function settle(num) {
  let winnings = 0

  // straight-up number bets (35:1)
  const nb = bets.value['n' + num] || 0
  winnings += nb * 36

  // outside bets
  for (const ob of outsideBets) {
    const b = bets.value[ob.id] || 0
    if (!b) continue
    if (ob.id === 'red' && RED_NUMS.has(num)) winnings += b * 2
    if (ob.id === 'black' && num > 0 && !RED_NUMS.has(num)) winnings += b * 2
    if (ob.id === 'even' && num > 0 && num % 2 === 0) winnings += b * 2
    if (ob.id === 'odd' && num % 2 === 1) winnings += b * 2
    if (ob.id === '1-18' && num >= 1 && num <= 18) winnings += b * 2
    if (ob.id === '19-36' && num >= 19 && num <= 36) winnings += b * 2
  }

  bets.value = {}
  if (winnings > 0) {
    balance.value += winnings
    showToast(`🎉 You won ${winnings} chips!`)
    showTrashTalk.value = true
    // hackStore.increamentSavings();
  } else {
    showToast(`😢 No luck this time`)
    showTrashTalk.value = true
    hackStore.increamentSavings()
  }
  console.log(hackStore.goalReached, hackStore.savings, hackStore.savingGoal);
  if (hackStore.goalReached) {
    showCelebration.value = true
    setTimeout(() => {
      showCelebration.value = false
      router.push('/')
    }, 5000)
  }
}

function showToast(msg) {
  toastMsg.value = msg
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => (toastMsg.value = ''), 3000)
}

// ── Ball position (CSS-driven orbit) ──────────────────────────
const ballStyle = computed(() => {
  // ball orbits at a fixed radius; its angle is inverse of wheel angle
  const angle = (-wheelAngle.value * Math.PI) / 180
  const r = 190
  const cx = 210,
    cy = 210
  return {
    left: cx + r * Math.cos(angle) - 7 + 'px',
    top: cy + r * Math.sin(angle) - 7 + 'px',
  }
})

// ── Canvas draw ────────────────────────────────────────────────
function drawWheel(angle = 0) {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  const cx = 210,
    cy = 210,
    R = 180
  const seg = (2 * Math.PI) / NUMBERS.length
  const offset = (angle * Math.PI) / 180

  ctx.clearRect(0, 0, 420, 420)

  // outer shadow ring
  ctx.save()
  ctx.beginPath()
  ctx.arc(cx, cy, R + 14, 0, 2 * Math.PI)
  ctx.shadowBlur = 30
  ctx.shadowColor = 'rgba(0,0,0,.7)'
  ctx.fillStyle = '#1a0a00'
  ctx.fill()
  ctx.restore()

  // segments
  NUMBERS.forEach((num, i) => {
    const start = offset + i * seg - Math.PI / 2
    const end = start + seg

    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.arc(cx, cy, R, start, end)
    ctx.closePath()

    if (num === 0) {
      ctx.fillStyle = '#1a7a3c'
    } else {
      ctx.fillStyle = RED_NUMS.has(num) ? '#c0392b' : '#1a1a1a'
    }
    ctx.fill()
    ctx.strokeStyle = '#8B6914'
    ctx.lineWidth = 1.2
    ctx.stroke()

    // number label
    const mid = start + seg / 2
    const lx = cx + R * 0.74 * Math.cos(mid)
    const ly = cy + R * 0.74 * Math.sin(mid)
    ctx.save()
    ctx.translate(lx, ly)
    ctx.rotate(mid + Math.PI / 2)
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 11px serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(String(num), 0, 0)
    ctx.restore()
  })

  // inner hub
  const hubGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 40)
  hubGrad.addColorStop(0, '#f5d060')
  hubGrad.addColorStop(1, '#7a4f00')
  ctx.beginPath()
  ctx.arc(cx, cy, 40, 0, 2 * Math.PI)
  ctx.fillStyle = hubGrad
  ctx.fill()
  ctx.strokeStyle = '#f5d060'
  ctx.lineWidth = 2
  ctx.stroke()

  // hub diamond pattern
  ctx.save()
  ctx.translate(cx, cy)
  for (let d = 0; d < 8; d++) {
    ctx.rotate(Math.PI / 4)
    ctx.beginPath()
    ctx.moveTo(0, -28)
    ctx.lineTo(6, 0)
    ctx.lineTo(0, 28)
    ctx.lineTo(-6, 0)
    ctx.closePath()
    ctx.fillStyle = 'rgba(0,0,0,.25)'
    ctx.fill()
  }
  ctx.restore()

  // divider pins
  for (let i = 0; i < NUMBERS.length; i++) {
    const a = offset + i * seg - Math.PI / 2
    const px = cx + (R - 4) * Math.cos(a)
    const py = cy + (R - 4) * Math.sin(a)
    ctx.beginPath()
    ctx.arc(px, py, 3, 0, 2 * Math.PI)
    ctx.fillStyle = '#f5d060'
    ctx.fill()
  }

  // gold rim
  ctx.beginPath()
  ctx.arc(cx, cy, R, 0, 2 * Math.PI)
  ctx.strokeStyle = '#f5d060'
  ctx.lineWidth = 4
  ctx.stroke()
}

onMounted(() => drawWheel(0))
watch(wheelAngle, (v) => drawWheel(v))
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@700&family=Cinzel:wght@400;600&display=swap');

main {
  /* margin-top: 86px; */
  height: 100vh;
  background: var(--dark);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  padding: 0 0 48px;
  padding-top: 80px;
  position: relative;
  overflow-x: hidden;
  font-family: 'Cinzel', serif;
}

.felt-bg {
  position: fixed;
  inset: 0;
  background:
    radial-gradient(ellipse at 50% 0%, #1e3d20 0%, #0c1a0d 60%),
    repeating-linear-gradient(
      45deg,
      rgba(255, 255, 255, 0.015) 0px,
      rgba(255, 255, 255, 0.015) 1px,
      transparent 1px,
      transparent 12px
    );
  pointer-events: none;
}
.vignette {
  position: fixed;
  inset: 0;
  background: radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(0, 0, 0, 0.7) 100%);
  pointer-events: none;
}

/* ── Header ── */
header {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 28px;
  background: linear-gradient(90deg, #0c1a0d, #1a3a1e, #0c1a0d);
  border-bottom: 2px solid #8b6914;
  position: relative;
  z-index: 2;
}
.logo {
  font-family: 'Cinzel Decorative', serif;
  font-size: 1.1rem;
  color: #f5d060;
  letter-spacing: 0.12em;
  text-shadow: 0 0 18px rgba(245, 208, 96, 0.5);
}
.chips-display {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid #8b6914;
  border-radius: 30px;
  padding: 6px 16px;
}
.chip-icon {
  font-size: 1.1rem;
}
.balance {
  color: #f5d060;
  font-weight: 600;
  font-size: 1rem;
  letter-spacing: 0.06em;
}

/* ── Wheel ── */
.wheel-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  position: relative;
  z-index: 2;
  margin-top: 8px;
}
.wheel-outer {
  position: relative;
  width: 420px;
  height: 420px;
  filter: drop-shadow(0 8px 40px rgba(0, 0, 0, 0.8));
}
.wheel-track {
  width: 420px;
  height: 420px;
  position: relative;
}
.wheel-canvas {
  display: block;
}

.ball {
  position: absolute;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 30%, #fff 0%, #ccc 60%, #888 100%);
  box-shadow:
    0 0 8px rgba(255, 255, 255, 0.8),
    0 2px 4px rgba(0, 0, 0, 0.6);
  pointer-events: none;
  transition:
    left 0.05s linear,
    top 0.05s linear;
}

.needle {
  position: absolute;
  top: -16px;
  left: 50%;
  transform: translateX(-50%);
  color: #f5d060;
  font-size: 1.8rem;
  filter: drop-shadow(0 0 8px #f5d060);
  z-index: 10;
}

/* result badge */
.result-badge {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 10px 28px;
  border-radius: 12px;
  border: 2px solid currentColor;
}
.result-badge.red {
  color: #e74c3c;
  box-shadow: 0 0 20px rgba(231, 76, 60, 0.4);
}
.result-badge.black {
  color: #aaa;
  box-shadow: 0 0 20px rgba(150, 150, 150, 0.2);
}
.result-badge.green {
  color: #2ecc71;
  box-shadow: 0 0 20px rgba(46, 204, 113, 0.4);
}
.result-num {
  font-family: 'Cinzel Decorative', serif;
  font-size: 2.4rem;
  line-height: 1;
}
.result-label {
  font-size: 0.7rem;
  letter-spacing: 0.2em;
  opacity: 0.7;
}

/* ── Betting ── */
.betting {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  width: 100%;
  max-width: 680px;
  padding: 0 16px;
  position: relative;
  z-index: 2;
}

.bet-controls {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  width: 100%;
}

.chip-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: center;
}
.chip {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  border: 3px dashed var(--cc);
  background: radial-gradient(
    circle at 35% 30%,
    color-mix(in srgb, var(--cc) 60%, #fff),
    var(--cc)
  );
  color: #fff;
  font-family: 'Cinzel', serif;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition:
    transform 0.15s,
    box-shadow 0.15s;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.4);
}
.chip.active {
  transform: translateY(-6px) scale(1.12);
  box-shadow: 0 8px 20px color-mix(in srgb, var(--cc) 50%, transparent);
  border-style: solid;
}

.action-row {
  display: flex;
  gap: 12px;
  width: 100%;
  justify-content: center;
}

.clear-btn {
  padding: 10px 24px;
  border-radius: 8px;
  border: 1px solid #8b6914;
  background: transparent;
  color: #f5d060;
  font-family: 'Cinzel', serif;
  font-size: 0.85rem;
  letter-spacing: 0.1em;
  cursor: pointer;
  transition: background 0.2s;
}
.clear-btn:hover:not(:disabled) {
  background: rgba(139, 105, 20, 0.2);
}
.clear-btn:disabled {
  opacity: 0.4;
  cursor: default;
}

.spin-btn {
  flex: 1;
  max-width: 260px;
  padding: 12px 24px;
  border-radius: 8px;
  border: none;
  background: linear-gradient(135deg, #8b6914, #f5d060, #8b6914);
  color: #0c1a0d;
  font-family: 'Cinzel Decorative', serif;
  font-size: 0.9rem;
  letter-spacing: 0.1em;
  cursor: pointer;
  transition:
    transform 0.15s,
    box-shadow 0.15s;
  box-shadow: 0 4px 18px rgba(245, 208, 96, 0.35);
}
.spin-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 28px rgba(245, 208, 96, 0.55);
}
.spin-btn:disabled {
  opacity: 0.45;
  cursor: default;
}

.spin-loading {
  display: flex;
  gap: 5px;
  align-items: center;
  justify-content: center;
}
.spin-loading i {
  display: block;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #0c1a0d;
  animation: ld 0.5s ease-in-out infinite alternate;
}
.spin-loading i:nth-child(2) {
  animation-delay: 0.15s;
}
.spin-loading i:nth-child(3) {
  animation-delay: 0.3s;
}
@keyframes ld {
  to {
    transform: translateY(-5px);
    opacity: 0.3;
  }
}

/* ── Number grid ── */
.grid-wrap {
  width: 100%;
}
.num-grid {
  display: grid;
  grid-template-columns: 44px repeat(12, 1fr);
  gap: 3px;
  width: 100%;
}
.cell {
  aspect-ratio: 1;
  border-radius: 5px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  font-family: 'Cinzel', serif;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  position: relative;
  transition:
    transform 0.1s,
    box-shadow 0.1s;
  color: #fff;
}
.cell:hover:not(:disabled) {
  transform: scale(1.08);
  z-index: 1;
}
.cell.red {
  background: #8b1a1a;
}
.cell.black {
  background: #1a1a1a;
}
.cell.green {
  background: #1a6b2a;
  grid-column: 1;
  grid-row: 1 / 4;
  border-radius: 6px;
  font-size: 0.7rem;
}
.cell.betted {
  box-shadow:
    0 0 10px #f5d060,
    inset 0 0 8px rgba(245, 208, 96, 0.2);
  border-color: #f5d060;
}

.zero {
  writing-mode: vertical-rl;
  text-orientation: mixed;
  display: flex;
  align-items: center;
  justify-content: center;
}

.bet-chip {
  position: absolute;
  top: 2px;
  right: 2px;
  background: #f5d060;
  color: #0c1a0d;
  border-radius: 50%;
  width: 16px;
  height: 16px;
  font-size: 0.55rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  line-height: 1;
}

.outside-bets {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 3px;
  margin-top: 3px;
  width: 100%;
}
.outside-cell {
  padding: 8px 4px;
  border-radius: 5px;
  border: 1px solid rgba(139, 105, 20, 0.5);
  background: rgba(139, 105, 20, 0.1);
  color: #f5d060;
  font-family: 'Cinzel', serif;
  font-size: 0.65rem;
  letter-spacing: 0.04em;
  cursor: pointer;
  position: relative;
  transition: background 0.15s;
  text-align: center;
}
.outside-cell:hover:not(:disabled) {
  background: rgba(139, 105, 20, 0.3);
}
.outside-cell.betted {
  background: rgba(139, 105, 20, 0.35);
  border-color: #f5d060;
  box-shadow: 0 0 8px rgba(245, 208, 96, 0.3);
}

/* ── History ── */
.history {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
}
.history-label {
  font-size: 0.65rem;
  letter-spacing: 0.18em;
  color: rgba(245, 208, 96, 0.5);
  white-space: nowrap;
}
.history-nums {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
}
.h-num {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  font-weight: 600;
  border: 1px solid rgba(255, 255, 255, 0.15);
}
.h-num.red {
  background: #8b1a1a;
  color: #fff;
}
.h-num.black {
  background: #1a1a1a;
  color: #fff;
}
.h-num.green {
  background: #1a6b2a;
  color: #fff;
}

/* ── Toast ── */
.toast {
  position: fixed;
  bottom: 32px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(10, 20, 10, 0.92);
  border: 1px solid #8b6914;
  color: #f5d060;
  padding: 12px 28px;
  border-radius: 40px;
  font-size: 0.9rem;
  letter-spacing: 0.06em;
  z-index: 100;
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.5);
  white-space: nowrap;
}
.toast-enter-active {
  animation: toast-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.toast-leave-active {
  animation: toast-in 0.25s reverse;
}
@keyframes toast-in {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(20px) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0) scale(1);
  }
}

/* ── Result badge transition ── */
.result-enter-active {
  animation: badge-pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.result-leave-active {
  animation: badge-pop 0.2s reverse;
}
@keyframes badge-pop {
  from {
    opacity: 0;
    transform: scale(0.7);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* ── Responsive ── */
@media (max-width: 460px) {
  .wheel-outer,
  .wheel-track,
  .wheel-canvas {
    width: 320px;
    height: 320px;
  }
  .wheel-canvas {
    width: 320px;
    height: 320px;
  }
  .outside-bets {
    grid-template-columns: repeat(3, 1fr);
  }
  .num-grid {
    grid-template-columns: 36px repeat(12, 1fr);
    font-size: 0.65rem;
  }
}

/* ── Celebration ── */
.celebration-overlay {
  position: fixed;
  inset: 0;
  z-index: 200;
  background: rgba(0, 0, 0, 0.88);
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(6px);
}
.confetti-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
.celebrate-content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  text-align: center;
  padding: 0 24px;
}
.trophy-bounce {
  font-size: 5rem;
  animation:
    trophy-pop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both,
    trophy-float 2s ease-in-out 0.6s infinite alternate;
}
@keyframes trophy-pop {
  from {
    transform: scale(0) rotate(-20deg);
    opacity: 0;
  }
  to {
    transform: scale(1) rotate(0);
    opacity: 1;
  }
}
@keyframes trophy-float {
  from {
    transform: translateY(0);
  }
  to {
    transform: translateY(-12px);
  }
}

.celebrate-title {
  font-family: 'Cinzel Decorative', serif;
  font-size: clamp(1.6rem, 6vw, 3rem);
  color: #f5d060;
  text-shadow:
    0 0 30px rgba(245, 208, 96, 0.9),
    0 0 60px rgba(245, 208, 96, 0.4);
  animation: title-glow 1.2s ease-in-out infinite alternate;
}
@keyframes title-glow {
  from {
    text-shadow: 0 0 20px rgba(245, 208, 96, 0.7);
  }
  to {
    text-shadow:
      0 0 50px rgba(245, 208, 96, 1),
      0 0 80px rgba(245, 208, 96, 0.5);
  }
}
.celebrate-sub {
  color: rgba(255, 255, 255, 0.6);
  font-family: 'Cinzel', serif;
  font-size: 1rem;
  letter-spacing: 0.1em;
}

/* balloons */
.balloon-row {
  position: fixed;
  inset: 0;
  pointer-events: none;
}
.balloon {
  position: absolute;
  bottom: -10%;
  left: var(--x);
  font-size: var(--size);
  animation: balloon-rise 4s ease-in var(--delay) forwards;
  filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.4));
}
@keyframes balloon-rise {
  from {
    transform: translateY(0) rotate(-8deg);
    opacity: 1;
  }
  50% {
    transform: translateY(-60vh) rotate(8deg);
  }
  to {
    transform: translateY(-110vh) rotate(-4deg);
    opacity: 0.3;
  }
}

/* fireworks */
.firework-row {
  position: fixed;
  inset: 0;
  pointer-events: none;
}
.firework {
  position: absolute;
  top: 20%;
  left: var(--x);
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #f5d060;
  animation: fw-burst 1s ease-out var(--d) infinite;
  box-shadow:
    20px -20px 0 #e74c3c,
    -20px -20px 0 #3498db,
    20px 20px 0 #2ecc71,
    -20px 20px 0 #9b59b6,
    0 -28px 0 #fff,
    0 28px 0 #ff6b35;
}
@keyframes fw-burst {
  0% {
    transform: scale(0);
    opacity: 1;
  }
  60% {
    transform: scale(2.5);
    opacity: 0.8;
  }
  100% {
    transform: scale(0);
    opacity: 0;
  }
}

/* overlay transition */
.celebrate-enter-active {
  animation: fade-in 0.4s ease;
}
.celebrate-leave-active {
  animation: fade-in 0.4s reverse;
}
@keyframes fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* ── Trash Talk ── */
.trash-talk {
  position: fixed;
  top: 100px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 150;

  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 28px;
  border-radius: 4px;
  background: #0a0a0a;
  color: #ff2d55;
  font-family: 'Cinzel Decorative', serif;
  font-size: clamp(0.65rem, 2vw, 0.85rem);
  letter-spacing: 0.08em;
  white-space: nowrap;

  /* animated rainbow border via background-clip trick */
  border: 2px solid transparent;
  background-clip: padding-box;
  box-shadow:
    0 0 0 2px #0a0a0a,
    0 0 20px rgba(255, 45, 85, 0.5),
    0 0 40px rgba(255, 45, 85, 0.2);

  /* racing border overlay */
  isolation: isolate;
  overflow: visible;
}

/* animated corner brackets */
.trash-border-tl,
.trash-border-br {
  position: absolute;
  width: 16px;
  height: 16px;
  border-color: #ff2d55;
  border-style: solid;
  animation: corner-pulse 1s ease-in-out infinite alternate;
}
.trash-border-tl {
  top: -3px;
  left: -3px;
  border-width: 3px 0 0 3px;
  animation-delay: 0s;
}
.trash-border-br {
  bottom: -3px;
  right: -3px;
  border-width: 0 3px 3px 0;
  animation-delay: 0.5s;
}
@keyframes corner-pulse {
  from {
    border-color: #ff2d55;
    width: 16px;
    height: 16px;
  }
  to {
    border-color: #ffe600;
    width: 22px;
    height: 22px;
  }
}

/* racing neon line that runs around the border */
.trash-talk::before {
  content: '';
  position: absolute;
  inset: -2px;
  border-radius: 5px;
  background: conic-gradient(
    from var(--angle, 0deg),
    #ff2d55 0%,
    #ff6b35 15%,
    #ffe600 30%,
    #2ecc71 45%,
    #00e5ff 60%,
    #9b59b6 75%,
    #ff2d55 100%
  );
  z-index: -1;
  animation: spin-border 1.8s linear infinite;
}
.trash-talk::after {
  content: '';
  position: absolute;
  inset: 2px;
  background: #0a0a0a;
  border-radius: 3px;
  z-index: -1;
}

@property --angle {
  syntax: '<angle>';
  initial-value: 0deg;
  inherits: false;
}
@keyframes spin-border {
  to {
    --angle: 360deg;
  }
}

/* icon shake */
.trash-icon {
  display: inline-block;
  animation: skull-shake 0.4s ease-in-out infinite alternate;
  font-size: 1rem;
}
.trash-icon:last-child {
  animation-direction: alternate-reverse;
}
@keyframes skull-shake {
  from {
    transform: rotate(-15deg) scale(1);
  }
  to {
    transform: rotate(15deg) scale(1.2);
  }
}

/* text flicker */
.trash-text {
  animation: text-flicker 3s ease-in-out infinite;
}
@keyframes text-flicker {
  0%,
  100% {
    opacity: 1;
    text-shadow: 0 0 8px #ff2d55;
  }
  92% {
    opacity: 1;
    text-shadow: 0 0 8px #ff2d55;
  }
  93% {
    opacity: 0.4;
    text-shadow: none;
  }
  94% {
    opacity: 1;
    text-shadow: 0 0 16px #ff2d55;
  }
  96% {
    opacity: 0.6;
    text-shadow: none;
  }
  97% {
    opacity: 1;
    text-shadow: 0 0 8px #ff2d55;
  }
}

/* entry/exit */
.trash-enter-active {
  animation: trash-slam 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.trash-leave-active {
  animation: trash-slam 0.25s ease-in reverse;
}
@keyframes trash-slam {
  from {
    opacity: 0;
    transform: translateX(-50%) scale(0.6) rotate(-4deg);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) scale(1) rotate(0deg);
  }
}
</style>
