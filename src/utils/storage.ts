import type { GameSession } from '../types/game.ts'

const SESSION_KEY = 'luggage-game-session'
const REPLAY_KEY = 'luggage-game-replay'

export function saveSession(session: GameSession): void {
  try {
    const data = JSON.stringify(session)
    sessionStorage.setItem(SESSION_KEY, data)
  } catch {
    // silently fail
  }
}

export function loadSession(): GameSession | null {
  try {
    const data = sessionStorage.getItem(SESSION_KEY)
    if (!data) return null
    return JSON.parse(data) as GameSession
  } catch {
    return null
  }
}

export function clearSession(): void {
  sessionStorage.removeItem(SESSION_KEY)
}

export function saveReplayData(session: GameSession): void {
  try {
    const replayData = {
      sessionId: session.sessionId,
      difficulty: session.difficulty,
      elapsedSeconds: session.elapsedSeconds,
      score: session.score,
      correctCount: session.correctCount,
      errorCount: session.errorCount,
      cards: session.cards,
      zones: session.zones,
      placementRecords: session.placementRecords,
      scoreDetails: session.scoreDetails,
      alerts: session.alerts,
      savedAt: Date.now(),
    }
    localStorage.setItem(REPLAY_KEY, JSON.stringify(replayData))
  } catch {
    // silently fail
  }
}

export function loadReplayData(): {
  sessionId: string
  difficulty: string
  elapsedSeconds: number
  score: number
  correctCount: number
  errorCount: number
  cards: GameSession['cards']
  zones: GameSession['zones']
  placementRecords: GameSession['placementRecords']
  scoreDetails: GameSession['scoreDetails']
  alerts: GameSession['alerts']
  savedAt: number
} | null {
  try {
    const data = localStorage.getItem(REPLAY_KEY)
    if (!data) return null
    return JSON.parse(data)
  } catch {
    return null
  }
}

export function clearReplayData(): void {
  localStorage.removeItem(REPLAY_KEY)
}
