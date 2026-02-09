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
}

// Генерация случайного типа фишки
function getRandomTileType() {
  return Math.floor(Math.random() * TILE_COLORS.length)
}

// Создание пустой доски
function createEmptyBoard(rows, cols) {
  return Array.from({ length: rows }, () => 
    Array.from({ length: cols }, () => null)
  )
}

// Заполнение доски без начальных совпадений
function fillBoardWithoutMatches(rows, cols) {
  const board = createEmptyBoard(rows, cols)
  
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      let tileType
      let attempts = 0
      const maxAttempts = 100
      
      do {
        tileType = getRandomTileType()
        attempts++
      } while (
        attempts < maxAttempts && 
        wouldCreateMatch(board, row, col, tileType, rows, cols)
      )
      
      board[row][col] = {
        id: `${row}-${col}-${Date.now()}-${Math.random()}`,
        type: tileType,
        row,
        col,
      }
    }
  }
  
  return board
}

// Проверка, создаст ли размещение фишки совпадение
function wouldCreateMatch(board, row, col, type, rows, cols) {
  // Проверка горизонтали влево
  if (col >= 2) {
    if (
      board[row][col - 1]?.type === type &&
      board[row][col - 2]?.type === type
    ) {
      return true
    }
  }
  
  // Проверка вертикали вверх
  if (row >= 2) {
    if (
      board[row - 1]?.[col]?.type === type &&
      board[row - 2]?.[col]?.type === type
    ) {
      return true
    }
  }
  
  return false
}

// Поиск всех совпадений на доске
function findAllMatches(board, rows, cols) {
  const matches = new Set()
  
  // Горизонтальные совпадения
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols - 2; col++) {
      const tile = board[row][col]
      if (tile === null) continue
      
      let matchLength = 1
      while (
        col + matchLength < cols &&
        board[row][col + matchLength]?.type === tile.type
      ) {
        matchLength++
      }
      
      if (matchLength >= 3) {
        for (let i = 0; i < matchLength; i++) {
          matches.add(`${row}-${col + i}`)
        }
      }
    }
  }
  
  // Вертикальные совпадения
  for (let col = 0; col < cols; col++) {
    for (let row = 0; row < rows - 2; row++) {
      const tile = board[row][col]
      if (tile === null) continue
      
      let matchLength = 1
      while (
        row + matchLength < rows &&
        board[row + matchLength]?.[col]?.type === tile.type
      ) {
        matchLength++
      }
      
      if (matchLength >= 3) {
        for (let i = 0; i < matchLength; i++) {
          matches.add(`${row + i}-${col}`)
        }
      }
    }
  }
  
  return matches
}

// Удаление совпадений с доски
function removeMatches(board, matches) {
  const newBoard = board.map(row => [...row])
  
  matches.forEach(key => {
    const [row, col] = key.split('-').map(Number)
    newBoard[row][col] = null
  })
  
  return newBoard
}

// "Падение" фишек вниз и заполнение пустых мест
function applyGravityAndFill(board, rows, cols) {
  const newBoard = board.map(row => [...row])
  
  // Для каждого столбца
  for (let col = 0; col < cols; col++) {
    // Собираем все не-пустые фишки снизу вверх
    const tiles = []
    for (let row = rows - 1; row >= 0; row--) {
      if (newBoard[row][col] !== null) {
        tiles.push(newBoard[row][col])
      }
    }
    
    // Заполняем столбец снизу вверх
    for (let row = rows - 1; row >= 0; row--) {
      const tileIndex = rows - 1 - row
      if (tileIndex < tiles.length) {
        // Существующая фишка падает
        newBoard[row][col] = {
          ...tiles[tileIndex],
          row,
          col,
        }
      } else {
        // Генерируем новую фишку
        newBoard[row][col] = {
          id: `${row}-${col}-${Date.now()}-${Math.random()}`,
          type: getRandomTileType(),
          row,
          col,
        }
      }
    }
  }
  
  return newBoard
}

// Проверка, являются ли две позиции соседними
function areAdjacent(row1, col1, row2, col2) {
  const rowDiff = Math.abs(row1 - row2)
  const colDiff = Math.abs(col1 - col2)
  return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1)
}

// Обмен двух фишек местами
function swapTiles(board, row1, col1, row2, col2) {
  const newBoard = board.map(row => [...row])
  
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
      selectedTile: null, // { row, col }
      score: 0,
      isProcessing: false, // Блокировка во время обработки совпадений
    }
  },
  
  getters: {
    getBoard: (state) => state.board,
    getRows: (state) => state.rows,
    getCols: (state) => state.cols,
    getSelectedTile: (state) => state.selectedTile,
    getScore: (state) => state.score,
    getIsProcessing: (state) => state.isProcessing,
    getTileAt: (state) => (row, col) => state.board[row]?.[col] ?? null,
    getTileColor: () => (type) => TILE_COLORS[type]?.color ?? '#ccc',
  },
  
  mutations: {
    [MUTATIONS.SET_GRID_SIZE](state, { rows, cols }) {
      state.rows = Math.max(MIN_GRID_SIZE, rows)
      state.cols = Math.max(MIN_GRID_SIZE, cols)
    },
    
    [MUTATIONS.SET_BOARD](state, board) {
      state.board = board
    },
    
    [MUTATIONS.SET_TILE](state, { row, col, tile }) {
      if (state.board[row]) {
        state.board[row][col] = tile
      }
    },
    
    [MUTATIONS.SET_SELECTED_TILE](state, tile) {
      state.selectedTile = tile
    },
    
    [MUTATIONS.SET_SCORE](state, score) {
      state.score = score
    },
    
    [MUTATIONS.INCREMENT_SCORE](state, amount) {
      state.score += amount
    },
    
    [MUTATIONS.SET_IS_PROCESSING](state, isProcessing) {
      state.isProcessing = isProcessing
    },
  },
  
  actions: {
    // Инициализация игры
    initGame({ commit, state }, { rows = DEFAULT_GRID_SIZE, cols = DEFAULT_GRID_SIZE } = {}) {
      commit(MUTATIONS.SET_GRID_SIZE, { rows, cols })
      commit(MUTATIONS.SET_SCORE, 0)
      commit(MUTATIONS.SET_SELECTED_TILE, null)
      
      const board = fillBoardWithoutMatches(state.rows, state.cols)
      commit(MUTATIONS.SET_BOARD, board)
    },
    
    // Изменение размера сетки
    setGridSize({ dispatch }, { rows, cols }) {
      dispatch('initGame', { rows, cols })
    },
    
    // Снятие выделения
    clearSelection({ commit }) {
      commit(MUTATIONS.SET_SELECTED_TILE, null)
    },
    
    // Выбор фишки
    selectTile({ commit, state, dispatch }, { row, col }) {
      if (state.isProcessing) return
      
      const currentSelected = state.selectedTile
      
      // Если уже выбрана та же фишка - снимаем выделение
      if (currentSelected?.row === row && currentSelected?.col === col) {
        commit(MUTATIONS.SET_SELECTED_TILE, null)
        return
      }
      
      // Если есть выбранная фишка и кликнули на соседнюю - меняем местами
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
      
      // Иначе выбираем новую фишку
      commit(MUTATIONS.SET_SELECTED_TILE, { row, col })
    },
    
    // Перемещение выбранной фишки стрелкой
    moveSelectedTile({ state, dispatch, commit }, direction) {
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
      
      // Проверяем границы
      if (
        targetRow < 0 || targetRow >= state.rows ||
        targetCol < 0 || targetCol >= state.cols
      ) {
        return
      }
      
      dispatch('trySwap', {
        row1: row,
        col1: col,
        row2: targetRow,
        col2: targetCol,
      })
      commit(MUTATIONS.SET_SELECTED_TILE, null)
    },
    
    // Попытка обмена фишек
    async trySwap({ commit, state, dispatch }, { row1, col1, row2, col2 }) {
      if (state.isProcessing) return
      
      commit(MUTATIONS.SET_IS_PROCESSING, true)
      
      // Обмениваем фишки
      let newBoard = swapTiles(state.board, row1, col1, row2, col2)
      commit(MUTATIONS.SET_BOARD, newBoard)
      
      // Проверяем совпадения
      const matches = findAllMatches(newBoard, state.rows, state.cols)
      
      if (matches.size === 0) {
        // Нет совпадений - возвращаем обратно
        await new Promise(resolve => setTimeout(resolve, 200))
        newBoard = swapTiles(newBoard, row1, col1, row2, col2)
        commit(MUTATIONS.SET_BOARD, newBoard)
        commit(MUTATIONS.SET_IS_PROCESSING, false)
        return
      }
      
      // Есть совпадения - обрабатываем цепочку
      await dispatch('processMatches')
    },
    
    // Обработка всех совпадений (включая каскадные)
    async processMatches({ commit, state }) {
      let board = state.board
      let hasMatches = true
      
      while (hasMatches) {
        const matches = findAllMatches(board, state.rows, state.cols)
        
        if (matches.size === 0) {
          hasMatches = false
          break
        }
        
        // Начисляем очки
        commit(MUTATIONS.INCREMENT_SCORE, matches.size * 10)
        
        // Удаляем совпадения
        board = removeMatches(board, matches)
        commit(MUTATIONS.SET_BOARD, board)
        
        // Пауза для визуализации
        await new Promise(resolve => setTimeout(resolve, 200))
        
        // Применяем гравитацию и заполняем
        board = applyGravityAndFill(board, state.rows, state.cols)
        commit(MUTATIONS.SET_BOARD, board)
        
        // Пауза перед следующей проверкой
        await new Promise(resolve => setTimeout(resolve, 200))
      }
      
      commit(MUTATIONS.SET_IS_PROCESSING, false)
    },
    
    // Drag & Drop обмен
    dropTile({ state, dispatch }, { fromRow, fromCol, toRow, toCol }) {
      if (state.isProcessing) return
      
      // Проверяем, что позиции соседние
      if (!areAdjacent(fromRow, fromCol, toRow, toCol)) {
        return
      }
      
      dispatch('trySwap', {
        row1: fromRow,
        col1: fromCol,
        row2: toRow,
        col2: toCol,
      })
    },
  },
}
