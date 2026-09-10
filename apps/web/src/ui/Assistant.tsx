import { useEffect, useRef, useState } from 'react'

import {
  applyDraft,
  draftLines,
  listenOnce,
  logNote,
  understand,
  voiceAvailable,
  type NoteDraft,
  type Turn,
} from '../lib/voice'
import { Avatar } from './Avatar'

type Phase = 'idle' | 'listening' | 'thinking'

/**
 * A conversation, not a one-liner. Every sentence stays on screen: what you said, what Eva
 * answered, and what got written to the log. The whole exchange is sent back up on each
 * turn, so a follow-up like "8500" attaches to the question before it. Nothing is written
 * until you confirm a draft.
 */
interface Said {
  id: string
  kind: 'you' | 'eva'
  text: string
}

interface Proposed {
  id: string
  kind: 'draft'
  draft: NoteDraft
  /** Set once confirmed or dismissed; the card stays in the thread as a record. */
  settled: 'saved' | 'dropped' | null
}

type Entry = Said | Proposed

export function Assistant({ date }: { date: string }) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [available, setAvailable] = useState(false)
  const [entries, setEntries] = useState<Entry[]>([])
  const [error, setError] = useState<string | null>(null)
  const [typed, setTyped] = useState('')
  const [via, setVia] = useState<'text' | 'voice'>('voice')
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    void voiceAvailable().then(setAvailable).catch(() => setAvailable(false))
  }, [])

  // Newest at the bottom, the way a conversation reads.
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [entries, phase])

  const add = (entry: Entry) => setEntries((list) => [...list, entry])

  /** Only spoken turns go back to the model; draft cards are ours, not part of the talk. */
  const turnsFrom = (list: Entry[]): Turn[] =>
    list
      .filter((e): e is Said => e.kind !== 'draft')
      .map((e) => ({ role: e.kind === 'you' ? ('user' as const) : ('assistant' as const), content: e.text }))

  const process = async (text: string, source: 'text' | 'voice') => {
    setError(null)
    setVia(source)
    const said: Said = { id: crypto.randomUUID(), kind: 'you', text }
    const next = [...entries, said]
    setEntries(next)
    setPhase('thinking')

    const understood = await understand(turnsFrom(next))
    setPhase('idle')

    if (!understood) {
      // No server to parse it, but the sentence is still worth keeping.
      await logNote({ via: source, text, applied: [] }, date)
      setError('Anlama servisi kapalı — not olduğu gibi kaydedildi. Ayar’dan sunucu tokenı gir.')
      return
    }
    if (understood.text) add({ id: crypto.randomUUID(), kind: 'eva', text: understood.text })
    if (understood.draft) {
      add({ id: crypto.randomUUID(), kind: 'draft', draft: understood.draft, settled: null })
    } else {
      // An answer with nothing to record is still worth keeping as a note.
      await logNote({ via: source, text, summary: understood.text, applied: [] }, date)
    }
  }

  const listen = async () => {
    setError(null)
    setPhase('listening')
    try {
      await process(await listenOnce(), 'voice')
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setPhase('idle')
    }
  }

  const submitTyped = async () => {
    const text = typed.trim()
    if (text === '') return
    setTyped('')
    try {
      await process(text, 'text')
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setPhase('idle')
    }
  }

  /** Settling a card is what stops it from being offered twice. */
  const settle = (id: string, how: 'saved' | 'dropped') =>
    setEntries((list) => list.map((e) => (e.id === id && e.kind === 'draft' ? { ...e, settled: how } : e)))

  const confirm = async (card: Proposed) => {
    if (card.settled) return
    settle(card.id, 'saved')
    await applyDraft(card.draft, date)
    const said = [...entries].reverse().find((e): e is Said => e.kind === 'you')
    await logNote(
      { via, text: said?.text ?? '', summary: card.draft.summary, applied: draftLines(card.draft) },
      date,
    )
  }

  const hint = available ? 'Ne yaptığını söyle, ben yazayım.' : 'Sesli not Android uygulamasında çalışır.'

  return (
    <section className="mt-3 flex flex-col gap-3 px-1">
      <div className="flex max-h-[52vh] flex-col gap-2 overflow-y-auto pr-1">
        {entries.length === 0 && (
          <div className="flex items-center gap-4">
            <Avatar listening={false} />
            <p className="text-sm leading-snug text-ink-dim">{hint}</p>
          </div>
        )}

        {entries.map((entry) =>
          entry.kind === 'draft' ? (
            <DraftCard key={entry.id} card={entry} onSave={() => void confirm(entry)} onDrop={() => settle(entry.id, 'dropped')} />
          ) : (
            <p
              key={entry.id}
              className={
                entry.kind === 'you'
                  ? 'self-end max-w-[85%] rounded-field bg-glass-strong px-3 py-2 text-sm text-ink-dim'
                  : 'self-start max-w-[85%] rounded-field bg-glass-inset px-3 py-2 text-sm leading-snug text-ink-dim'
              }
            >
              {entry.text}
            </p>
          ),
        )}

        {phase !== 'idle' && (
          <p className="self-start text-xs text-ink-faint">
            {phase === 'listening' ? 'Dinliyorum…' : 'anlıyorum…'}
          </p>
        )}
        {error && <p className="self-start text-sm text-a3">{error}</p>}
        <div ref={endRef} />
      </div>

      <div className="flex gap-2">
        <input
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && void submitTyped()}
          placeholder="Bugün ne yaptın?"
          className="flex-1 rounded-field bg-glass-inset px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-a1"
        />
        {available && (
          <button
            type="button"
            onClick={() => void listen()}
            disabled={phase !== 'idle'}
            aria-label="Sesli not"
            className="size-11 shrink-0 rounded-pill bg-glass-strong text-lg active:bg-glass disabled:opacity-50"
          >
            ●
          </button>
        )}
        <button
          type="button"
          onClick={() => void submitTyped()}
          disabled={phase !== 'idle'}
          className="rounded-field bg-a1/90 px-4 text-sm font-medium active:bg-a1 disabled:opacity-50"
        >
          Gönder
        </button>
      </div>
    </section>
  )
}

function DraftCard({ card, onSave, onDrop }: { card: Proposed; onSave: () => void; onDrop: () => void }) {
  const lines = draftLines(card.draft)

  if (card.settled) {
    return (
      <div className="self-start max-w-[85%] rounded-field bg-glass-inset px-3 py-2 text-xs text-ink-faint">
        {card.settled === 'saved' ? `Kaydedildi · ${lines.join(' · ')}` : 'Vazgeçildi'}
      </div>
    )
  }

  return (
    <div className="glass-card self-start w-[92%] p-4">
      {lines.length === 0 ? (
        <p className="text-sm text-ink-dim">Kaydedilecek bir ölçüm çıkaramadım.</p>
      ) : (
        <ul className="space-y-1 text-sm">
          {lines.map((l) => (
            <li key={l} className="text-ink-dim">
              {l}
            </li>
          ))}
        </ul>
      )}
      <div className="mt-3 flex gap-2">
        <button type="button" onClick={onDrop} className="rounded-field bg-glass-inset px-4 py-2.5 text-sm text-ink-faint">
          Vazgeç
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={lines.length === 0}
          className="flex-1 rounded-field bg-a1/90 py-2.5 text-sm font-medium active:bg-a1 disabled:opacity-50"
        >
          Kaydet
        </button>
      </div>
    </div>
  )
}
