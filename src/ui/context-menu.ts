import type { CardStatus } from '../types/game.ts'

interface ContextMenuOptions {
  onMark: (cardId: string, status: CardStatus) => void
}

const MENU_ITEMS: { status: CardStatus; label: string; icon: string; color: string }[] = [
  { status: 'pending', label: '待核对', icon: '🔍', color: '#f0a500' },
  { status: 'damaged', label: '破损', icon: '⚠️', color: '#e74c3c' },
  { status: 'locked', label: '临时锁定', icon: '🔒', color: '#95a5a6' },
]

export class ContextMenu {
  private menuEl: HTMLElement | null = null
  private options: ContextMenuOptions

  constructor(options: ContextMenuOptions) {
    this.options = options
    this.createMenuElement()
    this.bindGlobalEvents()
  }

  private createMenuElement(): void {
    this.menuEl = document.createElement('div')
    this.menuEl.className = 'context-menu'
    this.menuEl.style.display = 'none'

    for (const item of MENU_ITEMS) {
      const menuItem = document.createElement('div')
      menuItem.className = 'context-menu-item'
      menuItem.dataset.status = item.status

      const icon = document.createElement('span')
      icon.className = 'menu-icon'
      icon.textContent = item.icon

      const label = document.createElement('span')
      label.className = 'menu-label'
      label.textContent = item.label

      const dot = document.createElement('span')
      dot.className = 'menu-dot'
      dot.style.backgroundColor = item.color

      menuItem.appendChild(icon)
      menuItem.appendChild(label)
      menuItem.appendChild(dot)

      menuItem.addEventListener('click', () => {
        const cardId = this.menuEl!.dataset.targetCardId
        if (cardId) {
          this.options.onMark(cardId, item.status)
        }
        this.hide()
      })

      this.menuEl.appendChild(menuItem)
    }

    document.body.appendChild(this.menuEl)
  }

  private bindGlobalEvents(): void {
    document.addEventListener('click', () => this.hide())
    document.addEventListener('contextmenu', (e: MouseEvent) => {
      if (this.menuEl && !this.menuEl.contains(e.target as Node)) {
        this.hide()
      }
    })
  }

  show(cardId: string, x: number, y: number): void {
    if (!this.menuEl) return

    this.menuEl.dataset.targetCardId = cardId
    this.menuEl.style.display = 'block'

    const menuWidth = 180
    const menuHeight = 144
    const maxX = window.innerWidth - menuWidth
    const maxY = window.innerHeight - menuHeight

    this.menuEl.style.left = `${Math.min(x, maxX)}px`
    this.menuEl.style.top = `${Math.min(y, maxY)}px`
  }

  hide(): void {
    if (this.menuEl) {
      this.menuEl.style.display = 'none'
    }
  }

  destroy(): void {
    if (this.menuEl) {
      this.menuEl.remove()
      this.menuEl = null
    }
  }
}
