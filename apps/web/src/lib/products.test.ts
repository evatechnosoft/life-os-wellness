import { describe, expect, it } from 'vitest'

import { PRODUCTS, findProduct, productLines, servingOf } from './products'

describe('findProduct', () => {
  it('Turkce harf ve buyuk-kucuk farkini yok sayar', () => {
    expect(findProduct('FISTIKLI TAHIN HELVASI')?.name).toBe('fıstıklı tahin helvası')
    expect(findProduct('kakaolu tahin helvasi')?.name).toBe('kakaolu tahin helvası')
  })
  it('cumlenin icinde gecen urun adini yakalar', () => {
    expect(findProduct('akşam 40 g fıstıklı tahin helvası yedim')?.brand).toBe('Servet')
  })
  it('marka adiyla da bulunur', () => {
    expect(findProduct('züber nohut cipsi')?.name).toBe('fırında nohut cipsi')
  })
  it('katalogda olmayan sey null doner - benzerine yuvarlanmaz', () => {
    expect(findProduct('sade helva')).toBeNull()
    expect(findProduct('')).toBeNull()
  })
})

describe('servingOf', () => {
  it('gramaji 100 g degerinden olcekler', () => {
    const p = findProduct('fıstıklı tahin helvası')!
    expect(servingOf(p, 50)).toEqual({ kcal: 300, protein_g: 7 })
  })
  it('gramaj verilmezse urunun kendi porsiyonunu kullanir', () => {
    const chips = findProduct('nohut cipsi')!
    expect(servingOf(chips, null)).toEqual({ kcal: 115, protein_g: 4 })
  })
  it('porsiyonu olmayan urunde gramajsiz sayi uretmez', () => {
    expect(servingOf(findProduct('kakaolu tahin helvası')!, null)).toBeNull()
  })
})

describe('productLines', () => {
  it('her urun icin 100 g degerlerini tek satirda verir', () => {
    const text = productLines().join('\n')
    expect(text).toContain('fıstıklı tahin helvası (Servet): 100 g = 600 kcal, 14 g protein')
    expect(text).toContain('fırında nohut cipsi (Züber)')
  })
  it('porsiyonu olan urunde porsiyon da yazilir', () => {
    expect(productLines().join('\n')).toContain('porsiyon 25 g = 115 kcal')
  })
  it('katalogdaki her urun satira girer', () => {
    expect(productLines()).toHaveLength(PRODUCTS.length + 1)
  })
})
