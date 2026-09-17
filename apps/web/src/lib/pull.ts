/**
 * Asagi cekip birakinca yenileme (pull-to-refresh) mantigi. Saf fonksiyon: DOM
 * okumaz, olay dinlemez - bilesen parmagin nerede oldugunu soyler, karar burada
 * verilir ve test edilebilir kalir.
 *
 * evaitecOTA'daki desenle ayni: liste yukarida iken asagi cekilir, esik gecilince
 * birakildiginda taze veri istenir.
 */

/** Bu mesafeden sonra birakmak yenilemeyi tetikler (px). */
export const PULL_THRESHOLD = 72

/** Gostergenin inebilecegi en fazla mesafe; lastik gibi durur, sayfa kopmaz. */
export const PULL_MAX = 120

/**
 * Direnc: parmak 2 px inerken gosterge 1 px iniyor. Sayfa kaydirmasiyla ayni
 * hizda hareket etmek "ekran kaydi" hissi verir, cekme hissi vermez.
 */
const RESISTANCE = 0.5

export interface PullState {
  /** Gostergenin inecegi mesafe (px). */
  distance: number
  /** Esik gecildi: birakilirsa yenilenir. */
  armed: boolean
  /** Cekme suruyor - bu sirada sayfanin kendi kaydirmasi engellenir. */
  active: boolean
}

const IDLE: PullState = { distance: 0, armed: false, active: false }

/**
 * `startY` dokunusun basladigi nokta (dokunulmuyorsa null), `currentY` parmagin
 * su anki yeri, `scrollTop` kaydirilabilir alanin tepeden uzakligi.
 *
 * Yalniz **tepedeyken** ve **asagi dogru** cekildiginde calisir: sayfa ortasinda
 * yukari kaydirirken yenileme gostergesi cikmaz.
 */
export function pullFrom(startY: number | null, currentY: number, scrollTop: number): PullState {
  if (startY === null || scrollTop > 0) return IDLE
  const dragged = currentY - startY
  if (dragged <= 0) return IDLE
  const distance = Math.min(dragged * RESISTANCE, PULL_MAX)
  return { distance, armed: distance >= PULL_THRESHOLD, active: true }
}

/** Gostergenin metni. Cumleyi burada tutmak bileseni sunum disi mantiktan kurtariyor. */
export function pullLabel(state: PullState, refreshing: boolean): string {
  if (refreshing) return 'Yenileniyor…'
  if (state.armed) return 'Bırak, yenilensin'
  return 'Yenilemek için çek'
}
