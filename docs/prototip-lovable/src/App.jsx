import PhoneFrame from './components/PhoneFrame'
import Screen1A from './components/screens/Screen1A'
import Screen1B from './components/screens/Screen1B'
import Screen2A from './components/screens/Screen2A'
import Screen2B from './components/screens/Screen2B'
import Screen3A from './components/screens/Screen3A'
import Screen3B from './components/screens/Screen3B'

function App() {
  return (
    <div className="min-h-screen w-full bg-[#0b0d12] relative overflow-hidden">
      <div className="pointer-events-none absolute -top-40 left-1/4 w-[520px] h-[520px] bg-teal-500/20 blur-[130px] rounded-full" />
      <div className="pointer-events-none absolute -top-24 right-1/4 w-[520px] h-[520px] bg-indigo-500/20 blur-[130px] rounded-full" />
      <div className="pointer-events-none absolute top-10 right-10 w-[300px] h-[300px] bg-pink-500/10 blur-[110px] rounded-full" />

      <div className="relative z-10 w-full px-4 sm:px-6 lg:px-10 py-12">
        <header className="text-center mb-12">
          <p className="inline-block text-xs tracking-widest uppercase text-teal-300/70 font-semibold mb-3">
            Prototip · Mock Veri
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Fitness Uygulaması Konsept Ekranları
          </h1>
          <p className="text-white/50 mt-3 text-sm sm:text-base max-w-2xl mx-auto">
            Altı farklı ekran varyasyonu — koyu aurora cam stili, gerçek veri yerine örnek verilerle hazırlanmıştır.
          </p>
        </header>

        <div className="flex flex-wrap justify-center gap-8 lg:gap-10">
          <PhoneFrame label="1A · Özet (Halkalar)">
            <Screen1A />
          </PhoneFrame>
          <PhoneFrame label="1B · Özet (Çubuklar)">
            <Screen1B />
          </PhoneFrame>
          <PhoneFrame label="2A · Takip (Zaman Çizelgesi)">
            <Screen2A />
          </PhoneFrame>
          <PhoneFrame label="2B · Takip (Sırada)">
            <Screen2B />
          </PhoneFrame>
          <PhoneFrame label="3A · Diğer (Kutular)">
            <Screen3A />
          </PhoneFrame>
          <PhoneFrame label="3B · Diğer (Liste)">
            <Screen3B />
          </PhoneFrame>
        </div>
      </div>
    </div>
  )
}

export default App