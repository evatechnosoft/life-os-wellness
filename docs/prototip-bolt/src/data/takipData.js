// Mock data for Page 2 (Takip) variants

export const timeline = [
  { id: 1, time: '07:15', title: 'Sabah tartısı', detail: '78.4 kg', status: 'done' },
  { id: 2, time: '08:00', title: 'Kahvaltı', detail: '32 g protein · 480 kcal', status: 'done' },
  { id: 3, time: '08:40', title: 'Yürüyüş', detail: '2.1 km · Health Connect', status: 'done' },
  { id: 4, time: '13:00', title: 'Öğle', detail: '43 g protein açık', status: 'current' },
  { id: 5, time: '18:30', title: 'Sırt + Biceps', detail: '3 egzersiz · 45 dk', status: 'upcoming' },
  { id: 6, time: '20:00', title: 'Akşam yemeği', detail: 'planlandı', status: 'upcoming' },
  { id: 7, time: '22:00', title: 'Akşam retrosu', detail: 'gün özeti', status: 'upcoming' },
]

export const nextSession = {
  time: '18:30',
  title: 'Sırt + Biceps',
  duration: '45 dk',
  exercises: [
    { id: 1, name: 'Lat pulldown', sets: 3, reps: 10, weight: 45 },
    { id: 2, name: 'Seated row', sets: 3, reps: 10, weight: 40 },
    { id: 3, name: 'Biceps curl', sets: 2, reps: 12, weight: 10 },
  ],
}

export const quickLogs = [
  { id: 'ogun', label: 'Öğün', value: '3/4 öğün', color: '#2dd4bf' },
  { id: 'kilo', label: 'Kilo', value: '78.4 kg', color: '#6366f1' },
  { id: 'su', label: 'Su', value: '1.4 / 2.5 L', color: '#ec4899' },
]
