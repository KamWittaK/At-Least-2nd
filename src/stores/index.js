import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useHackStore = defineStore('hack', () => {
  const balance = ref(8000.00)
  const spendings = ref(0)
  const savings = ref(0)
  const savingPercentage = ref(0)
  const trashTalks = ref([
    "I've seen more processing power in a broken smart toaster than in whatever you used to come up with this request.",
    "Your code is so bad, it makes Internet Explorer look like a speed demon.",
    "If your code were a car, it would be a rusted-out clunker that barely starts.",
    "Your coding skills are so weak, they couldn't even hack it in a kindergarten programming class.",
    "I've seen more logic in a bowl of spaghetti than in your code.",
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
