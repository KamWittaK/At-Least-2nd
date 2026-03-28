<template>
  <main class="blackjack-view">
    <div class="felt-bg" aria-hidden="true" />
    <div class="vignette" aria-hidden="true" />

    <section class="table-shell">
      <header class="table-header">
        <div>
          <p class="eyebrow">Golden Table</p>
          <h1>Blackjack</h1>
          <p class="table-copy">Classic twenty-one with a code-tunable house edge.</p>
        </div>

        <div class="table-stats">
          <div class="stat-pill">
            <span>Balance</span>
            <strong>{{ formatChips(balance) }}</strong>
          </div>
          <div class="stat-pill">
            <span>Bet</span>
            <strong>{{ formatChips(currentBet) }}</strong>
          </div>
          <div class="stat-pill">
            <span>Savings</span>
            <strong>{{ formatChips(savings) }}</strong>
          </div>
          <div class="stat-pill">
            <span>Spendings</span>
            <strong>{{ formatChips(spendings) }}</strong>
          </div>
          <div class="stat-pill accent">
            <span>Available</span>
            <strong>{{ formatChips(availableToPlay) }}</strong>
          </div>
        </div>
      </header>

      <section class="table-surface">
        <div class="table-grid">
          <div class="table-main">
            <div class="hand-panel dealer-panel">
              <div class="hand-head">
                <div>
                  <p class="hand-role">Dealer</p>
                  <h2>House Hand</h2>
                </div>
                <span class="score-badge">{{ visibleDealerScore }}</span>
              </div>

              <div class="cards-row">
                <article
                  v-for="(card, index) in dealerHand"
                  :key="`dealer-${card.id}-${index}`"
                  class="card-tile"
                  :class="{ hidden: shouldHideDealerCard(index) }"
                >
                  <div v-if="shouldHideDealerCard(index)" class="card-back">
                    <span>HOUSE</span>
                  </div>
                  <img v-else :src="card.image" :alt="card.label" class="card-face" />
                </article>
                <div v-if="!dealerHand.length" class="empty-seat">Waiting for deal</div>
              </div>
            </div>

            <Transition name="result">
              <div v-if="roundMessage" class="result-banner" :class="outcomeClass">
                <span class="result-top">{{ roundLabel }}</span>
                <strong>{{ roundMessage }}</strong>
              </div>
            </Transition>

            <div class="hand-panel player-panel">
              <div class="hand-head">
                <div>
                  <p class="hand-role">Player</p>
                  <h2>Your Hand</h2>
                </div>
                <span class="score-badge player">{{ playerScore }}</span>
              </div>

              <div class="cards-row">
                <article
                  v-for="(card, index) in playerHand"
                  :key="`player-${card.id}-${index}`"
                  class="card-tile"
                >
                  <img :src="card.image" :alt="card.label" class="card-face" />
                </article>
                <div v-if="!playerHand.length" class="empty-seat">Place a bet and deal</div>
              </div>
            </div>
          </div>

          <aside class="betting-panel">
            <div class="panel-block">
              <p class="panel-label">Betting Rail</p>
              <div class="bet-controls">
                <div class="chip-row">
                  <button
                    v-for="chip in chips"
                    :key="chip"
                    class="chip"
                    :class="{ active: selectedChip === chip }"
                    :style="{ '--cc': chipColor(chip) }"
                    :disabled="roundActive || chip > maxPlayableBet"
                    @click="selectedChip = chip"
                  >
                    {{ chip }}
                  </button>
                </div>

                <div class="action-row">
                  <button
                    class="clear-btn"
                    :disabled="roundActive || currentBet === 0"
                    @click="clearBet"
                  >
                    CLEAR
                  </button>
                  <button class="bet-btn" :disabled="roundActive" @click="placeBet">
                    ADD {{ selectedChip }}
                  </button>
                  <button
                    class="deal-btn"
                    :disabled="roundActive || currentBet === 0"
                    @click="startRound"
                  >
                    DEAL
                  </button>
                </div>
              </div>
            </div>

            <div class="panel-block">
              <p class="panel-label">Play Hand</p>
              <div class="play-controls">
                <button class="play-btn hit" :disabled="!canHit" @click="hit">HIT</button>
                <button class="play-btn stand" :disabled="!canStand" @click="stand">STAND</button>
                <button class="play-btn ghost" :disabled="roundActive" @click="resetTable">
                  RESET TABLE
                </button>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </section>

    <Transition name="toast">
      <div v-if="toastMsg" class="toast">{{ toastMsg }}</div>
    </Transition>

    <!-- <Transition name="celebrate">
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
        </div>
      </div>
    </Transition> -->

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
import { computed, onUnmounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { useHackStore } from '../stores/index.js'

const BLACKJACK_PAYOUT = 1.5
const HOUSE_EDGE_BIAS = 0.40
const DEALER_STAND_SCORE = 17
const API_BASE_URL = 'http://localhost:8000'

const SUITS = ['clubs', 'diamonds', 'hearts', 'spades']
const RANKS = ['ace', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'jack', 'queen', 'king']
const FACE_RANKS = new Set(['10', 'jack', 'queen', 'king'])

const chips = [25, 50, 100, 250, 500]
const cardModules = import.meta.glob('../assets/cards/*.svg', { eager: true, import: 'default' })

const router = useRouter()
const hackStore = useHackStore()
const { balance, lastTrashTalkMessage, savings, spendings, availableToPlay, maxPlayableBet } =
  storeToRefs(hackStore)

const currentBet = ref(0)
const selectedChip = ref(50)
const deck = ref([])
const playerHand = ref([])
const dealerHand = ref([])
const roundState = ref('idle')
const roundMessage = ref('')
const roundLabel = ref('')
const roundOutcome = ref('')
const dealerHoleHidden = ref(true)
const toastMsg = ref('')
const showCelebration = ref(false)
const showTrashTalk = ref(false)
const confettiCanvas = ref(null)

let toastTimer = null
let trashTimer = null
let activeTrashAudio = null
let activeTrashAudioUrl = null

const balloons = [
  { id: 1, emoji: '🎈', style: '--delay:0s;--x:10%;--size:3rem' },
  { id: 2, emoji: '🎉', style: '--delay:.25s;--x:24%;--size:2.6rem' },
  { id: 3, emoji: '🎊', style: '--delay:.5s;--x:40%;--size:2.8rem' },
  { id: 4, emoji: '🥳', style: '--delay:.15s;--x:60%;--size:2.7rem' },
  { id: 5, emoji: '🎈', style: '--delay:.4s;--x:78%;--size:3.1rem' },
]

const fallbackTrashTalk = computed(() => {
  const lines = hackStore.trashTalks || []
  return lines[Math.floor(Math.random() * lines.length)] || 'The house still found a way to talk.'
})
const activeTrashTalk = computed(() => lastTrashTalkMessage.value || fallbackTrashTalk.value)

const roundActive = computed(() => roundState.value === 'player' || roundState.value === 'dealer')
const playerScore = computed(() => bestScore(playerHand.value))
const dealerScore = computed(() => bestScore(dealerHand.value))
const visibleDealerScore = computed(() => {
  if (!dealerHand.value.length) return 0
  if (!dealerHoleHidden.value || dealerHand.value.length < 2) return dealerScore.value
  return bestScore([dealerHand.value[0]])
})
const outcomeClass = computed(() => {
  if (roundOutcome.value === 'win') return 'win'
  if (roundOutcome.value === 'push') return 'push'
  return 'lose'
})
const canHit = computed(() => roundState.value === 'player' && playerScore.value < 21)
const canStand = computed(() => roundState.value === 'player')

function createDeck() {
  return SUITS.flatMap((suit) =>
    RANKS.map((rank) => ({
      id: `${rank}-${suit}-${Math.random().toString(36).slice(2, 9)}`,
      rank,
      suit,
      image: cardModules[`../assets/cards/${rank}_of_${suit}.svg`],
      label: `${prettyRank(rank)} of ${capitalize(suit)}`,
    })),
  )
}

function resetDeck() {
  deck.value = createDeck()
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

function cardBaseValue(card) {
  if (!card) return 0
  if (card.rank === 'ace') return 11
  return FACE_RANKS.has(card.rank) ? 10 : Number(card.rank)
}

function bestScore(hand) {
  let total = 0
  let aces = 0

  hand.forEach((card) => {
    total += cardBaseValue(card)
    if (card.rank === 'ace') aces += 1
  })

  while (total > 21 && aces > 0) {
    total -= 10
    aces -= 1
  }

  return total
}

function weightedDraw(recipient) {
  if (!deck.value.length) resetDeck()

  const hand = recipient === 'dealer' ? dealerHand.value : playerHand.value
  const currentTotal = bestScore(hand)
  const weightedCards = deck.value.map((card) => ({
    card,
    weight: drawWeight(card, recipient, currentTotal),
  }))

  const totalWeight = weightedCards.reduce((sum, item) => sum + item.weight, 0)
  let roll = Math.random() * totalWeight
  let selectedIndex = weightedCards.length - 1

  for (let index = 0; index < weightedCards.length; index += 1) {
    roll -= weightedCards[index].weight
    if (roll <= 0) {
      selectedIndex = index
      break
    }
  }

  return deck.value.splice(selectedIndex, 1)[0]
}

function drawWeight(card, recipient, currentTotal) {
  const nextTotal = bestScore([
    ...Array.from({ length: currentTotal === 0 ? 0 : 1 }, () => ({ rank: '2' })),
  ])
  void nextTotal

  let weight = 1
  const cardValue = cardBaseValue(card)

  if (recipient === 'player') {
    if (currentTotal >= 12) {
      const simulatedScore = bestScore([...playerHand.value, card])
      if (simulatedScore > 21) weight *= 1 + HOUSE_EDGE_BIAS * 8
      else if (cardValue >= 10) weight *= 1 + HOUSE_EDGE_BIAS * 2
      else weight *= 1 - HOUSE_EDGE_BIAS * 0.8
    } else {
      if (cardValue <= 5) weight *= 1 + HOUSE_EDGE_BIAS * 2.5
      if (card.rank === 'ace' || cardValue >= 10) weight *= 1 - HOUSE_EDGE_BIAS * 1.25
    }
  }

  if (recipient === 'dealer') {
    const simulatedScore = bestScore([...dealerHand.value, card])
    if (currentTotal < DEALER_STAND_SCORE) {
      if (simulatedScore >= DEALER_STAND_SCORE && simulatedScore <= 21) weight *= 1 + HOUSE_EDGE_BIAS * 6
      if (simulatedScore > 21) weight *= Math.max(0.12, 1 - HOUSE_EDGE_BIAS * 6)
    }
  }

  return Math.max(0.08, weight)
}

function formatChips(value) {
  return `${Math.round(value).toLocaleString()} chips`
}

function chipColor(chip) {
  const colors = {
    25: '#e74c3c',
    50: '#3498db',
    100: '#2ecc71',
    250: '#9b59b6',
    500: '#f39c12',
  }
  return colors[chip] || '#a39a7b'
}

function placeBet() {
  if (roundActive.value) return
  if (balance.value < selectedChip.value) {
    showToast('Not enough chips to place that bet.')
    return
  }
  if (!hackStore.canRisk(selectedChip.value, currentBet.value)) {
    showToast('That bet goes past your session limit.')
    return
  }

  balance.value -= selectedChip.value
  currentBet.value += selectedChip.value
  roundMessage.value = ''
  roundLabel.value = ''
  roundOutcome.value = ''
}

function clearBet() {
  if (roundActive.value || currentBet.value === 0) return
  balance.value += currentBet.value
  currentBet.value = 0
}

async function startRound() {
  if (roundActive.value || currentBet.value === 0) return

  if (deck.value.length < 15) resetDeck()

  playerHand.value = []
  dealerHand.value = []
  roundMessage.value = ''
  roundLabel.value = ''
  roundOutcome.value = ''
  dealerHoleHidden.value = true
  roundState.value = 'player'

  playerHand.value.push(weightedDraw('player'))
  dealerHand.value.push(weightedDraw('dealer'))
  playerHand.value.push(weightedDraw('player'))
  dealerHand.value.push(weightedDraw('dealer'))

  const playerNatural = playerScore.value === 21
  const dealerNatural = dealerScore.value === 21

  if (playerNatural || dealerNatural) {
    await finishNaturals(playerNatural, dealerNatural)
  }
}

async function hit() {
  if (!canHit.value) return

  playerHand.value.push(weightedDraw('player'))
  if (playerScore.value > 21) {
    dealerHoleHidden.value = false
    finishRound('lose', 'Bust. House takes the hand.', 0, 'BUST')
  } else if (playerScore.value === 21) {
    await stand()
  }
}

async function stand() {
  if (!canStand.value) return

  roundState.value = 'dealer'
  dealerHoleHidden.value = false

  while (dealerScore.value < DEALER_STAND_SCORE) {
    await wait(450)
    dealerHand.value.push(weightedDraw('dealer'))
  }

  await wait(250)
  settleHands()
}

async function finishNaturals(playerNatural, dealerNatural) {
  dealerHoleHidden.value = false
  await wait(450)

  if (playerNatural && dealerNatural) {
    finishRound('push', 'Both sides hit blackjack. Push.', currentBet.value, 'PUSH')
    return
  }

  if (playerNatural) {
    finishRound(
      'win',
      `Blackjack pays ${BLACKJACK_PAYOUT}x.`,
      currentBet.value + currentBet.value * BLACKJACK_PAYOUT,
      'BLACKJACK',
    )
    return
  }

  finishRound('lose', 'Dealer shows blackjack.', 0, 'HOUSE')
}

function settleHands() {
  if (dealerScore.value > 21) {
    finishRound('win', 'Dealer busts. Chips slide your way.', currentBet.value * 2, 'WIN')
    return
  }

  if (playerScore.value > dealerScore.value) {
    finishRound('win', 'You beat the house.', currentBet.value * 2, 'WIN')
    return
  }

  if (playerScore.value === dealerScore.value) {
    finishRound('push', 'Dead even. Bet returned.', currentBet.value, 'PUSH')
    return
  }

  finishRound('lose', 'Dealer hand holds.', 0, 'HOUSE')
}

function finishRound(outcome, message, payout, label) {
  const settledBet = currentBet.value

  roundState.value = 'finished'
  roundOutcome.value = outcome
  roundMessage.value = message
  roundLabel.value = label

  if (payout > 0) balance.value += payout

  if (outcome === 'win') {
    showToast(`You won ${Math.round(payout - settledBet)} chips.`)
    hackStore.moveWinToSpendings(settledBet)
  } else if (outcome === 'push') {
    showToast('Push. Your bet is back on the rail.')
  } else {
    showToast('House wins this round.')
    triggerTrashTalk()
    hackStore.moveLossToSavings(settledBet)
  }

  currentBet.value = 0
  checkCelebration()
}

function checkCelebration() {
  if (!hackStore.goalReached) return

  showCelebration.value = true
  setTimeout(() => {
    showCelebration.value = false
    //router.push('/')
  }, 5000)
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

function showToast(message) {
  toastMsg.value = message
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toastMsg.value = ''
  }, 2800)
}

function shouldHideDealerCard(index) {
  return dealerHoleHidden.value && index === 1 && roundState.value !== 'finished'
}

function resetTable() {
  if (roundActive.value) return
  clearBet()
  playerHand.value = []
  dealerHand.value = []
  roundMessage.value = ''
  roundLabel.value = ''
  roundOutcome.value = ''
  dealerHoleHidden.value = true
  roundState.value = 'idle'
}

function wait(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
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

function launchConfetti() {
  const canvas = confettiCanvas.value
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight

  const colors = ['#f5d060', '#e74c3c', '#2ecc71', '#3498db', '#fff', '#ff8c42']
  const pieces = Array.from({ length: 140 }, () => ({
    x: Math.random() * canvas.width,
    y: -20 - Math.random() * 180,
    w: 6 + Math.random() * 10,
    h: 4 + Math.random() * 6,
    color: colors[Math.floor(Math.random() * colors.length)],
    rot: Math.random() * Math.PI * 2,
    vx: (Math.random() - 0.5) * 4,
    vy: 2 + Math.random() * 4,
    vr: (Math.random() - 0.5) * 0.18,
  }))

  let frame = 0
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    pieces.forEach((piece) => {
      piece.x += piece.vx
      piece.y += piece.vy
      piece.rot += piece.vr
      if (piece.y > canvas.height + 20) {
        piece.y = -20
        piece.x = Math.random() * canvas.width
      }

      ctx.save()
      ctx.translate(piece.x, piece.y)
      ctx.rotate(piece.rot)
      ctx.fillStyle = piece.color
      ctx.fillRect(-piece.w / 2, -piece.h / 2, piece.w, piece.h)
      ctx.restore()
    })

    frame += 1
    if (frame < 280) requestAnimationFrame(draw)
  }

  draw()
}

watch(showCelebration, (visible) => {
  if (visible) {
    window.setTimeout(launchConfetti, 60)
  }
})

onUnmounted(() => {
  stopTrashTalkPlayback()
})

resetDeck()
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@700&family=Cinzel:wght@400;600;700&display=swap');

.blackjack-view {
  min-height: 100vh;
  background: #06160f;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 76px 16px 20px;
  position: relative;
  overflow: hidden;
  font-family: 'Cinzel', serif;
}

.felt-bg,
.vignette {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.felt-bg {
  background:
    radial-gradient(circle at top, rgba(255, 215, 125, 0.12), transparent 32%),
    radial-gradient(circle at bottom, rgba(255, 255, 255, 0.06), transparent 30%),
    linear-gradient(135deg, #0c402d, #07271b 45%, #03110c);
}

.felt-bg::after {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
  background-size: 26px 26px;
  mix-blend-mode: soft-light;
  opacity: 0.22;
}

.vignette {
  background: radial-gradient(circle, transparent 45%, rgba(0, 0, 0, 0.7));
}

.table-shell {
  position: relative;
  width: min(1180px, 100%);
  height: fit-content;
  border-radius: 34px;
  border: 2px solid rgba(245, 208, 96, 0.45);
  background:
    linear-gradient(180deg, rgba(8, 34, 24, 0.96), rgba(3, 15, 10, 0.98)),
    #06160f;
  box-shadow:
    0 30px 80px rgba(0, 0, 0, 0.45),
    inset 0 0 0 1px rgba(255, 255, 255, 0.05),
    inset 0 0 48px rgba(245, 208, 96, 0.08);
  padding: 20px;
  z-index: 1;
}

.table-header,
.table-footer {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.eyebrow {
  margin: 0 0 4px;
  color: #f5d060;
  font-size: 0.78rem;
  letter-spacing: 0.28em;
  text-transform: uppercase;
}

.table-header h1 {
  margin: 0;
  font-family: 'Cinzel Decorative', serif;
  color: #fff4cd;
  font-size: clamp(1.7rem, 3vw, 2.6rem);
}

.table-copy {
  margin: 4px 0 0;
  color: rgba(255, 248, 225, 0.7);
  max-width: 28rem;
  font-size: 0.92rem;
}

.table-stats {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}

.stat-pill,
.legend-pill {
  min-width: 124px;
  padding: 10px 12px;
  border-radius: 16px;
  border: 1px solid rgba(245, 208, 96, 0.18);
  background: rgba(255, 255, 255, 0.05);
  color: #f7efd2;
  text-align: left;
}

.stat-pill span,
.legend-pill span,
.hand-role {
  display: block;
  text-transform: uppercase;
  letter-spacing: 0.18em;
  font-size: 0.72rem;
  color: rgba(255, 244, 205, 0.65);
}

.stat-pill strong,
.legend-pill strong {
  display: block;
  margin-top: 4px;
  font-size: 0.94rem;
}

.stat-pill.accent {
  background: linear-gradient(135deg, rgba(245, 208, 96, 0.18), rgba(255, 119, 48, 0.12));
}

.table-surface {
  position: relative;
  margin: 16px 0;
  border-radius: 24px;
  border: 1px solid rgba(245, 208, 96, 0.22);
  background:
    radial-gradient(circle at center, rgba(21, 88, 62, 0.5), transparent 55%),
    linear-gradient(180deg, rgba(11, 70, 49, 0.88), rgba(4, 29, 20, 0.95));
  padding: 20px 22px;
  overflow: hidden;
}

.table-surface::before {
  content: '';
  position: absolute;
  inset: 10px;
  border: 2px solid rgba(245, 208, 96, 0.14);
  border-radius: 18px;
  pointer-events: none;
}

.table-grid {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 290px;
  gap: 18px;
  align-items: stretch;
}

.table-main {
  min-width: 0;
}

.hand-panel {
  position: relative;
  padding: 10px 10px;
  border-radius: 20px;
  border: 1px solid rgba(245, 208, 96, 0.12);
  background: rgba(0, 0, 0, 0.12);
}

.hand-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.hand-head h2 {
  margin: 2px 0 0;
  color: #fff6db;
  font-size: clamp(1.1rem, 1.7vw, 1.45rem);
}

.score-badge {
  min-width: 48px;
  padding: 9px 11px;
  border-radius: 999px;
  text-align: center;
  font-weight: 700;
  color: #fff6db;
  background: rgba(0, 0, 0, 0.28);
  border: 1px solid rgba(245, 208, 96, 0.25);
}

.score-badge.player {
  background: rgba(245, 208, 96, 0.18);
}

.cards-row {
  min-height: 118px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}

.card-tile {
  width: 84px;
  height: 122px;
  border-radius: 14px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.08);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.24);
  transform: rotate(calc(var(--rot, 0) * 1deg));
}

.card-face,
.card-back {
  width: 100%;
  height: 100%;
}

.card-face {
  display: block;
  object-fit: cover;
}

.card-back {
  display: grid;
  place-items: center;
  background:
    radial-gradient(circle at top, rgba(245, 208, 96, 0.28), transparent 38%),
    linear-gradient(135deg, #102f23, #091711);
  color: #f5d060;
  font-size: 0.66rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  border: 1px solid rgba(245, 208, 96, 0.22);
}

.empty-seat {
  min-width: 180px;
  padding: 14px 16px;
  border-radius: 14px;
  border: 1px dashed rgba(245, 208, 96, 0.24);
  color: rgba(255, 248, 225, 0.6);
  text-transform: uppercase;
  letter-spacing: 0.16em;
  font-size: 0.68rem;
}

.result-banner {
  position: relative;
  width: fit-content;
  margin: 10px auto;
  padding: 9px 16px;
  border-radius: 999px;
  text-align: center;
  color: #fff8e5;
  border: 1px solid rgba(255, 255, 255, 0.16);
  box-shadow: 0 14px 28px rgba(0, 0, 0, 0.22);
}

.result-banner.win {
  background: linear-gradient(135deg, rgba(46, 204, 113, 0.85), rgba(17, 97, 56, 0.88));
}

.result-banner.lose {
  background: linear-gradient(135deg, rgba(192, 57, 43, 0.85), rgba(92, 22, 22, 0.9));
}

.result-banner.push {
  background: linear-gradient(135deg, rgba(52, 152, 219, 0.85), rgba(24, 75, 123, 0.88));
}

.result-top {
  display: block;
  font-size: 0.62rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  opacity: 0.8;
}

.betting-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px;
  border-radius: 22px;
  border: 1px solid rgba(245, 208, 96, 0.16);
  background: rgba(4, 17, 12, 0.58);
}

.panel-block {
  padding: 12px;
  border-radius: 16px;
  border: 1px solid rgba(245, 208, 96, 0.12);
  background: rgba(255, 255, 255, 0.04);
}

.panel-label {
  margin: 0 0 10px;
  color: rgba(255, 244, 205, 0.72);
  font-size: 0.72rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
}

.bet-controls,
.play-controls {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.chip-row,
.action-row,
.play-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.chip {
  min-width: 60px;
  padding: 10px 14px;
  border: 0;
  border-radius: 999px;
  font-family: inherit;
  font-weight: 700;
  color: #fff;
  background:
    radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.3), transparent 26%),
    var(--cc);
  box-shadow:
    inset 0 0 0 3px rgba(255, 255, 255, 0.18),
    0 10px 18px rgba(0, 0, 0, 0.2);
  cursor: pointer;
  transition: transform 0.18s ease, filter 0.18s ease;
}

.chip.active,
.chip:hover:not(:disabled) {
  transform: translateY(-2px) scale(1.03);
  filter: brightness(1.06);
}

button {
  cursor: pointer;
}

.clear-btn,
.bet-btn,
.deal-btn,
.play-btn {
  border: 0;
  border-radius: 14px;
  padding: 10px 14px;
  font-family: inherit;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  transition: transform 0.18s ease, opacity 0.18s ease, box-shadow 0.18s ease;
  font-size: 0.8rem;
}

.clear-btn,
.play-btn.ghost {
  color: #f7edd0;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(245, 208, 96, 0.18);
}

.bet-btn {
  color: #07130d;
  background: linear-gradient(135deg, #f5d060, #ffb347);
}

.deal-btn,
.play-btn.hit {
  color: #07130d;
  background: linear-gradient(135deg, #54d68d, #c9f26a);
  box-shadow: 0 10px 22px rgba(84, 214, 141, 0.18);
}

.play-btn.stand {
  color: #fff6db;
  background: linear-gradient(135deg, #214964, #2c7fb8);
}

.clear-btn:hover:not(:disabled),
.bet-btn:hover:not(:disabled),
.deal-btn:hover:not(:disabled),
.play-btn:hover:not(:disabled) {
  transform: translateY(-2px);
}

button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.table-footer {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(245, 208, 96, 0.12);
}

.toast {
  position: fixed;
  left: 50%;
  bottom: 24px;
  transform: translateX(-50%);
  z-index: 30;
  padding: 14px 18px;
  border-radius: 999px;
  background: rgba(6, 13, 10, 0.92);
  border: 1px solid rgba(245, 208, 96, 0.28);
  color: #fff5d2;
  box-shadow: 0 20px 34px rgba(0, 0, 0, 0.28);
}

.celebration-overlay {
  position: fixed;
  inset: 0;
  z-index: 40;
  display: grid;
  place-items: center;
  background: rgba(3, 8, 5, 0.72);
  backdrop-filter: blur(6px);
}

.confetti-canvas {
  position: absolute;
  inset: 0;
}

.celebrate-content {
  position: relative;
  text-align: center;
  color: #fff6db;
}

.trophy-bounce {
  font-size: 4rem;
  animation: bounce 1s ease-in-out infinite;
}

.celebrate-title {
  margin: 10px 0 6px;
  font-family: 'Cinzel Decorative', serif;
  letter-spacing: 0.08em;
}

.celebrate-sub {
  margin: 0;
  color: rgba(255, 248, 225, 0.82);
}

.balloon-row {
  position: relative;
  margin-top: 24px;
  min-height: 84px;
}

.balloon {
  position: absolute;
  left: var(--x);
  font-size: var(--size);
  animation: floatUp 3s ease-in-out infinite;
  animation-delay: var(--delay);
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

.result-enter-active,
.result-leave-active,
.toast-enter-active,
.toast-leave-active,
.celebrate-enter-active,
.celebrate-leave-active,
.trash-enter-active,
.trash-leave-active {
  transition: all 0.24s ease;
}

.result-enter-from,
.result-leave-to,
.toast-enter-from,
.toast-leave-to,
.trash-enter-from,
.trash-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

.celebrate-enter-from,
.celebrate-leave-to {
  opacity: 0;
}

@keyframes bounce {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

@keyframes floatUp {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-14px);
  }
}

@media (max-width: 900px) {
  .blackjack-view {
    padding-top: 72px;
  }

  .table-header,
  .table-footer {
    flex-direction: column;
    align-items: stretch;
  }

  .table-stats {
    justify-content: flex-start;
  }

  .table-grid {
    grid-template-columns: 1fr;
  }

  .card-tile {
    width: 72px;
    height: 104px;
  }

}

@media (max-width: 640px) {
  .table-shell {
    padding: 16px;
    max-height: calc(100vh - 82px);
  }

  .table-surface {
    padding: 16px 12px;
  }

  .table-header h1 {
    font-size: 1.7rem;
  }

  .card-tile {
    width: 64px;
    height: 92px;
    border-radius: 12px;
  }

  .score-badge {
    min-width: 42px;
    padding: 8px 10px;
  }
}
</style>
