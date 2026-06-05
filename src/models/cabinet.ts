import type { CabinetZone, CabinetSlot, ZoneId, TimeSlot } from '../types/game.ts'

const ZONE_CONFIG: { zoneId: ZoneId; zoneName: string; timeSlot: TimeSlot }[] = [
  { zoneId: 'A', zoneName: 'A 区', timeSlot: '08:00-10:00' },
  { zoneId: 'B', zoneName: 'B 区', timeSlot: '10:00-12:00' },
  { zoneId: 'C', zoneName: 'C 区', timeSlot: '14:00-16:00' },
]

const SLOTS_PER_ZONE = 6

export function createZones(): CabinetZone[] {
  return ZONE_CONFIG.map((config) => {
    const slots: CabinetSlot[] = []
    for (let i = 1; i <= SLOTS_PER_ZONE; i++) {
      slots.push({
        slotId: `${config.zoneId}-${i}`,
        zoneId: config.zoneId,
        slotNumber: i,
        timeSlot: config.timeSlot,
        cardId: null,
      })
    }
    return {
      zoneId: config.zoneId,
      zoneName: config.zoneName,
      timeSlot: config.timeSlot,
      slots,
    }
  })
}

export function findSlotById(zones: CabinetZone[], slotId: string): CabinetSlot | undefined {
  for (const zone of zones) {
    const slot = zone.slots.find((s) => s.slotId === slotId)
    if (slot) return slot
  }
  return undefined
}

export function findSlotByPosition(
  zones: CabinetZone[],
  zoneId: ZoneId,
  slotNumber: number
): CabinetSlot | undefined {
  const zone = zones.find((z) => z.zoneId === zoneId)
  return zone?.slots.find((s) => s.slotNumber === slotNumber)
}
