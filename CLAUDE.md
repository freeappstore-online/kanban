# kanban

Personal kanban boards. Sign in with GitHub, create boards, drag cards between lists. Boards sync across your devices via FAS per-user KV.

- Subdomain: `kanban.freeappstore.online`
- Dev: `pnpm install && pnpm dev`
- Build: `pnpm build`
- Deploy: `git push origin main` (auto-deploys via Cloudflare Pages)

Free, MIT-licensed, no tracking. For platform conventions, read
https://freeappstore.online/skills.md
before writing or changing anything.

---

## Architecture

Single-user. Each board is one KV value under `board:<id>`; `boards:index` lists the user's boards.

```
web/src/
├── App.tsx                     auth gate + hash routing
├── lib/
│   ├── fas.ts                  SDK singleton
│   └── storage.ts              boards:index + board:<id> CRUD
├── pages/
│   ├── SignIn.tsx              GitHub sign-in screen
│   ├── Boards.tsx              board list / create / delete
│   └── Board.tsx               lists + cards + drag-drop
├── components/
│   ├── ListColumn.tsx          one list (column of cards)
│   ├── CardItem.tsx            one card (sortable)
│   ├── CardModal.tsx           card detail edit
│   └── Shell.tsx               brand wrapper
└── types.ts                    Board / List / Card shapes
```

KV budget: per-user 1MB total, 100 keys, 64KB per value. One board per key fits hundreds of cards comfortably; we cap boards-per-user implicitly via the 100-key limit, which is fine.
