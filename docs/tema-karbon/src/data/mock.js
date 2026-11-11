// Ortak mock veri – tüm yönler aynı veriyi kullanır
export const ozet = {
  Gün: {
    protein: { v: 92, max: 150, unit: 'g' },
    kalori: { v: 1020, max: 2120, unit: 'kcal' },
    adim: { v: 5760, max: 8000, unit: 'adım' },
    kilo: { v: '-0,4', unit: 'kg/hf', label: '7 gün trend' },
    uyku: '6:48',
    nabiz: 61,
    antrenman: { v: 4, max: 5 },
  },
  Hafta: {
    protein: { v: 128, max: 150, unit: 'g' },
    kalori: { v: 1940, max: 2120, unit: 'kcal' },
    adim: { v: 7310, max: 8000, unit: 'adım' },
    kilo: { v: '-0,4', unit: 'kg/hf', label: '7 gün trend' },
    uyku: '7:05',
    nabiz: 62,
    antrenman: { v: 4, max: 5 },
  },
  Ay: {
    protein: { v: 121, max: 150, unit: 'g' },
    kalori: { v: 1985, max: 2120, unit: 'kcal' },
    adim: { v: 6890, max: 8000, unit: 'adım' },
    kilo: { v: '-0,3', unit: 'kg/hf', label: '30 gün trend' },
    uyku: '6:57',
    nabiz: 63,
    antrenman: { v: 17, max: 20 },
  },
};

export const kiloSerisi = [82.4, 82.3, 82.35, 82.1, 82.15, 82.0, 81.98];

export const akis = [
  { saat: '07:10', baslik: 'Sabah tartısı', detay: '81,98 kg', durum: 'tamam' },
  { saat: '08:00', baslik: 'Kahvaltı', detay: '31 g protein', durum: 'tamam' },
  { saat: '10:30', baslik: 'Yürüyüş', detay: '3.240 adım', durum: 'tamam' },
  { saat: 'ŞİMDİ', baslik: 'Öğle', detay: '43 g protein', durum: 'acik' },
  { saat: '18:30', baslik: 'Sırt + Biceps', detay: '3 hareket · 45 dk', durum: 'sirada' },
  { saat: '22:30', baslik: 'Akşam retrosu', detay: '2 dk', durum: 'sirada' },
];

export const seans = {
  ad: 'Sırt + Biceps',
  saat: '18:30',
  hareketler: [
    { ad: 'Lat pulldown', set: 3, tekrar: 10, kg: 45 },
    { ad: 'Seated row', set: 3, tekrar: 10, kg: 40 },
    { ad: 'Biceps curl', set: 2, tekrar: 12, kg: 10 },
  ],
};

export const digerListe = [
  { id: 'hedef', ad: 'Hedefler', alt: '150 g protein · 8.000 adım' },
  { id: 'kutuphane', ad: 'Hareket kütüphanesi', alt: '64 hareket' },
  { id: 'tabak', ad: 'Seans ve Tabak', alt: 'Şablonlar' },
  { id: 'shake', ad: 'Shake ve Dondurma', alt: '6 tarif' },
  { id: 'hatirlatma', ad: 'Hatırlatmalar', alt: '5 aktif' },
  { id: 'saat', ad: 'Saat / Health Connect', alt: 'Bağlı' },
  { id: 'disa', ad: 'Veri dışa aktar', alt: 'CSV · JSON' },
  { id: 'ayar', ad: 'Ayarlar', alt: 'Birimler, tema' },
];

export const navItems = ['Bugün', 'Plan', 'Ölçüm', 'Koç'];

export const fmt = (n) => n.toLocaleString('tr-TR');
