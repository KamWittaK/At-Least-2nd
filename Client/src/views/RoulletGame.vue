<template>
  <main>
    <div class="felt-bg" aria-hidden="true" />
    <div class="vignette" aria-hidden="true" />

    <section class="wheel-section">
      <div class="wheel-outer">
        <div class="wheel-track">
          <canvas ref="canvasRef" width="420" height="420" class="wheel-canvas" />
          <div class="ball" :style="ballStyle" />
        </div>
        <div class="needle">▼</div>
      </div>
      <Transition name="result">
        <div v-if="lastResult !== null && !isSpinning" class="result-badge" :class="resultColor">
          <span class="result-num">{{ lastResult }}</span>
          <span class="result-label">{{ resultLabel }}</span>
        </div>
      </Transition>
    </section>

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

      <!-- ══════════════════════════════════
           ROULETTE TABLE
           Reference layout (from image):
           • 3 rows of numbers, 12 cols wide
           • Row 1 (top):    3,6,9,12,15,18,21,24,27,30,33,36
           • Row 2 (middle): 2,5,8,11,14,17,20,23,26,29,32,35
           • Row 3 (bottom): 1,4,7,10,13,16,19,22,25,28,31,34
           • Zero left, spans all 3 rows
           • "2 to 1" right, one per row
      ═══════════════════════════════════ -->
      <div class="table-wrap">
        <!-- number grid -->
        <div class="num-grid">
          <!-- Zero: col 1, rows 1-3 -->
          <button
            class="cell green"
            style="grid-column: 1; grid-row: 1/4"
            :class="{ betted: getBet('n0') > 0 }"
            @click="placeBet('n0')"
            :disabled="isSpinning"
          >
            0<span v-if="getBet('n0') > 0" class="bet-chip">{{ getBet('n0') }}</span>
          </button>

          <!--
            Numbers placed explicitly with grid-column / grid-row.
            col = Math.ceil(n/3) + 1   (offset 1 for zero column)
            row = 4 - ((n-1)%3 + 1)   = 4 - (n-1)%3 - 1 = 3 - (n-1)%3
                  n=3 → row 1, n=2 → row 2, n=1 → row 3  ✓
          -->
          <button
            v-for="n in 36"
            :key="n"
            class="cell"
            :class="[numColor(n), { betted: getBet('n' + n) > 0 }]"
            :style="{ gridColumn: Math.ceil(n / 3) + 1, gridRow: 3 - ((n - 1) % 3) }"
            @click="placeBet('n' + n)"
            :disabled="isSpinning"
          >
            {{ n }}
            <span v-if="getBet('n' + n) > 0" class="bet-chip">{{ getBet('n' + n) }}</span>
          </button>

          <!-- 2 to 1: col 14, rows 1-3 -->
          <button
            v-for="row in 3"
            :key="'col' + row"
            class="cell two-to-one"
            :style="{ gridColumn: 14, gridRow: row }"
            :class="{ betted: getBet('col' + row) > 0 }"
            @click="placeBet('col' + row)"
            :disabled="isSpinning"
          >
            2:1<span v-if="getBet('col' + row) > 0" class="bet-chip">{{
              getBet('col' + row)
            }}</span>
          </button>
        </div>

        <!-- dozen row -->
        <div class="dozen-row">
          <div />
          <!-- zero spacer -->
          <button
            v-for="d in dozenBets"
            :key="d.id"
            class="sub-cell dozen-cell"
            :class="{ betted: getBet(d.id) > 0 }"
            @click="placeBet(d.id)"
            :disabled="isSpinning"
          >
            {{ d.label }}<span v-if="getBet(d.id) > 0" class="bet-chip">{{ getBet(d.id) }}</span>
          </button>
          <div />
          <!-- 2to1 spacer -->
        </div>

        <!-- outside bets row -->
        <div class="outside-row">
          <div />
          <!-- zero spacer -->
          <button
            v-for="ob in outsideBets"
            :key="ob.id"
            class="sub-cell outside-cell"
            :class="{ betted: getBet(ob.id) > 0 }"
            @click="placeBet(ob.id)"
            :disabled="isSpinning"
          >
            <span v-if="ob.id === 'red'" class="diam" style="color: #c0392b">♦</span>
            <span
              v-else-if="ob.id === 'black'"
              class="diam"
              style="color: #0d0d0d; -webkit-text-stroke: 1px rgba(255, 255, 255, 0.4)"
              >♦</span
            >
            <template v-else>{{ ob.label }}</template>
            <span v-if="getBet(ob.id) > 0" class="bet-chip">{{ getBet(ob.id) }}</span>
          </button>
          <div />
          <!-- 2to1 spacer -->
        </div>
      </div>

      <div class="history">
        <span class="history-label">RECENT</span>
        <div class="history-nums">
          <span v-for="(h, i) in history" :key="i" class="h-num" :class="numColor(h)">{{ h }}</span>
        </div>
      </div>
    </section>

    <Transition name="toast">
      <div v-if="toastMsg" class="toast">{{ toastMsg }}</div>
    </Transition>

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
  </main>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useHackStore } from '../stores/index.js'
import { useRouter } from 'vue-router'

const router = useRouter()
const hackStore = useHackStore()

const NUMBERS = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14,
  31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26,
]
const RED_NUMS = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 21, 23, 25, 27, 30, 32, 34, 36])
function numColor(n) {
  return n === 0 ? 'green' : RED_NUMS.has(n) ? 'red' : 'black'
}

const canvasRef = ref(null)
const confettiCanvas = ref(null)
const balance = ref(5000)
const bets = ref({})
const selectedChip = ref(10)
const isSpinning = ref(false)
const wheelAngle = ref(0)
const lastResult = ref(null)
const history = ref([])
const toastMsg = ref('')
const showCelebration = ref(false)
let toastTimer = null

const chips = [5, 10, 25, 50, 100, 500]
const dozenBets = [
  { id: '1st12', label: '1st 12' },
  { id: '2nd12', label: '2nd 12' },
  { id: '3rd12', label: '3rd 12' },
]
const outsideBets = [
  { id: '1-18', label: '1-18' },
  { id: 'even', label: 'Even' },
  { id: 'red', label: '' },
  { id: 'black', label: '' },
  { id: 'odd', label: 'Odd' },
  { id: '19-36', label: '19-36' },
]

const totalBet = computed(() => Object.values(bets.value).reduce((s, v) => s + v, 0))
const resultColor = computed(() => numColor(lastResult.value))
const resultLabel = computed(() => {
  if (lastResult.value === null) return ''
  if (lastResult.value === 0) return 'ZERO'
  return RED_NUMS.has(lastResult.value) ? 'RED' : 'BLACK'
})

function chipColor(c) {
  return (
    { 5: '#e74c3c', 10: '#3498db', 25: '#2ecc71', 50: '#9b59b6', 100: '#f39c12', 500: '#1abc9c' }[
      c
    ] || '#888'
  )
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

function spinWheel() {
  if (isSpinning.value || totalBet.value === 0) return
  isSpinning.value = true
  const wi = Math.floor(Math.random() * NUMBERS.length)
  const seg = 360 / NUMBERS.length
  const tgt = 360 * (6 + Math.floor(Math.random() * 4)) + wi * seg + seg / 2
  animateWheel(wheelAngle.value, wheelAngle.value + tgt, 5000, () => {
    wheelAngle.value = (wheelAngle.value + tgt) % 360
    lastResult.value = NUMBERS[wi]
    history.value = [NUMBERS[wi], ...history.value].slice(0, 12)
    settle(NUMBERS[wi])
    isSpinning.value = false
  })
}

function animateWheel(from, to, dur, onDone) {
  const start = performance.now()
  ;(function frame(now) {
    const t = Math.min((now - start) / dur, 1),
      ease = 1 - Math.pow(1 - t, 4)
    wheelAngle.value = from + (to - from) * ease
    drawWheel(wheelAngle.value)
    if (t < 1) requestAnimationFrame(frame)
    else onDone()
  })(performance.now())
}


function settle(num) {
  isSpinning.value = false

  const totalWagered = totalBet.value  // ← capture BEFORE bets.value = {}

  let w = (bets.value['n' + num] || 0) * 36
  if (bets.value['red'] && RED_NUMS.has(num)) w += bets.value['red'] * 2
  if (bets.value['black'] && num > 0 && !RED_NUMS.has(num)) w += bets.value['black'] * 2
  if (bets.value['even'] && num > 0 && num % 2 === 0) w += bets.value['even'] * 2
  if (bets.value['odd'] && num % 2 === 1) w += bets.value['odd'] * 2
  if (bets.value['1-18'] && num >= 1 && num <= 18) w += bets.value['1-18'] * 2
  if (bets.value['19-36'] && num >= 19 && num <= 36) w += bets.value['19-36'] * 2
  if (bets.value['1st12'] && num >= 1 && num <= 12) w += bets.value['1st12'] * 3
  if (bets.value['2nd12'] && num >= 13 && num <= 24) w += bets.value['2nd12'] * 3
  if (bets.value['3rd12'] && num >= 25 && num <= 36) w += bets.value['3rd12'] * 3
  if (bets.value['col1'] && num > 0 && num % 3 === 0) w += bets.value['col1'] * 3
  if (bets.value['col2'] && num > 0 && num % 3 === 2) w += bets.value['col2'] * 3
  if (bets.value['col3'] && num > 0 && num % 3 === 1) w += bets.value['col3'] * 3

  bets.value = {}  // ← now safe to clear

  if (w > 0) {
    balance.value += w
    showToast(`🎉 You won ${w} chips!`)
    console.log('You won', w, 'chips')
    hackStore.balance -= w;
    hackStore.spendings += w;

  } else {
    showToast('😢 No luck this time')
    hackStore.balance -= totalWagered;  // ← use captured value to update store
    hackStore.savings += totalWagered; 
  }

  if(hackStore.savings >= hackStore.savingGoal) {
    hackStore.goalReached = true;
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

const ballStyle = computed(() => {
  const a = (-wheelAngle.value * Math.PI) / 180,
    r = 190,
    cx = 210,
    cy = 210
  return { left: cx + r * Math.cos(a) - 7 + 'px', top: cy + r * Math.sin(a) - 7 + 'px' }
})

function drawWheel(angle = 0) {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d'),
    cx = 210,
    cy = 210,
    R = 180
  const seg = (2 * Math.PI) / NUMBERS.length,
    offset = (angle * Math.PI) / 180
  ctx.clearRect(0, 0, 420, 420)
  ctx.save()
  ctx.beginPath()
  ctx.arc(cx, cy, R + 14, 0, 2 * Math.PI)
  ctx.shadowBlur = 30
  ctx.shadowColor = 'rgba(0,0,0,.7)'
  ctx.fillStyle = '#1a0a00'
  ctx.fill()
  ctx.restore()
  NUMBERS.forEach((num, i) => {
    const s = offset + i * seg - Math.PI / 2,
      e = s + seg
    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.arc(cx, cy, R, s, e)
    ctx.closePath()
    ctx.fillStyle = num === 0 ? '#1a7a3c' : RED_NUMS.has(num) ? '#c0392b' : '#1a1a1a'
    ctx.fill()
    ctx.strokeStyle = '#8B6914'
    ctx.lineWidth = 1.2
    ctx.stroke()
    const m = s + seg / 2,
      lx = cx + R * 0.74 * Math.cos(m),
      ly = cy + R * 0.74 * Math.sin(m)
    ctx.save()
    ctx.translate(lx, ly)
    ctx.rotate(m + Math.PI / 2)
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 11px serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(String(num), 0, 0)
    ctx.restore()
  })
  const hg = ctx.createRadialGradient(cx, cy, 0, cx, cy, 40)
  hg.addColorStop(0, '#f5d060')
  hg.addColorStop(1, '#7a4f00')
  ctx.beginPath()
  ctx.arc(cx, cy, 40, 0, 2 * Math.PI)
  ctx.fillStyle = hg
  ctx.fill()
  ctx.strokeStyle = '#f5d060'
  ctx.lineWidth = 2
  ctx.stroke()
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
  for (let i = 0; i < NUMBERS.length; i++) {
    const a = offset + i * seg - Math.PI / 2
    ctx.beginPath()
    ctx.arc(cx + (R - 4) * Math.cos(a), cy + (R - 4) * Math.sin(a), 3, 0, 2 * Math.PI)
    ctx.fillStyle = '#f5d060'
    ctx.fill()
  }
  ctx.beginPath()
  ctx.arc(cx, cy, R, 0, 2 * Math.PI)
  ctx.strokeStyle = '#f5d060'
  ctx.lineWidth = 4
  ctx.stroke()
}
onMounted(() => drawWheel(0))
watch(wheelAngle, (v) => drawWheel(v))

const balloons = [
  { id: 1, emoji: '🎈', style: '--delay:0s;--x:8%;--size:3rem' },
  { id: 2, emoji: '🎉', style: '--delay:.3s;--x:22%;--size:2.4rem' },
  { id: 3, emoji: '🎈', style: '--delay:.6s;--x:40%;--size:3.5rem' },
  { id: 4, emoji: '🥳', style: '--delay:.2s;--x:58%;--size:2.8rem' },
  { id: 5, emoji: '🎊', style: '--delay:.5s;--x:74%;--size:2.4rem' },
  { id: 6, emoji: '🎈', style: '--delay:.1s;--x:88%;--size:3rem' },
]

function launchConfetti() {
  const canvas = confettiCanvas.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
  const C = ['#f5d060', '#e74c3c', '#2ecc71', '#3498db', '#9b59b6', '#fff', '#ff6b35']
  const P = Array.from({ length: 160 }, () => ({
    x: Math.random() * canvas.width,
    y: -20 - Math.random() * 200,
    w: 6 + Math.random() * 10,
    h: 3 + Math.random() * 6,
    color: C[Math.floor(Math.random() * C.length)],
    rot: Math.random() * Math.PI * 2,
    vx: (Math.random() - 0.5) * 4,
    vy: 2 + Math.random() * 4,
    vr: (Math.random() - 0.5) * 0.2,
    wave: Math.random() * Math.PI * 2,
  }))
  let f = 0
  ;(function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    P.forEach((p) => {
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
    f++
    if (f < 300) requestAnimationFrame(draw)
    else ctx.clearRect(0, 0, canvas.width, canvas.height)
  })()
}
watch(showCelebration, (v) => {
  if (v) setTimeout(launchConfetti, 50)
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@700&family=Cinzel:wght@400;600&display=swap');
*,
*::before,
*::after {
  box-sizing: border-box;
}

main {
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
  pointer-events: none;
  background:
    radial-gradient(ellipse at 50% 0%, #1e3d20, #0c1a0d 60%),
    repeating-linear-gradient(
      45deg,
      rgba(255, 255, 255, 0.015) 0px,
      rgba(255, 255, 255, 0.015) 1px,
      transparent 1px,
      transparent 12px
    );
}
.vignette {
  position: fixed;
  inset: 0;
  pointer-events: none;
  background: radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(0, 0, 0, 0.7) 100%);
}

/* ── Wheel ── */
.wheel-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  position: relative;
  z-index: 2;
}
.wheel-outer {
  position: relative;
  width: 360px;
  height: 360px;
  filter: drop-shadow(0 8px 40px rgba(0, 0, 0, 0.8));
}
.wheel-track {
  width: 360px;
  height: 360px;
  position: relative;
}
.wheel-canvas {
  display: block;
  width: 360px;
  height: 360px;
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
}
.needle {
  position: absolute;
  top: -14px;
  left: 50%;
  transform: translateX(-50%);
  color: #f5d060;
  font-size: 1.5rem;
  filter: drop-shadow(0 0 8px #f5d060);
  z-index: 10;
}
.result-badge {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 8px 22px;
  border-radius: 10px;
  border: 2px solid currentColor;
}
.result-badge.red {
  color: #e74c3c;
  box-shadow: 0 0 20px rgba(231, 76, 60, 0.4);
}
.result-badge.black {
  color: #bbb;
  box-shadow: 0 0 20px rgba(150, 150, 150, 0.2);
}
.result-badge.green {
  color: #2ecc71;
  box-shadow: 0 0 20px rgba(46, 204, 113, 0.4);
}
.result-num {
  font-family: 'Cinzel Decorative', serif;
  font-size: 2rem;
  line-height: 1;
}
.result-label {
  font-size: 0.6rem;
  letter-spacing: 0.2em;
  opacity: 0.7;
}

/* ── Bet controls ── */
.betting {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  width: 100%;
  max-width: 760px;
  position: relative;
  z-index: 2;
}
.bet-controls {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  width: 100%;
}
.chip-row {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  justify-content: center;
}
.chip {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 3px dashed var(--cc);
  background: radial-gradient(
    circle at 35% 30%,
    color-mix(in srgb, var(--cc) 55%, #fff),
    var(--cc)
  );
  color: #fff;
  font-family: 'Cinzel', serif;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  transition:
    transform 0.15s,
    box-shadow 0.15s;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.4);
}
.chip.active {
  transform: translateY(-5px) scale(1.1);
  border-style: solid;
  box-shadow: 0 8px 20px color-mix(in srgb, var(--cc) 50%, transparent);
}
.action-row {
  display: flex;
  gap: 10px;
  width: 100%;
  justify-content: center;
}
.clear-btn {
  padding: 9px 22px;
  border-radius: 8px;
  border: 1px solid #8b6914;
  background: transparent;
  color: #f5d060;
  font-family: 'Cinzel', serif;
  font-size: 0.8rem;
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
  max-width: 240px;
  padding: 11px 22px;
  border-radius: 8px;
  border: none;
  background: linear-gradient(135deg, #8b6914, #f5d060, #8b6914);
  color: #0c1a0d;
  font-family: 'Cinzel Decorative', serif;
  font-size: 0.85rem;
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

/* ══════════════════════════════════════
   ROULETTE TABLE
══════════════════════════════════════ */
.table-wrap {
  width: 100%;
  background: #1b6b22;
  border: 3px solid #e8e0c8;
  border-radius: 6px;
  padding: 3px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

/* Number grid — 14 named columns, 3 rows */
.num-grid {
  display: grid;
  /* col 1=zero(30px) | cols 2-13=numbers(1fr each) | col 14=2to1(34px) */
  grid-template-columns: 30px repeat(12, 1fr) 34px;
  grid-template-rows: repeat(3, 38px);
  gap: 2px;
}

.cell {
  border-radius: 3px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  font-family: 'Cinzel', serif;
  font-size: 0.7rem;
  font-weight: 700;
  cursor: pointer;
  color: #fff;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  transition:
    filter 0.1s,
    transform 0.1s;
  user-select: none;
  padding: 0;
  min-width: 0;
}
.cell:hover:not(:disabled) {
  filter: brightness(1.45);
  transform: scale(1.07);
  z-index: 3;
}
.cell:disabled {
  cursor: default;
}
.cell.red {
  background: #c0392b;
}
.cell.black {
  background: #111;
}
.cell.green {
  background: linear-gradient(175deg, #1a8040, #125e2e);
  border-color: rgba(255, 255, 255, 0.5);
  font-size: 0.9rem;
}
.cell.two-to-one {
  background: #1b6b22;
  border-color: rgba(255, 255, 255, 0.45);
  font-size: 0.55rem;
  letter-spacing: 0.02em;
  writing-mode: vertical-rl;
  text-orientation: mixed;
}
.cell.betted {
  box-shadow:
    0 0 10px #f5d060,
    inset 0 0 6px rgba(245, 208, 96, 0.3);
  border-color: #f5d060 !important;
}

.bet-chip {
  position: absolute;
  top: 1px;
  right: 1px;
  background: #f5d060;
  color: #0c1a0d;
  border-radius: 50%;
  width: 13px;
  height: 13px;
  font-size: 0.44rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 4;
  pointer-events: none;
}

/* Dozen row */
.dozen-row {
  display: grid;
  grid-template-columns: 30px repeat(3, 1fr) 34px;
  gap: 2px;
}

/* Outside row */
.outside-row {
  display: grid;
  grid-template-columns: 30px repeat(6, 1fr) 34px;
  gap: 2px;
}

/* Shared sub-cell style for dozen + outside */
.sub-cell {
  height: 28px;
  border-radius: 3px;
  border: 1px solid rgba(255, 255, 255, 0.4);
  background: #1b6b22;
  color: #fff;
  font-family: 'Cinzel', serif;
  font-size: 0.6rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  cursor: pointer;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: filter 0.12s;
}
.sub-cell:hover:not(:disabled) {
  filter: brightness(1.4);
}
.sub-cell.betted {
  border-color: #f5d060;
  box-shadow: 0 0 8px rgba(245, 208, 96, 0.4);
  background: rgba(245, 208, 96, 0.1);
}

.diam {
  font-size: 1.15rem;
  line-height: 1;
}

/* History */
.history {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
}
.history-label {
  font-size: 0.6rem;
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
  width: 25px;
  height: 25px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.63rem;
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

/* Toast */
.toast {
  position: fixed;
  bottom: 28px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(10, 20, 10, 0.92);
  border: 1px solid #8b6914;
  color: #f5d060;
  padding: 11px 26px;
  border-radius: 40px;
  font-size: 0.88rem;
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

/* Celebration */
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

@media (max-width: 520px) {
  .wheel-outer,
  .wheel-track,
  .wheel-canvas {
    width: 280px;
    height: 280px;
  }
  .num-grid {
    grid-template-rows: repeat(3, 28px);
  }
  .cell {
    font-size: 0.58rem;
  }
  .sub-cell {
    height: 22px;
    font-size: 0.5rem;
  }
}
</style>
