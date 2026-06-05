import type { GameSession, PlacementRecord, PlacementResult, ErrorCategory, ReviewSource } from '../types/game.ts'
import { isCardCorrectlyPlaced } from '../models/card.ts'

let detailCounter = 0

export function classifyPlacement(
  card: GameSession['cards'][number],
  slotZoneId: string,
  slotTimeSlot: string
): { result: PlacementResult; errorCategory: ErrorCategory; errorMessage: string } {
  if (card.zoneId !== slotZoneId) {
    return {
      result: 'wrong-zone',
      errorCategory: 'zone-mismatch',
      errorMessage: `柜区不匹配：应归入 ${card.zoneId}区，实际放入 ${slotZoneId}区`,
    }
  }
  if (card.timeSlot !== slotTimeSlot) {
    return {
      result: 'wrong-time',
      errorCategory: 'time-mismatch',
      errorMessage: `时段不匹配：应归入 ${card.timeSlot}，实际放入 ${slotTimeSlot}`,
    }
  }
  if (!isCardCorrectlyPlaced(card)) {
    return {
      result: 'wrong-slot',
      errorCategory: 'slot-mismatch',
      errorMessage: `编号不匹配：应归入 ${card.zoneId}-${card.slotNumber}，实际放入 ${card.placedSlotId}`,
    }
  }
  return { result: 'correct', errorCategory: 'none', errorMessage: '' }
}

export function buildPlacementRecord(
  card: GameSession['cards'][number],
  slotZoneId: string,
  slotTimeSlot: string,
  reviewSource: ReviewSource
): PlacementRecord {
  const classification = classifyPlacement(card, slotZoneId, slotTimeSlot)
  return {
    cardId: card.cardId,
    expectedSlotId: `${card.zoneId}-${card.slotNumber}`,
    actualSlotId: card.placedSlotId,
    result: classification.result,
    errorCategory: classification.errorCategory,
    errorMessage: classification.errorMessage,
    reviewSource,
    statusAtPlace: card.status,
    isAnomaly: card.isAnomaly,
    timestamp: Date.now(),
  }
}

export function buildUnplacedRecord(card: GameSession['cards'][number]): PlacementRecord {
  return {
    cardId: card.cardId,
    expectedSlotId: `${card.zoneId}-${card.slotNumber}`,
    actualSlotId: null,
    result: 'unplaced',
    errorCategory: 'none',
    errorMessage: '未归位',
    reviewSource: 'none',
    statusAtPlace: card.status,
    isAnomaly: card.isAnomaly,
    timestamp: Date.now(),
  }
}

export function onCardPlaced(
  session: GameSession,
  cardId: string,
  slotZoneId: string,
  slotTimeSlot: string,
  reviewSource: ReviewSource = 'none'
): void {
  const card = session.cards.find((c) => c.cardId === cardId)
  if (!card) return

  const record = buildPlacementRecord(card, slotZoneId, slotTimeSlot, reviewSource)
  session.placementRecords.push(record)

  if (record.result === 'correct') {
    session.correctCount++
    session.score += 100
    session.scoreDetails.push({
      itemId: `detail-${++detailCounter}`,
      category: 'correct-placement',
      cardId,
      points: 100,
      description: `${cardId} 正确归位至 ${card.placedSlotId}`,
      timestamp: Date.now(),
    })
  } else {
    session.errorCount++
    session.score = Math.max(0, session.score - 30)
    session.scoreDetails.push({
      itemId: `detail-${++detailCounter}`,
      category: 'wrong-penalty',
      cardId,
      points: -30,
      description: record.errorMessage,
      timestamp: Date.now(),
    })
  }
}

export function onCardRemoved(session: GameSession, cardId: string): void {
  const card = session.cards.find((c) => c.cardId === cardId)
  if (!card) return

  if (card.isPlaced && isCardCorrectlyPlaced(card)) {
    session.correctCount = Math.max(0, session.correctCount - 1)
    session.score = Math.max(0, session.score - 100)
    session.scoreDetails.push({
      itemId: `detail-${++detailCounter}`,
      category: 'remove-penalty',
      cardId,
      points: -100,
      description: `${cardId} 从正确位置移除`,
      timestamp: Date.now(),
    })
  }
}
