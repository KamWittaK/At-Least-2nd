import { ref, computed, watch } from 'vue'
import { defineStore } from 'pinia'

export const useHackStore = defineStore('hack', () => {
  const STORAGE_KEY = 'hack-store-state'
  const balance = ref(8000.0)
  const spendings = ref(0)
  const savings = ref(0)
  const savingPercentage = ref(0)
  const sessionBudget = ref(0)
  const marketSeed = ref(24681357)
  const marketTickCount = ref(0)
  const lastMarketMove = ref(0)
  const investmentGainLoss = ref(0)
  const marketMode = ref('LIVE')
  const currentQuip = ref('')
  const isCharacterTalking = ref(false)
  const lastTrashTalkMessage = ref('')
  // const goalReached = ref(false)
  const savingGoal = ref(0)

  const trashTalks = ref([
    'Broken toaster smarter than you.',
    'Your code slower than Internet Explorer.',
    'Does your mom know you have a spending problem',
    'Kindergarten coders outperform your skills.',
    'Spaghetti has better logic than you.',
  ])

  // const savingGoal = computed(() => balance.value * (savingPercentage.value / 100))
  
  const availableToPlay = computed(
    () => Math.max(0, sessionBudget.value - savings.value - spendings.value),
  )
  const maxPlayableBet = computed(() => Math.max(0, Math.min(balance.value, availableToPlay.value)))
  const investedValue = computed(() => roundMoney(savings.value + investmentGainLoss.value))
  const investmentReturnPercent = computed(() =>
    savings.value > 0 ? roundMoney((investmentGainLoss.value / savings.value) * 100) : 0,
  )
  const marketStatus = computed(() => {
    if (!savings.value) return 'Awaiting first deposit'
    if (lastMarketMove.value > 0) return 'Market up'
    if (lastMarketMove.value < 0) return 'Market down'
    return 'Market flat'
  })

  const goalReached = computed(() => savings.value >= savingGoal.value)
  let quipCycleToken = 0

  function roundMoney(amount) {
    return Math.round((Number(amount) || 0) * 100) / 100
  }

  function syncInvestmentValue() {
    investmentGainLoss.value = roundMoney(
      Math.max(-savings.value, investedValue.value - savings.value),
    )
  }

  function nextRandom() {
    marketSeed.value = (marketSeed.value * 1664525 + 1013904223) % 4294967296
    return marketSeed.value / 4294967296
  }

  function marketMoveFromRandom(randomValue) {
    const scenarios = [
      { cutoff: 0.03, move: -0.0185 },
      { cutoff: 0.12, move: -0.009 },
      { cutoff: 0.28, move: -0.0045 },
      { cutoff: 0.48, move: -0.0015 },
      { cutoff: 0.72, move: 0.0028 },
      { cutoff: 0.88, move: 0.0055 },
      { cutoff: 0.97, move: 0.0095 },
      { cutoff: 1, move: 0.015 },
    ]

    return scenarios.find((scenario) => randomValue <= scenario.cutoff)?.move ?? 0
  }

  function advanceMarket() {
    marketTickCount.value += 1

    if (!savings.value) {
      lastMarketMove.value = 0
      investmentGainLoss.value = 0
      return
    }

    const baseMove = marketMoveFromRandom(nextRandom())
    const microAdjustment = (nextRandom() - 0.5) * 0.0022
    const move = baseMove + microAdjustment
    const currentValue = savings.value + investmentGainLoss.value
    const nextValue = roundMoney(Math.max(0, currentValue * (1 + move)))

    lastMarketMove.value = roundMoney(move * 100)
    investmentGainLoss.value = roundMoney(nextValue - savings.value)
  }

  function loadPersistedState() {
    if (typeof window === 'undefined') return

    try {
      const rawState = window.localStorage.getItem(STORAGE_KEY)
      if (!rawState) return

      const parsedState = JSON.parse(rawState)
      balance.value = roundMoney(parsedState.balance ?? balance.value)
      spendings.value = roundMoney(parsedState.spendings ?? spendings.value)
      savings.value = roundMoney(parsedState.savings ?? savings.value)
      savingPercentage.value = Math.min(
        100,
        Math.max(0, Number(parsedState.savingPercentage) || savingPercentage.value),
      )
      sessionBudget.value = roundMoney(parsedState.sessionBudget ?? sessionBudget.value)
      marketSeed.value = Number(parsedState.marketSeed) || marketSeed.value
      marketTickCount.value = Number(parsedState.marketTickCount) || marketTickCount.value
      lastMarketMove.value = roundMoney(parsedState.lastMarketMove ?? lastMarketMove.value)
      investmentGainLoss.value = roundMoney(
        parsedState.investmentGainLoss ?? investmentGainLoss.value,
      )
      marketMode.value = String(parsedState.marketMode || marketMode.value)
      lastTrashTalkMessage.value = String(parsedState.lastTrashTalkMessage || '')
    } catch (error) {
      console.error('Failed to load persisted hack store state:', error)
    }
  }

  function persistState() {
    if (typeof window === 'undefined') return

    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          balance: roundMoney(balance.value),
          spendings: roundMoney(spendings.value),
          savings: roundMoney(savings.value),
          savingPercentage: Number(savingPercentage.value) || 0,
          sessionBudget: roundMoney(sessionBudget.value),
          marketSeed: Number(marketSeed.value) || 0,
          marketTickCount: Number(marketTickCount.value) || 0,
          lastMarketMove: roundMoney(lastMarketMove.value),
          investmentGainLoss: roundMoney(investmentGainLoss.value),
          marketMode: marketMode.value,
          lastTrashTalkMessage: lastTrashTalkMessage.value,
        }),
      )
    } catch (error) {
      console.error('Failed to persist hack store state:', error)
    }
  }

  function setSessionRisk(percentage) {
    const normalizedPercentage = Math.min(100, Math.max(0, Number(percentage) || 0))

    savingPercentage.value = normalizedPercentage
    sessionBudget.value = roundMoney(balance.value * (normalizedPercentage / 100))
  }

  function resetSessionProgress() {
    spendings.value = 0
    savings.value = 0
    investmentGainLoss.value = 0
    lastMarketMove.value = 0
    marketTickCount.value = 0
  }

  function canRisk(amount, reserved = 0) {
    const normalizedAmount = roundMoney(amount)
    const normalizedReserved = roundMoney(reserved)
    return normalizedAmount <= Math.max(0, availableToPlay.value - normalizedReserved)
  }

  function moveWinToSpendings(amount) {
    const normalizedAmount = roundMoney(Math.max(0, Number(amount) || 0))
    spendings.value += normalizedAmount
    advanceMarket()
  }

  function moveLossToSavings(amount) {
    const normalizedAmount = roundMoney(Math.max(0, Number(amount) || 0))
    savings.value += normalizedAmount
    syncInvestmentValue()
    advanceMarket()
  }

  function increamentSavings() {
    savings.value += balance.value * 0.03
    balance.value -= balance.value * 0.03
    syncInvestmentValue()
    advanceMarket()
  }

  function increamentSpendings() {
    spendings.value += balance.value * 0.05
    balance.value -= balance.value * 0.05
    advanceMarket()
  }

  function setTrashTalkMessage(message) {
    const normalizedMessage = String(message || '').trim()
    lastTrashTalkMessage.value = normalizedMessage
    currentQuip.value = normalizedMessage
  }

  async function cycleQuip(talkingTime, message = lastTrashTalkMessage.value) {
    const normalizedTime = Math.max(0, Number(talkingTime) || 0)
    const normalizedMessage = String(message || '').trim()
    const currentToken = ++quipCycleToken

    if (normalizedMessage) {
      currentQuip.value = normalizedMessage
      lastTrashTalkMessage.value = normalizedMessage
    }

    isCharacterTalking.value = true

    await new Promise((resolve) => {
      window.setTimeout(resolve, normalizedTime)
    })

    if (currentToken === quipCycleToken) {
      isCharacterTalking.value = false
    }
  }

  function stopQuip() {
    quipCycleToken += 1
    isCharacterTalking.value = false
  }

  loadPersistedState()

  watch(
    [
      balance,
      spendings,
      savings,
      savingPercentage,
      sessionBudget,
      marketSeed,
      marketTickCount,
      lastMarketMove,
      investmentGainLoss,
      marketMode,
      lastTrashTalkMessage,
    ],
    () => {
      persistState()
    },
  )

  return {
    balance,
    spendings,
    savings,
    savingPercentage,
    sessionBudget,
    marketMode,
    marketTickCount,
    lastMarketMove,
    investmentGainLoss,
    investedValue,
    investmentReturnPercent,
    marketStatus,
    savingGoal,
    availableToPlay,
    maxPlayableBet,
    goalReached,
    currentQuip,
    isCharacterTalking,
    lastTrashTalkMessage,
    trashTalks,
    setSessionRisk,
    resetSessionProgress,
    canRisk,
    moveWinToSpendings,
    moveLossToSavings,
    increamentSavings,
    increamentSpendings,
    advanceMarket,
    setTrashTalkMessage,
    cycleQuip,
    stopQuip,
  }
})
