import { useEffect, useRef, useState } from 'react'
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core'
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import type { User } from '@freeappstore/sdk'
import type { Board as BoardT, List } from '../types'
import { getBoard, saveBoard, newList, newCard } from '../lib/storage'
import { TopBar } from '../components/TopBar'
import { ListColumn } from '../components/ListColumn'
import { CardModal } from '../components/CardModal'

interface BoardProps {
  boardId: string
  user: User
  onBack: () => void
}

export function Board({ boardId, user, onBack }: BoardProps) {
  const [board, setBoard] = useState<BoardT | null | undefined>(undefined)
  const [openCard, setOpenCard] = useState<{ cardId: string; listId: string } | null>(null)
  const [addingList, setAddingList] = useState(false)
  const [newListTitle, setNewListTitle] = useState('')
  const [renamingBoard, setRenamingBoard] = useState(false)
  const [nameDraft, setNameDraft] = useState('')

  const saveQueue = useRef<Promise<void>>(Promise.resolve())

  useEffect(() => {
    getBoard(boardId).then(setBoard)
  }, [boardId])

  function persist(next: BoardT) {
    // Chain saves so out-of-order writes can't clobber later ones.
    saveQueue.current = saveQueue.current.then(() => saveBoard(next)).catch(() => {})
  }

  function mutate(fn: (b: BoardT) => BoardT) {
    setBoard((prev) => {
      if (!prev) return prev
      const next = fn(structuredClone(prev) as BoardT)
      persist(next)
      return next
    })
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function findListByCardId(b: BoardT, cardId: string): List | undefined {
    return b.lists.find((l) => l.cards.some((c) => c.id === cardId))
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event
    if (!over || !board) return
    const activeId = String(active.id)
    const overId = String(over.id)
    if (activeId === overId) return

    setBoard((prev) => {
      if (!prev) return prev
      const fromList = findListByCardId(prev, activeId)
      if (!fromList) return prev

      let toListId: string
      let toIndex: number
      if (overId.startsWith('list:')) {
        toListId = overId.slice(5)
        const toList = prev.lists.find((l) => l.id === toListId)
        if (!toList) return prev
        toIndex = toList.cards.length
      } else {
        const toList = findListByCardId(prev, overId)
        if (!toList) return prev
        toListId = toList.id
        toIndex = toList.cards.findIndex((c) => c.id === overId)
      }

      if (fromList.id === toListId) return prev

      const next = structuredClone(prev) as BoardT
      const from = next.lists.find((l) => l.id === fromList.id)!
      const to = next.lists.find((l) => l.id === toListId)!
      const idx = from.cards.findIndex((c) => c.id === activeId)
      const [card] = from.cards.splice(idx, 1)
      to.cards.splice(toIndex, 0, card)
      return next
    })
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || !board) return
    const activeId = String(active.id)
    const overId = String(over.id)

    mutate((next) => {
      const fromList = findListByCardId(next, activeId)
      if (!fromList) return next

      if (!overId.startsWith('list:')) {
        const overList = findListByCardId(next, overId)
        if (overList && overList.id === fromList.id) {
          const oldIndex = fromList.cards.findIndex((c) => c.id === activeId)
          const newIndex = fromList.cards.findIndex((c) => c.id === overId)
          if (oldIndex !== newIndex) {
            fromList.cards = arrayMove(fromList.cards, oldIndex, newIndex)
          }
        }
      }
      return next
    })
  }

  if (board === undefined) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center text-[var(--muted)]">
        Loading…
      </div>
    )
  }

  if (board === null) {
    return (
      <div className="min-h-[100dvh]">
        <TopBar user={user} left={<BackButton onClick={onBack} />} />
        <main className="mx-auto max-w-[1540px] px-4 py-12 text-center">
          <p className="text-[var(--muted)]">Board not found.</p>
        </main>
      </div>
    )
  }

  function commitAddList() {
    const t = newListTitle.trim()
    if (t) {
      mutate((next) => {
        next.lists.push(newList(t))
        return next
      })
    }
    setNewListTitle('')
    setAddingList(false)
  }

  function commitRenameBoard() {
    const t = nameDraft.trim()
    if (t && board && t !== board.name) {
      mutate((next) => {
        next.name = t
        return next
      })
    }
    setRenamingBoard(false)
  }

  const open = openCard ? board.lists.find((l) => l.id === openCard.listId)?.cards.find((c) => c.id === openCard.cardId) : null

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <TopBar
        user={user}
        left={<BackButton onClick={onBack} />}
        center={
          renamingBoard ? (
            <input
              autoFocus
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              onBlur={commitRenameBoard}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitRenameBoard()
                if (e.key === 'Escape') setRenamingBoard(false)
              }}
              className="w-full bg-transparent text-center text-sm font-semibold text-[var(--ink)] outline-none"
            />
          ) : (
            <button
              onClick={() => {
                setNameDraft(board.name)
                setRenamingBoard(true)
              }}
              className="truncate font-semibold text-[var(--ink)]"
            >
              {board.name}
            </button>
          )
        }
      />

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <main className="flex flex-1 gap-4 overflow-x-auto px-4 py-6 sm:px-6">
          {board.lists.map((list) => (
            <ListColumn
              key={list.id}
              list={list}
              onAddCard={(title) =>
                mutate((next) => {
                  const target = next.lists.find((l) => l.id === list.id)
                  if (target) target.cards.push(newCard(title))
                  return next
                })
              }
              onCardClick={(card) => setOpenCard({ cardId: card.id, listId: list.id })}
              onRename={(title) =>
                mutate((next) => {
                  const target = next.lists.find((l) => l.id === list.id)
                  if (target) target.title = title
                  return next
                })
              }
              onDelete={() =>
                mutate((next) => {
                  next.lists = next.lists.filter((l) => l.id !== list.id)
                  return next
                })
              }
            />
          ))}

          {addingList ? (
            <div className="flex w-72 shrink-0 flex-col gap-2 rounded-2xl bg-[var(--glass)] p-3">
              <input
                autoFocus
                value={newListTitle}
                onChange={(e) => setNewListTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitAddList()
                  if (e.key === 'Escape') {
                    setAddingList(false)
                    setNewListTitle('')
                  }
                }}
                placeholder="List title"
                className="bg-transparent text-sm font-semibold text-[var(--ink)] outline-none placeholder:text-[var(--muted)]"
              />
              <div className="flex gap-2">
                <button
                  onClick={commitAddList}
                  className="rounded-full bg-[var(--ink)] px-3 py-1 text-xs font-semibold text-[var(--paper)]"
                >
                  Add list
                </button>
                <button
                  onClick={() => {
                    setAddingList(false)
                    setNewListTitle('')
                  }}
                  className="rounded-full border border-[var(--line-strong)] px-3 py-1 text-xs text-[var(--muted)]"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setAddingList(true)}
              className="flex h-12 w-72 shrink-0 items-center justify-center rounded-2xl border-2 border-dashed border-[var(--line-strong)] text-sm font-medium text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--ink)]"
            >
              + Add a list
            </button>
          )}
        </main>
      </DndContext>

      {open && openCard ? (
        <CardModal
          card={open}
          onClose={() => setOpenCard(null)}
          onSave={(patch) =>
            mutate((next) => {
              const list = next.lists.find((l) => l.id === openCard.listId)
              const card = list?.cards.find((c) => c.id === openCard.cardId)
              if (card) Object.assign(card, patch)
              return next
            })
          }
          onDelete={() => {
            mutate((next) => {
              const list = next.lists.find((l) => l.id === openCard.listId)
              if (list) list.cards = list.cards.filter((c) => c.id !== openCard.cardId)
              return next
            })
            setOpenCard(null)
          }}
        />
      ) : null}
    </div>
  )
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="rounded-full border border-[var(--line-strong)] bg-[var(--glass)] px-3 py-1 text-xs text-[var(--muted)] hover:text-[var(--ink)]"
      aria-label="Back to boards"
    >
      ← Boards
    </button>
  )
}
