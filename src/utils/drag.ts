import type { DragState } from '../types/game.ts'

export function createDragState(): DragState {
  return {
    draggingCardId: null,
    sourceType: null,
    sourceSlotId: null,
  }
}

export function setDragData(
  state: DragState,
  cardId: string,
  sourceType: 'scatter' | 'slot',
  sourceSlotId: string | null
): void {
  state.draggingCardId = cardId
  state.sourceType = sourceType
  state.sourceSlotId = sourceSlotId
}

export function clearDragData(state: DragState): void {
  state.draggingCardId = null
  state.sourceType = null
  state.sourceSlotId = null
}

export function getDragData(state: DragState): DragState {
  return { ...state }
}

export function setupCardDrag(
  element: HTMLElement,
  cardId: string,
  sourceType: 'scatter' | 'slot',
  sourceSlotId: string | null,
  dragState: DragState
): void {
  element.setAttribute('draggable', 'true')

  element.addEventListener('dragstart', (e: DragEvent) => {
    const card = document.querySelector(`[data-card-id="${cardId}"]`) as HTMLElement
    if (card?.dataset.status === 'locked') {
      e.preventDefault()
      return
    }
    setDragData(dragState, cardId, sourceType, sourceSlotId)
    e.dataTransfer!.setData('text/plain', cardId)
    e.dataTransfer!.effectAllowed = 'move'
    element.classList.add('dragging')
  })

  element.addEventListener('dragend', () => {
    element.classList.remove('dragging')
    clearDragData(dragState)
  })
}

export function setupDropTarget(
  element: HTMLElement,
  onDrop: (cardId: string) => void
): void {
  element.addEventListener('dragover', (e: DragEvent) => {
    e.preventDefault()
    e.dataTransfer!.dropEffect = 'move'
    element.classList.add('drag-over')
  })

  element.addEventListener('dragleave', () => {
    element.classList.remove('drag-over')
  })

  element.addEventListener('drop', (e: DragEvent) => {
    e.preventDefault()
    element.classList.remove('drag-over')
    const cardId = e.dataTransfer!.getData('text/plain')
    if (cardId) {
      onDrop(cardId)
    }
  })
}
