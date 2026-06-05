import type { HintMessage } from '../types/game.ts'

const TYPE_ICONS: Record<HintMessage['type'], string> = {
  zone: '📍',
  time: '🕐',
  number: '🔢',
  general: '💡',
}

export function renderHintPanel(): HTMLElement {
  const panel = document.createElement('div')
  panel.className = 'hint-panel'
  panel.id = 'hint-panel'

  const title = document.createElement('h4')
  title.className = 'hint-title'
  title.textContent = '提示线索'

  const list = document.createElement('div')
  list.className = 'hint-list'
  list.id = 'hint-list'

  panel.appendChild(title)
  panel.appendChild(list)
  return panel
}

export function addHintToPanel(hint: HintMessage): void {
  const list = document.getElementById('hint-list')
  if (!list) return

  const item = document.createElement('div')
  item.className = `hint-item hint-${hint.type}`

  const icon = document.createElement('span')
  icon.className = 'hint-icon'
  icon.textContent = TYPE_ICONS[hint.type]

  const text = document.createElement('span')
  text.className = 'hint-text'
  text.textContent = hint.text

  item.appendChild(icon)
  item.appendChild(text)
  list.appendChild(item)

  list.scrollTop = list.scrollHeight

  item.classList.add('hint-enter')
  requestAnimationFrame(() => {
    item.classList.remove('hint-enter')
  })
}
