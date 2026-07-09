import { ThemeSkin, solid, blendHex } from '@engine/ui'

describe('ThemeSkin — procedural defaults', () => {
  it('generates every slot from the built-in default colours when nothing is supplied', () => {
    const skin = new ThemeSkin()
    // jsdom has no working 2D canvas context, so the generated fallback resolves to a
    // SolidColorBackground — this also exercises the "colour-only fallback" path.
    expect(skin.panel).toHaveProperty('fill', '#223044')
    expect(skin.panel).toHaveProperty('border', '#48597a')
  })

  it('derives buttonHover as a lighter tile and buttonDown as a darker tile of the base fill/border', () => {
    const skin = new ThemeSkin()
    expect(skin.buttonHover).toHaveProperty('fill', blendHex('#223044', '#ffffff', 0.20))
    expect(skin.buttonDown).toHaveProperty('fill',  blendHex('#223044', '#000000', 0.18))
  })

  it('derives progressTrack darker and progressFill from the accent colour', () => {
    const skin = new ThemeSkin()
    expect(skin.progressTrack).toHaveProperty('fill', blendHex('#223044', '#000000', 0.28))
    expect(skin.progressFill).toHaveProperty('fill', '#5a9bd8')
  })

  it('button defaults to the same reference as panel when not explicitly given', () => {
    const skin = new ThemeSkin()
    expect(skin.button).toBe(skin.panel)
  })

  it('defaults buttonTint to a black overlay at strength 0.15', () => {
    const skin = new ThemeSkin()
    expect(skin.buttonTint).toEqual({ color: '#000000', strength: 0.15 })
  })

  it('honours custom generate colours/radius', () => {
    const skin = new ThemeSkin({ generate: { fill: '#ff0000', border: '#00ff00', accent: '#0000ff' } })
    expect(skin.panel).toHaveProperty('fill', '#ff0000')
    expect(skin.panel).toHaveProperty('border', '#00ff00')
    expect(skin.progressFill).toHaveProperty('fill', '#0000ff')
  })

  it('font/fontFamily default to null (no per-skin override)', () => {
    const skin = new ThemeSkin()
    expect(skin.font).toBeNull()
    expect(skin.fontFamily).toBeNull()
  })

  it('textColor defaults to null (inherit from theme.colors.text)', () => {
    const skin = new ThemeSkin()
    expect(skin.textColor).toBeNull()
  })
})

describe('ThemeSkin — explicit overrides', () => {
  it('an explicitly supplied background wins over procedural generation', () => {
    const explicitPanel = solid({ fill: '#123456' })
    const skin = new ThemeSkin({ panel: explicitPanel })
    expect(skin.panel).toBe(explicitPanel)
  })

  it('button can be given its own art independent of panel', () => {
    const panelBg  = solid({ fill: '#111111' })
    const buttonBg = solid({ fill: '#222222' })
    const skin = new ThemeSkin({ panel: panelBg, button: buttonBg })
    expect(skin.panel).toBe(panelBg)
    expect(skin.button).toBe(buttonBg)
    expect(skin.button).not.toBe(skin.panel)
  })

  it('accepts an explicit buttonTint override', () => {
    const skin = new ThemeSkin({ buttonTint: { color: '#ff00ff', strength: 0.5 } })
    expect(skin.buttonTint).toEqual({ color: '#ff00ff', strength: 0.5 })
  })

  it('accepts a per-skin fontFamily override', () => {
    const skin = new ThemeSkin({ fontFamily: 'Comic Sans MS' })
    expect(skin.fontFamily).toBe('Comic Sans MS')
  })

  it('accepts a per-skin textColor override', () => {
    const skin = new ThemeSkin({ textColor: '#ff9900' })
    expect(skin.textColor).toBe('#ff9900')
  })

  it('reuses the supplied panel/button sprite for buttonHover/buttonDown when no dedicated art is given (one-sprite skin — UIButton tints it instead of swapping in a mismatched tile)', () => {
    const spriteBg = solid({ fill: '#334455' })
    const skin = new ThemeSkin({ panel: spriteBg })
    expect(skin.buttonHover).toBe(skin.button)
    expect(skin.buttonDown).toBe(skin.button)
  })

  it('an explicit buttonHover/buttonDown still wins even when panel/button art is supplied', () => {
    const spriteBg      = solid({ fill: '#334455' })
    const dedicatedHover = solid({ fill: '#556677' })
    const skin = new ThemeSkin({ panel: spriteBg, buttonHover: dedicatedHover })
    expect(skin.buttonHover).toBe(dedicatedHover)
    expect(skin.buttonHover).not.toBe(skin.button)
    // buttonDown still wasn't given explicitly, so it falls back to reusing button.
    expect(skin.buttonDown).toBe(skin.button)
  })

  it('a purely procedural skin (no explicit panel/button) still generates distinct hover/pressed tiles, not a shared reference', () => {
    const skin = new ThemeSkin()
    expect(skin.buttonHover).not.toBe(skin.button)
    expect(skin.buttonDown).not.toBe(skin.button)
  })
})
