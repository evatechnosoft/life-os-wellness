import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useRef, useState } from 'react'

import { acceptDraft, ask } from '../lib/chat'
import { db, type ChatMessage } from '../lib/db'
import { isNative } from '../lib/health'
import { capturePhoto } from '../lib/meals'
import { listenOnce, stopListening, voiceAvailable } from '../lib/voice'
import { Avatar } from './Avatar'

/**
 * Eva ile konusma. Tek yol: hem Bugun ekranindaki kisa hali (compact) hem Eva
 * sekmesi ayni gecmisi, ayni ucu ve ayni onay kapisini kullanir. Ikisi ayri
 * istemciyken Bugun'dekinin gecmisi yoktu ve kaydettigi sey Notlar'a dusmuyordu.
 */
export function Eva({ compact = false }: { compact?: boolean }) {
  const all = useLiveQuery(() => db.chat.orderBy('id').toArray(), []) ?? []
  const messages = compact ? all.slice(-4) : all
  const [typed, setTyped] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const [canSpeak, setCanSpeak] = useState(false)
  const bottom = useRef<HTMLDivElement>(null)

  useEffect(() => {
    void voiceAvailable().then(setCanSpeak).catch(() => setCanSpeak(false))
  }, [])

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages.length, busy])

  const send = async (text: string, via: 'text' | 'voice' | 'photo', image?: Blob) => {
    if (text.trim() === '' && !image) return
    setBusy('yanıt')
    try {
      await ask(text.trim(), { via, image })
    } finally {
      setBusy(null)
    }
  }

  const speak = async () => {
    setBusy('dinleme')
    try {
      const heard = await listenOnce()
      setBusy('yanıt')
      await ask(heard, { via: 'voice' })
    } catch {
      // izin verilmedi ya da bir sey duyulmadi; dugme bosta kalir
    } finally {
      setBusy(null)
    }
  }

  const photo = async () => {
    setBusy('foto')
    try {
      const blob = await capturePhoto()
      setBusy('yanıt')
      await ask('Bu ne kadar protein ve kalori?', { via: 'photo', image: blob })
    } catch {
      // vazgecildi
    } finally {
      setBusy(null)
    }
  }

  const submit = () => {
    const text = typed
    setTyped('')
    void send(text, 'text')
  }

  return (
    <div className={compact ? 'flex flex-col' : 'flex min-h-[70dvh] flex-col'}>
      <div className={compact ? 'max-h-[42vh] space-y-4 overflow-y-auto pr-1' : 'flex-1 space-y-5'}>
        {all.length === 0 && (
          <div className={`flex items-center gap-4 ${compact ? '' : 'pt-6'}`}>
            <Avatar size={compact ? 28 : undefined} />
            <p className="text-sm leading-snug text-ink-dim">
              {compact
                ? 'Ne yaptığını yaz ya da söyle, ben günlüğe geçireyim.'
                : 'Sor, anlat ya da tabağının fotoğrafını göster. Son bir haftanın verisi elimde, cevaplar ona göre olur.'}
            </p>
          </div>
        )}

        {messages.map((m: ChatMessage) =>
          m.role === 'eva' ? (
            <div key={m.id} className="flex gap-3">
              <div className="pt-0.5">
                <Avatar size={28} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{m.text}</p>

                {m.sources && m.sources.length > 0 && (
                  <ul className="mt-2 space-y-0.5">
                    {m.sources.map((s) => (
                      <li key={s.url} className="truncate text-xs">
                        <a href={s.url} target="_blank" rel="noreferrer" className="text-a1 underline-offset-2 hover:underline">
                          {s.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}

                {m.draft != null && !m.applied && (
                  <button
                    type="button"
                    onClick={() => void acceptDraft(m)}
                    className="mt-2 min-h-11 rounded-field bg-a1/90 px-4 text-xs font-medium text-solid active:bg-a1"
                  >
                    Günlüğe kaydet
                  </button>
                )}
                {m.applied && m.applied.length > 0 && (
                  <p className="mt-2 text-xs text-a1">kaydedildi · {m.applied.join(' · ')}</p>
                )}
              </div>
            </div>
          ) : (
            <div key={m.id} className="pl-10 text-right">
              <p className="whitespace-pre-wrap text-sm text-ink-dim">{m.text}</p>
              <span className="text-[10px] text-ink-faint">
                {m.at}
                {m.via === 'voice' ? ' · sesli' : m.via === 'photo' ? ' · fotoğraf' : ''}
              </span>
            </div>
          ),
        )}

        {busy && (
          <div className="flex items-center gap-3">
            <Avatar size={28} listening={busy === 'dinleme'} />
            <span className="text-xs text-ink-faint">
              {busy === 'dinleme' ? 'dinliyorum…' : busy === 'foto' ? 'kamera…' : 'düşünüyorum…'}
            </span>
          </div>
        )}
        <div ref={bottom} />
      </div>

      <div
        className={`mt-4 flex gap-2 rounded-pill border border-edge-soft bg-glass p-1.5 backdrop-blur ${
          compact ? '' : 'sticky bottom-20'
        }`}
      >
        <input
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder={compact ? 'Bugün ne yaptın?' : 'Yaz…'}
          className="min-w-0 flex-1 bg-transparent px-3 text-sm outline-none"
        />
        {isNative() && (
          <button
            type="button"
            onClick={() => void photo()}
            disabled={busy !== null}
            aria-label="Fotoğraf"
            className="size-11 rounded-pill bg-glass-strong text-xs disabled:opacity-50"
          >
            foto
          </button>
        )}
        {canSpeak && (
          <button
            type="button"
            onClick={() => (busy === 'dinleme' ? void stopListening() : void speak())}
            disabled={busy !== null && busy !== 'dinleme'}
            aria-label={busy === 'dinleme' ? 'Dinlemeyi durdur' : 'Konuş'}
            className={`size-11 rounded-pill disabled:opacity-50 ${busy === 'dinleme' ? 'bg-a3/90' : 'bg-a1/90'}`}
          >
            {busy === 'dinleme' ? '■' : '●'}
          </button>
        )}
        {typed.trim() !== '' && (
          <button type="button" onClick={submit} className="rounded-pill bg-a1/90 px-4 text-sm font-medium text-solid">
            Gönder
          </button>
        )}
      </div>
    </div>
  )
}
