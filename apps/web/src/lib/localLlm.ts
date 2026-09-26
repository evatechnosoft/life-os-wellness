import { Capacitor, registerPlugin, type PluginListenerHandle } from '@capacitor/core'

import { splitReply } from '../../../api/src/persona'
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

/**
 * Modelin KV penceresi 1280 token (istem + yanit). Sunucunun personasi tek basina
 * ~7000 karakter - pencereyi asar ve MediaPipe hata atmadan sureci dusurur. Turkce
 * ~3 karakter/token: 2400 karakterlik istem ~800 token, yanita ~450 token kalir.
 */
export const MAX_PROMPT_CHARS = 2400
const MAX_LOCAL_CONTEXT = 1200
const MAX_LOCAL_TURNS = 4
const MAX_TURN_CHARS = 300
const MAX_LAST_CHARS = 500
export const LOCAL_NOTE = 'Sunucu kapalı, telefondaki model yanıtlıyor.'

/** Sunucu personasinin ozu: uslup, saglik siniri, kayit satiri. */
const LOCAL_SYSTEM = `Sen Eva'sın: Dean'in sağlık günlüğünde kısa, sıcak, emojisiz konuşan yardımcı. Kullanıcının kendi verisine dayan, bilmediğini söyle, uydurma.
Teşhis koyma, ilaç/doz önerme; göğüs ağrısı, nefes darlığı, bayılma, çarpıntıda hemen hekime yönlendir. Kısıtlama ya da öğün atlama önerme.
Kaydedilecek veri geçtiyse yanıtın sonuna tek satır ekle: <kayit>{"weight_kg":null,"protein_g":null,"kcal":null,"steps":null,"summary":"..."}</kayit>`

export type Turn = { role: 'user' | 'assistant'; content: string }

/**
 * Gemma'nin sistem rolu yok: persona + baglam ilk kullanici turune gomulur, gecmis
 * sohbet sablonuyla akar. Saf fonksiyon - test edilir, cihaz istemez.
 */
export function gemmaPrompt(context: string, turns: Turn[]): string {
  const recent = turns.slice(-MAX_LOCAL_TURNS).map((t, i, all) => ({
    ...t,
    content: t.content.slice(0, i === all.length - 1 ? MAX_LAST_CHARS : MAX_TURN_CHARS),
  }))
  const last = recent.at(-1)
  if (!last || last.role !== 'user') throw new Error('son tur kullanicinin olmali')
  const build = (ctx: string): string => {
    const head = `${LOCAL_SYSTEM}\n\nKullanıcının son günleri:\n${ctx}`
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
  // Baglam kalan butceyi alir: persona ve son soru hic kirpilmaz.
  const room = MAX_PROMPT_CHARS - build('').length
  return build(context.slice(0, Math.max(0, Math.min(MAX_LOCAL_CONTEXT, room))))
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
