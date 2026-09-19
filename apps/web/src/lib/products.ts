/**
 * Elle bakimli urun katalogu: paket etiketinden okunan degerler (PLAN-DIET S6'nin
 * yerel katmani). Barkod servisi (Open Food Facts) gelene kadar Dean'in evinde
 * duran, ambalajli ve tekrar tekrar yenen urunler burada durur.
 *
 * Buradaki sayilar TAHMIN DEGIL, etiketten okunmustur - modele oyle gider.
 * Yeni urun: `src/data/products.json` dosyasina 100 g degerleriyle eklenir.
 */
import catalog from '../data/products.json'
import { foldTr } from './nutrition'

export interface ProductNutrients {
  kcal: number
  protein_g: number
  fat_g: number
  carb_g: number
  sugar_g: number
  fibre_g: number
  salt_g: number
}

export interface Product {
  name: string
  brand: string
  /** Paketin kendi porsiyonu, etikette varsa. */
  portion_g?: number
  per100g: ProductNutrients
}

export const PRODUCTS: Product[] = catalog as Product[]

function words(text: string): string[] {
  return foldTr(text)
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 2)
}

/**
 * Serbest metinde urun arar ("aksam 40 g fistikli helva yedim"). Eslesme icin en az
 * iki kelime tutmali: tek kelime ("helva") farkli bir urunu yanlis fiyatlandirir.
 */
export function findProduct(text: string): Product | null {
  const said = new Set(words(text))
  if (said.size === 0) return null
  let best: { product: Product; score: number } | null = null
  for (const product of PRODUCTS) {
    const keys = [...words(product.name), ...words(product.brand)]
    const score = keys.filter((k) => said.has(k)).length
    if (score >= 2 && (!best || score > best.score)) best = { product, score }
  }
  return best?.product ?? null
}


/**
 * Arama kutusu icin: yazilanin gectigi her urun. `findProduct`tan farki, tek bir
 * kelime de yeter - kullanici listeden kendi secer, yanlis eslesme riski yok.
 */
export function searchProducts(query: string): Product[] {
  const terms = words(query)
  if (terms.length === 0) return []
  return PRODUCTS.filter((p) => {
    const hay = `${foldTr(p.name)} ${foldTr(p.brand)}`
    return terms.every((t) => hay.includes(t))
  })
}

/** Gramajdan kcal/protein. Gramaj yoksa paketin kendi porsiyonu, o da yoksa null. */
export function servingOf(product: Product, grams: number | null): { kcal: number; protein_g: number } | null {
  const g = grams ?? product.portion_g ?? null
  if (g == null) return null
  const ratio = g / 100
  return {
    kcal: Math.round(product.per100g.kcal * ratio),
    protein_g: Math.round(product.per100g.protein_g * ratio),
  }
}

/** Modele giden katalog satirlari: Eva bu urunler icin porsiyonu bastan sormasin. */
export function productLines(): string[] {
  const lines = ['elindeki ambalajlı ürünler (paket etiketinden, tahmin değil):']
  for (const p of PRODUCTS) {
    const per = p.per100g
    const serving = p.portion_g != null ? servingOf(p, p.portion_g) : null
    const portion = serving ? ` · porsiyon ${p.portion_g} g = ${serving.kcal} kcal, ${serving.protein_g} g protein` : ''
    lines.push(
      `${p.name} (${p.brand}): 100 g = ${per.kcal} kcal, ${per.protein_g} g protein, ${per.fat_g} g yağ, ${per.carb_g} g karbonhidrat (${per.sugar_g} g şeker), ${per.fibre_g} g lif, ${per.salt_g} g tuz${portion}`,
    )
  }
  return lines
}
