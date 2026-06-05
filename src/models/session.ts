import type { GameSession, Difficulty } from '../types/game.ts'
import { createZones } from './cabinet.ts'
import { generateCards } from './card.ts'

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
  }
}

export function isGameComplete(session: GameSession): boolean {
  return session.cards.every((c) => c.isPlaced)
}

export function calculateFinalScore(session: GameSession): number {
  const baseScore = session.correctCount * 100
  const errorPenalty = session.errorCount * 30
  const anomalyBonus = session.cards.filter((c) => c.isAnomaly && c.status !== 'normal').length * 50
  const timeBonus = Math.max(0, 300 - session.elapsedSeconds)
  return Math.max(0, baseScore - errorPenalty + anomalyBonus + timeBonus)
}

export function getStarRating(score: number): number {
  if (score >= 800) return 3
  if (score >= 500) return 2
  if (score >= 200) return 1
  return 0
}
