<script setup>
import { useHackStore } from '../stores/index.js'
import { useRoute, useRouter } from 'vue-router';


const hackStore = useHackStore();
const route = useRoute();
const router = useRouter();
</script>

<template>
    <div id="hud">
      <div @click="router.push('/')"  class="cursor-pointer" id="logo">THE HOUSE  </div>
      <div id="hud-right">
        <div id="balance-panel">
          <div class="coin-icon">✦</div>
          <div>
            <div id="balance-label">Balance</div>
            <div id="balance-amount">${{ hackStore.balance.toFixed(2) }}</div>
          </div>
        </div>
        <div v-show="route.path.includes('games')" id="balance-panel">
          <div class="coin-icon">✦</div>
          <div>
            <div id="balance-label">Savings</div>
            <div id="balance-amount">${{ hackStore.savings.toFixed(2) }}</div>
          </div>
        </div>
        <div v-show="route.path.includes('games')" id="balance-panel">
          <div class="coin-icon">✦</div>
          <div>
            <div id="balance-label">Spendings</div>
            <div id="balance-amount">${{ hackStore.spendings.toFixed(2) }}</div>
          </div>
        </div>
        <div id="player-badge">
          <div class="avatar">SH</div>
          <div>
            <div class="player-name">PLAYER_01</div>
            
          </div>
        </div>
      </div>
    </div>
</template>

<style scoped>
/* ── HUD TOP BAR ── */
#hud {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 28px;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.7) 0%, transparent 100%);
  /* border-bottom: 1px solid rgba(0, 245, 255, 0.1); */
  margin-bottom: 20px;
}

#logo {
  font-size: 22px;
  font-weight: 900;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  background: linear-gradient(90deg, var(--cyan), var(--purple-bright));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  filter: drop-shadow(0 0 12px rgba(0, 245, 255, 0.5));
  animation: logoPulse 3s ease-in-out infinite;
}
@keyframes logoPulse {
  0%,
  100% {
    filter: drop-shadow(0 0 8px rgba(0, 245, 255, 0.4));
  }
  50% {
    filter: drop-shadow(0 0 20px rgba(0, 245, 255, 0.9));
  }
}

#hud-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

#balance-panel {
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(255, 215, 0, 0.07);
  border: 1px solid rgba(255, 215, 0, 0.25);
  border-radius: 8px;
  padding: 7px 16px;
  position: relative;
  overflow: hidden;
  animation: balanceGlow 2s ease-in-out infinite;
}
@keyframes balanceGlow {
  0%,
  100% {
    box-shadow: 0 0 10px rgba(255, 215, 0, 0.1);
  }
  50% {
    box-shadow: 0 0 22px rgba(255, 215, 0, 0.3);
  }
}

.coin-icon {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 35%, #ffe566, var(--gold-dim));
  border: 1.5px solid #ffe566;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  line-height: 1;
  box-shadow: 0 0 8px rgba(255, 215, 0, 0.6);
  animation: coinSpin 4s linear infinite;
}
@keyframes coinSpin {
  0% {
    transform: rotateY(0deg);
  }
  50% {
    transform: rotateY(90deg);
    width: 4px;
  }
  51% {
    transform: rotateY(90deg);
    width: 4px;
  }
  100% {
    transform: rotateY(0deg);
  }
}

#balance-label {
  font-family: 'Share Tech Mono', monospace;
  font-size: 11px;
  color: rgba(255, 215, 0, 0.6);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
#balance-amount {
  font-family: 'Share Tech Mono', monospace;
  font-size: 17px;
  font-weight: 700;
  color: var(--gold);
  letter-spacing: 0.05em;
  text-shadow: 0 0 12px rgba(255, 215, 0, 0.6);
}
#balance-amount .cents {
  font-size: 12px;
  opacity: 0.7;
}

#player-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 6px 12px;
}

.avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--purple), var(--cyan-dim));
  border: 2px solid var(--cyan);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  box-shadow: 0 0 10px rgba(0, 245, 255, 0.4);
}

.player-name {
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: rgba(255, 255, 255, 0.9);
}

.player-level {
  font-family: 'Share Tech Mono', monospace;
  font-size: 10px;
  color: var(--cyan);
  opacity: 0.8;
}

</style>