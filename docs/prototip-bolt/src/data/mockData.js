// Shared mock data for Page 1 (Özet) variants

export const gunData = {
  protein: { value: 92, goal: 150, unit: 'g' },
  kalori: { value: 1020, goal: 2120, unit: 'kcal' },
  adim: { value: 5760, goal: 8000, unit: 'adım' },
  uyku: { value: '6:48', unit: 'sa' },
  nabiz: { value: 61, unit: 'bpm' },
}

export const haftaData = {
  kiloTrend: -0.4, // kg/hf
  gunler: [
    { gun: 'Pzt', protein: 0.8, kalori: 0.9, adim: 0.6 },
    { gun: 'Sal', protein: 0.6, kalori: 0.7, adim: 0.9 },
    { gun: 'Çar', protein: 1.0, kalori: 0.95, adim: 0.4 },
    { gun: 'Per', protein: 0.5, kalori: 0.6, adim: 0.7 },
    { gun: 'Cum', protein: 0.9, kalori: 1.0, adim: 1.0 },
    { gun: 'Cmt', protein: 0.3, kalori: 0.4, adim: 0.3 },
    { gun: 'Paz', protein: 0.6, kalori: 0.5, adim: 0.72 },
  ],
}

export const ayData = {
  gunlukDoluluk: Array.from({ length: 30 }, (_, i) => {
    // pseudo-random but deterministic fill ratio 0..1
    const seed = Math.sin(i * 12.9898) * 43758.5453
    return Math.abs(seed - Math.floor(seed))
  }),
  haftalikOrtalama: [
    { hafta: 'Hf1', protein: 78, kalori: 85, adim: 65 },
    { hafta: 'Hf2', protein: 82, kalori: 80, adim: 72 },
    { hafta: 'Hf3', protein: 65, kalori: 70, adim: 58 },
    { hafta: 'Hf4', protein: 90, kalori: 88, adim: 81 },
  ],
}
