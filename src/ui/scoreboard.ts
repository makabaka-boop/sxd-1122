export function renderScoreboard(): HTMLElement {
  const board = document.createElement('div')
  board.className = 'scoreboard'
  board.id = 'scoreboard'

  const title = document.createElement('h4')
  title.className = 'scoreboard-title'
  title.textContent = '计分板'

  const correctItem = createScoreItem('correct', '✔ 正确', '0')
  const errorItem = createScoreItem('error', '✘ 错误', '0')
  const scoreItem = createScoreItem('score', '★ 得分', '0')
  const timeItem = createScoreItem('time', '⏱ 用时', '0s')

  board.appendChild(title)
  board.appendChild(correctItem)
  board.appendChild(errorItem)
  board.appendChild(scoreItem)
  board.appendChild(timeItem)
  return board
}

function createScoreItem(id: string, label: string, value: string): HTMLElement {
  const item = document.createElement('div')
  item.className = 'score-item'

  const labelEl = document.createElement('span')
  labelEl.className = 'score-label'
  labelEl.textContent = label

  const valueEl = document.createElement('span')
  valueEl.className = 'score-value'
  valueEl.id = `score-${id}`
  valueEl.textContent = value

  item.appendChild(labelEl)
  item.appendChild(valueEl)
  return item
}

export function updateScoreboard(
  correct: number,
  error: number,
  score: number,
  elapsedSeconds: number
): void {
  const correctEl = document.getElementById('score-correct')
  const errorEl = document.getElementById('score-error')
  const scoreEl = document.getElementById('score-score')
  const timeEl = document.getElementById('score-time')

  if (correctEl) correctEl.textContent = String(correct)
  if (errorEl) errorEl.textContent = String(error)
  if (scoreEl) scoreEl.textContent = String(score)
  if (timeEl) timeEl.textContent = formatTime(elapsedSeconds)
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return m > 0 ? `${m}m${s}s` : `${s}s`
}
