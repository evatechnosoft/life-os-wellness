import { useEffect, useState } from 'react'

import { applyDraft, draftLines, listenOnce, logNote, understand, voiceAvailable, type NoteDraft } from '../lib/voice'
import { Avatar } from './Avatar'

type Phase = 'idle' | 'listening' | 'thinking' | 'draft' | 'saved'

/**
 * Speak-to-log. Deliberately not a chat transcript: one face, one line of text, and a
 * draft you confirm. Nothing is written until you say yes.
 */
export function Assistant({ date }: { date: string }) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [available, setAvailable] = useState(false)
  const [heard, setHeard] = useState('')
  const [draft, setDraft] = useState<NoteDraft | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [typed, setTyped] = useState('')
  const [writing, setWriting] = useState(false)
  const [via, setVia] = useState<'text' | 'voice'>('voice')

  useEffect(() => {
    void voiceAvailable().then(setAvailable).catch(() => setAvailable(false))
  }, [])

  /** One path for both inputs: take text, understand it, show a draft to confirm. */
  const process = async (text: string, source: 'text' | 'voice') => {
    setVia(source)
    setHeard(text)
    setPhase('thinking')
    const understood = await understand(text)
    if (!understood) {
      // No server to parse it, but the sentence is still worth keeping.
      await logNote({ via: source, text, applied: [] }, date)
      setError('Anlama servisi kapalı — not olduğu gibi kaydedildi. Ayar’dan sunucu tokenı gir.')
      setPhase('idle')
      return
    }
    setDraft(understood)
    setPhase('draft')
  }

  const listen = async () => {
    setError(null)
    setDraft(null)
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
    setError(null)
    setDraft(null)
    setTyped('')
    setWriting(false)
    try {
      await process(text, 'text')
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setPhase('idle')
    }
  }

  const confirm = async () => {
    if (!draft) return
    await applyDraft(draft, date)
    await logNote({ via, text: heard, summary: draft.summary, applied: draftLines(draft) }, date)
    setDraft(null)
    setPhase('saved')
    window.setTimeout(() => setPhase('idle'), 2500)
  }

  const line = (): string => {
    if (error) return error
    switch (phase) {
      case 'listening':
        return 'Dinliyorum.'
      case 'thinking':
        return heard
      case 'draft':
        return draft?.summary ?? ''
      case 'saved':
        return 'Kaydettim.'
      default:
        return available
          ? 'Ne yaptığını söyle, ben yazayım.'
          : 'Sesli not Android uygulamasında çalışır.'
    }
  }

  const lines = draft ? draftLines(draft) : []

  return (
    <section className="mt-3 flex flex-col gap-3 px-1">
      <div className="flex items-center gap-4">
        <Avatar listening={phase === 'listening'} />
        <div className="min-w-0 flex-1">
          <p className={`text-sm leading-snug ${error ? 'text-a3' : 'text-ink-dim'}`}>{line()}</p>
          {phase === 'thinking' && <p className="mt-1 text-xs text-ink-faint">anlıyorum…</p>}
        </div>
        {phase !== 'draft' && (
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={() => setWriting((w) => !w)}
              aria-label="Yazarak not"
              className="size-12 rounded-pill bg-glass-strong text-sm active:bg-glass"
            >
              yaz
            </button>
            {available && (
              <button
                type="button"
                onClick={() => void listen()}
                disabled={phase === 'listening' || phase === 'thinking'}
                aria-label="Sesli not"
                className="size-12 rounded-pill bg-a1/90 text-lg active:bg-a1 disabled:opacity-50"
              >
                ●
              </button>
            )}
          </div>
        )}
      </div>

      {writing && phase !== 'draft' && (
        <div className="flex gap-2">
          <input
            autoFocus
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && void submitTyped()}
            placeholder="Bugün ne yaptın?"
            className="flex-1 rounded-field bg-glass-inset px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-a1"
          />
          <button
            type="button"
            onClick={() => void submitTyped()}
            className="rounded-field bg-a1/90 px-4 text-sm font-medium active:bg-a1"
          >
            Gönder
          </button>
        </div>
      )}

      {phase === 'draft' && draft && (
        <div className="glass-card p-4">
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
            <button
              type="button"
              onClick={() => {
                setDraft(null)
                setPhase('idle')
              }}
              className="rounded-field bg-glass-inset px-4 py-2.5 text-sm text-ink-faint"
            >
              Vazgeç
            </button>
            <button
              type="button"
              onClick={() => void confirm()}
              disabled={lines.length === 0}
              className="flex-1 rounded-field bg-a1/90 py-2.5 text-sm font-medium active:bg-a1 disabled:opacity-50"
            >
              Kaydet
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
