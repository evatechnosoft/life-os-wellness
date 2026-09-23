import { Capacitor, registerPlugin, type PluginListenerHandle } from '@capacitor/core'

import { SYSTEM, splitReply } from '../../../api/src/persona'
import type { NoteDraft } from './voice'

/**
 * Cihaz-ici Eva'nin JS yuzu. Persona sunucuyla AYNI dosyadan (apps/api/src/persona.ts);
 * degisen yalniz modelin nerede kostugu. Yalniz APK'da var - web'de model yok, orada
 * kural tabanli offline.ts tek yedek.
 */

/** `persistent`: model /sdcard/evaitec/llm altinda, uygulama kaldirilinca silinmiyor. */
export type ModelStatus = { ready: boolean; sizeMb: number; persistent: boolean; canPersist: boolean }

/** Implemented in android/app/src/main/java/com/evaitec/wellness/LocalLlmPlugin.kt. */
const LocalLlm = registerPlugin<{
  status(): Promise<ModelStatus>
  download(): Promise<{ ok: boolean; status: string }>
  persist(): Promise<{ ok: boolean; status: string }>
  remove(): Promise<void>
  generate(opts: { prompt: string }): Promise<{ text: string }>
  addListener(event: 'modelDownload', fn: (e: { status: string }) => void): Promise<PluginListenerHandle>
}>('LocalLlm')

const isNative = (): boolean => Capacitor.isNativePlatform()

/** Modelin KV penceresi 1280 token; baglam sunucuya giden 4000 karakterin yarisiyla sinirli. */
const MAX_LOCAL_CONTEXT = 1800
const MAX_LOCAL_TURNS = 4
export const LOCAL_NOTE = 'Sunucu kapalı, telefondaki model yanıtlıyor.'

export type Turn = { role: 'user' | 'assistant'; content: string }

/**
 * Gemma'nin sistem rolu yok: persona + baglam ilk kullanici turune gomulur, gecmis
 * sohbet sablonuyla akar. Saf fonksiyon - test edilir, cihaz istemez.
 */
export function gemmaPrompt(context: string, turns: Turn[]): string {
  const recent = turns.slice(-MAX_LOCAL_TURNS)
  const last = recent.at(-1)
  if (!last || last.role !== 'user') throw new Error('son tur kullanicinin olmali')
  const head = `${SYSTEM}\n\nKullanıcının son günleri:\n${context.slice(0, MAX_LOCAL_CONTEXT)}`
  const body = recent
    .map((t, i) => {
      const role = t.role === 'user' ? 'user' : 'model'
      const text = i === 0 && t.role === 'user' ? `${head}\n\n${t.content}` : t.content
      return `<start_of_turn>${role}\n${text}<end_of_turn>`
    })
    .join('\n')
  const prefixed = recent[0]!.role === 'user' ? body : `<start_of_turn>user\n${head}<end_of_turn>\n${body}`
  return `${prefixed}\n<start_of_turn>model\n`
}

export async function localModelReady(): Promise<boolean> {
  if (!isNative()) return false
  try {
    return (await LocalLlm.status()).ready
  } catch {
    return false
  }
}

export async function localModelStatus(): Promise<ModelStatus | null> {
  if (!isNative()) return null
  return LocalLlm.status()
}

export async function downloadLocalModel(): Promise<{ ok: boolean; status: string }> {
  if (!isNative()) return { ok: false, status: 'Yalnız Android uygulamasında çalışır' }
  return LocalLlm.download()
}

/** Modeli kaldir-kur'dan kurtaran kalici klasore tasir; izin yoksa ayar ekranini acar. */
export async function persistLocalModel(): Promise<{ ok: boolean; status: string }> {
  if (!isNative()) return { ok: false, status: 'Yalnız Android uygulamasında çalışır' }
  return LocalLlm.persist()
}

export async function removeLocalModel(): Promise<void> {
  if (isNative()) await LocalLlm.remove()
}

export async function onModelDownload(listener: (status: string) => void): Promise<PluginListenerHandle | null> {
  if (!isNative()) return null
  return LocalLlm.addListener('modelDownload', ({ status }) => listener(status))
}

/** Telefondaki modelden yanit; <kayit> ayristirmasi sunucudakiyle ayni fonksiyon. */
export async function askLocal(context: string, turns: Turn[]): Promise<{ text: string; draft: NoteDraft | null }> {
  const { text } = await LocalLlm.generate({ prompt: gemmaPrompt(context, turns) })
  const parsed = splitReply(text)
  return { text: parsed.text, draft: parsed.draft as NoteDraft | null }
}
