// Mock data for Page 3 (Diğer) variants

const icon = (path) => path

export const groups = [
  {
    key: 'hafta',
    label: 'Her hafta',
    items: [
      { id: 'hedefler', label: 'Hedefler', icon: 'target' },
      { id: 'hareket', label: 'Hareket kütüphanesi', icon: 'dumbbell' },
      { id: 'seanstabak', label: 'Seans ve Tabak', icon: 'plate' },
    ],
  },
  {
    key: 'ara',
    label: 'Ara sıra',
    items: [
      { id: 'tarif', label: 'Shake ve Dondurma tarifleri', icon: 'blender' },
      { id: 'hatirlat', label: 'Hatırlatmalar', icon: 'bell' },
    ],
  },
  {
    key: 'kurulum',
    label: 'Kurulum',
    items: [
      { id: 'saat', label: 'Saat / Health Connect', icon: 'watch' },
      { id: 'disaaktar', label: 'Veri dışa aktar', icon: 'export' },
      { id: 'ayarlar', label: 'Ayarlar', icon: 'settings' },
    ],
  },
]

export const flatMostUsed = [
  { id: 'hedefler', label: 'Hedefler', icon: 'target', sub: 'Protein, kalori, adım hedefleri' },
  { id: 'hareket', label: 'Hareket kütüphanesi', icon: 'dumbbell', sub: '48 egzersiz' },
  { id: 'seanstabak', label: 'Seans ve Tabak', icon: 'plate', sub: 'Şablonlar' },
]

export const flatSections = [
  {
    key: 'ara',
    label: 'Ara sıra',
    items: [
      { id: 'tarif', label: 'Shake ve Dondurma tarifleri', icon: 'blender', sub: '12 tarif' },
      { id: 'hatirlat', label: 'Hatırlatmalar', icon: 'bell', sub: '3 aktif' },
    ],
  },
  {
    key: 'kurulum',
    label: 'Kurulum',
    items: [
      { id: 'saat', label: 'Saat / Health Connect', icon: 'watch', sub: 'Bağlı' },
      { id: 'disaaktar', label: 'Veri dışa aktar', icon: 'export', sub: 'CSV / JSON' },
      { id: 'ayarlar', label: 'Ayarlar', icon: 'settings', sub: 'Genel tercihler' },
    ],
  },
]

export { icon }
