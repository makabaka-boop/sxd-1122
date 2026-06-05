import type { LuggageCard, Difficulty, ZoneId, TimeSlot } from '../types/game.ts'

const ZONE_IDS: ZoneId[] = ['A', 'B', 'C']
const TIME_SLOTS: TimeSlot[] = ['08:00-10:00', '10:00-12:00', '14:00-16:00']
const SLOT_COUNTS: Record<Difficulty, number> = { easy: 3, medium: 4, hard: 6 }

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export function generateCards(difficulty: Difficulty): LuggageCard[] {
  const slotsPerZone = SLOT_COUNTS[difficulty]
  const anomalyRate = difficulty === 'easy' ? 0 : difficulty === 'medium' ? 0.1 : 0.2
  const cards: LuggageCard[] = []
  let id = 1

  for (const zoneId of ZONE_IDS) {
    const zoneTimeSlot = TIME_SLOTS[ZONE_IDS.indexOf(zoneId)]
    const slotNumbers = shuffleArray([1, 2, 3, 4, 5, 6]).slice(0, slotsPerZone)

    for (const slotNumber of slotNumbers) {
      const isAnomaly = Math.random() < anomalyRate
      cards.push({
        cardId: `card-${id++}`,
        zoneId,
        slotNumber,
        timeSlot: zoneTimeSlot,
        status: 'normal',
        isPlaced: false,
        placedSlotId: null,
        isAnomaly,
      })
    }
  }

  return shuffleArray(cards)
}

export function findCardById(cards: LuggageCard[], cardId: string): LuggageCard | undefined {
  return cards.find((c) => c.cardId === cardId)
}

export function isCardCorrectlyPlaced(card: LuggageCard): boolean {
  if (!card.isPlaced || !card.placedSlotId) return false
  const expectedSlotId = `${card.zoneId}-${card.slotNumber}`
  return card.placedSlotId === expectedSlotId
}
