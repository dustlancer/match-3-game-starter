// Константы для цветов фишек (8 цветов)
export const TILE_COLORS = [
  { id: 0, name: 'red', color: '#e74c3c' },
  { id: 1, name: 'blue', color: '#3498db' },
  { id: 2, name: 'green', color: '#2ecc71' },
  { id: 3, name: 'yellow', color: '#f1c40f' },
  { id: 4, name: 'purple', color: '#9b59b6' },
  { id: 5, name: 'orange', color: '#e67e22' },
  { id: 6, name: 'cyan', color: '#1abc9c' },
  { id: 7, name: 'pink', color: '#fd79a8' },
]

// Бонусы: B=3x3 взрыв, H=горизонт, V=вертикаль, T-=отнять время, T+=добавить время
export const BONUS_TYPES = ['B', 'H', 'V', 'T-', 'T+']
export const BONUS_LABELS = { B: 'B', H: 'H', V: 'V', 'T-': 'T−', 'T+': 'T+' }

// Цвета с комбо-эффектами (red, blue, green, yellow, purple)
const COMBO_COLOR_IDS = [0, 1, 2, 3, 4]

// Цель уровня и начальное время
export const TARGET_SCORE = 10000
export const DEFAULT_LEVEL_TIME = 120
export const MAX_CRYSTALS_PER_LEVEL = 8

// Минимальный и дефолтный размер сетки
export const MIN_GRID_SIZE = 4
export const DEFAULT_GRID_SIZE = 8

const MUTATIONS = {
  SET_GRID_SIZE: 'SET_GRID_SIZE',
  SET_BOARD: 'SET_BOARD',
  SET_TILE: 'SET_TILE',
  SET_SELECTED_TILE: 'SET_SELECTED_TILE',
  SET_SCORE: 'SET_SCORE',
  INCREMENT_SCORE: 'INCREMENT_SCORE',
  SET_IS_PROCESSING: 'SET_IS_PROCESSING',
  SET_TIME_REMAINING: 'SET_TIME_REMAINING',
  ADD_TIME: 'ADD_TIME',
  SET_LEVEL_COMPLETE: 'SET_LEVEL_COMPLETE',
}

// Генерация случайного типа фишки
const getRandomTileType = () => Math.floor(Math.random() * TILE_COLORS.length)

// Случайный бонус (вероятность ~12%)
const getRandomBonus = () => (Math.random() < 0.12 ? BONUS_TYPES[Math.floor(Math.random() * BONUS_TYPES.length)] : null)

// Случайный кристалл (если ещё не достигнут лимит)
const getRandomCrystal = (currentCount) =>
  currentCount < MAX_CRYSTALS_PER_LEVEL && Math.random() < 0.08

// Создание фишки
const createTile = (row, col, opts = {}) => {
  const { type, bonus, crystal } = opts
  return {
    id: `${row}-${col}-${Date.now()}-${Math.random()}`,
    type: type ?? getRandomTileType(),
    row,
    col,
    bonus: bonus ?? null,
    crystal: crystal ?? false,
  }
}

// Создание пустой доски
const createEmptyBoard = (rows, cols) =>
  Array.from({ length: rows }, () => Array.from({ length: cols }, () => null))

// Проверка, создаст ли размещение фишки совпадение
const wouldCreateMatch = (board, row, col, type, rows, cols) => {
  if (col >= 2) {
    if (board[row][col - 1]?.type === type && board[row][col - 2]?.type === type) {
      return true
    }
  }
  if (row >= 2) {
    if (board[row - 1]?.[col]?.type === type && board[row - 2]?.[col]?.type === type) {
      return true
    }
  }
  return false
}


const fillBoardWithoutMatches = (rows, cols) => {
  const board = createEmptyBoard(rows, cols)
  let crystalCount = 0
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      let tileType
      let attempts = 0
      const maxAttempts = 100
      do {
        tileType = getRandomTileType()
        attempts++
      } while (attempts < maxAttempts && wouldCreateMatch(board, row, col, tileType, rows, cols))
      const hasCrystal = getRandomCrystal(crystalCount)
      if (hasCrystal) crystalCount++
      board[row][col] = createTile(row, col, {
        type: tileType,
        bonus: getRandomBonus(),
        crystal: hasCrystal,
      })
    }
  }
  return { board, crystalCount }
}

// Поиск всех совпадений на доске (возвращает Set ключей и Map цвет -> Set для комбо)
const findAllMatches = (board, rows, cols) => {
  const matches = new Set()
  const matchesByColor = new Map()
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols - 2; col++) {
      const tile = board[row][col]
      if (tile === null) continue
      let matchLength = 1
      while (col + matchLength < cols && board[row][col + matchLength]?.type === tile.type) {
        matchLength++
      }
      if (matchLength >= 3) {
        for (let i = 0; i < matchLength; i++) {
          const key = `${row}-${col + i}`
          matches.add(key)
          if (!matchesByColor.has(tile.type)) matchesByColor.set(tile.type, new Set())
          matchesByColor.get(tile.type).add(key)
        }
      }
    }
  }
  for (let col = 0; col < cols; col++) {
    for (let row = 0; row < rows - 2; row++) {
      const tile = board[row][col]
      if (tile === null) continue
      let matchLength = 1
      while (row + matchLength < rows && board[row + matchLength]?.[col]?.type === tile.type) {
        matchLength++
      }
      if (matchLength >= 3) {
        for (let i = 0; i < matchLength; i++) {
          const key = `${row + i}-${col}`
          matches.add(key)
          if (!matchesByColor.has(tile.type)) matchesByColor.set(tile.type, new Set())
          matchesByColor.get(tile.type).add(key)
        }
      }
    }
  }
  return { matches, matchesByColor }
}

// Расширить Set удалений эффектом бонуса клетки
const applyBonusEffect = (board, rows, cols, toRemove, row, col) => {
  const tile = board[row]?.[col]
  if (!tile?.bonus) return
  switch (tile.bonus) {
    case 'B': {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const nr = row + dr
          const nc = col + dc
          if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
            toRemove.add(`${nr}-${nc}`)
          }
        }
      }
      break
    }
    case 'H':
      for (let c = 0; c < cols; c++) toRemove.add(`${row}-${c}`)
      break
    case 'V':
      for (let r = 0; r < rows; r++) toRemove.add(`${r}-${col}`)
      break
    default:
      break
  }
}

// Эффект комбо по цвету
const applyComboEffect = (board, rows, cols, toRemove, colorId) => {
  switch (colorId) {
    case 0: {
      const maxR = Math.max(0, rows - 3)
      const maxC = Math.max(0, cols - 3)
      const cr = maxR > 0 ? Math.floor(Math.random() * (maxR + 1)) : 0
      const cc = maxC > 0 ? Math.floor(Math.random() * (maxC + 1)) : 0
      for (let dr = 0; dr < 3 && cr + dr < rows; dr++) {
        for (let dc = 0; dc < 3 && cc + dc < cols; dc++) {
          toRemove.add(`${cr + dr}-${cc + dc}`)
        }
      }
      break
    }
    case 1: {
      const c = Math.floor(Math.random() * cols)
      for (let r = 0; r < rows; r++) toRemove.add(`${r}-${c}`)
      break
    }
    case 3: {
      const r = Math.floor(Math.random() * rows)
      for (let c = 0; c < cols; c++) toRemove.add(`${r}-${c}`)
      break
    }
    case 4: {
      const bonus = BONUS_TYPES[Math.floor(Math.random() * BONUS_TYPES.length)]
      if (bonus === 'T-') {
        return { addTime: -15 }
      }
      if (bonus === 'T+') {
        return { addTime: 15 }
      }
      const tileWithBonus = []
      for (let rr = 0; rr < rows; rr++) {
        for (let cc = 0; cc < cols; cc++) {
          const t = board[rr]?.[cc]
          if (t && !toRemove.has(`${rr}-${cc}`)) tileWithBonus.push({ row: rr, col: cc })
        }
      }
      if (tileWithBonus.length > 0) {
        const pick = tileWithBonus[Math.floor(Math.random() * tileWithBonus.length)]
        const nt = board[pick.row][pick.col]
        if (nt) {
          board[pick.row][pick.col] = { ...nt, bonus }
        }
      }
      break
    }
    case 2: {
      for (let rr = 0; rr < rows; rr++) {
        for (let cc = 0; cc < cols; cc++) {
          const t = board[rr]?.[cc]
          if (t?.crystal) toRemove.add(`${rr}-${cc}`)
        }
      }
      break
    }
    default:
      break
  }
  return {}
}

// Удаление совпадений с доски
const removeFromBoard = (board, toRemove) => {
  const newBoard = board.map((row) => [...row])
  toRemove.forEach((key) => {
    const [row, col] = key.split('-').map(Number)
    newBoard[row][col] = null
  })
  return newBoard
}

// Подсчёт очков: 3=30, 4=60, 5=120, т.е. 30 * 2^(n-3)
const calcMoveScore = (totalPopped, crystalsPopped) => {
  if (totalPopped < 3) return 0
  const base = 30 * Math.pow(2, totalPopped - 3)
  const crystalMultiplier = Math.pow(3, crystalsPopped)
  return Math.floor(base * crystalMultiplier)
}

// Подсчёт кристаллов на доске
const countCrystalsOnBoard = (board, rows, cols) => {
  let count = 0
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (board[r]?.[c]?.crystal) count++
    }
  }
  return count
}

// Падение фишек вниз и заполнение пустых мест
const applyGravityAndFill = (board, rows, cols) => {
  const newBoard = board.map((row) => [...row])
  for (let col = 0; col < cols; col++) {
    const tiles = []
    for (let row = rows - 1; row >= 0; row--) {
      if (newBoard[row][col] !== null) {
        tiles.push(newBoard[row][col])
      }
    }
    for (let row = rows - 1; row >= 0; row--) {
      const tileIndex = rows - 1 - row
      if (tileIndex < tiles.length) {
        newBoard[row][col] = { ...tiles[tileIndex], row, col }
      } else {
        const currentCrystals = countCrystalsOnBoard(newBoard, rows, cols)
        const hasCrystal = getRandomCrystal(currentCrystals)
        newBoard[row][col] = createTile(row, col, {
          bonus: getRandomBonus(),
          crystal: hasCrystal,
        })
      }
    }
  }
  return newBoard
}

// Проверка, являются ли две позиции соседними
const areAdjacent = (row1, col1, row2, col2) => {
  const rowDiff = Math.abs(row1 - row2)
  const colDiff = Math.abs(col1 - col2)
  return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1)
}

// Обмен двух фишек местами
const swapTiles = (board, row1, col1, row2, col2) => {
  const newBoard = board.map((row) => [...row])
  const tile1 = { ...newBoard[row1][col1], row: row2, col: col2 }
  const tile2 = { ...newBoard[row2][col2], row: row1, col: col1 }
  newBoard[row1][col1] = tile2
  newBoard[row2][col2] = tile1
  return newBoard
}

export default {
  namespaced: true,

  state() {
    return {
      rows: DEFAULT_GRID_SIZE,
      cols: DEFAULT_GRID_SIZE,
      board: [],
      selectedTile: null,
      score: 0,
      isProcessing: false,
      timeRemaining: DEFAULT_LEVEL_TIME,
      levelComplete: false,
    }
  },

  getters: {
    getBoard: (state) => state.board,
    getRows: (state) => state.rows,
    getCols: (state) => state.cols,
    getGridSize: (state) => state.rows,
    getSelectedTile: (state) => state.selectedTile,
    getScore: (state) => state.score,
    getIsProcessing: (state) => state.isProcessing,
    getTimeRemaining: (state) => state.timeRemaining,
    getLevelComplete: (state) => state.levelComplete,
    getTileAt: (state) => (row, col) => state.board[row]?.[col] ?? null,
    getTileColor: () => (type) => TILE_COLORS[type]?.color ?? '#ccc',
  },

  mutations: {
    [MUTATIONS.SET_GRID_SIZE]: (state, { size }) => {
      const s = Math.max(MIN_GRID_SIZE, Math.min(12, size))
      state.rows = s
      state.cols = s
    },
    [MUTATIONS.SET_BOARD]: (state, board) => {
      state.board = board
    },
    [MUTATIONS.SET_TILE]: (state, { row, col, tile }) => {
      if (state.board[row]) {
        state.board[row][col] = tile
      }
    },
    [MUTATIONS.SET_SELECTED_TILE]: (state, tile) => {
      state.selectedTile = tile
    },
    [MUTATIONS.SET_SCORE]: (state, score) => {
      state.score = score
    },
    [MUTATIONS.INCREMENT_SCORE]: (state, amount) => {
      state.score += amount
    },
    [MUTATIONS.SET_IS_PROCESSING]: (state, isProcessing) => {
      state.isProcessing = isProcessing
    },
    [MUTATIONS.SET_TIME_REMAINING]: (state, time) => {
      state.timeRemaining = Math.max(0, time)
    },
    [MUTATIONS.ADD_TIME]: (state, delta) => {
      state.timeRemaining = Math.max(0, state.timeRemaining + delta)
    },
    [MUTATIONS.SET_LEVEL_COMPLETE]: (state, value) => {
      state.levelComplete = value
    },
  },

  actions: {
    initGame: ({ commit, state }, { size = DEFAULT_GRID_SIZE } = {}) => {
      commit(MUTATIONS.SET_GRID_SIZE, { size })
      commit(MUTATIONS.SET_SCORE, 0)
      commit(MUTATIONS.SET_SELECTED_TILE, null)
      commit(MUTATIONS.SET_TIME_REMAINING, DEFAULT_LEVEL_TIME)
      commit(MUTATIONS.SET_LEVEL_COMPLETE, false)
      const { board } = fillBoardWithoutMatches(state.rows, state.cols)
      commit(MUTATIONS.SET_BOARD, board)
    },
    setGridSize: ({ dispatch }, { size }) => {
      dispatch('initGame', { size })
    },
    clearSelection: ({ commit }) => {
      commit(MUTATIONS.SET_SELECTED_TILE, null)
    },
    selectTile: ({ commit, state, dispatch }, { row, col }) => {
      if (state.isProcessing) return
      const currentSelected = state.selectedTile
      if (currentSelected?.row === row && currentSelected?.col === col) {
        commit(MUTATIONS.SET_SELECTED_TILE, null)
        return
      }
      if (currentSelected && areAdjacent(currentSelected.row, currentSelected.col, row, col)) {
        dispatch('trySwap', {
          row1: currentSelected.row,
          col1: currentSelected.col,
          row2: row,
          col2: col,
        })
        commit(MUTATIONS.SET_SELECTED_TILE, null)
        return
      }
      commit(MUTATIONS.SET_SELECTED_TILE, { row, col })
    },
    moveSelectedTile: ({ state, dispatch, commit }, direction) => {
      if (state.isProcessing || !state.selectedTile) return
      const { row, col } = state.selectedTile
      let targetRow = row
      let targetCol = col
      switch (direction) {
        case 'up':
          targetRow = row - 1
          break
        case 'down':
          targetRow = row + 1
          break
        case 'left':
          targetCol = col - 1
          break
        case 'right':
          targetCol = col + 1
          break
      }
      if (targetRow < 0 || targetRow >= state.rows || targetCol < 0 || targetCol >= state.cols) {
        return
      }
      dispatch('trySwap', { row1: row, col1: col, row2: targetRow, col2: targetCol })
      commit(MUTATIONS.SET_SELECTED_TILE, null)
    },
    trySwap: async ({ commit, state, dispatch }, { row1, col1, row2, col2 }) => {
      if (state.isProcessing) return
      commit(MUTATIONS.SET_IS_PROCESSING, true)
      let newBoard = swapTiles(state.board, row1, col1, row2, col2)
      commit(MUTATIONS.SET_BOARD, newBoard)
      const { matches } = findAllMatches(newBoard, state.rows, state.cols)
      if (matches.size === 0) {
        await new Promise((resolve) => setTimeout(resolve, 200))
        newBoard = swapTiles(newBoard, row1, col1, row2, col2)
        commit(MUTATIONS.SET_BOARD, newBoard)
        commit(MUTATIONS.SET_IS_PROCESSING, false)
        return
      }
      await dispatch('processMatches')
    },
    processMatches: async ({ commit, state }) => {
      let board = state.board.map((row) => [...row])
      let hasMatches = true
      let totalPoppedThisMove = 0
      let crystalsPoppedThisMove = 0
      let lastMatchedColor = null
      let comboCount = 0

      while (hasMatches) {
        const { matches, matchesByColor } = findAllMatches(board, state.rows, state.cols)
        if (matches.size === 0) {
          hasMatches = false
          break
        }

        const toRemove = new Set(matches)

        // Собираем цвета в этом раунде (для комбо)
        const colorsThisRound = [...matchesByColor.keys()].filter((c) => COMBO_COLOR_IDS.includes(c))

        // Проверяем комбо: тот же цвет, что и в прошлом раунде
        for (const colorId of colorsThisRound) {
          if (colorId === lastMatchedColor) {
            comboCount++
            const effect = applyComboEffect(board, state.rows, state.cols, toRemove, colorId)
            if (effect.addTime) {
              commit(MUTATIONS.ADD_TIME, effect.addTime)
            }
          }
        }
        lastMatchedColor = colorsThisRound[0] ?? lastMatchedColor
        if (colorsThisRound.length > 0 && comboCount === 0) {
          comboCount = 1
        }

        // Эффекты бонусов с удаляемых клеток (итеративно — бонусы могут добавлять новые)
        let prevSize = 0
        while (toRemove.size !== prevSize) {
          prevSize = toRemove.size
          const toAdd = new Set()
          toRemove.forEach((key) => {
            const [r, c] = key.split('-').map(Number)
            applyBonusEffect(board, state.rows, state.cols, toAdd, r, c)
          })
          toAdd.forEach((k) => toRemove.add(k))
        }

        // Применяем бонусы T- и T+ с удаляемых клеток
        toRemove.forEach((key) => {
          const [r, c] = key.split('-').map(Number)
          const tile = board[r]?.[c]
          if (tile?.bonus === 'T-') commit(MUTATIONS.ADD_TIME, -10)
          if (tile?.bonus === 'T+') commit(MUTATIONS.ADD_TIME, 10)
        })

        // Подсчёт кристаллов для удаления
        let crystalsInRound = 0
        toRemove.forEach((key) => {
          const [r, c] = key.split('-').map(Number)
          if (board[r]?.[c]?.crystal) crystalsInRound++
        })
        crystalsPoppedThisMove += crystalsInRound
        totalPoppedThisMove += toRemove.size

        board = removeFromBoard(board, toRemove)
        commit(MUTATIONS.SET_BOARD, board)
        await new Promise((resolve) => setTimeout(resolve, 200))

        board = applyGravityAndFill(board, state.rows, state.cols)
        commit(MUTATIONS.SET_BOARD, board)
        await new Promise((resolve) => setTimeout(resolve, 200))
      }

      const moveScore = calcMoveScore(totalPoppedThisMove, crystalsPoppedThisMove)
      if (moveScore > 0) {
        commit(MUTATIONS.INCREMENT_SCORE, moveScore)
      }

      if (state.score + moveScore >= TARGET_SCORE) {
        commit(MUTATIONS.SET_LEVEL_COMPLETE, true)
      }

      commit(MUTATIONS.SET_IS_PROCESSING, false)
    },
    tickTimer: ({ commit, state }) => {
      if (state.levelComplete || state.isProcessing) return
      const next = state.timeRemaining - 1
      commit(MUTATIONS.SET_TIME_REMAINING, next)
      if (next <= 0) {
        commit(MUTATIONS.SET_LEVEL_COMPLETE, true)
      }
    },
    dropTile: ({ state, dispatch }, { fromRow, fromCol, toRow, toCol }) => {
      if (state.isProcessing) return
      if (!areAdjacent(fromRow, fromCol, toRow, toCol)) return
      dispatch('trySwap', { row1: fromRow, col1: fromCol, row2: toRow, col2: toCol })
    },
  },
}
