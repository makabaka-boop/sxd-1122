import type { GameSession, Difficulty, ScoreDetail } from '../types/game.ts'
import { createZones } from './cabinet.ts'
import { generateCards } from './card.ts'
import { isCardCorrectlyPlaced } from './card.ts'

export function createSession(difficulty: Difficulty): GameSession {
  const zones = createZones()
  const cards = generateCards(difficulty)
  return {
    sessionId: `session-${Date.now()}`,
    score: 0,
    correctCount: 0,
    errorCount: 0,
    elapsedSeconds: 0,
    difficulty,
    phase: 'playing',
    cards,
    zones,
    hints: [],
    alerts: [],
    placementRecords: [],
    scoreDetails: [],
  }
}

export function isGameComplete(session: GameSession): boolean {
  return session.cards.every((c) => c.isPlaced && isCardCorrectlyPlaced(c))
}

export function calculateFinalScore(session: GameSession): { score: number; details: ScoreDetail[] } {
  const details: ScoreDetail[] = []
  let score = 0

  const correctCards = session.cards.filter((c) => c.isPlaced && isCardCorrectlyPlaced(c))
  for (const card of correctCards) {
    score += 100
    details.push({
      itemId: `final-correct-${card.cardId}`,
      category: 'correct-placement',
      cardId: card.cardId,
      points: 100,
      description: `${card.cardId} 正确归位至 ${card.placedSlotId}`,
      timestamp: Date.now(),
    })
  }

  const wrongCards = session.cards.filter((c) => c.isPlaced && !isCardCorrectlyPlaced(c))
  for (const card of wrongCards) {
    score -= 30
    details.push({
      itemId: `final-wrong-${card.cardId}`,
      category: 'wrong-penalty',
      cardId: card.cardId,
      points: -30,
      description: `${card.cardId} 归位错误，应归入 ${card.zoneId}-${card.slotNumber}`,
      timestamp: Date.now(),
    })
  }

  const anomalyCards = session.cards.filter((c) => c.isAnomaly && c.status !== 'normal')
  for (const card of anomalyCards) {
    score += 50
    details.push({
      itemId: `final-anomaly-${card.cardId}`,
      category: 'anomaly-bonus',
      cardId: card.cardId,
      points: 50,
      description: `${card.cardId} 成功标记异常（${card.status}）`,
      timestamp: Date.now(),
    })
  }

  const timeBonus = Math.max(0, 300 - session.elapsedSeconds)
  if (timeBonus > 0) {
    score += timeBonus
    details.push({
      itemId: 'final-time-bonus',
      category: 'time-bonus',
      cardId: null,
      points: timeBonus,
      description: `用时 ${session.elapsedSeconds}秒，时间奖励 +${timeBonus}`,
      timestamp: Date.now(),
    })
  }

  return { score: Math.max(0, score), details }
}

export function getStarRating(score: number): number {
  if (score >= 800) return 3
  if (score >= 500) return 2
  if (score >= 200) return 1
  return 0
}
