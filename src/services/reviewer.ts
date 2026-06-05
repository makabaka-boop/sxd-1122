import type { LuggageCard, CabinetZone, ReviewAlert } from '../types/game.ts'
import { isCardCorrectlyPlaced } from '../models/card.ts'

let alertCounter = 0

export function scanForAnomalies(
  cards: LuggageCard[],
  _zones: CabinetZone[]
): ReviewAlert[] {
  const alerts: ReviewAlert[] = []
  const placedCards = cards.filter((c) => c.isPlaced)

  for (const card of placedCards) {
    if (!isCardCorrectlyPlaced(card)) {
      const existing = alerts.find(
        (a) => a.cardId === card.cardId && a.type === 'wrong-slot'
      )
      if (!existing) {
        alerts.push({
          id: `alert-${++alertCounter}`,
          cardId: card.cardId,
          message: `行李卡 ${card.cardId} 归位错误，应归入 ${card.zoneId}-${card.slotNumber}`,
          type: 'wrong-slot',
          timestamp: Date.now(),
        })
      }
    }

    if (card.isAnomaly && card.status === 'normal') {
      alerts.push({
        id: `alert-${++alertCounter}`,
        cardId: card.cardId,
        message: `行李卡 ${card.cardId} 存在异常但未标记，请右键检查`,
        type: 'unmarked-damage',
        timestamp: Date.now(),
      })
    }

    if (card.status === 'locked' && card.isPlaced) {
      alerts.push({
        id: `alert-${++alertCounter}`,
        cardId: card.cardId,
        message: `行李卡 ${card.cardId} 已锁定但仍放置在柜位中`,
        type: 'locked-warning',
        timestamp: Date.now(),
      })
    }
  }

  const slotMap = new Map<string, string[]>()
  for (const card of placedCards) {
    if (!card.placedSlotId) continue
    const existing = slotMap.get(card.placedSlotId) || []
    existing.push(card.cardId)
    slotMap.set(card.placedSlotId, existing)
  }

  for (const [slotId, cardIds] of slotMap) {
    if (cardIds.length > 1) {
      alerts.push({
        id: `alert-${++alertCounter}`,
        cardId: cardIds[0],
        message: `柜位 ${slotId} 存在多张卡片冲突`,
        type: 'conflict',
        timestamp: Date.now(),
      })
    }
  }

  return alerts
}

export function shouldReview(elapsedSeconds: number, lastReviewAt: number): boolean {
  const interval = 15
  return elapsedSeconds - lastReviewAt >= interval
}
