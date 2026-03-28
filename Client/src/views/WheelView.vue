<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const games = [
  { name: 'Roulette Wheel', emoji: '🎡', color: '#00ff88', route: '/games/roulette', desc: 'Spin & Win' },
  { name: 'Blackjack',      emoji: '🃏', color: '#00cfff', route: '/games/blackjack', desc: 'Beat the Dealer' },
  { name: 'Over Under',     emoji: '🎲', color: '#ff6b35', route: '/games/overunder', desc: 'High or Low?' },
]

const activeIndex = ref(0)
const direction   = ref(1)   // 1 = next, -1 = prev
const isAnimating = ref(false)

const segmentAngle = 360 / games.length  // 120°

const rotation = computed(() => -activeIndex.value * segmentAngle)

function next() {
  if (isAnimating.value) return
  isAnimating.value = true
  direction.value = 1
  activeIndex.value = (activeIndex.value + 1) % games.length
  setTimeout(() => isAnimating.value = false, 420)
}

function prev() {
  if (isAnimating.value) return
  isAnimating.value = true
  direction.value = -1
  activeIndex.value = (activeIndex.value - 1 + games.length) % games.length
  setTimeout(() => isAnimating.value = false, 420)
}

function goToGame() {
  router.push(games[activeIndex.value].route)
}

const activeGame = computed(() => games[activeIndex.value])
</script>

<template>
  <main>
    <!-- starfield background -->
    <div class="stars" aria-hidden="true">
      <div
        v-for="i in 120" :key="i" class="star"
        :style="{
          left: Math.random() * 100 + '%',
          top:  Math.random() * 100 + '%',
          animationDelay: Math.random() * 4 + 's',
          width:  Math.random() * 2 + 1 + 'px',
          height: Math.random() * 2 + 1 + 'px',
        }"
      />
    </div>

    <h1 class="title">CHOOSE YOUR GAME</h1>
    <p class="sub">Navigate the wheel — then enter the arena</p>

    <!-- 3-D scene -->
    <div class="scene">
      <div class="wheel-wrap">

        <!-- prev arrow -->
        <button class="nav-btn nav-prev" @click="prev" :disabled="isAnimating" aria-label="Previous">
          <span>‹</span>
        </button>

        <!-- perspective track -->
        <div
          class="track"
          :style="{ transform: `rotateX(18deg) rotateY(${rotation}deg)` }"
          :class="{ animating: isAnimating }"
        >
          <div
            v-for="(game, i) in games"
            :key="game.name"
            class="card"
            :class="{ active: i === activeIndex }"
            :style="{
              '--c': game.color,
              transform: `rotateY(${i * segmentAngle}deg) translateZ(260px)`,
            }"
            @click="i === activeIndex ? goToGame() : (i === (activeIndex + 1) % games.length ? next() : prev())"
          >
            <div class="card-inner">
              <span class="card-emoji">{{ game.emoji }}</span>
              <span class="card-name">{{ game.name }}</span>
              <span class="card-desc">{{ game.desc }}</span>
              <span v-if="i === activeIndex" class="card-cta">TAP TO PLAY</span>
            </div>
          </div>
        </div>


        <!-- floor reflection -->
        <div class="floor"/>

        <!-- next arrow -->
        <button class="nav-btn nav-next" @click="next" :disabled="isAnimating" aria-label="Next">
          <span>›</span>
        </button>
      </div>
    </div>

    <!-- dot indicators -->
    <div class="dots">
      <button
        v-for="(g, i) in games" :key="i"
        class="dot"
        :class="{ active: i === activeIndex }"
        :style="{ '--c': g.color }"
        @click="() => { direction = i > activeIndex ? 1 : -1; activeIndex = i }"
      />
    </div>

    <!-- active game badge -->
    <Transition name="badge">
      <div class="badge" :style="{ '--c': activeGame.color }" :key="activeIndex">
        <span class="badge-emoji">{{ activeGame.emoji }}</span>
        <div class="badge-text">
          <strong>{{ activeGame.name }}</strong>
          <em>{{ activeGame.desc }}</em>
        </div>
        <button class="play-btn" @click="goToGame">PLAY →</button>
      </div>
    </Transition>
  </main>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;600&display=swap');

*, *::before, *::after { box-sizing: border-box; }

main {
  height: 100vh;
  background: var(--dark, #0d0020);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 28px;
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
  font-size: clamp(2.2rem, 7vw, 4.5rem);
  letter-spacing: .18em;
  background: linear-gradient(135deg, #fff 30%, #c084fc 100%);
  background-clip: text;
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

.wheel-wrap {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* ── Nav buttons ── */
.nav-btn {
  position: absolute;
  top: 80%;
  transform: translateY(-50%);
  z-index: 30;
  width: 44px; height: 44px;
  border-radius: 50%;
  border: 2px solid rgba(192,132,252,.6);
  background: rgba(13,0,32,.8);
  color: #c084fc;
  font-size: 1.8rem;
  line-height: 1;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: border-color .2s, box-shadow .2s, transform .15s;
  backdrop-filter: blur(4px);
  padding: 0;
}
.nav-btn span { display: block; margin-top: -2px; }
.nav-btn:hover:not(:disabled) {
  border-color: #c084fc;
  box-shadow: 0 0 18px rgba(192,132,252,.6);
  transform: translateY(-50%) scale(1.1);
}
.nav-btn:disabled { opacity: .3; cursor: default; }
.nav-prev { right: 60%; }
.nav-next { right: 30%; }

/* pulse ring on nav buttons */
.nav-btn::after {
  content: '';
  position: absolute;
  inset: -4px;
  border-radius: 50%;
  border: 1px solid rgba(192,132,252,.3);
  animation: nav-pulse 2s ease-in-out infinite;
}
@keyframes nav-pulse {
  0%,100% { transform: scale(1);   opacity: .5; }
  50%      { transform: scale(1.3); opacity: 0;  }
}

/* ── 3-D track ── */
.track {
  width: 0;
  height: 0;
  transform-style: preserve-3d;
  transition: transform .42s cubic-bezier(.4, 0, .2, 1);
  position: relative;
}
.track.animating {
  filter: drop-shadow(0 0 24px rgba(192,132,252,.5));
}

/* ── Cards ── */
.card {
  position: absolute;
  width: 160px; height: 220px;
  left: -80px; top: -110px;
  transform-style: preserve-3d;
  cursor: pointer;
  transition: filter .3s;
}
.card:not(.active) { filter: brightness(.45) saturate(.4); }

.card-inner {
  width: 100%; height: 100%;
  border-radius: 20px;
  background: linear-gradient(160deg, rgba(255,255,255,.12), rgba(255,255,255,.04));
  border: 1.5px solid var(--c);
  box-shadow: 0 0 20px color-mix(in srgb, var(--c) 35%, transparent),
              inset 0 1px 0 rgba(255,255,255,.15);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  backdrop-filter: blur(6px);
  transition: box-shadow .3s, border-color .3s;
  position: relative;
  overflow: hidden;
}

/* active card glow + animated border */
.card.active .card-inner {
  border-color: var(--c);
  box-shadow: 0 0 40px color-mix(in srgb, var(--c) 55%, transparent),
              inset 0 0 20px color-mix(in srgb, var(--c) 15%, transparent);
}
.card.active .card-inner::before {
  content: '';
  position: absolute;
  inset: -2px;
  border-radius: 21px;
  background: conic-gradient(from var(--a, 0deg), var(--c), transparent 40%, var(--c));
  z-index: -1;
  animation: card-border-spin 2s linear infinite;
}
.card.active .card-inner::after {
  content: '';
  position: absolute;
  inset: 1.5px;
  border-radius: 19px;
  background: linear-gradient(160deg, rgba(255,255,255,.08), rgba(0,0,0,.6));
  z-index: -1;
}

@property --a {
  syntax: '<angle>';
  initial-value: 0deg;
  inherits: false;
}
@keyframes card-border-spin { to { --a: 360deg; } }

.card-emoji {
  font-size: 3rem;
  filter: drop-shadow(0 0 12px var(--c));
  transition: transform .3s;
}
.card.active .card-emoji { animation: emoji-bob 1.8s ease-in-out infinite alternate; }
@keyframes emoji-bob { from { transform: translateY(0) scale(1); } to { transform: translateY(-6px) scale(1.05); } }

.card-name {
  font-family: 'Bebas Neue', sans-serif;
  font-size: 1.7rem;
  letter-spacing: .1em;
  text-align: center;
  color: var(--c);
  text-shadow: 0 0 18px var(--c);
}
.card-desc {
  font-size: .78rem;
  color: rgba(255,255,255,.5);
  letter-spacing: .04em;
}
.card-cta {
  font-family: 'Bebas Neue', sans-serif;
  font-size: .75rem;
  letter-spacing: .2em;
  color: var(--c);
  opacity: .8;
  animation: cta-blink 1.2s ease-in-out infinite alternate;
  margin-top: 4px;
}
@keyframes cta-blink { from { opacity: .4; } to { opacity: 1; } }

/* ── Hub ── */
.hub {
  position: absolute;
  width: 52px; height: 52px;
  pointer-events: none;
  z-index: 10;
}
.hub-ring {
  position: absolute; inset: 0;
  border-radius: 50%;
  border: 2px solid rgba(192,132,252,.7);
  background: radial-gradient(circle, #2a0a4a 0%, #0d0020 100%);
  box-shadow: 0 0 18px #c084fc, inset 0 0 12px #c084fc44;
  animation: hub-pulse 2s ease-in-out infinite alternate;
}
.hub-ring--2 { inset: 8px; border-color: rgba(255,255,255,.2); animation-delay: .6s; }
@keyframes hub-pulse { to { box-shadow: 0 0 32px #c084fc, inset 0 0 20px #c084fc66; } }

/* ── Floor ── */
.floor {
  position: absolute;
  bottom: -30px; left: 50%;
  transform: translateX(-50%);
  width: 320px; height: 40px;
  background: radial-gradient(ellipse, rgba(192,132,252,.25) 0%, transparent 70%);
  filter: blur(8px);
  pointer-events: none;
}

/* ── Dot indicators ── */
.dots {
  display: flex;
  gap: 10px;
  margin-top: -8px;
}
.dot {
  width: 10px; height: 10px;
  border-radius: 50%;
  border: 1.5px solid var(--c);
  background: transparent;
  cursor: pointer;
  transition: background .2s, transform .2s, box-shadow .2s;
  padding: 0;
}
.dot.active {
  background: var(--c);
  transform: scale(1.4);
  box-shadow: 0 0 10px var(--c);
}

/* ── Badge ── */
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
  transition: background .2s, color .2s, box-shadow .2s;
}
.play-btn:hover {
  background: var(--c);
  color: #000;
  box-shadow: 0 0 20px var(--c);
}

/* badge swap transition */
.badge-enter-active { animation: badge-in .35s cubic-bezier(.34,1.56,.64,1); }
.badge-leave-active { animation: badge-in .2s reverse; position: absolute; }
@keyframes badge-in {
  from { opacity: 0; transform: translateY(14px) scale(.94); }
  to   { opacity: 1; transform: none; }
}
</style>