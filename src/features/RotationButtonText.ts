import { AttributeStore } from '../AttributeStore.js'
import { visuallyHidden } from '../visuallyHidden.js'
import type { WarnType } from './Feature.js'

export type RotationLabelType = (playing: boolean) => string

/**
 * Shows the rotation button text that matches the rotation: the markup's data-rotation-playing or data-rotation-stopped text, or the rotationLabel option.
 * Without either it changes nothing and warns, because only the page knows its language.
 */
export class RotationButtonText {
  private readonly attributes = new AttributeStore()
  private readonly playingText: HTMLElement | null
  private readonly stoppedText: HTMLElement | null
  private readonly labelTarget: HTMLElement | null
  private readonly rotationLabel: RotationLabelType | null
  private originalNodes: ChildNode[] | null = null

  public constructor(
    button: HTMLElement | null,
    rotationLabel: RotationLabelType | null,
    warn: WarnType
  ) {
    this.playingText = button?.querySelector<HTMLElement>('[data-rotation-playing]') ?? null
    this.stoppedText = button?.querySelector<HTMLElement>('[data-rotation-stopped]') ?? null
    this.rotationLabel = rotationLabel
    this.labelTarget = button?.querySelector<HTMLElement>('[data-rotation-label]') ?? button
    if (button !== null && !this.hasMarkupTexts() && rotationLabel === null) {
      warn(
        'the rotation button has no texts. Add one element with data-rotation-playing and one with data-rotation-stopped, or pass rotationLabel.'
      )
    }
  }

  public show(playing: boolean): void {
    if (this.playingText !== null && this.stoppedText !== null) {
      this.toggle(this.playingText, playing)
      this.toggle(this.stoppedText, !playing)
      return
    }
    if (this.rotationLabel === null || this.labelTarget === null) return
    const label = this.rotationLabel(playing)
    if (this.labelTarget.textContent === label) return
    this.originalNodes ??= Array.from(this.labelTarget.childNodes)
    this.labelTarget.textContent = label
  }

  public restore(): void {
    this.attributes.restore()
    if (this.labelTarget !== null && this.originalNodes !== null) {
      this.labelTarget.replaceChildren(...this.originalNodes)
      this.originalNodes = null
    }
  }

  private hasMarkupTexts(): boolean {
    return this.playingText !== null && this.stoppedText !== null
  }

  // Browsers never translate hidden text, so the other text stays rendered, out of sight and out of the name.
  private toggle(text: HTMLElement, visible: boolean): void {
    this.attributes.remove(text, 'hidden')
    if (visible) {
      this.attributes.reset(text, 'aria-hidden')
      this.attributes.reset(text, 'style')
      return
    }
    this.attributes.set(text, 'aria-hidden', 'true')
    this.attributes.set(text, 'style', visuallyHidden)
  }
}
