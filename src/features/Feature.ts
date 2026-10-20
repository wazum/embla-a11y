export interface Feature {
  destroy(): void
}

export type WarnType = (message: string) => void
