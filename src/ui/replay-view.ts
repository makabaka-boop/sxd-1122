import type { GameSession, PlacementRecord, ScoreDetail, ZoneId, TimeSlot, ErrorCategory } from '../types/game.ts'
import { buildUnplacedRecord } from '../services/scorer.ts'

const RESULT_LABELS: Record<PlacementRecord['result'], { text: string; cls: string }> = {
  correct: { text: '✔ 正确', cls: 'replay-result-correct' },
  'wrong-zone': { text: '✘ 柜区错误', cls: 'replay-result-wrong' },
  'wrong-slot': { text: '✘ 编号错误', cls: 'replay-result-wrong' },
  'wrong-time': { text: '✘ 时段错误', cls: 'replay-result-wrong' },
  unplaced: { text: '○ 未归位', cls: 'replay-result-unplaced' },
}

const ERROR_CATEGORY_LABELS: Record<ErrorCategory, string> = {
  'zone-mismatch': '柜区不匹配',
  'slot-mismatch': '编号不匹配',
  'time-mismatch': '时段不匹配',
  'unmarked-anomaly': '未标记异常',
  conflict: '卡片冲突',
  'locked-placement': '锁定放置',
  none: '无',
}

const REVIEW_SOURCE_LABELS: Record<PlacementRecord['reviewSource'], string> = {
  'auto-scan': '自动扫描',
  'manual-check': '手动检查',
  'hint-triggered': '提示触发',
  none: '无',
}

const SCORE_CATEGORY_LABELS: Record<ScoreDetail['category'], { text: string; cls: string }> = {
  'correct-placement': { text: '正确归位', cls: 'score-cat-correct' },
  'wrong-penalty': { text: '错误扣分', cls: 'score-cat-wrong' },
  'anomaly-bonus': { text: '异常奖励', cls: 'score-cat-bonus' },
  'time-bonus': { text: '时间奖励', cls: 'score-cat-bonus' },
  'remove-penalty': { text: '移除扣分', cls: 'score-cat-wrong' },
}

type FilterState = {
  zone: ZoneId | 'all'
  timeSlot: TimeSlot | 'all'
  errorCategory: ErrorCategory | 'all'
}

export function renderReplayView(
  session: GameSession,
  onBack: () => void,
  onHighlightSlot: (slotId: string) => void,
  onHighlightCard: (cardId: string) => void
): HTMLElement {
  const allRecords = buildFinalRecords(session)

  let filterState: FilterState = { zone: 'all', timeSlot: 'all', errorCategory: 'all' }

  const container = document.createElement('div')
  container.className = 'replay-view'

  const header = createReplayHeader(session, onBack)
  container.appendChild(header)

  const body = document.createElement('div')
  body.className = 'replay-body'

  const filterBar = createFilterBar(filterState, () => {
    filterState = getCurrentFilters()
    renderRecordList()
  })
  body.appendChild(filterBar)

  const summaryBar = createSummaryBar(allRecords, session.scoreDetails)
  body.appendChild(summaryBar)

  const recordListContainer = document.createElement('div')
  recordListContainer.className = 'replay-record-list'
  recordListContainer.id = 'replay-record-list'
  body.appendChild(recordListContainer)

  const scoreDetailSection = createScoreDetailSection(session.scoreDetails)
  body.appendChild(scoreDetailSection)

  container.appendChild(body)

  function getCurrentFilters(): FilterState {
    return filterState
  }

  function renderRecordList(): void {
    recordListContainer.innerHTML = ''
    const filtered = applyFilters(allRecords, filterState)
    if (filtered.length === 0) {
      const empty = document.createElement('div')
      empty.className = 'replay-empty'
      empty.textContent = '没有匹配的记录'
      recordListContainer.appendChild(empty)
      return
    }
    for (const record of filtered) {
      const row = createRecordRow(record, onHighlightSlot, onHighlightCard)
      recordListContainer.appendChild(row)
    }
  }

  renderRecordList()
  return container
}

function buildFinalRecords(session: GameSession): PlacementRecord[] {
  const records = [...session.placementRecords]
  const recordedCardIds = new Set(records.map((r) => r.cardId))

  for (const card of session.cards) {
    if (!recordedCardIds.has(card.cardId)) {
      records.push(buildUnplacedRecord(card))
    }
  }

  return records
}

function applyFilters(records: PlacementRecord[], filter: FilterState): PlacementRecord[] {
  return records.filter((r) => {
    if (filter.zone !== 'all') {
      if (!r.expectedSlotId.startsWith(`${filter.zone}-`)) return false
    }
    if (filter.timeSlot !== 'all') {
      const card = records.find((rec) => rec.cardId === r.cardId)
      if (card) {
        const expectedZone = card.expectedSlotId.split('-')[0] as ZoneId
        const zoneTimeMap: Record<ZoneId, TimeSlot> = {
          A: '08:00-10:00',
          B: '10:00-12:00',
          C: '14:00-16:00',
        }
        if (zoneTimeMap[expectedZone] !== filter.timeSlot) return false
      }
    }
    if (filter.errorCategory !== 'all') {
      if (r.errorCategory !== filter.errorCategory) return false
    }
    return true
  })
}

function createReplayHeader(session: GameSession, onBack: () => void): HTMLElement {
  const header = document.createElement('div')
  header.className = 'replay-header'

  const titleArea = document.createElement('div')
  titleArea.className = 'replay-header-title'

  const title = document.createElement('h2')
  title.className = 'replay-title'
  title.textContent = '本局复盘与错因追踪'

  const subtitle = document.createElement('span')
  subtitle.className = 'replay-subtitle'
  const diffNames: Record<string, string> = { easy: '简单', medium: '中等', hard: '困难' }
  subtitle.textContent = `${diffNames[session.difficulty] || session.difficulty} | 用时 ${session.elapsedSeconds}秒 | 得分 ${session.score}`

  titleArea.appendChild(title)
  titleArea.appendChild(subtitle)

  const backBtn = document.createElement('button')
  backBtn.className = 'replay-back-btn'
  backBtn.textContent = '← 返回结算'
  backBtn.addEventListener('click', onBack)

  header.appendChild(titleArea)
  header.appendChild(backBtn)
  return header
}

function createFilterBar(filterState: FilterState, onChange: () => void): HTMLElement {
  const bar = document.createElement('div')
  bar.className = 'replay-filter-bar'

  const zoneSelect = createFilterSelect(
    'replay-filter-zone',
    '柜区',
    [
      { value: 'all', label: '全部柜区' },
      { value: 'A', label: 'A 区' },
      { value: 'B', label: 'B 区' },
      { value: 'C', label: 'C 区' },
    ],
    filterState.zone,
    (val) => { filterState.zone = val as ZoneId | 'all'; onChange() }
  )

  const timeSelect = createFilterSelect(
    'replay-filter-time',
    '时段',
    [
      { value: 'all', label: '全部时段' },
      { value: '08:00-10:00', label: '08:00-10:00' },
      { value: '10:00-12:00', label: '10:00-12:00' },
      { value: '14:00-16:00', label: '14:00-16:00' },
    ],
    filterState.timeSlot,
    (val) => { filterState.timeSlot = val as TimeSlot | 'all'; onChange() }
  )

  const errorSelect = createFilterSelect(
    'replay-filter-error',
    '错误类型',
    [
      { value: 'all', label: '全部类型' },
      { value: 'none', label: '无错误' },
      { value: 'zone-mismatch', label: '柜区不匹配' },
      { value: 'slot-mismatch', label: '编号不匹配' },
      { value: 'time-mismatch', label: '时段不匹配' },
      { value: 'unmarked-anomaly', label: '未标记异常' },
      { value: 'conflict', label: '卡片冲突' },
      { value: 'locked-placement', label: '锁定放置' },
    ],
    filterState.errorCategory,
    (val) => { filterState.errorCategory = val as ErrorCategory | 'all'; onChange() }
  )

  bar.appendChild(zoneSelect)
  bar.appendChild(timeSelect)
  bar.appendChild(errorSelect)
  return bar
}

function createFilterSelect(
  id: string,
  label: string,
  options: { value: string; label: string }[],
  currentValue: string,
  onChange: (value: string) => void
): HTMLElement {
  const wrapper = document.createElement('div')
  wrapper.className = 'replay-filter-item'

  const labelEl = document.createElement('label')
  labelEl.className = 'replay-filter-label'
  labelEl.textContent = label
  labelEl.htmlFor = id

  const select = document.createElement('select')
  select.className = 'replay-filter-select'
  select.id = id

  for (const opt of options) {
    const option = document.createElement('option')
    option.value = opt.value
    option.textContent = opt.label
    if (opt.value === currentValue) option.selected = true
    select.appendChild(option)
  }

  select.addEventListener('change', () => onChange(select.value))

  wrapper.appendChild(labelEl)
  wrapper.appendChild(select)
  return wrapper
}

function createSummaryBar(records: PlacementRecord[], scoreDetails: ScoreDetail[]): HTMLElement {
  const bar = document.createElement('div')
  bar.className = 'replay-summary-bar'

  const correctCount = records.filter((r) => r.result === 'correct').length
  const wrongCount = records.filter((r) => r.result !== 'correct' && r.result !== 'unplaced').length
  const unplacedCount = records.filter((r) => r.result === 'unplaced').length
  const totalPoints = scoreDetails.reduce((sum, d) => sum + d.points, 0)

  const items = [
    { label: '正确归位', value: String(correctCount), cls: 'summary-correct' },
    { label: '归位错误', value: String(wrongCount), cls: 'summary-wrong' },
    { label: '未归位', value: String(unplacedCount), cls: 'summary-unplaced' },
    { label: '累计得分', value: String(totalPoints), cls: 'summary-score' },
  ]

  for (const item of items) {
    const el = document.createElement('div')
    el.className = `replay-summary-item ${item.cls}`
    el.innerHTML = `<span class="summary-value">${item.value}</span><span class="summary-label">${item.label}</span>`
    bar.appendChild(el)
  }

  return bar
}

function createRecordRow(
  record: PlacementRecord,
  onHighlightSlot: (slotId: string) => void,
  onHighlightCard: (cardId: string) => void
): HTMLElement {
  const row = document.createElement('div')
  row.className = `replay-record-row replay-row-${record.result}`
  row.dataset.cardId = record.cardId
  row.dataset.expectedSlotId = record.expectedSlotId

  const resultInfo = RESULT_LABELS[record.result]

  const resultTag = document.createElement('span')
  resultTag.className = `replay-result-tag ${resultInfo.cls}`
  resultTag.textContent = resultInfo.text

  const cardInfo = document.createElement('div')
  cardInfo.className = 'replay-card-info'
  cardInfo.innerHTML = `
    <span class="replay-card-id">${record.cardId.replace('card-', '#')}</span>
    <span class="replay-expected">应归入: ${record.expectedSlotId}</span>
    ${record.actualSlotId ? `<span class="replay-actual">实际归入: ${record.actualSlotId}</span>` : ''}
  `

  const errorInfo = document.createElement('div')
  errorInfo.className = 'replay-error-info'
  if (record.errorCategory !== 'none') {
    errorInfo.innerHTML = `
      <span class="replay-error-cat">${ERROR_CATEGORY_LABELS[record.errorCategory]}</span>
      <span class="replay-error-msg">${record.errorMessage}</span>
      <span class="replay-error-source">来源: ${REVIEW_SOURCE_LABELS[record.reviewSource]}</span>
    `
  }

  const statusTag = document.createElement('span')
  statusTag.className = 'replay-status-tag'
  const statusLabels: Record<string, string> = { normal: '', pending: '待核对', damaged: '破损', locked: '已锁定' }
  statusTag.textContent = statusLabels[record.statusAtPlace] || ''

  const anomalyTag = document.createElement('span')
  anomalyTag.className = 'replay-anomaly-tag'
  if (record.isAnomaly) {
    anomalyTag.textContent = '异常卡'
  }

  const left = document.createElement('div')
  left.className = 'replay-row-left'
  left.appendChild(resultTag)
  left.appendChild(cardInfo)

  const right = document.createElement('div')
  right.className = 'replay-row-right'
  right.appendChild(errorInfo)
  if (statusTag.textContent) right.appendChild(statusTag)
  if (anomalyTag.textContent) right.appendChild(anomalyTag)

  row.appendChild(left)
  row.appendChild(right)

  row.addEventListener('click', () => {
    document.querySelectorAll('.replay-record-row.active').forEach((el) => el.classList.remove('active'))
    row.classList.add('active')
    if (record.actualSlotId) {
      onHighlightSlot(record.actualSlotId)
    }
    onHighlightCard(record.cardId)
  })

  return row
}

function createScoreDetailSection(details: ScoreDetail[]): HTMLElement {
  const section = document.createElement('div')
  section.className = 'replay-score-section'

  const title = document.createElement('h3')
  title.className = 'replay-section-title'
  title.textContent = '得分明细'
  section.appendChild(title)

  if (details.length === 0) {
    const empty = document.createElement('div')
    empty.className = 'replay-empty'
    empty.textContent = '暂无得分记录'
    section.appendChild(empty)
    return section
  }

  const table = document.createElement('div')
  table.className = 'replay-score-table'

  for (const detail of details) {
    const row = document.createElement('div')
    row.className = 'replay-score-row'

    const catInfo = SCORE_CATEGORY_LABELS[detail.category]
    const catTag = document.createElement('span')
    catTag.className = `replay-score-cat ${catInfo.cls}`
    catTag.textContent = catInfo.text

    const desc = document.createElement('span')
    desc.className = 'replay-score-desc'
    desc.textContent = detail.description

    const points = document.createElement('span')
    points.className = `replay-score-points ${detail.points >= 0 ? 'points-positive' : 'points-negative'}`
    points.textContent = detail.points >= 0 ? `+${detail.points}` : String(detail.points)

    row.appendChild(catTag)
    row.appendChild(desc)
    row.appendChild(points)
    table.appendChild(row)
  }

  section.appendChild(table)
  return section
}

export function highlightReplayRecord(cardId: string): void {
  document.querySelectorAll('.replay-record-row.active').forEach((el) => el.classList.remove('active'))
  const row = document.querySelector(`.replay-record-row[data-card-id="${cardId}"]`) as HTMLElement
  if (row) {
    row.classList.add('active')
    row.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
}
