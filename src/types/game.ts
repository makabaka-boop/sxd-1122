export type ZoneId = 'A' | 'B' | 'C'
export type TimeSlot = '08:00-10:00' | '10:00-12:00' | '14:00-16:00'
export type CardStatus = 'normal' | 'pending' | 'damaged' | 'locked'
export type Difficulty = 'easy' | 'medium' | 'hard'
export type GamePhase = 'start' | 'playing' | 'ended'

export interface CabinetZone {
  zoneId: ZoneId
  zoneName: string
  timeSlot: TimeSlot
  slots: CabinetSlot[]
}

export interface CabinetSlot {
  slotId: string
  zoneId: ZoneId
  slotNumber: number
  timeSlot: TimeSlot
  cardId: string | null
}

export interface LuggageCard {
  cardId: string
  zoneId: ZoneId
  slotNumber: number
  timeSlot: TimeSlot
  status: CardStatus
  isPlaced: boolean
  placedSlotId: string | null
  isAnomaly: boolean
}

export interface HintMessage {
  id: string
  text: string
  type: 'zone' | 'time' | 'number' | 'general'
  timestamp: number
}

export interface ReviewAlert {
  id: string
  cardId: string
  message: string
  type: 'wrong-slot' | 'unmarked-damage' | 'conflict' | 'locked-warning'
  timestamp: number
}

export interface GameSession {
  sessionId: string
  score: number
  correctCount: number
  errorCount: number
  elapsedSeconds: number
  difficulty: Difficulty
  phase: GamePhase
  cards: LuggageCard[]
  zones: CabinetZone[]
  hints: HintMessage[]
  alerts: ReviewAlert[]
}

export interface DragState {
  draggingCardId: string | null
  sourceType: 'scatter' | 'slot' | null
  sourceSlotId: string | null
}
