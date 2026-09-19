import { useEffect, useState } from 'react'

import { db } from '../lib/db'
import { alternatives, type Exercise as Ex, regionsFor, type Regions, roleOf, type Spot } from '../lib/exercises'

/**
 * Gecis ve bekleme. Uzun gecis + kisa bekleme, iki karede bile akici okunuyor;
 * kaynak veri setinde hareket basina iki kare var (873/876), fazlasi gelirse
 * `media` dizisi uzar ve burasi degismeden calisir.
 */
const FADE_MS = 1400
const HOLD_MS = 2200

/**
 * Uzak kareleri bir kez indirip IndexedDB'ye yazar, sonra hep oradan okur.
 * Tek efekt, dizi halinde: hareket degisince kare sayisi da degisebiliyor,
 * kare basina ayri hook cagirmak React'in kural ihlali olurdu.
 * Inmeyen kare null kalir - cagiran aciklama metnine duser.
 */
function useCachedImages(urls: string[]): (string | null)[] {
  const key = urls.join('|')
  const [srcs, setSrcs] = useState<(string | null)[]>(() => urls.map(() => null))

  useEffect(() => {
    const list = key === '' ? [] : key.split('|')
    const objectUrls: string[] = []
    let alive = true
    setSrcs(list.map(() => null))

    const one = async (url: string, i: number): Promise<void> => {
      const hit = await db.exercise_media.get(url).catch(() => undefined)
      let blob = hit?.blob
      if (blob === undefined) {
        const res = await fetch(url).catch(() => null)
        if (res === null || !res.ok) return
        blob = await res.blob()
        // Yazma basarisiz olsa da (kota dolu) gorsel gosterilir, sadece kalici olmaz.
        await db.exercise_media.put({ url, blob, cached_at: new Date().toISOString() }).catch(() => {})
      }
      if (!alive) return
      const objectUrl = URL.createObjectURL(blob)
      objectUrls.push(objectUrl)
      setSrcs((prev) => prev.map((v, j) => (j === i ? objectUrl : v)))
    }

    void Promise.all(list.map(one))
    return () => {
      alive = false
      for (const u of objectUrls) URL.revokeObjectURL(u)
    }
  }, [key])

  return srcs
}

const REGION_LABEL: Record<string, string> = {
  gogus: 'göğüs',
  sirt: 'sırt',
  bel: 'bel',
  omuz: 'omuz',
  kol: 'kol',
  onkol: 'önkol',
  karin: 'karın',
  onBacak: 'ön bacak',
  arkaBacak: 'arka bacak',
  kalca: 'kalça',
  baldir: 'baldır',
  boyun: 'boyun',
}

/** Ortak uzuvlar: iki gorunumde de ayni yerde duruyor. */
const LIMBS: [string, string][] = [
  ['omuz', 'M31 37a9 8 0 0 1 14 0l-1 9-13 1zM89 37a9 8 0 0 0-14 0l1 9 13 1z'],
  ['kol', 'M30 47h10a2 2 0 0 1 2 2v24a2 2 0 0 1-2 2H30a2 2 0 0 1-2-2V49a2 2 0 0 1 2-2zM80 47h10a2 2 0 0 1 2 2v24a2 2 0 0 1-2 2H80a2 2 0 0 1-2-2V49a2 2 0 0 1 2-2z'],
  ['onkol', 'M29 78h9a2 2 0 0 1 2 2v22a2 2 0 0 1-2 2h-9a2 2 0 0 1-2-2V80a2 2 0 0 1 2-2zM82 78h9a2 2 0 0 1 2 2v22a2 2 0 0 1-2 2h-9a2 2 0 0 1-2-2V80a2 2 0 0 1 2-2z'],
]

const FRONT: [string, string][] = [
  ['gogus', 'M46 36h28a3 3 0 0 1 3 3v17a3 3 0 0 1-3 3H46a3 3 0 0 1-3-3V39a3 3 0 0 1 3-3z'],
  ['karin', 'M51 60h18a2 2 0 0 1 2 2v26a2 2 0 0 1-2 2H51a2 2 0 0 1-2-2V62a2 2 0 0 1 2-2z'],
  ['kalca', 'M46 92h28a3 3 0 0 1 3 3v11a3 3 0 0 1-3 3H46a3 3 0 0 1-3-3V95a3 3 0 0 1 3-3z'],
  ['onBacak', 'M47 111h11a2 2 0 0 1 2 2v34a2 2 0 0 1-2 2H47a2 2 0 0 1-2-2v-34a2 2 0 0 1 2-2zM62 111h11a2 2 0 0 1 2 2v34a2 2 0 0 1-2 2H62a2 2 0 0 1-2-2v-34a2 2 0 0 1 2-2z'],
  ['baldir', 'M48 151h9a2 2 0 0 1 2 2v26a2 2 0 0 1-2 2h-9a2 2 0 0 1-2-2v-26a2 2 0 0 1 2-2zM63 151h9a2 2 0 0 1 2 2v26a2 2 0 0 1-2 2h-9a2 2 0 0 1-2-2v-26a2 2 0 0 1 2-2z'],
]

const BACK: [string, string][] = [
  ['sirt', 'M46 36h28a3 3 0 0 1 3 3v21a3 3 0 0 1-3 3H46a3 3 0 0 1-3-3V39a3 3 0 0 1 3-3z'],
  ['bel', 'M50 65h20a2 2 0 0 1 2 2v20a2 2 0 0 1-2 2H50a2 2 0 0 1-2-2V67a2 2 0 0 1 2-2z'],
  ['kalca', 'M45 92h30a4 4 0 0 1 4 4v12a4 4 0 0 1-4 4H45a4 4 0 0 1-4-4V96a4 4 0 0 1 4-4z'],
  ['arkaBacak', 'M47 114h11a2 2 0 0 1 2 2v32a2 2 0 0 1-2 2H47a2 2 0 0 1-2-2v-32a2 2 0 0 1 2-2zM62 114h11a2 2 0 0 1 2 2v32a2 2 0 0 1-2 2H62a2 2 0 0 1-2-2v-32a2 2 0 0 1 2-2z'],
  ['baldir', 'M48 152h9a2 2 0 0 1 2 2v25a2 2 0 0 1-2 2h-9a2 2 0 0 1-2-2v-25a2 2 0 0 1 2-2zM63 152h9a2 2 0 0 1 2 2v25a2 2 0 0 1-2 2h-9a2 2 0 0 1-2-2v-25a2 2 0 0 1 2-2z'],
]

function fill(region: string, r: Regions): string {
  if (r.primary.includes(region)) return 'fill-work stroke-work'
  if (r.support.includes(region)) return 'fill-assist stroke-assist'
  return 'fill-glass-strong stroke-edge-soft'
}

// ponytail: figur kaba - bolgeyi gosteriyor ama anatomik degil. Dean "sonra
// iyilestiririz" dedi; fotograf uzeri vurgu (Tint) asil gosterge, bu onun yedegi.
// Yukseltme yolu: her bolge icin gercek kas silueti, ya da figuru tumden kaldirip
// tum hareketlerin karelerine focus koordinati girmek.
function BodyMap({ regions, view }: { regions: Regions; view: 'front' | 'back' }) {
  const parts = [...(view === 'front' ? FRONT : BACK), ...LIMBS]
  return (
    <figure className="flex flex-col items-center gap-1">
      <svg viewBox="0 0 120 190" className="h-auto w-full max-w-14" role="img" aria-label={`${view === 'front' ? 'Önden' : 'Arkadan'} çalışan bölgeler`}>
        <circle cx="60" cy="14" r="10" className="fill-glass-strong stroke-edge-soft" strokeWidth="0.6" />
        <rect x="55" y="24" width="10" height="7" className="fill-glass-strong stroke-edge-soft" strokeWidth="0.6" />
        {parts.map(([region, d]) => (
          <path key={region} d={d} className={fill(region, regions)} strokeWidth="0.6" />
        ))}
        {/* Yuk katmani en uste, dolgusuz: ayni bolge hem destek hem yuk noktasi olabilir. */}
        {parts
          .filter(([region]) => regions.load.includes(region))
          .map(([region, d]) => (
            <path key={`load-${region}`} d={d} className="fill-none stroke-load" strokeWidth="2" strokeDasharray="3 2.5" />
          ))}
      </svg>
      <figcaption className="text-[10px] uppercase tracking-wider text-ink-faint">
        {view === 'front' ? 'Ön' : 'Arka'}
      </figcaption>
    </figure>
  )
}

const TINT: Record<'work' | 'assist' | 'load', string> = {
  work: 'var(--color-work)',
  assist: 'var(--color-assist)',
  load: 'var(--color-load)',
}

/**
 * Vurgu dogrudan fotografin uzerine dusuyor: vucut zaten karede, ikinci bir
 * figur cizmek yerine calisan yeri boyamak daha dogru okunuyor.
 * `far` olan bolge (onden cekilmis karede bel gibi) govdenin arkasinda kaliyor,
 * yari opaklikla ciziliyor - orada oldugu bilinsin ama one cikmasin.
 */
function Tint({ spots, regions }: { spots: Spot[]; regions: Regions }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 mix-blend-screen">
      {spots.map((s) => {
        const role = roleOf(s.region, regions)
        if (role === null) return null
        return (
          <span
            key={`${s.region}-${s.x}-${s.y}`}
            className="absolute rounded-full"
            style={{
              left: `${s.x - s.r}%`,
              top: `${s.y - s.r}%`,
              width: `${s.r * 2}%`,
              height: `${s.r * 2}%`,
              background: `radial-gradient(circle, ${TINT[role]} 0%, transparent 72%)`,
              opacity: s.far === true ? 0.3 : 0.62,
            }}
          />
        )
      })}
    </div>
  )
}

/**
 * Kare adi. Iki karede "basla/bitir" dogru; uc ve fazlasinda ortadakiler ara
 * pozisyondur, numarayla anilir - "orta" demek dorduncu karede yalan olurdu.
 */
function frameLabel(index: number, total: number): string {
  if (index === 0) return 'Başlangıç'
  if (index === total - 1) return 'Bitiş'
  return `Ara ${index}`
}

function Frames({ ex, regions }: { ex: Ex; regions: Regions }) {
  const [at, setAt] = useState(0)
  const [playing, setPlaying] = useState(!window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const urls = ex.media.map((m) => m.url)
  const srcs = useCachedImages(urls)
  const total = urls.length

  useEffect(() => {
    if (!playing || total < 2) return
    // Ileri-geri: hareket basa sarmiyor, geldigi yoldan donuyor. Dort karede
    // 0-1-2-3-2-1 seklinde akiyor, bu yuzden dizi uzunlugu degil 2*(n-1) periyot.
    const period = 2 * (total - 1)
    let step = 0
    const id = window.setInterval(() => {
      step = (step + 1) % period
      setAt(step < total ? step : period - step)
    }, HOLD_MS)
    return () => window.clearInterval(id)
  }, [playing, total])

  // Kare inmediyse resim yerine bosluk degil, aciklama gosterilir (offline-first).
  if (srcs[0] === null || srcs[0] === undefined) {
    return (
      <p className="rounded-field bg-glass-inset p-3 text-xs text-ink-faint">
        Görsel henüz inmedi. Ağ gelince bir kez iner, sonra çevrimdışı da açılır.
      </p>
    )
  }

  const shown = srcs[at] ?? srcs[0]

  return (
    <div>
      <div className="relative aspect-video overflow-hidden rounded-field border border-edge-soft bg-bg-deep">
        {srcs.map((src, i) =>
          src === null ? null : (
            <img
              key={urls[i]}
              src={src}
              alt={`${ex.name} — ${frameLabel(i, total)}`}
              className="absolute inset-0 size-full object-cover transition-opacity ease-in-out"
              style={{ opacity: src === shown ? 1 : 0, transitionDuration: `${FADE_MS}ms` }}
            />
          ),
        )}
        {ex.focus[at] !== undefined && <Tint spots={ex.focus[at]!} regions={regions} />}
        <span className="absolute bottom-2 left-2 rounded-pill border border-edge bg-bg-deep/70 px-2.5 py-1 text-[10px] uppercase tracking-wider backdrop-blur">
          {frameLabel(at, total)}
          {total > 2 && <span className="ml-1 text-ink-faint">{at + 1}/{total}</span>}
        </span>
      </div>
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          onClick={() => setPlaying((v) => !v)}
          aria-pressed={playing}
          className="min-h-11 rounded-field bg-glass-strong px-4 text-sm"
        >
          {playing ? 'Duraklat' : 'Oynat'}
        </button>
        <button
          type="button"
          onClick={() => setAt((v) => (v + 1) % total)}
          className="min-h-11 rounded-field bg-glass-strong px-4 text-sm"
        >
          Kareyi değiştir
        </button>
      </div>
    </div>
  )
}

/**
 * Tek hareketin karti: iki kare gecisli gorsel, renk kodlu vucut haritasi,
 * talimat ve yuk uyarisi. Renk tek basina bilgi tasimaz - her bolgenin
 * yazili karsiligi da basilir (PLAN-COACH S2).
 */
export function Exercise({ ex, onPick }: { ex: Ex; onPick?: (id: string) => void }) {
  const regions = regionsFor(ex)
  const alts = alternatives(ex.id, { equipment: ['machine', 'dumbbell', 'cable', 'body only'] }).slice(0, 4)

  const chips = (regionList: string[], tone: string) =>
    regionList.map((r) => (
      <span key={`${tone}-${r}`} className={`rounded-pill border px-2.5 py-1 text-xs ${tone}`}>
        {REGION_LABEL[r] ?? r}
      </span>
    ))

  return (
    <article className="glass-card mt-3 p-5">
      <header className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 className="text-lg font-semibold tracking-tight">{ex.name}</h2>
        <span className="text-xs text-ink-faint">{ex.name_en}</span>
        <span className="ml-auto rounded-pill border border-a2 px-2.5 py-1 text-[10px] uppercase tracking-wider text-ink-dim">
          {ex.equipment_tr}
        </span>
      </header>

      <div className="mt-4 flex flex-col gap-3">
        <Frames ex={ex} regions={regions} />
        <div className="flex items-start gap-3">
          {/* Figur fotograftaki vurgunun yedegi: kare boyanmadiysa tek gosterge o. */}
          <div className="flex shrink-0 gap-0.5">
            <BodyMap regions={regions} view="front" />
            <BodyMap regions={regions} view="back" />
          </div>
          <div className="flex flex-1 flex-wrap gap-1.5">
            {chips(regions.primary, 'border-work/45 text-work')}
            {chips(regions.support, 'border-assist/45 text-assist')}
            {chips(regions.load, 'border-load/45 text-load')}
          </div>
        </div>
      </div>

      <ol className="mt-4 flex list-decimal flex-col gap-2 pl-5 text-sm text-ink-dim marker:text-ink-faint">
        {ex.instructions.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ol>

      {ex.cue !== '' && (
        <p className="mt-4 border-l-2 border-load pl-3 text-sm text-ink-dim">
          <b className="font-semibold text-ink">Dikkat:</b> {ex.cue}
        </p>
      )}

      {alts.length > 0 && onPick !== undefined && (
        <div className="mt-4">
          <p className="mb-2 text-xs uppercase tracking-wide text-ink-faint">Makine doluysa</p>
          <div className="flex flex-wrap gap-1.5">
            {alts.map((alt) => (
              <button
                key={alt.id}
                type="button"
                onClick={() => onPick(alt.id)}
                className="rounded-pill bg-glass-strong px-3 py-1.5 text-xs text-ink-dim"
              >
                {alt.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </article>
  )
}
