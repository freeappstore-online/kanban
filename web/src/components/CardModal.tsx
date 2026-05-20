import { useEffect, useRef, useState } from 'react'
import type { Card, ChecklistItem, Label, LabelColor } from '../types'
import { LABEL_PRESETS } from '../types'

interface CardModalProps {
  card: Card
  onClose: () => void
  onSave: (patch: Partial<Card>) => void
  onDelete: () => void
}

export function CardModal({ card, onClose, onSave, onDelete }: CardModalProps) {
  const [title, setTitle] = useState(card.title)
  const [description, setDescription] = useState(card.description ?? '')
  const [labels, setLabels] = useState<Label[]>(card.labels ?? [])
  const [dueAt, setDueAt] = useState<number | undefined>(card.dueAt)
  const [checklist, setChecklist] = useState<ChecklistItem[]>(card.checklist ?? [])
  const [newItem, setNewItem] = useState('')

  // Snapshots of the card at open-time. Compared against the live state
  // on close to compute the minimal patch — saves a write when the user
  // opens then closes the modal without changing anything.
  const initialRef = useRef({
    title: card.title,
    description: card.description ?? '',
    labels: card.labels ?? [],
    dueAt: card.dueAt,
    checklist: card.checklist ?? [],
  })

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function close() {
    const init = initialRef.current
    const patch: Partial<Card> = {}
    if (title.trim() && title.trim() !== init.title) patch.title = title.trim()
    if (description !== init.description) patch.description = description.trim() || undefined
    if (!sameLabels(labels, init.labels)) patch.labels = labels.length ? labels : undefined
    if (dueAt !== init.dueAt) patch.dueAt = dueAt
    if (!sameChecklist(checklist, init.checklist))
      patch.checklist = checklist.length ? checklist : undefined
    if (Object.keys(patch).length) onSave(patch)
    onClose()
  }

  function toggleLabel(color: LabelColor) {
    setLabels((prev) => {
      const idx = prev.findIndex((l) => l.color === color)
      if (idx >= 0) return prev.filter((l) => l.color !== color)
      return [...prev, { id: rid(), color, name: '' }]
    })
  }

  function renameLabel(color: LabelColor, name: string) {
    setLabels((prev) => prev.map((l) => (l.color === color ? { ...l, name } : l)))
  }

  function addChecklistItem() {
    const t = newItem.trim()
    if (!t) return
    setChecklist((prev) => [...prev, { id: rid(), text: t, done: false }])
    setNewItem('')
  }

  function toggleChecklistItem(id: string) {
    setChecklist((prev) => prev.map((i) => (i.id === id ? { ...i, done: !i.done } : i)))
  }

  function removeChecklistItem(id: string) {
    setChecklist((prev) => prev.filter((i) => i.id !== id))
  }

  const checkedCount = checklist.filter((i) => i.done).length
  const progressPct = checklist.length ? (checkedCount / checklist.length) * 100 : 0

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      onClick={close}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl border border-[var(--line)] bg-[var(--paper)] p-6 shadow-[var(--shadow-soft)] sm:max-h-[85dvh] sm:rounded-3xl"
      >
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          className="w-full bg-transparent text-lg font-semibold text-[var(--ink)] outline-none placeholder:text-[var(--muted)]"
        />

        {/* Labels */}
        <SectionLabel>Labels</SectionLabel>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {LABEL_PRESETS.map(({ color }) => {
            const active = labels.find((l) => l.color === color)
            const s = labelStyles(color)
            return (
              <button
                key={color}
                type="button"
                onClick={() => toggleLabel(color)}
                className={`inline-flex h-6 items-center rounded-full px-2 text-[11px] font-semibold uppercase tracking-wide transition-transform hover:scale-105 ${
                  active ? '' : 'opacity-50'
                }`}
                style={{ background: s.bg, color: s.fg }}
                aria-pressed={active != null}
                aria-label={`${color} label`}
              >
                {active?.name || (
                  <span
                    className="block h-1 w-4 rounded-full"
                    style={{ background: s.fg, opacity: active ? 1 : 0.5 }}
                  />
                )}
              </button>
            )
          })}
        </div>
        {labels.length > 0 && (
          <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
            {labels.map((l) => {
              const s = labelStyles(l.color)
              return (
                <input
                  key={l.id}
                  value={l.name}
                  onChange={(e) => renameLabel(l.color, e.target.value)}
                  placeholder={`Name this ${l.color} label`}
                  className="rounded-full border border-[var(--line)] px-3 py-1 text-[11px] outline-none focus:border-[var(--line-strong)]"
                  style={{ background: s.bg + '40', color: s.fg }}
                  maxLength={28}
                />
              )
            })}
          </div>
        )}

        {/* Due date */}
        <SectionLabel>Due date</SectionLabel>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <input
            type="datetime-local"
            value={dueAt !== undefined ? toLocalInput(dueAt) : ''}
            onChange={(e) => {
              const v = e.target.value
              setDueAt(v ? new Date(v).getTime() : undefined)
            }}
            className="rounded-full border border-[var(--line)] bg-[var(--paper-deep)] px-3 py-1.5 text-xs text-[var(--ink)] outline-none focus:border-[var(--line-strong)]"
          />
          {dueAt !== undefined && (
            <button
              type="button"
              onClick={() => setDueAt(undefined)}
              className="rounded-full border border-[var(--line)] px-3 py-1 text-[11px] text-[var(--muted)] hover:text-[var(--ink)]"
            >
              Clear
            </button>
          )}
        </div>

        {/* Checklist */}
        <SectionLabel>
          Checklist
          {checklist.length > 0 && (
            <span className="ml-2 text-[var(--muted)]">
              {checkedCount}/{checklist.length}
            </span>
          )}
        </SectionLabel>
        {checklist.length > 0 && (
          <>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[var(--line)]">
              <div
                className="h-full rounded-full bg-[var(--mint)] transition-[width]"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <ul className="mt-3 space-y-1.5">
              {checklist.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center gap-2 rounded-lg px-1.5 py-1 hover:bg-[var(--paper-deep)]"
                >
                  <input
                    type="checkbox"
                    checked={item.done}
                    onChange={() => toggleChecklistItem(item.id)}
                    className="size-4 cursor-pointer accent-[var(--mint)]"
                  />
                  <span
                    className={`flex-1 text-sm ${item.done ? 'text-[var(--muted)] line-through' : 'text-[var(--ink)]'}`}
                  >
                    {item.text}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeChecklistItem(item.id)}
                    aria-label="Remove item"
                    // Touch-first: persistently dim on mobile (where
                    // there's no hover) so the only delete affordance
                    // isn't invisible. Lights up fully on pointer hover.
                    className="rounded-full px-1.5 text-base leading-none text-[var(--muted)] opacity-40 hover:bg-[var(--paper-deep)] hover:text-[var(--error)] hover:opacity-100"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
        <div className="mt-2 flex gap-2">
          <input
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addChecklistItem()
              }
            }}
            placeholder="Add an item…"
            className="flex-1 rounded-full border border-[var(--line)] bg-[var(--paper-deep)] px-3 py-1.5 text-xs text-[var(--ink)] outline-none focus:border-[var(--line-strong)]"
          />
          <button
            type="button"
            onClick={addChecklistItem}
            disabled={!newItem.trim()}
            className="rounded-full border border-[var(--line-strong)] px-3 py-1.5 text-[11px] text-[var(--muted)] disabled:opacity-40 enabled:hover:text-[var(--ink)]"
          >
            Add
          </button>
        </div>

        {/* Description */}
        <SectionLabel>Description</SectionLabel>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add a more detailed description…"
          rows={5}
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

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-5 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
      {children}
    </div>
  )
}

function labelStyles(color: LabelColor): { bg: string; fg: string } {
  switch (color) {
    case 'accent':
      return { bg: 'var(--accent-soft)', fg: 'var(--accent-deep)' }
    case 'sky':
      return { bg: 'var(--sky-soft)', fg: 'var(--sky-deep)' }
    case 'mint':
      return { bg: 'var(--mint-soft)', fg: 'var(--mint-deep)' }
    case 'warning':
      return { bg: 'rgba(198, 134, 42, 0.16)', fg: 'var(--warning)' }
    case 'error':
      return { bg: 'rgba(199, 79, 67, 0.14)', fg: 'var(--error)' }
    case 'muted':
      return { bg: 'var(--line)', fg: 'var(--muted)' }
  }
}

/** Format a unix-ms timestamp into the `datetime-local` input shape (no TZ). */
function toLocalInput(ts: number): string {
  const d = new Date(ts)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function sameLabels(a: Label[], b: Label[]): boolean {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) {
    if (a[i].color !== b[i].color || a[i].name !== b[i].name) return false
  }
  return true
}

function sameChecklist(a: ChecklistItem[], b: ChecklistItem[]): boolean {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) {
    if (a[i].id !== b[i].id || a[i].text !== b[i].text || a[i].done !== b[i].done) return false
  }
  return true
}

function rid(): string {
  return Math.random().toString(36).slice(2, 10)
}
