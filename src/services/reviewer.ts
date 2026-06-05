import type { LuggageCard, CabinetZone, ReviewAlert, PlacementRecord, ErrorCategory, ReviewSource } from '../types/game.ts'
import { isCardCorrectlyPlaced } from '../models/card.ts'

let alertCounter = 0

export function scanForAnomalies(
  cards: LuggageCard[],
  zones: CabinetZone[]
): ReviewAlert[] {
  const alerts: ReviewAlert[] = []
  const placedCards = cards.filter((c) => c.isPlaced)

  for (const card of placedCards) {
    if (!isCardCorrectlyPlaced(card)) {
      const existing = alerts.find(
        (a) => a.cardId === card.cardId && (a.type === 'wrong-zone' || a.type === 'wrong-time' || a.type === 'wrong-slot')
      )
      if (!existing && card.placedSlotId) {
        const actualSlot = zones
          .flatMap((z) => z.slots)
          .find((s) => s.slotId === card.placedSlotId)

        if (actualSlot) {
          if (card.zoneId !== actualSlot.zoneId) {
            alerts.push({
              id: `alert-${++alertCounter}`,
              cardId: card.cardId,
              message: `行李卡 ${card.cardId} 柜区错误，应归入 ${card.zoneId}区，实际放入 ${actualSlot.zoneId}区`,
              type: 'wrong-zone',
              timestamp: Date.now(),
            })
          } else if (card.timeSlot !== actualSlot.timeSlot) {
            alerts.push({
              id: `alert-${++alertCounter}`,
              cardId: card.cardId,
              message: `行李卡 ${card.cardId} 时段错误，应归入 ${card.timeSlot}，实际放入 ${actualSlot.timeSlot}`,
              type: 'wrong-time',
              timestamp: Date.now(),
            })
          } else {
            alerts.push({
              id: `alert-${++alertCounter}`,
              cardId: card.cardId,
              message: `行李卡 ${card.cardId} 编号错误，应归入 ${card.zoneId}-${card.slotNumber}，实际放入 ${card.placedSlotId}`,
              type: 'wrong-slot',
              timestamp: Date.now(),
            })
          }
        }
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

export function mapAlertToErrorCategory(alertType: ReviewAlert['type']): ErrorCategory {
  switch (alertType) {
    case 'wrong-zone': return 'zone-mismatch'
    case 'wrong-time': return 'time-mismatch'
    case 'wrong-slot': return 'slot-mismatch'
    case 'unmarked-damage': return 'unmarked-anomaly'
    case 'conflict': return 'conflict'
    case 'locked-warning': return 'locked-placement'
  }
}

export function mapAlertToReviewSource(_alertType: ReviewAlert['type']): ReviewSource {
  return 'auto-scan'
}

export function updatePlacementRecordFromAlert(
  records: PlacementRecord[],
  cardId: string,
  errorCategory: ErrorCategory,
  errorMessage: string,
  reviewSource: ReviewSource
): void {
  for (let i = records.length - 1; i >= 0; i--) {
    if (records[i].cardId === cardId && records[i].actualSlotId !== null) {
      records[i].errorCategory = errorCategory
      records[i].errorMessage = errorMessage
      records[i].reviewSource = reviewSource
      break
    }
  }
}

export function shouldReview(elapsedSeconds: number, lastReviewAt: number): boolean {
  const interval = 15
  return elapsedSeconds - lastReviewAt >= interval
}
