import { useEffect, useState } from 'react'
import type { User } from '@freeappstore/sdk'
import { fas } from './lib/fas'
import { SignIn } from './pages/SignIn'
import { Boards } from './pages/Boards'
import { Board } from './pages/Board'

type Route = { name: 'boards' } | { name: 'board'; id: string }

function parseHash(): Route {
  const m = location.hash.match(/^#\/board\/([\w-]+)$/)
  return m ? { name: 'board', id: m[1] } : { name: 'boards' }
}

export default function App() {
  const [ready, setReady] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [route, setRoute] = useState<Route>(parseHash())

  useEffect(() => {
    let cancelled = false
    fas.auth.init().finally(() => {
      if (cancelled) return
      setRoute(parseHash())
      setReady(true)
    })
    const unsub = fas.auth.onChange((u) => setUser(u))
    const onHash = () => setRoute(parseHash())
    window.addEventListener('hashchange', onHash)
    return () => {
      cancelled = true
      unsub()
      window.removeEventListener('hashchange', onHash)
    }
  }, [])

  if (!ready) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center text-[var(--muted)]">
        Loading…
      </div>
    )
  }

  if (!user) return <SignIn />

  if (route.name === 'board') {
    return <Board boardId={route.id} user={user} onBack={() => (location.hash = '')} />
  }

  return <Boards user={user} onOpen={(id) => (location.hash = `#/board/${id}`)} />
}
