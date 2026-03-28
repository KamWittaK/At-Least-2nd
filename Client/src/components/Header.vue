<script setup>
import { useHackStore } from '@/stores'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { computed, ref, onMounted, onUnmounted } from 'vue'

const hackStore = useHackStore()
const route = useRoute()
const router = useRouter()
const { balance, spendings, investedValue, lastMarketMove } = storeToRefs(hackStore)

const currentQuip = ref('')
const isTalking = ref(false)
const showBubble = ref(true)
let cycleController = null
let marketTimer = null

const marketMoveLabel = computed(() => `${lastMarketMove.value >= 0 ? '+' : ''}${lastMarketMove.value.toFixed(2)}%`)
const marketMoveClass = computed(() =>
  lastMarketMove.value > 0 ? 'is-up' : lastMarketMove.value < 0 ? 'is-down' : 'is-flat',
)

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

async function fetchQuip() {
  // TODO: replace with actual API call
  // const response = await fetch('/api/trashtalk')
  // const data = await response.json()
  // return data.text

  const quips = [
    "Broken toaster smarter than you.",
    "Your code slower than Internet Explorer.",
    "Your code is a rust bucket.",
    "Kindergarten coders outperform your skills.",
    "Spaghetti has better logic than you."
  ]
  return quips[Math.floor(Math.random() * quips.length)]
}

async function cycleQuip(talkingTime) {
  cycleController?.abort()
  const controller = new AbortController()
  cycleController = controller
  const aborted = () => controller.signal.aborted

  while (!aborted()) {
    // 1. Fetch new quip from API
    const quip = await fetchQuip()
    if (aborted()) break

    // 2. Assign text and start talking
    currentQuip.value = quip
    isTalking.value = true

    // 3. Talk for talkingTime (character mimics reading)
    await sleep(talkingTime)
    if (aborted()) break

    // 4. Stop talking, pause briefly before next fetch
    isTalking.value = false
    await sleep(1000)
    if (aborted()) break
  }
}

onMounted(() => {
  cycleQuip(5000)
  marketTimer = setInterval(() => hackStore.advanceMarket(), 15000)
})

onUnmounted(() => {
  cycleController?.abort()
  clearInterval(marketTimer)
})
</script>

<template>
  <div id="hud">
    <div @click="router.push('/')" class="cursor-pointer" id="logo">THE HOUSE</div>

    <div id="hud-right">
      <!-- ── AI Character ── -->
      <div v-if="route.path.includes('games')" id="ai-character">
        <!-- Speech bubble -->
        <Transition name="bubble">
          <div v-if="showBubble" class="speech-bubble">
            <span class="bubble-text">{{ currentQuip }}</span>
          </div>
        </Transition>

        <!-- Character face -->
        <div class="char-wrap" :class="{ talking: isTalking }">
          <!-- Outer glow ring -->
          <div class="char-ring"/>
          <!-- Face -->
          <div class="char-face">
            <!-- Eyes -->
            <div class="eyes">
              <div class="eye" :class="{ blink: isTalking }"/>
              <div class="eye" :class="{ blink: isTalking }"/>
            </div>
            <!-- Mouth — animates when talking -->
            <div class="mouth" :class="{ open: isTalking }"/>
          </div>
          <!-- Scanline overlay -->
          <div class="char-scanlines"/>
        </div>
      </div>

      <!-- Balance panels -->
      <div id="balance-panel">
        <div class="coin-icon">✦</div>
        <div>
          <div id="balance-label">Balance</div>
          <div id="balance-amount">${{ balance.toFixed(2) }}</div>
        </div>
      </div>

      <div v-show="route.path.includes('games')" id="balance-panel">
        <div class="coin-icon">✦</div>
        <div>
          <div id="balance-label">Spendings</div>
          <div id="balance-amount">${{ spendings.toFixed(2) }}</div>
        </div>
      </div>

      <div id="balance-panel" class="invested-panel">
        <div class="coin-icon">▲</div>
        <div>
          <div id="balance-label">Invested</div>
          <div id="balance-amount">${{ investedValue.toFixed(2) }}</div>
          <div class="market-move" :class="marketMoveClass">{{ marketMoveLabel }}</div>
        </div>
      </div>

      <!-- Player badge -->
      <div id="player-badge">
        <div class="avatar">SH</div>
        <div>
          <div class="player-name">PLAYER_01</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ── HUD TOP BAR ── */
#hud {
  position: fixed;
  top: 0; left: 0; right: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 28px;
  background: linear-gradient(180deg, rgba(0,0,0,.75) 0%, transparent 100%);
  backdrop-filter: blur(6px);
}

#logo {
  font-size: 22px;
  font-weight: 900;
  letter-spacing: .12em;
  text-transform: uppercase;
  background: linear-gradient(90deg, var(--cyan), var(--purple-bright));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  filter: drop-shadow(0 0 12px rgba(0,245,255,.5));
  animation: logoPulse 3s ease-in-out infinite;
}
@keyframes logoPulse {
  0%,100% { filter: drop-shadow(0 0 8px rgba(0,245,255,.4)); }
  50%      { filter: drop-shadow(0 0 20px rgba(0,245,255,.9)); }
}

#hud-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.invested-panel {
  min-width: 138px;
}

/* ── AI Character ── */
#ai-character {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0;
}

/* Speech bubble */
.speech-bubble {
  position: relative;
  background: rgba(0, 245, 255, .08);
  border: 1px solid rgba(0, 245, 255, .35);
  border-radius: 10px 10px 0 10px;
  padding: 6px 12px;
  max-width: 180px;
  margin-right: 8px;
  backdrop-filter: blur(4px);
  box-shadow: 0 0 14px rgba(0,245,255,.15);
}
/* pointer tail */
.speech-bubble::after {
  content: '';
  position: absolute;
  bottom: -1px;
  right: -8px;
  width: 0; height: 0;
  border-top: 8px solid rgba(0,245,255,.35);
  border-right: 8px solid transparent;
}
.speech-bubble::before {
  content: '';
  position: absolute;
  bottom: 1px;
  right: -6px;
  width: 0; height: 0;
  border-top: 7px solid rgba(0,22,28,.9);
  border-right: 7px solid transparent;
  z-index: 1;
}
.bubble-text {
  font-family: 'Share Tech Mono', monospace;
  font-size: 10px;
  color: rgba(0,245,255,.9);
  letter-spacing: .04em;
  line-height: 1.4;
  /* white-space: nowrap; */
}

/* bubble transition */
.bubble-enter-active { animation: bubble-pop .3s cubic-bezier(.34,1.56,.64,1); }
.bubble-leave-active { animation: bubble-pop .15s reverse; }
@keyframes bubble-pop {
  from { opacity: 0; transform: scale(.8) translateX(8px); }
  to   { opacity: 1; transform: scale(1) translateX(0); }
}

/* Character wrap */
.char-wrap {
  position: relative;
  width: 44px; height: 44px;
  cursor: pointer;
  flex-shrink: 0;
}

/* pulsing outer ring */
.char-ring {
  position: absolute;
  inset: -4px;
  border-radius: 50%;
  border: 1.5px solid rgba(0,245,255,.4);
  animation: ring-pulse 2.5s ease-in-out infinite;
}
@keyframes ring-pulse {
  0%,100% { transform: scale(1);   opacity: .5; border-color: rgba(0,245,255,.4); }
  50%      { transform: scale(1.12); opacity: 1;  border-color: rgba(0,245,255,.8); }
}
.char-wrap.talking .char-ring {
  animation: ring-talk .3s ease-in-out infinite alternate;
}
@keyframes ring-talk {
  from { transform: scale(1);   border-color: rgba(0,245,255,.5); }
  to   { transform: scale(1.15); border-color: rgba(0,245,255,1); box-shadow: 0 0 12px rgba(0,245,255,.6); }
}

/* Face circle */
.char-face {
  width: 44px; height: 44px;
  border-radius: 50%;
  background: radial-gradient(circle at 38% 35%, #0d2a2e, #050f12);
  border: 1.5px solid rgba(0,245,255,.5);
  box-shadow: 0 0 18px rgba(0,245,255,.25), inset 0 0 10px rgba(0,245,255,.08);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 5px;
  overflow: hidden;
  position: relative;
}

/* scanlines on face */
.char-scanlines {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: repeating-linear-gradient(
    0deg,
    rgba(0,245,255,.04) 0px,
    rgba(0,245,255,.04) 1px,
    transparent 1px,
    transparent 3px
  );
  pointer-events: none;
}

/* Eyes */
.eyes {
  display: flex;
  gap: 8px;
  align-items: center;
}
.eye {
  width: 7px; height: 7px;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 30%, #fff, #00f5ff);
  box-shadow: 0 0 6px #00f5ff;
  animation: eye-glow 2s ease-in-out infinite alternate;
  transition: height .1s;
}
@keyframes eye-glow {
  from { box-shadow: 0 0 4px #00f5ff; }
  to   { box-shadow: 0 0 12px #00f5ff, 0 0 20px rgba(0,245,255,.4); }
}
.eye.blink { height: 1px; border-radius: 2px; }

/* Mouth */
.mouth {
  width: 14px; height: 3px;
  border-radius: 3px;
  background: rgba(0,245,255,.5);
  transition: all .15s ease;
  box-shadow: 0 0 4px rgba(0,245,255,.4);
}
.mouth.open {
  height: 7px;
  width: 16px;
  border-radius: 2px 2px 6px 6px;
  background: rgba(0,245,255,.7);
  box-shadow: 0 0 10px rgba(0,245,255,.6), inset 0 2px 4px rgba(0,0,0,.5);
  animation: mouth-talk .2s ease-in-out infinite alternate;
}
@keyframes mouth-talk {
  from { height: 5px; }
  to   { height: 9px; }
}

/* talking bounce */
.char-wrap.talking .char-face {
  animation: char-bounce .25s ease-in-out infinite alternate;
}
@keyframes char-bounce {
  from { transform: translateY(0); }
  to   { transform: translateY(-2px); }
}

/* ── Balance panels ── */
#balance-panel {
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(255,215,0,.07);
  border: 1px solid rgba(255,215,0,.25);
  border-radius: 8px;
  padding: 7px 16px;
  position: relative;
  overflow: hidden;
  animation: balanceGlow 2s ease-in-out infinite;
}
@keyframes balanceGlow {
  0%,100% { box-shadow: 0 0 10px rgba(255,215,0,.1); }
  50%      { box-shadow: 0 0 22px rgba(255,215,0,.3); }
}

.coin-icon {
  width: 20px; height: 20px;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 35%, #ffe566, var(--gold-dim));
  border: 1.5px solid #ffe566;
  display: flex; align-items: center; justify-content: center;
  font-size: 10px; line-height: 1;
  box-shadow: 0 0 8px rgba(255,215,0,.6);
  animation: coinSpin 4s linear infinite;
}
@keyframes coinSpin {
  0%   { transform: rotateY(0deg); }
  50%  { transform: rotateY(90deg); width: 4px; }
  51%  { transform: rotateY(90deg); width: 4px; }
  100% { transform: rotateY(0deg); }
}

#balance-label {
  font-family: 'Share Tech Mono', monospace;
  font-size: 11px;
  color: rgba(255,215,0,.6);
  text-transform: uppercase;
  letter-spacing: .08em;
}
#balance-amount {
  font-family: 'Share Tech Mono', monospace;
  font-size: 17px;
  font-weight: 700;
  color: var(--gold);
  letter-spacing: .05em;
  text-shadow: 0 0 12px rgba(255,215,0,.6);
}

.market-move {
  font-family: 'Share Tech Mono', monospace;
  margin-top: 3px;
  font-size: 10px;
  letter-spacing: .08em;
  text-transform: uppercase;
}

.market-move.is-up {
  color: #63f0af;
}

.market-move.is-down {
  color: #ff9e86;
}

.market-move.is-flat {
  color: rgba(255,255,255,.58);
}

/* ── Player badge ── */
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
  width: 28px; height: 28px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--purple), var(--cyan-dim));
  border: 2px solid var(--cyan);
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: 700;
  box-shadow: 0 0 10px rgba(0,245,255,.4);
}
.player-name {
  font-size: 13px;
  font-weight: 700;
  letter-spacing: .05em;
  color: rgba(255,255,255,.9);
}
</style>
