import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useHackStore = defineStore('hack', () => {
  const balance = ref(8000.00)
  const spendings = ref(0)
  const savings = ref(0)
  const savingPercentage = ref(0)
  const trashTalks = ref([
  "Broken toaster smarter than you.",
  "Your code slower than Internet Explorer.",
  "Your code is a rust bucket.",
  "Kindergarten coders outperform your skills.",
  "Spaghetti has better logic than you."
])


  const savingGoal = computed(() => balance.value * (savingPercentage.value / 100))

  const goalReached = computed(() => savings.value >= savingGoal.value)

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

  return { balance, spendings, savings, goalReached,trashTalks, increamentSavings, increamentSpendings }
})
