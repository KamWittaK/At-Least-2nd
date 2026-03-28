import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useHackStore = defineStore('hack', () => {
  const balance = ref(8000.0)
  const spendings = ref(0)
  const savings = ref(0)
  const savingPercentage = ref(0)
  const sessionBudget = ref(0)
  const trashTalks = ref([
    'Broken toaster smarter than you.',
    'Your code slower than Internet Explorer.',
    'Your code is a rust bucket.',
    'Kindergarten coders outperform your skills.',
    'Spaghetti has better logic than you.',
  ])

  const savingGoal = computed(() => balance.value * (savingPercentage.value / 100))
  const availableToPlay = computed(
    () => Math.max(0, sessionBudget.value - savings.value - spendings.value),
  )
  const maxPlayableBet = computed(() => Math.max(0, Math.min(balance.value, availableToPlay.value)))

  const goalReached = computed(() => savings.value >= savingGoal.value)

  function roundMoney(amount) {
    return Math.round((Number(amount) || 0) * 100) / 100
  }

  function setSessionRisk(percentage) {
    const normalizedPercentage = Math.min(100, Math.max(0, Number(percentage) || 0))
    savingPercentage.value = normalizedPercentage
    sessionBudget.value = roundMoney(balance.value * (normalizedPercentage / 100))
    spendings.value = 0
    savings.value = 0
  }

  function canRisk(amount, reserved = 0) {
    const normalizedAmount = roundMoney(amount)
    const normalizedReserved = roundMoney(reserved)
    return normalizedAmount <= Math.max(0, availableToPlay.value - normalizedReserved)
  }

  function moveWinToSpendings(amount) {
    const normalizedAmount = roundMoney(Math.max(0, Number(amount) || 0))
    spendings.value += normalizedAmount
  }

  function moveLossToSavings(amount) {
    const normalizedAmount = roundMoney(Math.max(0, Number(amount) || 0))
    savings.value += normalizedAmount
  }

  function increamentSavings() {
    // increment savings by 1% of balance
    savings.value += balance.value * 0.03
    // decrement balance by the same amount
    balance.value -= balance.value * 0.03
  }

  function increamentSpendings() {
    // increment spendings by 1% of balance
    spendings.value += balance.value * 0.05
    // decrement balance by the same amount
    balance.value -= balance.value * 0.05
  }

  return {
    balance,
    spendings,
    savings,
    savingPercentage,
    sessionBudget,
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
  }
})
