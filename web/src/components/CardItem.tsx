import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Card } from '../types'

interface CardItemProps {
  card: Card
  onClick: () => void
}

export function CardItem({ card, onClick }: CardItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
    data: { type: 'card', cardId: card.id },
  })

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className="cursor-grab touch-none rounded-xl border border-[var(--line)] bg-[var(--paper)] p-3 text-sm text-[var(--ink)] shadow-[var(--shadow-card)] hover:border-[var(--line-strong)] active:cursor-grabbing"
    >
      <div className="font-medium">{card.title}</div>
      {card.description ? (
        <div className="mt-1 line-clamp-2 text-xs text-[var(--muted)]">{card.description}</div>
      ) : null}
    </div>
  )
}
