import type { LuggageCard } from '../types/game.ts'
import { setupCardDrag } from '../utils/drag.ts'
import type { DragState } from '../types/game.ts'

const STATUS_LABELS: Record<LuggageCard['status'], string> = {
  normal: '',
  pending: '待核对',
  damaged: '破损',
  locked: '已锁定',
}

export function renderLuggageCard(
  card: LuggageCard,
  dragState: DragState,
  sourceType: 'scatter' | 'slot',
  sourceSlotId: string | null,
  onContextMenu: (cardId: string, x: number, y: number) => void
): HTMLElement {
  const cardEl = document.createElement('div')
  cardEl.className = `luggage-card status-${card.status}`
  cardEl.dataset.cardId = card.cardId
  cardEl.dataset.status = card.status

  if (card.isAnomaly && card.status === 'normal') {
    cardEl.classList.add('anomaly-hidden')
  }

  const zoneTag = document.createElement('span')
  zoneTag.className = 'card-zone-tag'
  zoneTag.textContent = `${card.zoneId}区`

  const numberTag = document.createElement('span')
  numberTag.className = 'card-number-tag'
  numberTag.textContent = `${card.slotNumber}号`

  const timeTag = document.createElement('span')
  timeTag.className = 'card-time-tag'
  timeTag.textContent = card.timeSlot

  const idTag = document.createElement('span')
  idTag.className = 'card-id-tag'
  idTag.textContent = card.cardId.replace('card-', '#')

  const infoRow = document.createElement('div')
  infoRow.className = 'card-info-row'
  infoRow.appendChild(zoneTag)
  infoRow.appendChild(numberTag)

  const timeRow = document.createElement('div')
  timeRow.className = 'card-time-row'
  timeRow.appendChild(timeTag)

  cardEl.appendChild(idTag)
  cardEl.appendChild(infoRow)
  cardEl.appendChild(timeRow)

  if (card.status !== 'normal') {
    const statusBadge = document.createElement('span')
    statusBadge.className = `status-badge badge-${card.status}`
    statusBadge.textContent = STATUS_LABELS[card.status]
    cardEl.appendChild(statusBadge)
  }

  setupCardDrag(cardEl, card.cardId, sourceType, sourceSlotId, dragState)

  cardEl.addEventListener('contextmenu', (e: MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onContextMenu(card.cardId, e.clientX, e.clientY)
  })

  return cardEl
}

export function updateCardStatus(cardEl: HTMLElement, status: LuggageCard['status']): void {
  cardEl.dataset.status = status
  cardEl.className = `luggage-card status-${status}`

  const existingBadge = cardEl.querySelector('.status-badge')
  if (existingBadge) existingBadge.remove()

  if (status !== 'normal') {
    const badge = document.createElement('span')
    badge.className = `status-badge badge-${status}`
    badge.textContent = STATUS_LABELS[status]
    cardEl.appendChild(badge)
  }

  if (status === 'locked') {
    cardEl.setAttribute('draggable', 'false')
  } else {
    cardEl.setAttribute('draggable', 'true')
  }
}
