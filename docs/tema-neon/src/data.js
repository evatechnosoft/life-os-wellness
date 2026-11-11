// Shared mock data for all directions.
export const USER = { name: 'Deniz', date: 'Salı · 14 Ekim', streak: 12 };

export const OZET = {
  periods: ['Gün', 'Hafta', 'Ay'],
  protein: { v: 92, max: 150 },
  kalori: { v: 1020, max: 2120 },
  adim: { v: 5760, max: 8000 },
  trend: { delta: '−0,4', unit: 'kg/hf', pts: [82.6, 82.4, 82.5, 82.1, 82.0, 81.9, 81.7], days: ['Ç', 'P', 'C', 'C', 'P', 'P', 'S'] },
  uyku: '6:48',
  nabiz: 61,
  antrenman: { v: 4, max: 5 },
};

export const FLOW = [
  { t: '07:10', k: 'Sabah tartısı', d: '81,7 kg', s: 'done' },
  { t: '08:00', k: 'Kahvaltı', d: '31 g protein', s: 'done' },
  { t: '10:30', k: 'Yürüyüş', d: '3.200 adım', s: 'done' },
  { t: 'ŞİMDİ', k: 'Öğle', d: '43 g protein açık', s: 'now' },
  { t: '18:30', k: 'Sırt + Biceps', d: '3 hareket · 45 dk', s: 'next' },
  { t: '22:30', k: 'Akşam retrosu', d: '2 dk not', s: 'next' },
];

export const SESSION = {
  title: 'Sırt + Biceps',
  time: '18:30',
  dur: '45 dk',
  items: [
    { n: 'Lat pulldown', s: '3×10', w: '45 kg' },
    { n: 'Seated row', s: '3×10', w: '40 kg' },
    { n: 'Biceps curl', s: '2×12', w: '10 kg' },
  ],
};

export const REMIND = [
  { k: 'Sabah tartısı', t: '07:00', on: true },
  { k: 'Protein kontrolü', t: '13:00', on: true },
  { k: 'Akşam retrosu', t: '22:30', on: false },
];

export const fmt = (n) => n.toLocaleString('tr-TR');
