import { useState } from 'react'

import { saveMeal } from '../lib/meals'
import { searchProducts, servingOf, type Product } from '../lib/products'

/**
 * Ambalajli urunu adiyla bulup gramajla kaydeder (PLAN-DIET S6 yerel katman).
 * Sayilar paket etiketinden gelir - fotograf tahmininin aksine kesin, `estimated`
 * bu yuzden false. Katalogda olmayan urun burada cikmaz: uydurmak yerine gorunmez.
 */
export function ProductPicker({ date, onSaved }: { date: string; onSaved?: () => void }) {
  const [query, setQuery] = useState('')
  const [picked, setPicked] = useState<Product | null>(null)
  const [grams, setGrams] = useState('')
  const [busy, setBusy] = useState(false)

  const hits = picked ? [] : searchProducts(query)
  const amount = grams === '' ? null : Number(grams)
  const serving = picked ? servingOf(picked, Number.isFinite(amount) ? amount : null) : null

  const pick = (product: Product) => {
    setPicked(product)
    setGrams(String(product.portion_g ?? 100))
  }

  const clear = () => {
    setPicked(null)
    setQuery('')
    setGrams('')
  }

  const save = async () => {
    if (!picked || !serving) return
    setBusy(true)
    try {
      await saveMeal(
        {
          protein_g: serving.protein_g,
          kcal: serving.kcal,
          note: `${amount ?? picked.portion_g} g ${picked.name}`,
          estimated: false,
          source: 'manual',
        },
        date,
      )
      clear()
      onSaved?.()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mb-3">
      <input
        value={picked ? `${picked.name} (${picked.brand})` : query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => picked && clear()}
        placeholder="Ürün ara (helva, nohut cipsi…)"
        className="w-full rounded-field bg-glass-inset px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-a1"
      />

      {hits.length > 0 && (
        <ul className="mt-1 space-y-1">
          {hits.map((p) => (
            <li key={`${p.brand}-${p.name}`}>
              <button
                type="button"
                onClick={() => pick(p)}
                className="w-full rounded-field bg-glass-inset px-3 py-2 text-left text-sm text-ink-dim"
              >
                {p.name} <span className="text-xs text-ink-faint">· {p.brand} · 100 g = {p.per100g.kcal} kcal, {p.per100g.protein_g} g protein</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {query.trim() !== '' && !picked && hits.length === 0 && (
        <p className="mt-1 text-xs text-ink-faint">Katalogda yok — paketin etiketini gönderirsen eklerim.</p>
      )}

      {picked && (
        <div className="mt-2 flex items-center gap-2">
          <input
            type="number"
            inputMode="numeric"
            value={grams}
            onChange={(e) => setGrams(e.target.value)}
            className="w-24 rounded-field bg-glass-inset px-3 py-2 text-center tabular-nums outline-none focus:ring-2 focus:ring-a1"
          />
          <span className="text-xs text-ink-faint">
            g{serving ? ` · ${serving.kcal} kcal · ${serving.protein_g} g protein` : ''}
          </span>
          <button
            type="button"
            onClick={() => void save()}
            disabled={busy || !serving}
            className="ml-auto rounded-field bg-a1/90 px-4 py-2.5 text-sm font-medium active:bg-a1 disabled:opacity-50"
          >
            Kaydet
          </button>
        </div>
      )}
    </div>
  )
}
