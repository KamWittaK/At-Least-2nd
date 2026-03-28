<template>
  <main class="over-under-view">
    <div class="bg-orb orb-left" aria-hidden="true" />
    <div class="bg-orb orb-right" aria-hidden="true" />
    <div class="noise" aria-hidden="true" />

    <section class="game-shell">
      <header class="hero">
        <div>
          <p class="eyebrow">Three Card Guessing</p>
          <h1>Over Under</h1>
          <p class="hero-copy">
            Ante one unit, read the first card, then decide whether the three-card total will
            finish over 23 or under 18.
          </p>
        </div>

        <div class="hero-actions">
          <button class="ghost-btn" @click="router.push('/wheel')">Back to Wheel</button>
          <button class="ghost-btn" @click="resetRound">Reset Round</button>
        </div>
      </header>

      <section class="layout">
        <section class="table-card">
          <div class="table-head">
            <div>
              <p class="section-label">Shoe</p>
              <h2>{{ deckCount }} Decks</h2>
            </div>

            <div class="deck-switcher">
              <button
                v-for="count in deckOptions"
                :key="count"
                class="deck-btn"
                :class="{ active: deckCount === count }"
                :disabled="roundState === 'decision'"
                @click="setDeckCount(count)"
              >
                {{ count }}
              </button>
            </div>
          </div>

          <div class="stats-grid">
            <article class="stat-panel">
              <span>Ante</span>
              <strong>{{ formatChips(anteBet) }}</strong>
            </article>
            <article class="stat-panel">
              <span>House Savings</span>
              <strong>{{ formatChips(savings) }}</strong>
            </article>
            <article class="stat-panel">
              <span>Spendings</span>
              <strong>{{ formatChips(spendings) }}</strong>
            </article>
            <article class="stat-panel">
              <span>Available</span>
              <strong>{{ formatChips(availableToPlay) }}</strong>
            </article>
            <article class="stat-panel">
              <span>Cards Left</span>
              <strong>{{ shoe.length }}</strong>
            </article>
          </div>

          <div class="bet-rail">
            <p class="section-label">Choose Unit Size</p>
            <p v-if="availableToPlay <= 0" class="bankroll-warning">
              You're broke for this session. Go allocate some money before you jump back in.
            </p>
            <div class="chip-row">
              <button
                v-for="chip in chips"
                :key="chip"
                class="chip"
                :class="{ active: selectedChip === chip }"
                :style="{ '--chip-color': chipColor(chip) }"
                :disabled="roundState !== 'waiting' || chip > maxPlayableBet"
                @click="selectedChip = chip"
              >
                <span class="chip-face">
                  <span class="chip-amount">${{ chip }}</span>
                </span>
              </button>
            </div>

            <button class="primary-btn" :disabled="!canDealAnte" @click="dealAnte">
              Deal First Card
            </button>
          </div>

          <div class="decision-panel">
            <div>
              <p class="section-label">Decision</p>
              <h3>{{ decisionHeadline }}</h3>
              <p class="decision-copy">{{ decisionCopy }}</p>
            </div>

            <div class="decision-actions">
              <button class="decision-btn fold" :disabled="!canChoose" @click="foldHand">
                Fold
              </button>
              <button class="decision-btn over" :disabled="!canChoose" @click="resolveHand('over')">
                Over
              </button>
              <button
                class="decision-btn under"
                :disabled="!canChoose"
                @click="resolveHand('under')"
              >
                Under
              </button>
            </div>
          </div>
        </section>

        <section class="table-card board-card">
          <div class="table-head">
            <div>
              <p class="section-label">Table Layout</p>
              <h2>Over Under Layout</h2>
            </div>
            <div class="thresholds">
              <span>Over pays on 24+</span>
              <span>Under pays on 17-</span>
            </div>
          </div>

          <div class="felt-table">
            <div class="felt-rail top-rail">
              <span>THE HOUSE</span>
              <span>THREE CARD TOTAL</span>
              <span>OVER / UNDER</span>
            </div>

            <div class="card-lane">
              <article v-for="(card, index) in displayCards" :key="`slot-${index}`" class="card-slot">
                <img v-if="card" :src="card.image" :alt="card.label" class="playing-card" />
                <div v-else class="card-back">
                  <span>HOUSE</span>
                </div>
              </article>
            </div>

            <div class="bet-spots">
              <div class="bet-spot ante-spot">
                <span class="spot-label">Ante</span>
                <strong>{{ anteBet ? `$${anteBet}` : '1 UNIT' }}</strong>
              </div>
              <div class="bet-spot over-spot" :class="{ selected: chosenSide === 'over' }">
                <span class="spot-label">Over</span>
                <strong>24+</strong>
              </div>
              <div class="bet-spot under-spot" :class="{ selected: chosenSide === 'under' }">
                <span class="spot-label">Under</span>
                <strong>17-</strong>
              </div>
              <div class="bet-spot fold-spot" :class="{ selected: chosenSide === 'fold' }">
                <span class="spot-label">Fold</span>
                <strong>Surrender</strong>
              </div>
            </div>

            <div class="result-strip">
              <div class="result-item">
                <span class="section-label">Current Total</span>
                <strong>{{ totalValue }}</strong>
              </div>
              <div class="result-item">
                <span class="section-label">Call</span>
                <strong>{{ callLabel }}</strong>
              </div>
              <div class="result-item">
                <span class="section-label">Result</span>
                <strong>{{ resultLabel }}</strong>
              </div>
            </div>
          </div>

          <Transition name="fade">
            <article v-if="statusMessage" class="status-card" :class="statusTone">
              <p class="section-label">Round Status</p>
              <h3>{{ statusTitle }}</h3>
              <p>{{ statusMessage }}</p>
            </article>
          </Transition>
        </section>
      </section>
    </section>

    <Transition name="trash">
      <div v-if="showTrashTalk" class="trash-talk">
        <div class="trash-border-tl" />
        <div class="trash-border-br" />
        <span class="trash-icon">💀</span>
        <span class="trash-text">{{ activeTrashTalk }}</span>
        <span class="trash-icon">💀</span>
      </div>
    </Transition>
  </main>
</template>

<script setup>
import { computed, onUnmounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { useHackStore } from '../stores/index.js'

const API_BASE_URL = 'http://localhost:8000'
const SUITS = ['clubs', 'diamonds', 'hearts', 'spades']
const RANKS = ['ace', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'jack', 'queen', 'king']
const FACE_RANKS = new Set(['10', 'jack', 'queen', 'king'])

const cardModules = import.meta.glob('../assets/cards/*.svg', { eager: true, import: 'default' })

const router = useRouter()
const hackStore = useHackStore()
const { savings, spendings, availableToPlay, maxPlayableBet, lastTrashTalkMessage } =
  storeToRefs(hackStore)

const deckOptions = [4, 6, 8]
const chips = [25, 50, 100, 250, 500]

const deckCount = ref(6)
const selectedChip = ref(50)
const shoe = ref([])
const roundState = ref('waiting')
const firstCard = ref(null)
const revealedCards = ref([])
const anteBet = ref(0)
const sideBet = ref(0)
const chosenSide = ref('')
const statusTitle = ref('Make your ante to start.')
const statusMessage = ref('Deal one card face up, then choose Fold, Over, or Under.')
const statusTone = ref('neutral')
const showTrashTalk = ref(false)
let trashTimer = null
let activeTrashAudio = null
let activeTrashAudioUrl = null

initializeShoe()

const displayCards = computed(() => {
  const cards = [firstCard.value, ...revealedCards.value]
  while (cards.length < 3) cards.push(null)
  return cards
})

const allCards = computed(() => [firstCard.value, ...revealedCards.value].filter(Boolean))
const totalValue = computed(() => allCards.value.reduce((sum, card) => sum + cardValue(card), 0))
const canDealAnte = computed(
  () => roundState.value === 'waiting' && selectedChip.value <= maxPlayableBet.value,
)
const canChoose = computed(
  () =>
    roundState.value === 'decision' &&
    anteBet.value > 0 &&
    hackStore.canRisk(anteBet.value, anteBet.value),
)
const callLabel = computed(() => (chosenSide.value ? chosenSide.value.toUpperCase() : 'NONE'))
const resultLabel = computed(() => {
  if (roundState.value !== 'resolved') return 'PENDING'
  return statusTone.value === 'win' ? 'WIN' : 'LOSE'
})
const decisionHeadline = computed(() => {
  if (roundState.value === 'waiting') return 'Place an ante and reveal the first card.'
  if (roundState.value === 'decision') return 'Choose your move after seeing the first card.'
  return 'Round settled. Reset or deal again.'
})
const decisionCopy = computed(() => {
  if (roundState.value === 'waiting') {
    return 'Your ante is one unit. Over or Under must match that ante exactly.'
  }
  if (roundState.value === 'decision') {
    return 'Fold loses the ante. Over wins at 24 or more. Under wins at 17 or less.'
  }
  return 'A winning call pays even money on both the ante and the matching side bet.'
})
const fallbackTrashTalk = computed(() => {
  const lines = hackStore.trashTalks || []
  return lines[Math.floor(Math.random() * lines.length)] || 'The house still found a way to talk.'
})
const activeTrashTalk = computed(() => lastTrashTalkMessage.value || fallbackTrashTalk.value)

function initializeShoe() {
  shoe.value = shuffle(createShoe(deckCount.value))
}

function createShoe(numberOfDecks) {
  const cards = []

  for (let deckIndex = 0; deckIndex < numberOfDecks; deckIndex += 1) {
    SUITS.forEach((suit) => {
      RANKS.forEach((rank) => {
        const moduleKey = `../assets/cards/${rank}_of_${suit}.svg`
        const image = cardModules[moduleKey]

        if (!image) return

        cards.push({
          id: `${deckIndex}-${rank}-${suit}-${Math.random().toString(36).slice(2, 9)}`,
          rank,
          suit,
          image,
          label: `${prettyRank(rank)} of ${capitalize(suit)}`,
        })
      })
    })
  }

  return cards
}

function shuffle(cards) {
  const deck = [...cards]

  for (let index = deck.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    ;[deck[index], deck[swapIndex]] = [deck[swapIndex], deck[index]]
  }

  return deck
}

function drawCard() {
  if (shoe.value.length < 3) initializeShoe()
  return shoe.value.shift()
}

function setDeckCount(count) {
  deckCount.value = count
  resetRound()
  initializeShoe()
}

function resetRound() {
  firstCard.value = null
  revealedCards.value = []
  anteBet.value = 0
  sideBet.value = 0
  chosenSide.value = ''
  roundState.value = 'waiting'
  statusTone.value = 'neutral'
  statusTitle.value = 'Make your ante to start.'
  statusMessage.value = 'Deal one card face up, then choose Fold, Over, or Under.'
}

function dealAnte() {
  if (!canDealAnte.value) return

  if (shoe.value.length < 12) initializeShoe()

  anteBet.value = selectedChip.value
  firstCard.value = drawCard()
  revealedCards.value = []
  sideBet.value = 0
  chosenSide.value = ''
  roundState.value = 'decision'
  statusTone.value = 'neutral'
  statusTitle.value = `First card: ${firstCard.value.label}`
  statusMessage.value = `Match the ante with Over or Under, or fold and surrender the ante. Available: ${formatChips(availableToPlay.value)}.`
}

function foldHand() {
  if (roundState.value !== 'decision') return

  const lostAmount = anteBet.value
  roundState.value = 'resolved'
  chosenSide.value = 'fold'
  sideBet.value = 0
  statusTone.value = 'lose'
  statusTitle.value = 'Fold'
  statusMessage.value = `You gave up the hand and forfeited ${formatChips(lostAmount)} to savings.`
  triggerTrashTalk()
  hackStore.moveLossToSavings(lostAmount)
  anteBet.value = 0
}

function resolveHand(side) {
  if (!canChoose.value) return

  chosenSide.value = side
  sideBet.value = anteBet.value

  revealedCards.value = [drawCard(), drawCard()]
  roundState.value = 'resolved'

  const total = totalValue.value
  const playerWon = side === 'over' ? total >= 24 : total <= 17
  const totalRisk = anteBet.value + sideBet.value

  if (playerWon) {
    statusTone.value = 'win'
    statusTitle.value = `${side === 'over' ? 'Over' : 'Under'} wins`
    statusMessage.value = `Total ${total} pays even money on the ante and ${side} bet.`
    hackStore.moveWinToSpendings(totalRisk)
  } else {
    statusTone.value = 'lose'
    statusTitle.value = `${side === 'over' ? 'Over' : 'Under'} loses`
    statusMessage.value = `Total ${total} does not satisfy the ${side} target, so both wagers lose.`
    triggerTrashTalk()
    hackStore.moveLossToSavings(totalRisk)
  }

  anteBet.value = 0
  sideBet.value = 0
}

function cardValue(card) {
  if (!card) return 0
  if (card.rank === 'ace') return 11
  return FACE_RANKS.has(card.rank) ? 10 : Number(card.rank)
}

function prettyRank(rank) {
  if (rank === 'ace') return 'Ace'
  if (rank === 'jack') return 'Jack'
  if (rank === 'queen') return 'Queen'
  if (rank === 'king') return 'King'
  return rank
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function formatChips(value) {
  return `$${Number(value).toLocaleString()}`
}

function chipColor(chip) {
  const colors = {
    25: '#d94b4b',
    50: '#2f7de1',
    100: '#2fa66a',
    250: '#7e57c2',
    500: '#f39c12',
  }

  return colors[chip] || '#c46c2b'
}

async function triggerTrashTalk() {
  const message = await fetchTrashTalkMessage()
  const talkingTime = await playTrashTalk(message)

  showTrashTalk.value = true
  clearTimeout(trashTimer)
  trashTimer = setTimeout(() => {
    showTrashTalk.value = false
  }, talkingTime + 250)
}

async function fetchTrashTalkMessage() {
  try {
    const response = await fetch(`${API_BASE_URL}/trashtalk`)
    if (!response.ok) throw new Error(`Trash talk request failed with ${response.status}`)

    const data = await response.json()
    const message = String(data.message || data.text || '').trim()
    if (message) {
      hackStore.setTrashTalkMessage(message)
      return message
    }
  } catch (error) {
    console.error('Error fetching trash talk:', error)
  }

  const fallbackMessage = activeTrashTalk.value
  hackStore.setTrashTalkMessage(fallbackMessage)
  return fallbackMessage
}

async function playTrashTalk(message) {
  const normalizedMessage = String(message || '').trim()
  if (!normalizedMessage) return 0

  hackStore.setTrashTalkMessage(normalizedMessage)
  stopTrashTalkPlayback()

  try {
    const response = await fetch(`${API_BASE_URL}/tts?text=${encodeURIComponent(normalizedMessage)}`)
    if (!response.ok) throw new Error(`TTS request failed with ${response.status}`)

    const blob = await response.blob()
    activeTrashAudioUrl = URL.createObjectURL(blob)
    activeTrashAudio = new Audio(activeTrashAudioUrl)

    const talkingTime = await getAudioDuration(activeTrashAudio)
    hackStore.cycleQuip(talkingTime, normalizedMessage)

    activeTrashAudio.addEventListener(
      'ended',
      () => {
        hackStore.stopQuip()
        cleanupAudioUrl()
      },
      { once: true },
    )
    activeTrashAudio.addEventListener(
      'error',
      () => {
        hackStore.stopQuip()
        cleanupAudioUrl()
      },
      { once: true },
    )

    await activeTrashAudio.play()
    return talkingTime
  } catch (error) {
    console.error('Error playing trash talk audio:', error)
    const fallbackDuration = estimateTalkingTime(normalizedMessage)
    hackStore.cycleQuip(fallbackDuration, normalizedMessage)
    return fallbackDuration
  }
}

function getAudioDuration(audio) {
  return new Promise((resolve) => {
    const resolveDuration = () => {
      const durationMs = Number.isFinite(audio.duration) ? Math.ceil(audio.duration * 1000) : 0
      resolve(durationMs || estimateTalkingTime(lastTrashTalkMessage.value))
    }

    if (audio.readyState >= 1 && Number.isFinite(audio.duration) && audio.duration > 0) {
      resolveDuration()
      return
    }

    audio.addEventListener('loadedmetadata', resolveDuration, { once: true })
    audio.addEventListener(
      'error',
      () => resolve(estimateTalkingTime(lastTrashTalkMessage.value)),
      { once: true },
    )
  })
}

function estimateTalkingTime(message) {
  return Math.max(2200, String(message || '').trim().length * 70)
}

function stopTrashTalkPlayback() {
  hackStore.stopQuip()

  if (activeTrashAudio) {
    activeTrashAudio.pause()
    activeTrashAudio.currentTime = 0
    activeTrashAudio = null
  }

  cleanupAudioUrl()
}

function cleanupAudioUrl() {
  if (activeTrashAudioUrl) {
    URL.revokeObjectURL(activeTrashAudioUrl)
    activeTrashAudioUrl = null
  }
}

onUnmounted(() => {
  stopTrashTalkPlayback()
})
</script>

<style scoped>
.over-under-view {
  min-height: 100vh;
  position: relative;
  overflow: hidden;
  background:
    radial-gradient(circle at top, rgba(255, 132, 76, 0.18), transparent 30%),
    linear-gradient(180deg, #09080f 0%, #14111d 45%, #09080f 100%);
  color: #fff6eb;
  font-family: 'Exo 2', sans-serif;
  padding: 120px 20px 40px;
}

.bg-orb {
  position: absolute;
  width: 360px;
  height: 360px;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.45;
}

.orb-left {
  top: 80px;
  left: -120px;
  background: rgba(0, 245, 255, 0.18);
}

.orb-right {
  right: -120px;
  bottom: 60px;
  background: rgba(255, 107, 53, 0.24);
}

.noise {
  position: absolute;
  inset: 0;
  background-image: radial-gradient(rgba(255, 255, 255, 0.08) 0.8px, transparent 0.8px);
  background-size: 18px 18px;
  opacity: 0.08;
  pointer-events: none;
}

.trash-enter-active,
.trash-leave-active {
  transition: all 0.24s ease;
}

.trash-enter-from,
.trash-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

.trash-talk {
  position: fixed;
  top: 10px;
  left: 42%;
  transform: translateX(-50%);
  z-index: 35;
  display: flex;
  align-items: center;
  gap: 12px;
  max-width: min(92vw, 760px);
  padding: 16px 18px;
  border-radius: 20px;
  background: rgba(18, 6, 6, 0.92);
  border: 1px solid rgba(255, 94, 94, 0.35);
  color: #ffe1e1;
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.26);
  z-index: 111;
}

.trash-icon {
  font-size: 1.25rem;
}

.trash-text {
  line-height: 1.45;
}

.trash-border-tl,
.trash-border-br {
  position: absolute;
  width: 28px;
  height: 28px;
  border-color: rgba(255, 184, 184, 0.45);
}

.trash-border-tl {
  top: 8px;
  left: 8px;
  border-top: 1px solid;
  border-left: 1px solid;
}

.trash-border-br {
  right: 8px;
  bottom: 8px;
  border-right: 1px solid;
  border-bottom: 1px solid;
}

.game-shell {
  position: relative;
  z-index: 1;
  max-width: 1200px;
  margin: 0 auto;
}

.hero {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 30px;
}

.hero-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.eyebrow,
.section-label {
  text-transform: uppercase;
  letter-spacing: 0.2em;
  color: #ff9d6c;
  font-size: 0.78rem;
}

h1 {
  font-size: clamp(3rem, 9vw, 5.5rem);
  line-height: 0.92;
  margin: 6px 0 0;
}

h2,
h3 {
  margin: 0;
}

.hero-copy,
.decision-copy,
.status-card p {
  color: rgba(255, 246, 235, 0.72);
  line-height: 1.5;
}

.layout {
  display: grid;
  grid-template-columns: 420px minmax(0, 1fr);
  gap: 22px;
}

.table-card {
  background: rgba(10, 10, 18, 0.72);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 28px;
  backdrop-filter: blur(18px);
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.28);
  padding: 24px;
}

.table-head,
.totals-panel,
.decision-panel,
.bet-rail {
  margin-bottom: 24px;
}

.table-head,
.totals-panel {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: start;
}

.thresholds,
.hero-copy {
  max-width: 500px;
}

.thresholds {
  display: grid;
  gap: 8px;
  color: rgba(255, 246, 235, 0.65);
  text-align: right;
}

.deck-switcher,
.chip-row,
.decision-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.deck-btn,
.chip,
.ghost-btn,
.primary-btn,
.decision-btn {
  border: 0;
  cursor: pointer;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    opacity 0.2s ease,
    background 0.2s ease;
}

.deck-btn,
.chip,
.ghost-btn {
  padding: 12px 16px;
  border-radius: 999px;
  color: #fff6eb;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.14);
}

.deck-btn.active,
.chip.active {
  background: linear-gradient(135deg, rgba(255, 122, 61, 0.95), rgba(255, 61, 110, 0.95));
  box-shadow: 0 16px 34px rgba(255, 61, 110, 0.18);
}

.chip-row {
  gap: 14px;
}

.bankroll-warning {
  margin: 0 0 14px;
  padding: 12px 14px;
  border-radius: 16px;
  border: 1px solid rgba(255, 107, 107, 0.34);
  background: rgba(120, 19, 24, 0.28);
  color: #ffd5d5;
  font-size: 0.95rem;
  line-height: 1.45;
}

.chip {
  padding: 0;
  width: 78px;
  height: 78px;
  border-radius: 50%;
  background:
    radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.38), transparent 22%),
    radial-gradient(circle at center, rgba(255, 255, 255, 0.08) 0 38%, transparent 39%),
    var(--chip-color);
  border: 4px solid rgba(255, 247, 230, 0.72);
  box-shadow:
    inset 0 0 0 6px rgba(0, 0, 0, 0.16),
    inset 0 0 0 12px rgba(255, 255, 255, 0.15),
    0 12px 24px rgba(0, 0, 0, 0.28);
  display: grid;
  place-items: center;
}

.chip-face {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: rgba(10, 10, 18, 0.22);
  border: 2px solid rgba(255, 250, 240, 0.72);
  box-shadow: inset 0 0 14px rgba(255, 255, 255, 0.12);
}

.chip-amount {
  font-size: 0.88rem;
  font-weight: 900;
  letter-spacing: 0.02em;
  color: #fffaf0;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.45);
}

.chip.active {
  transform: translateY(-2px) scale(1.05);
  box-shadow:
    inset 0 0 0 6px rgba(0, 0, 0, 0.16),
    inset 0 0 0 12px rgba(255, 255, 255, 0.18),
    0 18px 32px rgba(255, 61, 110, 0.22);
}

.primary-btn,
.decision-btn {
  color: #fff;
  font-weight: 800;
}

.primary-btn {
  width: 100%;
  min-height: 56px;
  border-radius: 18px;
  background: linear-gradient(135deg, #11d4ff, #2e6bff);
  box-shadow: 0 16px 34px rgba(46, 107, 255, 0.35);
}

.decision-btn {
  flex: 1;
  min-width: 110px;
  min-height: 56px;
  border-radius: 18px;
}

.decision-btn.fold {
  background: linear-gradient(135deg, #5d6472, #3b404d);
}

.decision-btn.over {
  background: linear-gradient(135deg, #11d4ff, #2e6bff);
}

.decision-btn.under {
  background: linear-gradient(135deg, #ff7a3d, #ff3d6e);
}

button:hover:not(:disabled) {
  transform: translateY(-2px);
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 24px;
}

.stat-panel,
.status-card,
.totals-panel {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 22px;
}

.stat-panel {
  padding: 16px;
}

.stat-panel span {
  display: block;
  color: rgba(255, 246, 235, 0.6);
  margin-bottom: 8px;
}

.stat-panel strong,
.totals-panel strong {
  font-size: 1.25rem;
}

.board-card {
  display: flex;
  flex-direction: column;
}

.felt-table {
  position: relative;
  border-radius: 30px 30px 140px 140px;
  padding: 22px 24px 30px;
  border: 2px solid rgba(244, 210, 110, 0.28);
  background:
    radial-gradient(circle at 50% 24%, rgba(255, 255, 255, 0.08), transparent 26%),
    radial-gradient(circle at center, rgba(18, 120, 86, 0.35), transparent 60%),
    linear-gradient(180deg, rgba(11, 73, 56, 0.95), rgba(7, 42, 30, 0.98));
  box-shadow:
    inset 0 0 0 10px rgba(5, 22, 16, 0.48),
    inset 0 0 90px rgba(0, 0, 0, 0.18),
    0 30px 60px rgba(0, 0, 0, 0.32);
  overflow: hidden;
}

.felt-table::before {
  content: '';
  position: absolute;
  inset: 14px;
  border-radius: 22px 22px 124px 124px;
  border: 2px solid rgba(244, 210, 110, 0.16);
  pointer-events: none;
}

.felt-rail {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  color: rgba(255, 242, 214, 0.78);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  margin-bottom: 22px;
  position: relative;
  z-index: 1;
}

.card-lane {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  margin: 0 auto 26px;
  max-width: 520px;
  position: relative;
  z-index: 1;
}

.card-slot {
  aspect-ratio: 5 / 7;
  border-radius: 24px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  min-height: 220px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.bet-spots {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
  align-items: end;
  margin-bottom: 24px;
  position: relative;
  z-index: 1;
}

.bet-spot {
  min-height: 118px;
  border-radius: 999px;
  border: 3px solid rgba(244, 210, 110, 0.44);
  background: rgba(8, 37, 27, 0.34);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  padding: 14px;
  box-shadow: inset 0 0 0 10px rgba(255, 255, 255, 0.03);
}

.bet-spot strong {
  font-size: 1.1rem;
  color: #fff8e7;
}

.spot-label {
  text-transform: uppercase;
  letter-spacing: 0.18em;
  font-size: 0.75rem;
  color: rgba(255, 241, 214, 0.7);
  margin-bottom: 8px;
}

.bet-spot.selected {
  border-color: rgba(255, 255, 255, 0.86);
  box-shadow:
    inset 0 0 0 10px rgba(255, 255, 255, 0.06),
    0 0 24px rgba(255, 255, 255, 0.12);
}

.ante-spot {
  transform: rotate(-4deg);
}

.over-spot {
  transform: rotate(-1deg);
}

.under-spot {
  transform: rotate(1deg);
}

.fold-spot {
  transform: rotate(4deg);
}

.result-strip {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  position: relative;
  z-index: 1;
}

.result-item {
  background: rgba(0, 0, 0, 0.18);
  border: 1px solid rgba(244, 210, 110, 0.14);
  border-radius: 18px;
  padding: 14px 16px;
  text-align: center;
}

.result-item strong {
  display: block;
  margin-top: 8px;
  font-size: 1.35rem;
}

.playing-card {
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: #fff;
}

.card-back {
  width: calc(100% - 18px);
  height: calc(100% - 18px);
  border-radius: 18px;
  display: grid;
  place-items: center;
  color: rgba(255, 255, 255, 0.75);
  font-weight: 800;
  letter-spacing: 0.18em;
  background:
    linear-gradient(135deg, rgba(17, 212, 255, 0.25), rgba(46, 107, 255, 0.15)),
    rgba(17, 18, 30, 0.92);
  border: 1px solid rgba(17, 212, 255, 0.3);
}

.status-card {
  padding: 20px;
}

.status-card.win {
  border-color: rgba(17, 212, 255, 0.44);
}

.status-card.lose {
  border-color: rgba(255, 122, 61, 0.44);
}

.status-card.neutral {
  border-color: rgba(255, 255, 255, 0.12);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.22s ease, transform 0.22s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(12px);
}

@media (max-width: 980px) {
  .layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .hero,
  .table-head {
    flex-direction: column;
    align-items: start;
  }

  .thresholds {
    text-align: left;
  }

  .card-lane,
  .bet-spots,
  .result-strip {
    grid-template-columns: 1fr;
  }

  .card-slot {
    min-height: 300px;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
