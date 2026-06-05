import type { LuggageCard, CabinetZone, HintMessage, ZoneId } from '../types/game.ts'

const ZONE_NAMES: Record<ZoneId, string> = { A: 'A 区', B: 'B 区', C: 'C 区' }

const ZONE_HINTS = [
  (zone: ZoneId) => `${ZONE_NAMES[zone]}负责上午最早的时段行李`,
  (zone: ZoneId) => `${ZONE_NAMES[zone]}的编号位从1开始排列`,
  (zone: ZoneId) => `注意${ZONE_NAMES[zone]}的取件时段标识`,
]

const TIME_HINTS = [
  (slot: string) => `${slot}时段的行李应归入对应柜区`,
  (slot: string) => `检查时段标签：${slot}`,
  (slot: string) => `${slot}行李需要按时段匹配柜区`,
]

const GENERAL_HINTS = [
  '每张行李卡都标有柜区、编号和时段三个关键信息',
  '先按柜区分组，再按编号排序会更高效',
  '注意卡片上的时段必须与柜区时段一致',
  '右键标记异常卡可以帮助复核角色更快发现问题',
  '标记为"临时锁定"的卡片无法被拖拽，需先解锁',
  '破损卡需要特别注意，复核角色会检查',
]

let hintCounter = 0

export function generateHint(card: LuggageCard, _zones: CabinetZone[]): HintMessage {
  const type = Math.random()
  let text: string
  let hintType: HintMessage['type']

  if (type < 0.35) {
    const fn = ZONE_HINTS[Math.floor(Math.random() * ZONE_HINTS.length)]
    text = fn(card.zoneId)
    hintType = 'zone'
  } else if (type < 0.65) {
    const fn = TIME_HINTS[Math.floor(Math.random() * TIME_HINTS.length)]
    text = fn(card.timeSlot)
    hintType = 'time'
  } else if (type < 0.85) {
    text = `${ZONE_NAMES[card.zoneId]}编号${card.slotNumber}位尚未归位`
    hintType = 'number'
  } else {
    text = GENERAL_HINTS[Math.floor(Math.random() * GENERAL_HINTS.length)]
    hintType = 'general'
  }

  return {
    id: `hint-${++hintCounter}`,
    text,
    type: hintType,
    timestamp: Date.now(),
  }
}

export function shouldGiveHint(correctCount: number): boolean {
  return correctCount > 0 && correctCount % 2 === 0
}
