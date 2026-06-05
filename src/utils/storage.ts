import type { GameSession } from '../types/game.ts'

const STORAGE_KEY = 'luggage-game-session'

export function saveSession(session: GameSession): void {
  try {
    const data = JSON.stringify(session)
    sessionStorage.setItem(STORAGE_KEY, data)
  } catch {
    // silently fail
  }
}

export function loadSession(): GameSession | null {
  try {
    const data = sessionStorage.getItem(STORAGE_KEY)
    if (!data) return null
    return JSON.parse(data) as GameSession
  } catch {
    return null
  }
}

export function clearSession(): void {
  sessionStorage.removeItem(STORAGE_KEY)
}
