import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useHackStore = defineStore('hack', () => {
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
  const trashTalks = ref([
    'Broken toaster smarter than you.',
    'Your code slower than Internet Explorer.',
    'Does your mom know you have a spending problem',
    'Kindergarten coders outperform your skills.',
    'Spaghetti has better logic than you.',
  ])

  const savingGoal = computed(() => balance.value * (savingPercentage.value / 100))
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

  function roundMoney(amount) {
    return Math.round((Number(amount) || 0) * 100) / 100
  }

  function syncInvestmentValue() {
    investmentGainLoss.value = roundMoney(Math.max(-savings.value, investedValue.value - savings.value))
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

  function setSessionRisk(percentage) {
    const normalizedPercentage = Math.min(100, Math.max(0, Number(percentage) || 0))
    savingPercentage.value = normalizedPercentage
    sessionBudget.value = roundMoney(balance.value * (normalizedPercentage / 100))
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
    // increment savings by 1% of balance
    savings.value += balance.value * 0.03
    // decrement balance by the same amount
    balance.value -= balance.value * 0.03
    syncInvestmentValue()
    advanceMarket()
  }

  function increamentSpendings() {
    // increment spendings by 1% of balance
    spendings.value += balance.value * 0.05
    // decrement balance by the same amount
    balance.value -= balance.value * 0.05
    advanceMarket()
  }

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
    trashTalks,
    setSessionRisk,
    canRisk,
    moveWinToSpendings,
    moveLossToSavings,
    increamentSavings,
    increamentSpendings,
    advanceMarket,
  }
})
