import type { IRenderer, IPoint, IRect, TextStyle, ScaleFilter } from '@engine/renderer'

export interface DrawCall {
  type: 'image' | 'rect' | 'circle' | 'line' | 'text' | 'clear'
  args: unknown[]
}

export class MockRenderer implements IRenderer {
  readonly logicalWidth  = 320
  readonly logicalHeight = 240

  drawCalls:  DrawCall[] = []
  transforms: { offsetX: number; offsetY: number }[] = []
  clips:      IRect[] = []

  private _imageSmoothing = false
  get imageSmoothing(): boolean { return this._imageSmoothing }

  private _scaleFilter: ScaleFilter = 'pixelated'
  get scaleFilter(): ScaleFilter { return this._scaleFilter }

  clear(_color?: string):                                     void { this.drawCalls.push({ type: 'clear', args: [] }) }
  drawImage(img: unknown, src: IRect, dst: IRect):            void { this.drawCalls.push({ type: 'image', args: [img, src, dst] }) }
  drawRect(rect: IRect, color: string, fill?: boolean):       void { this.drawCalls.push({ type: 'rect',  args: [rect, color, fill] }) }
  drawCircle(center: IPoint, radius: number, color: string, fill?: boolean): void { this.drawCalls.push({ type: 'circle', args: [center, radius, color, fill] }) }
  drawLine(from: IPoint, to: IPoint, color: string):          void { this.drawCalls.push({ type: 'line',  args: [from, to, color] }) }
  drawText(text: string, pos: IPoint, style: TextStyle):      void { this.drawCalls.push({ type: 'text',  args: [text, pos, style] }) }
  pushTransform(x: number, y: number):                        void { this.transforms.push({ offsetX: x, offsetY: y }) }
  popTransform():                                             void { this.transforms.pop() }
  pushClip(rect: IRect):                                      void { this.clips.push(rect) }
  popClip():                                                  void { this.clips.pop() }
  setImageSmoothing(enabled: boolean):                        void { this._imageSmoothing = enabled }
  setDrawSmoothing(_enabled: boolean):                        void {}
  setScaleFilter(filter: ScaleFilter):                        void { this._scaleFilter = filter }
  toggleScaleFilter():                                        void { this._scaleFilter = this._scaleFilter === 'smooth' ? 'pixelated' : 'smooth' }

  /** Reset recorded calls between test assertions. */
  reset(): void {
    this.drawCalls  = []
    this.transforms = []
    this.clips      = []
  }

  /** Count draw calls of a specific type. */
  countCalls(type: DrawCall['type']): number {
    return this.drawCalls.filter(c => c.type === type).length
  }
}
