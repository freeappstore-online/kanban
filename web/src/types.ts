export interface Card {
  id: string
  title: string
  description?: string
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
