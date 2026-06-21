export class Texture {
  readonly image:  HTMLImageElement
  readonly width:  number
  readonly height: number
  readonly path:   string

  constructor(image: HTMLImageElement, path: string) {
    this.image  = image
    this.width  = image.naturalWidth
    this.height = image.naturalHeight
    this.path   = path
  }
}
