import { fas } from './fas'
import type { Board, BoardSummary, List, Card } from '../types'

const INDEX_KEY = 'boards:index'
const boardKey = (id: string) => `board:${id}`

export async function listBoards(): Promise<BoardSummary[]> {
  return (await fas.kv.get<BoardSummary[]>(INDEX_KEY)) ?? []
}

export async function getBoard(id: string): Promise<Board | null> {
  return (await fas.kv.get<Board>(boardKey(id))) ?? null
}

export async function saveBoard(board: Board): Promise<void> {
  board.updatedAt = Date.now()
  await fas.kv.set(boardKey(board.id), board)
  const index = await listBoards()
  const summary = { id: board.id, name: board.name, updatedAt: board.updatedAt }
  const next = [summary, ...index.filter((b) => b.id !== board.id)]
  await fas.kv.set(INDEX_KEY, next)
}

export async function deleteBoard(id: string): Promise<void> {
  await fas.kv.delete(boardKey(id))
  const index = await listBoards()
  await fas.kv.set(
    INDEX_KEY,
    index.filter((b) => b.id !== id),
  )
}

export function newBoard(name: string): Board {
  const now = Date.now()
  return {
    id: crypto.randomUUID(),
    name,
    lists: [],
    createdAt: now,
    updatedAt: now,
  }
}

export function newList(title: string): List {
  return { id: crypto.randomUUID(), title, cards: [] }
}

export function newCard(title: string): Card {
  return { id: crypto.randomUUID(), title, createdAt: Date.now() }
}
