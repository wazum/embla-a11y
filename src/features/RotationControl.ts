import type { EmblaCarouselType, EmblaEventListType } from 'embla-carousel'
import type { Feature } from './Feature.js'

declare module 'embla-carousel' {
  interface EmblaEventListType {
    'autoplay:play': null
    'autoplay:stop': null
    'autoscroll:play': null
    'autoscroll:stop': null
  }
}

type RotationType = { stop: () => void; play: () => void; isPlaying: () => boolean }

export type RotationMemoryType = {
  stoppedByUser: boolean
  startedByUser: boolean
  playing: boolean | null
}

export type RotationLabelType = (playing: boolean) => string

export type RotationButtonType = {
  rotationButton: HTMLElement | null
  rotationLabel: RotationLabelType
}

const rotationEvents: (keyof EmblaEventListType)[] = [
  'autoplay:play',
  'autoplay:stop',
  'autoscroll:play',
  'autoscroll:stop'
]

/**
 * Stops the Autoplay and AutoScroll plugins for good as soon as someone focuses or presses anything in the carousel, and keeps them stopped.
 * With reduced motion they stay stopped until the user starts them with the rotation button.
 * The rotation button starts and stops them, and its text always says what pressing it will do.
 * A reInit keeps the rotation as it was: stopped when the user stopped it, running when it ran.
 */
export class RotationControl implements Feature {
  private readonly emblaApi: EmblaCarouselType
  private readonly area: HTMLElement
  private readonly memory: RotationMemoryType
  private readonly button: HTMLElement | null
  private readonly rotationLabel: RotationLabelType
  private readonly labelTarget: HTMLElement | null
  private readonly originalLabel: string | null
  private readonly onInteraction = (event: Event): void => {
    if (event.target instanceof Node && this.button?.contains(event.target) === true) return
    this.stopForGood()
  }
  private readonly onToggle = (): void => {
    if (this.isPlaying()) this.stopForGood()
    else this.start()
  }
  private readonly onRotationChange = (): void => queueMicrotask(() => this.followRotation())
  private readonly reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
  private readonly onReducedMotionChange = (): void => {
    if (!this.reducedMotion.matches) return
    this.memory.startedByUser = false
    this.stopAll()
  }
  private destroyed = false

  public constructor(
    emblaApi: EmblaCarouselType,
    area: HTMLElement,
    memory: RotationMemoryType,
    { rotationButton, rotationLabel }: RotationButtonType
  ) {
    this.emblaApi = emblaApi
    this.area = area
    this.memory = memory
    this.button = rotationButton
    this.rotationLabel = rotationLabel
    this.labelTarget =
      rotationButton?.querySelector<HTMLElement>('[data-rotation-label]') ?? rotationButton
    this.originalLabel = this.labelTarget?.textContent ?? null
    area.addEventListener('focusin', this.onInteraction, true)
    area.addEventListener('pointerdown', this.onInteraction, true)
    rotationButton?.addEventListener('click', this.onToggle)
    for (const event of rotationEvents) emblaApi.on(event, this.onRotationChange)
    this.reducedMotion.addEventListener('change', this.onReducedMotionChange)
    queueMicrotask(() => this.restore())
  }

  public destroy(): void {
    this.destroyed = true
    this.area.removeEventListener('focusin', this.onInteraction, true)
    this.area.removeEventListener('pointerdown', this.onInteraction, true)
    this.button?.removeEventListener('click', this.onToggle)
    for (const event of rotationEvents) this.emblaApi.off(event, this.onRotationChange)
    this.reducedMotion.removeEventListener('change', this.onReducedMotionChange)
    if (this.labelTarget !== null && this.originalLabel !== null) {
      this.labelTarget.textContent = this.originalLabel
    }
  }

  private stopForGood(): void {
    this.memory.stoppedByUser = true
    this.memory.startedByUser = false
    this.stopAll()
  }

  private start(): void {
    this.memory.stoppedByUser = false
    this.memory.startedByUser = true
    for (const rotation of this.rotations()) rotation.play()
    this.updateLabel()
  }

  private stopAll(): void {
    for (const rotation of this.rotations()) rotation.stop()
    this.updateLabel()
  }

  private mustStayStopped(): boolean {
    return this.memory.stoppedByUser || (this.reducedMotion.matches && !this.memory.startedByUser)
  }

  private followRotation(): void {
    if (this.destroyed) return
    const playing = this.isPlaying()
    if (playing && this.mustStayStopped()) {
      for (const rotation of this.rotations()) rotation.stop()
      return
    }
    this.memory.playing = playing
    this.updateLabel()
  }

  private restore(): void {
    if (this.destroyed) return
    for (const rotation of this.rotations()) {
      if (this.mustStayStopped()) rotation.stop()
      else if (this.memory.playing === true && !rotation.isPlaying()) rotation.play()
    }
    this.updateLabel()
  }

  private updateLabel(): void {
    if (this.labelTarget === null || this.rotations().length === 0) return
    const label = this.rotationLabel(this.isPlaying())
    if (this.labelTarget.textContent !== label) this.labelTarget.textContent = label
  }

  private isPlaying(): boolean {
    return this.rotations().some((rotation) => rotation.isPlaying())
  }

  private rotations(): RotationType[] {
    return Object.values(this.emblaApi.plugins()).flatMap((plugin) =>
      isRotation(plugin) ? [plugin] : []
    )
  }
}

function isRotation(plugin: unknown): plugin is RotationType {
  if (typeof plugin !== 'object' || plugin === null || !('name' in plugin)) return false
  return plugin.name === 'autoplay' || plugin.name === 'autoScroll'
}
