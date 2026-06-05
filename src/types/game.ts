export type ZoneId = 'A' | 'B' | 'C'
export type TimeSlot = '08:00-10:00' | '10:00-12:00' | '14:00-16:00'
export type CardStatus = 'normal' | 'pending' | 'damaged' | 'locked'
export type Difficulty = 'easy' | 'medium' | 'hard'
export type GamePhase = 'start' | 'playing' | 'ended'
export type PlacementResult = 'correct' | 'wrong-zone' | 'wrong-slot' | 'wrong-time' | 'unplaced'
export type ErrorCategory = 'zone-mismatch' | 'slot-mismatch' | 'time-mismatch' | 'unmarked-anomaly' | 'conflict' | 'locked-placement' | 'none'
export type ReviewSource = 'auto-scan' | 'manual-check' | 'hint-triggered' | 'none'

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
  type: 'wrong-zone' | 'wrong-time' | 'wrong-slot' | 'unmarked-damage' | 'conflict' | 'locked-warning'
  timestamp: number
}

export interface PlacementRecord {
  cardId: string
  expectedSlotId: string
  actualSlotId: string | null
  result: PlacementResult
  errorCategory: ErrorCategory
  errorMessage: string
  reviewSource: ReviewSource
  statusAtPlace: CardStatus
  isAnomaly: boolean
  timestamp: number
}

export interface ScoreDetail {
  itemId: string
  category: 'correct-placement' | 'wrong-penalty' | 'anomaly-bonus' | 'time-bonus' | 'remove-penalty'
  cardId: string | null
  points: number
  description: string
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
  placementRecords: PlacementRecord[]
  scoreDetails: ScoreDetail[]
}

export interface DragState {
  draggingCardId: string | null
  sourceType: 'scatter' | 'slot' | null
  sourceSlotId: string | null
}
