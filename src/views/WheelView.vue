<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter();

const games = [
  { name: 'Roullet Wheel', emoji: '🎡', color: '#00ff88', route: '/games/roulette', desc: 'Roulette Wheel' },
  { name: 'Blackjack', emoji: '🃏', color: '#00cfff', route: '/games/tetris', desc: 'Blackjack' },
  { name: 'Over Under', emoji: '🎲', color: '#ff6b35', route: '/games/pong', desc: 'Over Under' },
]


const isSpinning = ref(false)
const rotation   = ref(0)
const landed     = ref(null)
const showBadge  = ref(false)

const segmentAngle = 360 / games.length   // 120°

/* which segment is facing the camera after spin */
const landedIndex = computed(() => {
  const norm = (((-rotation.value % 360) + 360) % 360)
  return Math.round(norm / segmentAngle) % games.length
})

function spin() {
  if (isSpinning.value) return
  isSpinning.value = true
  showBadge.value  = false
  landed.value     = null

  const spins  = 4 + Math.floor(Math.random() * 4)          // 4-7 full rotations
  const snap   = Math.round(Math.random() * (games.length - 1)) * segmentAngle
  rotation.value  += spins * 360 + snap

  setTimeout(() => {
    isSpinning.value = false
    landed.value     = games[landedIndex.value]
    showBadge.value  = true
  }, 3200)
}

function goToGame() {
  if (landed.value) {
    router.push(landed.value.route)
  }
}
</script>

<template>
  <main>
    <!-- starfield background -->
    <div class="stars" aria-hidden="true">
      <div v-for="i in 120" :key="i" class="star" :style="{
        left: Math.random()*100+'%',
        top:  Math.random()*100+'%',
        animationDelay: Math.random()*4+'s',
        width:  (Math.random()*2+1)+'px',
        height: (Math.random()*2+1)+'px',
      }"/>
    </div>

    <h1 class="title">SPIN TO PLAY</h1>
    <p class="sub">Give it a whirl — your next game awaits</p>

    <!-- 3-D scene -->
    <div class="scene">
      <div class="wheel-wrap">

        <!-- perspective track -->
        <div
          class="track"
          :style="{ transform: `rotateX(18deg) rotateY(${rotation}deg)` }"
          :class="{ spinning: isSpinning }"
        >
          <!-- one card per game -->
          <div
            v-for="(game, i) in games"
            :key="game.name"
            class="card"
            :style="{
              '--c':    game.color,
              '--i':    i,
              '--n':    games.length,
              '--a':    segmentAngle,
              transform: `rotateY(${i * segmentAngle}deg) translateZ(260px)`,
            }"
          >
            <div class="card-inner">
              <span class="card-emoji">{{ game.emoji }}</span>
              <span class="card-name">{{ game.name }}</span>
              <span class="card-desc">{{ game.desc }}</span>
            </div>
          </div>
        </div>

        <!-- center hub -->
        <div class="hub">
          <div class="hub-ring"/>
          <div class="hub-ring hub-ring--2"/>
        </div>

        <!-- floor reflection -->
        <div class="floor"/>
      </div>

      <!-- pointer arrow -->
      <div class="pointer">▼</div>
    </div>

    <!-- spin button -->
    <button class="spin-btn" :disabled="isSpinning" @click="spin">
      <span v-if="!isSpinning">🎰 SPIN</span>
      <span v-else class="dot-loader"><i/><i/><i/></span>
    </button>

    <!-- landed badge -->
    <Transition name="badge">
      <div v-if="showBadge && landed" class="badge" :style="{'--c': landed.color}">
        <span class="badge-emoji">{{ landed.emoji }}</span>
        <div class="badge-text text-center">
          <strong>{{ landed.name }}</strong>
          <em>{{ landed.desc }}</em>
        </div>
        <button class="play-btn" @click="goToGame">PLAY →</button>
      </div>
    </Transition>
  </main>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;600&display=swap');


main {
  /* margin-top: 20px; */
  /* min-height: 100vh; */
  height: 100vh;
  background: var(--dark);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 32px;
  overflow: hidden;
  position: relative;
  font-family: 'DM Sans', sans-serif;
  padding: 40px 16px 60px;
}

/* ── Stars ── */
.stars { position: absolute; inset: 0; pointer-events: none; }
.star {
  position: absolute;
  border-radius: 50%;
  background: #fff;
  opacity: .6;
  animation: twinkle 3s ease-in-out infinite alternate;
}
@keyframes twinkle { to { opacity: .1; transform: scale(.4); } }

/* ── Title ── */
.title {
  font-family: 'Bebas Neue', sans-serif;
  font-size: clamp(2.6rem, 8vw, 5rem);
  letter-spacing: .18em;
  background: linear-gradient(135deg, #fff 30%, #c084fc 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-align: center;
  line-height: 1;
}
.sub {
  color: rgba(255,255,255,.45);
  font-size: .95rem;
  letter-spacing: .06em;
  margin-top: -20px;
}

/* ── Scene ── */
.scene {
  position: relative;
  width: 340px;
  height: 340px;
  perspective: 900px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* ── 3-D track ── */
.track {
  width: 0;
  height: 0;
  transform-style: preserve-3d;
  transition: transform 3.2s cubic-bezier(.17,.67,.15,1);
  position: relative;
}
.track.spinning {
  filter: drop-shadow(0 0 30px rgba(192,132,252,.6));
}

/* ── Individual cards ── */
.card {
  position: absolute;
  width: 160px;
  height: 220px;
  left: -80px;
  top: -110px;
  transform-style: preserve-3d;
  cursor: default;
}
.card-inner {
  width: 100%;
  height: 100%;
  border-radius: 20px;
  background: linear-gradient(160deg, rgba(255,255,255,.12), rgba(255,255,255,.04));
  border: 1.5px solid var(--c);
  box-shadow:
    0 0 20px color-mix(in srgb, var(--c) 35%, transparent),
    inset 0 1px 0 rgba(255,255,255,.15);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  backdrop-filter: blur(6px);
  transition: box-shadow .3s;
}
.card-emoji { font-size: 3rem; filter: drop-shadow(0 0 12px var(--c)); }
.card-name  {
  font-family: 'Bebas Neue', sans-serif;
  font-size: 1.7rem;
  letter-spacing: .1em;
  color: var(--c);
  text-shadow: 0 0 18px var(--c);
}
.card-desc  { font-size: .78rem; color: rgba(255,255,255,.5); letter-spacing: .04em; }

/* ── Hub ── */
.hub {
  position: absolute;
  width: 52px;
  height: 52px;
  pointer-events: none;
  z-index: 10;
}
.hub-ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 2px solid rgba(192,132,252,.7);
  background: radial-gradient(circle, #2a0a4a 0%, #0d0020 100%);
  box-shadow: 0 0 18px #c084fc, inset 0 0 12px #c084fc44;
  animation: hub-pulse 2s ease-in-out infinite alternate;
}
.hub-ring--2 {
  inset: 8px;
  border-color: rgba(255,255,255,.2);
  animation-delay: .6s;
}
@keyframes hub-pulse { to { box-shadow: 0 0 32px #c084fc, inset 0 0 20px #c084fc66; } }

/* ── Floor reflection ── */
.floor {
  position: absolute;
  bottom: -30px;
  left: 50%;
  transform: translateX(-50%);
  width: 320px;
  height: 40px;
  background: radial-gradient(ellipse, rgba(192,132,252,.25) 0%, transparent 70%);
  filter: blur(8px);
  pointer-events: none;
}

/* ── Pointer ── */
.pointer {
  position: absolute;
  bottom: -24px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 1.6rem;
  color: #c084fc;
  filter: drop-shadow(0 0 8px #c084fc);
  animation: pointer-bob .9s ease-in-out infinite alternate;
  z-index: 20;
}
@keyframes pointer-bob { to { transform: translateX(-50%) translateY(5px); } }

/* ── Spin button ── */
.spin-btn {
  font-family: 'Bebas Neue', sans-serif;
  font-size: 1.4rem;
  letter-spacing: .2em;
  padding: 14px 52px;
  border-radius: 60px;
  border: none;
  background: linear-gradient(135deg, #7c3aed, #c084fc);
  color: #fff;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: transform .15s, box-shadow .15s;
  box-shadow: 0 4px 28px rgba(192,132,252,.5);
}
.spin-btn:not(:disabled):hover {
  transform: translateY(-3px) scale(1.03);
  box-shadow: 0 8px 38px rgba(192,132,252,.7);
}
.spin-btn:disabled { opacity: .55; cursor: default; }
.spin-btn::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, transparent 40%, rgba(255,255,255,.15) 50%, transparent 60%);
  transform: skewX(-20deg) translateX(-100%);
  transition: transform .5s;
}
.spin-btn:not(:disabled):hover::before { transform: skewX(-20deg) translateX(200%); }

/* dot loader */
.dot-loader { display: flex; gap: 6px; align-items: center; }
.dot-loader i {
  display: block; width: 8px; height: 8px; border-radius: 50%;
  background: #fff;
  animation: dot-bounce .6s ease-in-out infinite alternate;
}
.dot-loader i:nth-child(2) { animation-delay: .15s; }
.dot-loader i:nth-child(3) { animation-delay: .3s; }
@keyframes dot-bounce { to { transform: translateY(-6px); opacity: .3; } }

/* ── Landed badge ── */
.badge {
  display: flex;
  align-items: center;
  gap: 16px;
  background: linear-gradient(135deg, rgba(255,255,255,.1), rgba(255,255,255,.04));
  border: 1.5px solid var(--c);
  border-radius: 18px;
  padding: 16px 24px;
  box-shadow: 0 0 28px color-mix(in srgb, var(--c) 40%, transparent);
  backdrop-filter: blur(10px);
  min-width: 280px;
}
.badge-emoji { font-size: 2.2rem; filter: drop-shadow(0 0 10px var(--c)); }
.badge-text { flex: 1; }
.badge-text strong {
  display: block;
  font-family: 'Bebas Neue', sans-serif;
  font-size: 1.4rem;
  letter-spacing: .1em;
  color: var(--c);
}
.badge-text em { font-style: normal; font-size: .8rem; color: rgba(255,255,255,.5); }

.play-btn {
  font-family: 'Bebas Neue', sans-serif;
  font-size: 1rem;
  letter-spacing: .15em;
  padding: 10px 20px;
  border-radius: 30px;
  border: 1.5px solid var(--c);
  background: transparent;
  color: var(--c);
  cursor: pointer;
  transition: background .2s, color .2s;
}
.play-btn:hover { background: var(--c); color: #000; }

/* badge transition */
.badge-enter-active { animation: badge-in .5s cubic-bezier(.34,1.56,.64,1); }
.badge-leave-active { animation: badge-in .3s reverse; }
@keyframes badge-in {
  from { opacity: 0; transform: translateY(20px) scale(.9); }
  to   { opacity: 1; transform: none; }
}
</style>