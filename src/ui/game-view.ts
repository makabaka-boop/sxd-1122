import type { GameSession, LuggageCard, DragState } from '../types/game.ts'
import { createSession, isGameComplete, calculateFinalScore, getStarRating } from '../models/session.ts'
import { findSlotById } from '../models/cabinet.ts'
import { findCardById, isCardCorrectlyPlaced } from '../models/card.ts'
import { generateHint, shouldGiveHint } from '../services/hint.ts'
import { scanForAnomalies, shouldReview } from '../services/reviewer.ts'
import { onCardPlaced, onCardRemoved } from '../services/scorer.ts'
import { renderCabinetZone, clearSlotMark } from './cabinet.ts'
import { renderLuggageCard, updateCardStatus } from './card.ts'
import { ContextMenu } from './context-menu.ts'
import { renderHintPanel, addHintToPanel } from './hint-panel.ts'
import { showReviewAlert } from './review-modal.ts'
import { renderScoreboard, updateScoreboard } from './scoreboard.ts'
import { createDragState } from '../utils/drag.ts'
import { setupDropTarget } from '../utils/drag.ts'
import { saveSession, loadSession, clearSession } from '../utils/storage.ts'

export class GameView {
  private session: GameSession | null = null
  private dragState: DragState = createDragState()
  private contextMenu: ContextMenu
  private timer: ReturnType<typeof setInterval> | null = null
  private lastReviewAt = 0
  private reviewModalOpen = false
  private appEl: HTMLElement

  constructor(appEl: HTMLElement) {
    this.appEl = appEl
    this.contextMenu = new ContextMenu({
      onMark: (cardId, status) => this.handleMarkCard(cardId, status),
    })
    this.showStartScreen()
  }

  private showStartScreen(): void {
    this.appEl.innerHTML = ''
    const screen = document.createElement('div')
    screen.className = 'start-screen'

    const title = document.createElement('h1')
    title.className = 'game-title'
    title.textContent = '行李归位大师'

    const subtitle = document.createElement('p')
    subtitle.className = 'game-subtitle'
    subtitle.textContent = '将散落的行李卡按柜区、编号和时段归入正确位置'

    const diffContainer = document.createElement('div')
    diffContainer.className = 'difficulty-container'

    const diffs: { key: 'easy' | 'medium' | 'hard'; label: string; desc: string }[] = [
      { key: 'easy', label: '简单', desc: '9张卡片，无异常卡' },
      { key: 'medium', label: '中等', desc: '12张卡片，少量异常' },
      { key: 'hard', label: '困难', desc: '18张卡片，较多异常' },
    ]

    for (const d of diffs) {
      const card = document.createElement('div')
      card.className = `diff-card diff-${d.key}`
      card.innerHTML = `<h3>${d.label}</h3><p>${d.desc}</p>`
      card.addEventListener('click', () => this.startGame(d.key))
      diffContainer.appendChild(card)
    }

    const resumeBtn = document.createElement('button')
    resumeBtn.className = 'resume-btn'
    resumeBtn.textContent = '继续上次游戏'
    resumeBtn.style.display = loadSession() ? 'inline-block' : 'none'
    resumeBtn.addEventListener('click', () => this.resumeGame())

    screen.appendChild(title)
    screen.appendChild(subtitle)
    screen.appendChild(diffContainer)
    screen.appendChild(resumeBtn)
    this.appEl.appendChild(screen)
  }

  private startGame(difficulty: 'easy' | 'medium' | 'hard'): void {
    this.session = createSession(difficulty)
    this.lastReviewAt = 0
    this.renderGameView()
    this.startTimer()
    saveSession(this.session)
  }

  private resumeGame(): void {
    const saved = loadSession()
    if (!saved) return
    this.session = saved
    this.lastReviewAt = saved.elapsedSeconds
    this.renderGameView()
    this.startTimer()
  }

  private renderGameView(): void {
    if (!this.session) return
    this.appEl.innerHTML = ''

    const gameLayout = document.createElement('div')
    gameLayout.className = 'game-layout'

    const leftPanel = document.createElement('div')
    leftPanel.className = 'left-panel'
    leftPanel.appendChild(renderHintPanel())

    const centerPanel = document.createElement('div')
    centerPanel.className = 'center-panel'

    const gameHeader = document.createElement('div')
    gameHeader.className = 'game-header'
    const headerTitle = document.createElement('h2')
    headerTitle.className = 'header-title'
    headerTitle.textContent = '行李归位大师'
    const headerDiff = document.createElement('span')
    headerDiff.className = 'header-difficulty'
    const diffNames: Record<string, string> = { easy: '简单', medium: '中等', hard: '困难' }
    headerDiff.textContent = diffNames[this.session.difficulty] || this.session.difficulty
    gameHeader.appendChild(headerTitle)
    gameHeader.appendChild(headerDiff)
    centerPanel.appendChild(gameHeader)

    const cabinetArea = document.createElement('div')
    cabinetArea.className = 'cabinet-area'
    cabinetArea.id = 'cabinet-area'

    for (const zone of this.session.zones) {
      const zoneEl = renderCabinetZone(zone, (slotId, cardId) => this.handleDropOnSlot(slotId, cardId))
      cabinetArea.appendChild(zoneEl)
    }

    centerPanel.appendChild(cabinetArea)

    const scatterArea = document.createElement('div')
    scatterArea.className = 'scatter-area'
    scatterArea.id = 'scatter-area'

    const scatterTitle = document.createElement('h4')
    scatterTitle.className = 'scatter-title'
    scatterTitle.textContent = '待归位行李'
    scatterArea.appendChild(scatterTitle)

    const scatterCards = document.createElement('div')
    scatterCards.className = 'scatter-cards'
    scatterCards.id = 'scatter-cards'
    setupDropTarget(scatterCards, (cardId: string) => this.handleDropOnScatter(cardId))
    scatterArea.appendChild(scatterCards)

    centerPanel.appendChild(scatterArea)

    const rightPanel = document.createElement('div')
    rightPanel.className = 'right-panel'
    rightPanel.appendChild(renderScoreboard())

    const resetBtn = document.createElement('button')
    resetBtn.className = 'reset-btn'
    resetBtn.textContent = '重新开始'
    resetBtn.addEventListener('click', () => this.resetGame())
    rightPanel.appendChild(resetBtn)

    gameLayout.appendChild(leftPanel)
    gameLayout.appendChild(centerPanel)
    gameLayout.appendChild(rightPanel)
    this.appEl.appendChild(gameLayout)

    this.renderAllCards()
    this.updateScoreDisplay()

    for (const hint of this.session.hints) {
      addHintToPanel(hint)
    }
  }

  private renderAllCards(): void {
    if (!this.session) return

    const scatterCards = document.getElementById('scatter-cards')
    if (!scatterCards) return
    scatterCards.innerHTML = ''

    for (const card of this.session.cards) {
      const cardEl = this.createCardElement(card)

      if (card.isPlaced && card.placedSlotId) {
        const slotEl = document.querySelector(`[data-slot-id="${card.placedSlotId}"]`)
        if (slotEl) {
          const existingCard = slotEl.querySelector('.luggage-card')
          if (existingCard) existingCard.remove()
          slotEl.appendChild(cardEl)
          slotEl.classList.add('has-card')

          if (isCardCorrectlyPlaced(card)) {
            slotEl.classList.add('correct')
          } else {
            slotEl.classList.add('incorrect')
          }
        }
      } else {
        scatterCards.appendChild(cardEl)
      }
    }
  }

  private createCardElement(card: LuggageCard): HTMLElement {
    const sourceType = card.isPlaced ? 'slot' : 'scatter'
    return renderLuggageCard(
      card,
      this.dragState,
      sourceType,
      card.placedSlotId,
      (cardId, x, y) => this.contextMenu.show(cardId, x, y)
    )
  }

  private handleDropOnSlot(slotId: string, cardId: string): void {
    if (!this.session) return

    const card = findCardById(this.session.cards, cardId)
    if (!card) return
    if (card.status === 'locked') return

    const slot = findSlotById(this.session.zones, slotId)
    if (!slot) return

    const existingCardInSlot = this.session.cards.find(
      (c) => c.isPlaced && c.placedSlotId === slotId && c.cardId !== cardId
    )
    if (existingCardInSlot) return

    if (card.isPlaced && card.placedSlotId) {
      onCardRemoved(this.session, cardId)
      clearSlotMark(card.placedSlotId)
      const oldSlotEl = document.querySelector(`[data-slot-id="${card.placedSlotId}"]`)
      if (oldSlotEl) {
        const oldCard = oldSlotEl.querySelector('.luggage-card')
        if (oldCard) oldCard.remove()
        oldSlotEl.classList.remove('has-card', 'correct', 'incorrect')
      }
    }

    card.isPlaced = true
    card.placedSlotId = slotId

    onCardPlaced(this.session, cardId)

    const cardEl = document.querySelector(`[data-card-id="${cardId}"]`)
    if (cardEl) {
      cardEl.remove()
    }

    const newCardEl = this.createCardElement(card)
    const slotEl = document.querySelector(`[data-slot-id="${slotId}"]`)
    if (slotEl) {
      const existingInSlot = slotEl.querySelector('.luggage-card')
      if (existingInSlot) existingInSlot.remove()
      slotEl.appendChild(newCardEl)
      slotEl.classList.add('has-card')

      if (isCardCorrectlyPlaced(card)) {
        slotEl.classList.add('correct')
        slotEl.classList.remove('incorrect')
      } else {
        slotEl.classList.add('incorrect')
        slotEl.classList.remove('correct')
      }
    }

    this.updateScoreDisplay()

    if (isCardCorrectlyPlaced(card) && shouldGiveHint(this.session.correctCount)) {
      const hint = generateHint(card, this.session.zones)
      this.session.hints.push(hint)
      addHintToPanel(hint)
    }

    saveSession(this.session)

    if (isGameComplete(this.session)) {
      this.endGame()
    }
  }

  private handleDropOnScatter(cardId: string): void {
    if (!this.session) return

    const card = findCardById(this.session.cards, cardId)
    if (!card) return
    if (!card.isPlaced) return

    if (card.placedSlotId) {
      onCardRemoved(this.session, cardId)
      clearSlotMark(card.placedSlotId)
      const oldSlotEl = document.querySelector(`[data-slot-id="${card.placedSlotId}"]`)
      if (oldSlotEl) {
        const oldCard = oldSlotEl.querySelector('.luggage-card')
        if (oldCard) oldCard.remove()
        oldSlotEl.classList.remove('has-card', 'correct', 'incorrect')
      }
    }

    card.isPlaced = false
    card.placedSlotId = null

    const cardEl = document.querySelector(`[data-card-id="${cardId}"]`)
    if (cardEl) {
      cardEl.remove()
    }

    const newCardEl = this.createCardElement(card)
    const scatterCards = document.getElementById('scatter-cards')
    if (scatterCards) {
      scatterCards.appendChild(newCardEl)
    }

    this.updateScoreDisplay()
    saveSession(this.session)
  }

  private handleMarkCard(cardId: string, status: LuggageCard['status']): void {
    if (!this.session) return

    const card = findCardById(this.session.cards, cardId)
    if (!card) return

    card.status = card.status === status ? 'normal' : status

    const cardEl = document.querySelector(`[data-card-id="${cardId}"]`) as HTMLElement
    if (cardEl) {
      updateCardStatus(cardEl, card.status)
    }

    if (card.status === 'locked' && card.isPlaced && card.placedSlotId) {
      this.handleDropOnScatter(cardId)
    }

    saveSession(this.session)
  }

  private startTimer(): void {
    if (this.timer) clearInterval(this.timer)
    this.timer = setInterval(() => {
      if (!this.session || this.session.phase !== 'playing') return

      this.session.elapsedSeconds++
      this.updateScoreDisplay()

      if (shouldReview(this.session.elapsedSeconds, this.lastReviewAt)) {
        this.lastReviewAt = this.session.elapsedSeconds
        if (!this.reviewModalOpen) {
          const alerts = scanForAnomalies(this.session.cards, this.session.zones)
          if (alerts.length > 0) {
            const alert = alerts[0]
            this.session.alerts.push(alert)
            this.reviewModalOpen = true
            showReviewAlert(alert, () => {
              this.reviewModalOpen = false
              saveSession(this.session!)
            })
          }
        }
      }

      saveSession(this.session)
    }, 1000)
  }

  private updateScoreDisplay(): void {
    if (!this.session) return
    updateScoreboard(
      this.session.correctCount,
      this.session.errorCount,
      this.session.score,
      this.session.elapsedSeconds
    )
  }

  private endGame(): void {
    if (!this.session) return
    this.session.phase = 'ended'

    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }

    const finalScore = calculateFinalScore(this.session)
    this.session.score = finalScore
    const stars = getStarRating(finalScore)

    clearSession()

    this.appEl.innerHTML = ''
    const screen = document.createElement('div')
    screen.className = 'end-screen'

    const title = document.createElement('h1')
    title.className = 'end-title'
    title.textContent = '游戏结束'

    const starsEl = document.createElement('div')
    starsEl.className = 'star-rating'
    starsEl.textContent = '★'.repeat(stars) + '☆'.repeat(3 - stars)

    const scoreEl = document.createElement('div')
    scoreEl.className = 'final-score'
    scoreEl.textContent = `最终得分: ${finalScore}`

    const statsContainer = document.createElement('div')
    statsContainer.className = 'stats-container'

    const stats = [
      { label: '正确归位', value: String(this.session.correctCount) },
      { label: '错误次数', value: String(this.session.errorCount) },
      { label: '用时', value: `${this.session.elapsedSeconds}秒` },
      { label: '异常标记', value: String(this.session.cards.filter((c) => c.status !== 'normal').length) },
    ]

    for (const stat of stats) {
      const item = document.createElement('div')
      item.className = 'stat-item'
      item.innerHTML = `<span class="stat-label">${stat.label}</span><span class="stat-value">${stat.value}</span>`
      statsContainer.appendChild(item)
    }

    const replayBtn = document.createElement('button')
    replayBtn.className = 'replay-btn'
    replayBtn.textContent = '再玩一局'
    replayBtn.addEventListener('click', () => this.showStartScreen())

    screen.appendChild(title)
    screen.appendChild(starsEl)
    screen.appendChild(scoreEl)
    screen.appendChild(statsContainer)
    screen.appendChild(replayBtn)
    this.appEl.appendChild(screen)
  }

  private resetGame(): void {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
    this.session = null
    clearSession()
    this.showStartScreen()
  }

  destroy(): void {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
    this.contextMenu.destroy()
  }
}
