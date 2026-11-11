export const ozet = {
  tarih: 'Salı, 14 Ocak',
  protein: { deger: 92, hedef: 150, birim: 'g' },
  kalori: { deger: 1020, hedef: 2120, birim: 'kcal' },
  adim: { deger: 5760, hedef: 8000, birim: 'adım' },
  kilo: {
    trend: '-0,4',
    birim: 'kg/hf',
    seri: [82.6, 82.5, 82.5, 82.3, 82.3, 82.2, 82.1],
    gunler: ['Ç', 'P', 'C', 'C', 'P', 'P', 'S'],
  },
  uyku: '6:48',
  nabiz: 61,
  antrenman: { yapilan: 4, hedef: 5 },
};

export const akis = [
  { saat: '07:10', baslik: 'Sabah tartısı', detay: '82,1 kg', durum: 'tamam' },
  { saat: '08:00', baslik: 'Kahvaltı', detay: '31 g protein', durum: 'tamam' },
  { saat: '10:30', baslik: 'Yürüyüş', detay: '3.240 adım · 28 dk', durum: 'tamam' },
  { saat: 'ŞİMDİ', baslik: 'Öğle', detay: '43 g protein hedefi', durum: 'acik' },
  { saat: '18:30', baslik: 'Sırt + Biceps', detay: '3 hareket · ~45 dk', durum: 'bekliyor' },
  { saat: '22:30', baslik: 'Akşam retrosu', detay: '3 soru · 2 dk', durum: 'bekliyor' },
];

export const seans = {
  ad: 'Sırt + Biceps',
  saat: '18:30',
  hareketler: [
    { ad: 'Lat pulldown', set: '3×10', yuk: '45 kg' },
    { ad: 'Seated row', set: '3×10', yuk: '40 kg' },
    { ad: 'Biceps curl', set: '2×12', yuk: '10 kg' },
  ],
};

export const digerGruplar = [
  {
    baslik: 'Program',
    ogeler: [
      { ad: 'Hedefler', not: 'Protein, kilo, adım' },
      { ad: 'Hareket kütüphanesi', not: '64 hareket' },
      { ad: 'Seans ve Tabak', not: 'Şablonlar' },
      { ad: 'Shake ve Dondurma', not: '12 tarif' },
      { ad: 'Hatırlatmalar', not: '5 aktif' },
    ],
  },
  {
    baslik: 'Veri',
    ogeler: [
      { ad: 'Saat / Health Connect', not: 'Bağlı' },
      { ad: 'Veri dışa aktar', not: 'CSV, JSON' },
      { ad: 'Ayarlar', not: '' },
    ],
  },
];

export const navOgeleri = ['Bugün', 'Plan', 'Ölçüm', 'Koç'];
