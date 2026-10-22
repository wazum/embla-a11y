import type { EmblaCarouselType, EmblaEventListType } from 'embla-carousel'
import { AttributeStore } from '../AttributeStore.js'
import type { Feature, WarnType } from './Feature.js'
import { RotationButtonText, type RotationLabelType } from './RotationButtonText.js'

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
  pausedByHover: boolean
}

export type RotationButtonType = {
  rotationButton: HTMLElement | null
  rotationLabel: RotationLabelType | null
}

const rotationEvents: (keyof EmblaEventListType)[] = [
  'autoplay:play',
  'autoplay:stop',
  'autoscroll:play',
  'autoscroll:stop'
]

/**
 * Stops the Autoplay and AutoScroll plugins as soon as someone focuses or presses anything in the carousel, and keeps them stopped until the user starts them again.
 * With reduced motion they stay stopped until the user starts them with the rotation button.
 * The rotation button starts and stops them, and its text always says what pressing it will do.
 * A reInit keeps the rotation as it was: stopped when the user stopped it, running when it ran.
 */
export class RotationControl implements Feature {
  private readonly emblaApi: EmblaCarouselType
  private readonly area: HTMLElement
  private readonly memory: RotationMemoryType
  private readonly button: HTMLElement | null
  private readonly buttonText: RotationButtonText
  private readonly warn: WarnType
  private readonly attributes = new AttributeStore()
  private readonly onInteraction = (event: Event): void => {
    if (event.target instanceof Node && this.button?.contains(event.target) === true) return
    this.stopForGood()
  }
  private readonly onToggle = (): void => {
    if (this.isPlaying() || this.memory.pausedByHover) this.stopForGood()
    else this.start()
  }
  private readonly onPointerEnter = (event: PointerEvent): void => {
    if (event.pointerType !== 'mouse' || !this.isPlaying()) return
    this.memory.pausedByHover = true
    for (const rotation of this.rotations()) rotation.stop()
  }
  private readonly onPointerLeave = (event: PointerEvent): void => {
    if (event.pointerType !== 'mouse' || !this.memory.pausedByHover) return
    this.memory.pausedByHover = false
    if (this.mustStayStopped() || !this.canRotate()) {
      this.updateLabel()
      return
    }
    for (const rotation of this.rotations()) rotation.play()
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
    { rotationButton, rotationLabel }: RotationButtonType,
    warn: WarnType
  ) {
    this.emblaApi = emblaApi
    this.area = area
    this.memory = memory
    this.button = rotationButton
    this.warn = warn
    this.buttonText = new RotationButtonText(rotationButton, rotationLabel, warn)
    area.addEventListener('focusin', this.onInteraction, true)
    area.addEventListener('pointerdown', this.onInteraction, true)
    area.addEventListener('click', this.onInteraction, true)
    area.addEventListener('pointerenter', this.onPointerEnter)
    area.addEventListener('pointerleave', this.onPointerLeave)
    rotationButton?.addEventListener('click', this.onToggle)
    for (const event of rotationEvents) emblaApi.on(event, this.onRotationChange)
    this.reducedMotion.addEventListener('change', this.onReducedMotionChange)
    queueMicrotask(() => this.restore())
  }

  public destroy(): void {
    this.destroyed = true
    this.area.removeEventListener('focusin', this.onInteraction, true)
    this.area.removeEventListener('pointerdown', this.onInteraction, true)
    this.area.removeEventListener('click', this.onInteraction, true)
    this.area.removeEventListener('pointerenter', this.onPointerEnter)
    this.area.removeEventListener('pointerleave', this.onPointerLeave)
    this.button?.removeEventListener('click', this.onToggle)
    for (const event of rotationEvents) this.emblaApi.off(event, this.onRotationChange)
    this.reducedMotion.removeEventListener('change', this.onReducedMotionChange)
    this.buttonText.restore()
    this.attributes.restore()
  }

  private stopForGood(): void {
    this.memory.stoppedByUser = true
    this.memory.startedByUser = false
    this.memory.pausedByHover = false
    this.stopAll()
  }

  private start(): void {
    this.memory.stoppedByUser = false
    this.memory.startedByUser = true
    if (this.canRotate()) for (const rotation of this.rotations()) rotation.play()
    this.updateLabel()
  }

  private canRotate(): boolean {
    return this.emblaApi.snapList().length > 1
  }

  private hasSomethingToRotate(): boolean {
    return this.rotations().length > 0 && this.canRotate()
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
    if (playing && (this.mustStayStopped() || this.memory.pausedByHover)) {
      for (const rotation of this.rotations()) rotation.stop()
      return
    }
    if (this.memory.pausedByHover) return
    this.memory.playing = playing
    this.updateLabel()
  }

  private restore(): void {
    if (this.destroyed) return
    this.warnWithoutButton()
    this.warnWithoutRotation()
    this.updateAvailability()
    for (const rotation of this.rotations()) {
      if (this.mustStayStopped() || this.memory.pausedByHover) rotation.stop()
      else if (this.memory.playing === true && !rotation.isPlaying() && this.canRotate()) {
        rotation.play()
      }
    }
    this.updateLabel()
  }

  private warnWithoutButton(): void {
    if (this.button !== null || !this.hasSomethingToRotate()) return
    this.warn(
      'Autoplay or AutoScroll runs without a rotation button. Screen reader users who read without moving focus cannot stop it. Pass rotationButton.'
    )
  }

  private warnWithoutRotation(): void {
    if (this.button === null || this.rotations().length > 0) return
    this.warn(
      'there is a rotation button but no Autoplay or AutoScroll plugin, so the button does nothing. List Autoplay or AutoScroll before emblaA11y, or remove the button.'
    )
  }

  private updateAvailability(): void {
    if (this.button === null) return
    if (this.hasSomethingToRotate()) this.attributes.reset(this.button, 'aria-disabled')
    else this.attributes.set(this.button, 'aria-disabled', 'true')
  }

  private updateLabel(): void {
    if (this.rotations().length > 0) {
      this.buttonText.show(this.isPlaying() || this.memory.pausedByHover)
    }
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
