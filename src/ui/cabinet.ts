import type { CabinetZone } from '../types/game.ts'
import { setupDropTarget } from '../utils/drag.ts'

export function renderCabinetZone(zone: CabinetZone, onDrop: (slotId: string, cardId: string) => void): HTMLElement {
  const zoneEl = document.createElement('div')
  zoneEl.className = 'cabinet-zone'
  zoneEl.dataset.zoneId = zone.zoneId

  const header = document.createElement('div')
  header.className = 'zone-header'

  const title = document.createElement('h3')
  title.className = 'zone-title'
  title.textContent = zone.zoneName

  const timeBadge = document.createElement('span')
  timeBadge.className = 'time-badge'
  timeBadge.textContent = zone.timeSlot

  header.appendChild(title)
  header.appendChild(timeBadge)
  zoneEl.appendChild(header)

  const slotsGrid = document.createElement('div')
  slotsGrid.className = 'slots-grid'

  for (const slot of zone.slots) {
    const slotEl = document.createElement('div')
    slotEl.className = 'cabinet-slot'
    slotEl.dataset.slotId = slot.slotId

    const slotLabel = document.createElement('span')
    slotLabel.className = 'slot-label'
    slotLabel.textContent = `${slot.slotNumber}号`

    slotEl.appendChild(slotLabel)
    setupDropTarget(slotEl, (cardId: string) => onDrop(slot.slotId, cardId))
    slotsGrid.appendChild(slotEl)
  }

  zoneEl.appendChild(slotsGrid)
  return zoneEl
}

export function updateSlotDisplay(slotId: string, cardElement: HTMLElement | null): void {
  const slotEl = document.querySelector(`[data-slot-id="${slotId}"]`)
  if (!slotEl) return

  const existingCard = slotEl.querySelector('.luggage-card')
  if (existingCard) {
    existingCard.remove()
  }

  if (cardElement) {
    slotEl.appendChild(cardElement)
    slotEl.classList.add('has-card')
  } else {
    slotEl.classList.remove('has-card')
  }
}

export function markSlotCorrect(slotId: string): void {
  const slotEl = document.querySelector(`[data-slot-id="${slotId}"]`) as HTMLElement
  if (slotEl) {
    slotEl.classList.add('correct')
    slotEl.classList.remove('incorrect')
  }
}

export function markSlotIncorrect(slotId: string): void {
  const slotEl = document.querySelector(`[data-slot-id="${slotId}"]`) as HTMLElement
  if (slotEl) {
    slotEl.classList.add('incorrect')
    slotEl.classList.remove('correct')
  }
}

export function clearSlotMark(slotId: string): void {
  const slotEl = document.querySelector(`[data-slot-id="${slotId}"]`) as HTMLElement
  if (slotEl) {
    slotEl.classList.remove('correct', 'incorrect')
  }
}
