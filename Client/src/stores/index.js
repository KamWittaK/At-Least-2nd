import { ref, computed, watch } from 'vue'
import { defineStore } from 'pinia'

export const useHackStore = defineStore('hack', () => {
  const STORAGE_KEY = 'hack-store-state'
  const balance = ref(8000.0)
  const spendings = ref(0)
  const savings = ref(0)
  const savingPercentage = ref(0)
  const sessionBudget = ref(0)
  const currentQuip = ref('')
  const isCharacterTalking = ref(false)
  const lastTrashTalkMessage = ref('')
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
  let quipCycleToken = 0

  function roundMoney(amount) {
    return Math.round((Number(amount) || 0) * 100) / 100
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

  watch([balance, spendings, savings, savingPercentage, sessionBudget], () => {
    persistState()
  })

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
    setTrashTalkMessage,
    cycleQuip,
    stopQuip,
  }
})
