/**
 * Label color keys map to design tokens in index.css. Keeping this as an
 * enum-like union (not the raw hex) means a future theme switch lifts the
 * whole board's palette in one place.
 */
export type LabelColor = 'accent' | 'sky' | 'mint' | 'warning' | 'error' | 'muted'

export interface Label {
  id: string
  color: LabelColor
  /** Optional human name. Empty string means "color only, no text". */
  name: string
}

export interface ChecklistItem {
  id: string
  text: string
  done: boolean
}

export interface Card {
  id: string
  title: string
  description?: string
  /** Colored chips, max ~4 fit on the card preview before they wrap. */
  labels?: Label[]
  /** Unix ms timestamp. Renders as a date chip on the card preview. */
  dueAt?: number
  /** Inline subtasks. Card preview shows progress as `✓ 2/5`. */
  checklist?: ChecklistItem[]
  createdAt: number
}

export interface List {
  id: string
  title: string
  cards: Card[]
}

export interface Board {
  id: string
  name: string
  lists: List[]
  createdAt: number
  updatedAt: number
}

export interface BoardSummary {
  id: string
  name: string
  updatedAt: number
}

/**
 * Palette presented in the card editor. Order matters — first item is the
 * default highlight color shown to new users.
 */
export const LABEL_PRESETS: { color: LabelColor; defaultName: string }[] = [
  { color: 'accent', defaultName: '' },
  { color: 'sky', defaultName: '' },
  { color: 'mint', defaultName: '' },
  { color: 'warning', defaultName: '' },
  { color: 'error', defaultName: '' },
  { color: 'muted', defaultName: '' },
]
