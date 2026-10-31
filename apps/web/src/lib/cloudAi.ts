import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check'
import { getAI, getGenerativeModel, GoogleAIBackend, type GenerativeModel, type Part } from 'firebase/ai'

import { firebaseApp } from './firebaseApp'
import { featureOn } from './remoteFlags'
import { SYSTEM, splitReply } from '../../../api/src/persona'
import type { NoteDraft } from './voice'

/**
 * Sunucu kapaliyken bulut yedegi: Firebase AI Logic (Gemini Developer API), App Check
 * (reCAPTCHA Enterprise) korumali. Zincir: sunucu → burasi → cihaz-ici model → kural motoru.
 *
 * Spark (ucretsiz) katman: Google veriyi urun gelistirmede kullanabilir. Dean saglik
 * verisiyle gondermeyi 27 Eyl 2026'da kabul etti; Blaze'e gecilirse bu not silinir.
 */
const RECAPTCHA_SITE_KEY = '6LfkUdItAAAAAOflaE2kn-itI9CqeVJUex56P152'
/** Sunucudaki LiteLLM ile ayni model: iki yol ayni Eva gibi konussun. */
const MODEL = 'gemini-2.5-flash'
const TIMEOUT_MS = 25_000
export const CLOUD_NOTE = 'Sunucu kapalı, bulut yedeği yanıtlıyor.'

let model: GenerativeModel | null = null

function cloudModel(): GenerativeModel {
  if (model) return model
  const app = firebaseApp()
  initializeAppCheck(app, { provider: new ReCaptchaEnterpriseProvider(RECAPTCHA_SITE_KEY), isTokenAutoRefreshEnabled: true })
  model = getGenerativeModel(getAI(app, { backend: new GoogleAIBackend() }), {
    model: MODEL,
    systemInstruction: SYSTEM,
  })
  return model
}

export type CloudTurn = { role: 'user' | 'assistant'; content: string }

/**
 * Buluttan yanit; ag yoksa, kota/App Check reddinde ya da zaman asiminda null -
 * cagiran cihaz-ici zincire duser. `<kayit>` ayristirmasi sunucuyla ayni fonksiyon.
 */
export async function askCloud(
  context: string,
  turns: CloudTurn[],
  image?: { mimeType: string; data: string },
): Promise<{ text: string; draft: NoteDraft | null } | null> {
  if (!featureOn('cloud_ai')) return null
  if (typeof navigator !== 'undefined' && !navigator.onLine) return null
  const last = turns.at(-1)
  if (!last || last.role !== 'user') return null
  try {
    const chat = cloudModel().startChat({
      history: [
        { role: 'user', parts: [{ text: `Kullanıcının son günleri:\n${context}` }] },
        { role: 'model', parts: [{ text: 'Tamam, bu veriye dayanarak cevap vereceğim.' }] },
        ...turns.slice(0, -1).map((t) => ({
          role: t.role === 'user' ? ('user' as const) : ('model' as const),
          parts: [{ text: t.content }],
        })),
      ],
    })
    const parts: Part[] = [{ text: last.content }]
    if (image) parts.push({ inlineData: image })
    const result = await Promise.race([
      chat.sendMessage(parts),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('zaman asimi')), TIMEOUT_MS)),
    ])
    const parsed = splitReply(result.response.text())
    return { text: parsed.text, draft: parsed.draft as NoteDraft | null }
  } catch (error) {
    console.warn('askCloud', error)
    return null
  }
}
