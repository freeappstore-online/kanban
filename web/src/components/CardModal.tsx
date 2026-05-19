import { useEffect, useRef, useState } from 'react'
import type { Card } from '../types'

interface CardModalProps {
  card: Card
  onClose: () => void
  onSave: (patch: Partial<Card>) => void
  onDelete: () => void
}

export function CardModal({ card, onClose, onSave, onDelete }: CardModalProps) {
  const [title, setTitle] = useState(card.title)
  const [description, setDescription] = useState(card.description ?? '')
  const titleRef = useRef(card.title)
  const descRef = useRef(card.description ?? '')

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function close() {
    const patch: Partial<Card> = {}
    if (title.trim() && title.trim() !== titleRef.current) patch.title = title.trim()
    if (description !== descRef.current) patch.description = description.trim() || undefined
    if (Object.keys(patch).length) onSave(patch)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      onClick={close}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-t-3xl border border-[var(--line)] bg-[var(--paper)] p-6 shadow-[var(--shadow-soft)] sm:rounded-3xl"
      >
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          className="w-full bg-transparent text-lg font-semibold text-[var(--ink)] outline-none placeholder:text-[var(--muted)]"
        />

        <label className="mt-4 block text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add a more detailed description…"
          rows={6}
          className="mt-2 w-full resize-none rounded-xl border border-[var(--line)] bg-[var(--paper-deep)] p-3 text-sm text-[var(--ink)] outline-none placeholder:text-[var(--muted)] focus:border-[var(--line-strong)]"
        />

        <div className="mt-6 flex items-center justify-between gap-2">
          <button
            onClick={() => {
              if (confirm('Delete this card?')) onDelete()
            }}
            className="rounded-full border border-[var(--line-strong)] px-3 py-1.5 text-xs text-[var(--error)] hover:bg-[var(--error)]/10"
          >
            Delete card
          </button>
          <button
            onClick={close}
            className="rounded-full bg-[var(--ink)] px-4 py-1.5 text-xs font-semibold text-[var(--paper)]"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
