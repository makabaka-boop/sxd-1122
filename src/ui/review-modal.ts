import type { ReviewAlert } from '../types/game.ts'

const TYPE_ICONS: Record<ReviewAlert['type'], string> = {
  'wrong-slot': '❌',
  'unmarked-damage': '⚠️',
  conflict: '🔄',
  'locked-warning': '🔒',
}

export function showReviewAlert(alert: ReviewAlert, onDismiss: () => void): void {
  const overlay = document.createElement('div')
  overlay.className = 'review-overlay'

  const modal = document.createElement('div')
  modal.className = 'review-modal'

  const header = document.createElement('div')
  header.className = 'review-header'

  const icon = document.createElement('span')
  icon.className = 'review-icon'
  icon.textContent = TYPE_ICONS[alert.type] || '🔔'

  const title = document.createElement('span')
  title.className = 'review-title'
  title.textContent = '复核提醒'

  header.appendChild(icon)
  header.appendChild(title)

  const message = document.createElement('p')
  message.className = 'review-message'
  message.textContent = alert.message

  const footer = document.createElement('div')
  footer.className = 'review-footer'

  const dismissBtn = document.createElement('button')
  dismissBtn.className = 'review-btn dismiss-btn'
  dismissBtn.textContent = '知道了'
  dismissBtn.addEventListener('click', () => {
    overlay.remove()
    onDismiss()
  })

  const locateBtn = document.createElement('button')
  locateBtn.className = 'review-btn locate-btn'
  locateBtn.textContent = '定位卡片'
  locateBtn.addEventListener('click', () => {
    highlightCard(alert.cardId)
    overlay.remove()
    onDismiss()
  })

  footer.appendChild(dismissBtn)
  footer.appendChild(locateBtn)

  modal.appendChild(header)
  modal.appendChild(message)
  modal.appendChild(footer)
  overlay.appendChild(modal)

  overlay.addEventListener('click', (e: MouseEvent) => {
    if (e.target === overlay) {
      overlay.remove()
      onDismiss()
    }
  })

  document.body.appendChild(overlay)
}

function highlightCard(cardId: string): void {
  const cardEl = document.querySelector(`[data-card-id="${cardId}"]`) as HTMLElement
  if (!cardEl) return

  cardEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
  cardEl.classList.add('highlight-pulse')
  setTimeout(() => {
    cardEl.classList.remove('highlight-pulse')
  }, 2000)
}
