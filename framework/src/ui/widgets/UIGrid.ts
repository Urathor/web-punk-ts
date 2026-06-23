import { UIElement           } from '../UIElement'
import type { IRenderer      } from '@engine/renderer'
import type { BitmapFont     } from '../BitmapFont'
import type { Sprite         } from '@engine/animation/Sprite'
import type { UIBackground   } from '../backgrounds'
import { Rect                } from '@engine/math'

export interface GridCell {
  sprite?:   Sprite
  /** Displayed as a small label in the bottom-right corner when > 1. */
  quantity?: number
  selected?: boolean
}

export class UIGrid extends UIElement {
  columns:  number = 4
  rows:     number = 4
  /** Cell size in logical pixels (square). */
  cellSize: number = 18
  /** Gap between cells in logical pixels. */
  padding:  number = 2

  cellBackgroundColor: string = '#1a1a2e'
  cellBorderColor:     string = '#444466'
  selectedColor:       string = '#8899ff'

  /** Optional nine-slice/colour background drawn per cell (overrides the colours). */
  cellBackground:     UIBackground | null = null
  /** Optional highlight drawn over selected cells. */
  selectedBackground: UIBackground | null = null

  bitmapFont: BitmapFont | null = null

  private cells: GridCell[][] = []

  /** Called by UICanvas.addElement — computes widget size and initialises cells. */
  onAttach(): void {
    this.rebuildCells()
    this.width  = this.columns * (this.cellSize + this.padding) + this.padding
    this.height = this.rows    * (this.cellSize + this.padding) + this.padding
  }

  private rebuildCells(): void {
    this.cells = Array.from({ length: this.rows }, () =>
      Array.from({ length: this.columns }, () => ({}))
    )
  }

  setCell(row: number, col: number, cell: GridCell): void {
    if (this.cells[row]?.[col] !== undefined) this.cells[row]![col] = cell
  }

  getCell(row: number, col: number): GridCell | undefined {
    return this.cells[row]?.[col]
  }

  clearCell(row: number, col: number): void {
    if (this.cells[row]?.[col] !== undefined) this.cells[row]![col] = {}
  }

  render(renderer: IRenderer, _interpolation: number): void {
    const origin = this.getPosition()

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.columns; c++) {
        const cell   = this.cells[r]?.[c]
        const cellX  = origin.x + this.padding + c * (this.cellSize + this.padding)
        const cellY  = origin.y + this.padding + r * (this.cellSize + this.padding)
        const bounds = new Rect(cellX, cellY, this.cellSize, this.cellSize)

        if (this.cellBackground) {
          this.cellBackground.draw(renderer, bounds)
          if (cell?.selected) {
            if (this.selectedBackground) this.selectedBackground.draw(renderer, bounds)
            else                         renderer.drawRect(bounds, this.selectedColor, false)
          }
        } else {
          renderer.drawRect(bounds, this.cellBackgroundColor, true)
          renderer.drawRect(bounds, cell?.selected ? this.selectedColor : this.cellBorderColor, false)
        }

        if (cell?.sprite) {
          const iconPad  = 1
          const iconRect = new Rect(
            cellX + iconPad, cellY + iconPad,
            this.cellSize - iconPad * 2,
            this.cellSize - iconPad * 2
          )
          renderer.drawImage(cell.sprite.texture.image, cell.sprite.srcRect, iconRect)
        }

        if (cell?.quantity !== undefined && cell.quantity > 1 && this.bitmapFont) {
          const qty     = cell.quantity.toString()
          const m       = this.bitmapFont.measureString(qty)
          this.bitmapFont.drawString(
            renderer, qty,
            cellX + this.cellSize - m.width  - 1,
            cellY + this.cellSize - m.height - 1
          )
        }
      }
    }
  }
}
