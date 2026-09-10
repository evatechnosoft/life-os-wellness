import { useEffect, useState } from 'react'

import { applyDraft, draftLines, listenOnce, understand, voiceAvailable, type NoteDraft } from '../lib/voice'
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

  useEffect(() => {
    void voiceAvailable().then(setAvailable).catch(() => setAvailable(false))
  }, [])

  const listen = async () => {
    setError(null)
    setDraft(null)
    setPhase('listening')
    try {
      const text = await listenOnce()
      setHeard(text)
      setPhase('thinking')
      const understood = await understand(text)
      if (!understood) {
        setError('Anlama servisi kapalı — Ayar ekranından sunucu token’ı girmen gerekiyor.')
        setPhase('idle')
        return
      }
      setDraft(understood)
      setPhase('draft')
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setPhase('idle')
    }
  }

  const confirm = async () => {
    if (!draft) return
    await applyDraft(draft, date)
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
        {available && phase !== 'draft' && (
          <button
            type="button"
            onClick={() => void listen()}
            disabled={phase === 'listening' || phase === 'thinking'}
            aria-label="Sesli not"
            className="size-12 shrink-0 rounded-pill bg-a1/90 text-lg active:bg-a1 disabled:opacity-50"
          >
            ●
          </button>
        )}
      </div>

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
