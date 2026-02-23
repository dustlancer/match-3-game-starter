<template>
  <div class="game-board-wrapper">
    <div class="game-board-header">
      <div class="game-score">
        <span class="game-score__label">Очки:</span>
        <span class="game-score__value">{{ score }}</span>
      </div>
      
      <div class="game-controls">
        <label class="game-control">
          <span>Размер поля:</span>
          <input
            type="number"
            :value="gridSize"
            :min="minGridSize"
            max="12"
            @change="handleSizeChange"
            :disabled="isProcessing"
          />
        </label>
        
        <button 
          class="game-btn"
          @click="resetGame"
          :disabled="isProcessing"
        >
          Новая игра
        </button>
      </div>
    </div>
    
    <div 
      class="game-board"
      :style="boardStyle"
      :key="gridSize"
      @keydown="handleBoardKeydown"
      tabindex="-1"
      ref="boardRef"
    >
      <template v-for="row in rows" :key="'row-' + row">
        <GameTile
          v-for="col in cols"
          :key="'tile-' + row + '-' + col"
          :row="row - 1"
          :col="col - 1"
        />
      </template>
    </div>
    
    <!-- <div class="game-instructions">
      <h3>Управление:</h3>
      <ul>
        <li><strong>Клик:</strong> выберите фишку, затем кликните на соседнюю для обмена</li>
        <li><strong>Перетаскивание:</strong> перетащите фишку на соседнюю</li>
        <li><strong>Стрелки:</strong> выберите фишку и нажмите стрелку для обмена с соседней</li>
      </ul>
    </div> -->
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useStore } from 'vuex'
import GameTile from './GameTile.vue'
import { MIN_GRID_SIZE } from '@/store/game'

const store = useStore()
const boardRef = ref<HTMLElement | null>(null)

const rows = computed(() => store.getters['game/getRows'])
const cols = computed(() => store.getters['game/getCols'])
const gridSize = computed(() => store.getters['game/getGridSize'])
const score = computed(() => store.getters['game/getScore'])
const isProcessing = computed(() => store.getters['game/getIsProcessing'])
const minGridSize = MIN_GRID_SIZE

// Стиль сетки (размер поля квадратный) — размер доски масштабируется с gridSize для корректного отображения фона
const boardStyle = computed(() => {
  const size = gridSize.value
  const baseSize = Math.max(240, Math.min(600, size * 50))
  const maxWidth = typeof window !== 'undefined' ? Math.min(window.innerWidth * 0.9, baseSize) : baseSize
  return {
    gridTemplateColumns: `repeat(${size}, 1fr)`,
    gridTemplateRows: `repeat(${size}, 1fr)`,
    maxWidth: `${maxWidth}px`,
  }
})

// Обработка изменения размера поля
const handleSizeChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  const newSize = parseInt(target.value, 10)
  if (newSize >= minGridSize && newSize <= 12) {
    store.dispatch('game/setGridSize', { size: newSize })
  }
}

// Сброс игры
const resetGame = () => {
  store.dispatch('game/initGame', { size: gridSize.value })
}

// Глобальный обработчик клавиш для доски
const handleBoardKeydown = (event: KeyboardEvent) => {
  const keyMap: Record<string, string> = {
    ArrowUp: 'up',
    ArrowDown: 'down',
    ArrowLeft: 'left',
    ArrowRight: 'right',
  }
  
  const direction = keyMap[event.key]
  
  if (direction) {
    event.preventDefault()
    store.dispatch('game/moveSelectedTile', direction)
  }
}

// Инициализация игры при монтировании
onMounted(() => {
  store.dispatch('game/initGame')
})
</script>

<style scoped lang="scss">
.game-board-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  padding: 20px;
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
}

.game-board-header {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  align-items: center;
  justify-content: center;
  width: 100%;
  max-width: 600px;
}

.game-score {
  background: rgba(255, 255, 255, 0.1);
  padding: 12px 24px;
  border-radius: 12px;
  display: flex;
  gap: 10px;
  align-items: center;
  
  &__label {
    color: rgba(255, 255, 255, 0.7);
    font-size: 16px;
  }
  
  &__value {
    color: #f1c40f;
    font-size: 24px;
    font-weight: bold;
    text-shadow: 0 0 10px rgba(241, 196, 15, 0.5);
  }
}

.game-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
}

.game-control {
  display: flex;
  align-items: center;
  gap: 8px;
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  
  input {
    width: 60px;
    padding: 8px 12px;
    border: none;
    border-radius: 6px;
    background: rgba(255, 255, 255, 0.15);
    color: #fff;
    font-size: 14px;
    text-align: center;
    
    &:focus {
      outline: none;
      box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.3);
    }
    
    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
}

.game-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(231, 76, 60, 0.4);
  }
  
  &:active:not(:disabled) {
    transform: translateY(0);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.game-board {
  display: grid;
  gap: 6px;
  padding: 16px;
  background: linear-gradient(145deg, #2c3e50 0%, #1a252f 100%);
  border-radius: 16px;
  box-shadow: 
    0 10px 40px rgba(0, 0, 0, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  width: 100%;
  aspect-ratio: 1;
  outline: none;
  transition: max-width 0.2s ease;
}

.game-instructions {
  background: rgba(255, 255, 255, 0.05);
  padding: 16px 24px;
  border-radius: 12px;
  color: rgba(255, 255, 255, 0.7);
  max-width: 500px;
  
  h3 {
    margin: 0 0 10px 0;
    color: rgba(255, 255, 255, 0.9);
    font-size: 16px;
  }
  
  ul {
    margin: 0;
    padding-left: 20px;
    
    li {
      margin: 6px 0;
      font-size: 14px;
      line-height: 1.5;
      
      strong {
        color: rgba(255, 255, 255, 0.9);
      }
    }
  }
}
</style>
