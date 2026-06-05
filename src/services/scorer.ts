import type { GameSession } from '../types/game.ts'
import { isCardCorrectlyPlaced } from '../models/card.ts'

export function onCardPlaced(session: GameSession, cardId: string): void {
  const card = session.cards.find((c) => c.cardId === cardId)
  if (!card) return

  if (isCardCorrectlyPlaced(card)) {
    session.correctCount++
    session.score += 100
  } else {
    session.errorCount++
    session.score = Math.max(0, session.score - 30)
  }
}

export function onCardRemoved(session: GameSession, cardId: string): void {
  const card = session.cards.find((c) => c.cardId === cardId)
  if (!card) return

  if (card.isPlaced && isCardCorrectlyPlaced(card)) {
    session.correctCount = Math.max(0, session.correctCount - 1)
    session.score = Math.max(0, session.score - 100)
  }
}
