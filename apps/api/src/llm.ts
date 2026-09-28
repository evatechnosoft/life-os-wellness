import OpenAI from 'openai'

/**
 * Everything model-shaped goes through the home AI gateway (ZimaOS yz-litellm, netmovies
 * repo infra/yz), never straight to a vendor. The gateway owns the provider keys; this app
 * holds only its own virtual key, an OpenAI-compatible base URL and a model name:
 *   gemini-flash   conversation, vision, web search (falls back to gemini -> yerel)
 */
export interface LlmConfig {
  baseUrl: string
  apiKey: string
  chatModel: string
  visionModel: string
}

export type Llm = { client: OpenAI; config: LlmConfig }

/** Null when the proxy is not configured - callers answer 503 and the app falls back. */
export function createLlm(env: NodeJS.ProcessEnv = process.env): Llm | null {
  const baseUrl = env.LLM_BASE_URL
  if (!baseUrl) return null
  const config: LlmConfig = {
    baseUrl,
    // This app's virtual key on the gateway.
    apiKey: env.LLM_API_KEY ?? '',
    chatModel: env.LLM_CHAT_MODEL ?? 'gemini-flash',
    visionModel: env.LLM_VISION_MODEL ?? env.LLM_CHAT_MODEL ?? 'gemini-flash',
  }
  return {
    // maxRetries: 0 - 429'un sebebi dakikalik saglayici kotasi; SDK'nin otomatik
    // yeniden denemesi kotayi iki katina cikarip kullaniciyi bir o kadar bekletiyordu.
    client: new OpenAI({ baseURL: config.baseUrl, apiKey: config.apiKey, maxRetries: 0, timeout: 120_000 }),
    config,
  }
}

export interface ChatTurn {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface ImagePart {
  media_type: string
  data: string
}

export interface Source {
  /** Kaynak sayfanin kapak resmi (og:image) - yalniz tarif aramasinda doldurulur. */
  image?: string
  title: string
  url: string
}

export interface Completion {
  text: string
  /** Pages the model actually grounded on. Empty unless `search` was asked for. */
  sources: Source[]
}

/**
 * The OpenAI-standard way to ask for grounded answers. LiteLLM maps it onto whatever the
 * provider behind the alias offers - Gemini's own Google Search for us - so turning search
 * on stays a proxy concern and this file keeps knowing nothing about vendors.
 */
type SearchOption = { web_search_options: Record<string, never> }

/** Citations come back OpenAI-shaped; the SDK's message type does not carry them yet. */
interface Annotated {
  annotations?: { type?: string; url_citation?: { url?: string; title?: string } }[]
}

/** One completion. An image, when given, is attached to the last user turn. */
export async function complete(
  llm: Llm,
  turns: ChatTurn[],
  opts: { model?: string; image?: ImagePart; maxTokens?: number; search?: boolean } = {},
): Promise<Completion> {
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = turns.map((t) => ({
    role: t.role,
    content: t.content,
  }))

  if (opts.image) {
    const lastUser = [...messages].reverse().find((m) => m.role === 'user')
    if (lastUser && lastUser.role === 'user') {
      const text = typeof lastUser.content === 'string' ? lastUser.content : ''
      lastUser.content = [
        { type: 'text', text },
        { type: 'image_url', image_url: { url: `data:${opts.image.media_type};base64,${opts.image.data}` } },
      ]
    }
  }

  const search: SearchOption | Record<string, never> = opts.search ? { web_search_options: {} } : {}

  const response = await llm.client.chat.completions.create({
    model: opts.model ?? llm.config.chatModel,
    max_tokens: opts.maxTokens ?? 1500,
    messages,
    ...search,
  })

  const message = response.choices[0]?.message
  const annotated = collectSources((message as Annotated | undefined)?.annotations)
  return {
    text: message?.content ?? '',
    sources: annotated.length > 0
      ? annotated
      : groundingSources((response as Grounded).vertex_ai_grounding_metadata),
  }
}

/**
 * LiteLLM, Gemini aramasinin kaynaklarini OpenAI annotations'a cevirmiyor; yanitin ust
 * seviyesinde `vertex_ai_grounding_metadata` olarak birakiyor (24 Eyl canli yanit). Bu alan
 * okunmayinca arama yapilip kaynak listesi hep bos donuyordu.
 */
interface Grounded {
  vertex_ai_grounding_metadata?: {
    webSearchQueries?: string[]
    groundingChunks?: { web?: { uri?: string; title?: string } }[]
  }[]
}

export function groundingSources(meta: Grounded['vertex_ai_grounding_metadata']): Source[] {
  return collectSources(
    (meta ?? []).flatMap((m) => m.groundingChunks ?? []).map((c) => ({
      type: 'url_citation',
      url_citation: { url: c.web?.uri, title: c.web?.title },
    })),
  )
}

/** Keeps the first mention of each URL, drops citations without one. */
export function collectSources(annotations: Annotated['annotations']): Source[] {
  if (!annotations) return []
  const seen = new Set<string>()
  const sources: Source[] = []
  for (const a of annotations) {
    const url = a.url_citation?.url
    if (!url || seen.has(url)) continue
    seen.add(url)
    sources.push({ title: a.url_citation?.title?.trim() || hostOf(url), url })
  }
  return sources
}

/** A citation without a title still deserves a readable label. */
function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}
