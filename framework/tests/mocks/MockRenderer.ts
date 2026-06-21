import type { IRenderer, IPoint, IRect, TextStyle } from '@engine/renderer'

export interface DrawCall {
  type: 'image' | 'rect' | 'line' | 'text' | 'clear'
  args: unknown[]
}

export class MockRenderer implements IRenderer {
  readonly logicalWidth  = 320
  readonly logicalHeight = 240

  drawCalls:  DrawCall[] = []
  transforms: { offsetX: number; offsetY: number }[] = []

  private _imageSmoothing = false
  get imageSmoothing(): boolean { return this._imageSmoothing }

  clear(_color?: string):                                     void { this.drawCalls.push({ type: 'clear', args: [] }) }
  drawImage(img: unknown, src: IRect, dst: IRect):            void { this.drawCalls.push({ type: 'image', args: [img, src, dst] }) }
  drawRect(rect: IRect, color: string, fill?: boolean):       void { this.drawCalls.push({ type: 'rect',  args: [rect, color, fill] }) }
  drawLine(from: IPoint, to: IPoint, color: string):          void { this.drawCalls.push({ type: 'line',  args: [from, to, color] }) }
  drawText(text: string, pos: IPoint, style: TextStyle):      void { this.drawCalls.push({ type: 'text',  args: [text, pos, style] }) }
  pushTransform(x: number, y: number):                        void { this.transforms.push({ offsetX: x, offsetY: y }) }
  popTransform():                                             void { this.transforms.pop() }
  setImageSmoothing(enabled: boolean):                        void { this._imageSmoothing = enabled }
  setDrawSmoothing(_enabled: boolean):                        void {}

  /** Reset recorded calls between test assertions. */
  reset(): void {
    this.drawCalls  = []
    this.transforms = []
  }

  /** Count draw calls of a specific type. */
  countCalls(type: DrawCall['type']): number {
    return this.drawCalls.filter(c => c.type === type).length
  }
}
