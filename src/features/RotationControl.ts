import type { EmblaCarouselType } from 'embla-carousel'
import type { Feature } from './Feature.js'

type RotationType = { stop: () => void; play: () => void; isPlaying: () => boolean }

export type RotationMemoryType = { stoppedByUser: boolean; playingBeforeResize: boolean | null }

/**
 * Stops the Autoplay and AutoScroll plugins for good as soon as someone focuses or presses anything in the carousel.
 * A resize keeps the rotation as it was: stopped when the user stopped it, running when it ran.
 */
export class RotationControl implements Feature {
  private readonly emblaApi: EmblaCarouselType
  private readonly area: HTMLElement
  private readonly memory: RotationMemoryType
  private readonly onInteraction = (): void => this.stopForGood()
  private readonly onResize = (): void => {
    this.memory.playingBeforeResize = this.rotations().some((rotation) => rotation.isPlaying())
  }
  private destroyed = false

  public constructor(emblaApi: EmblaCarouselType, area: HTMLElement, memory: RotationMemoryType) {
    this.emblaApi = emblaApi
    this.area = area
    this.memory = memory
    area.addEventListener('focusin', this.onInteraction, true)
    area.addEventListener('pointerdown', this.onInteraction, true)
    emblaApi.on('resize', this.onResize)
    queueMicrotask(() => this.restore())
  }

  public destroy(): void {
    this.destroyed = true
    this.area.removeEventListener('focusin', this.onInteraction, true)
    this.area.removeEventListener('pointerdown', this.onInteraction, true)
    this.emblaApi.off('resize', this.onResize)
  }

  private stopForGood(): void {
    this.memory.stoppedByUser = true
    for (const rotation of this.rotations()) rotation.stop()
  }

  private restore(): void {
    if (this.destroyed) return
    const { stoppedByUser, playingBeforeResize } = this.memory
    this.memory.playingBeforeResize = null
    for (const rotation of this.rotations()) {
      if (stoppedByUser) rotation.stop()
      else if (playingBeforeResize === true && !rotation.isPlaying()) rotation.play()
    }
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
