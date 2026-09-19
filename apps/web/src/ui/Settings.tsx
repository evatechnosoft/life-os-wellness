import { useLiveQuery } from 'dexie-react-hooks'
import { Fragment, useEffect, useState } from 'react'

import { getApiBase, getToken, setApiBase, setToken } from '../lib/api'
import { db } from '../lib/db'
import { downloadLocalModel, localModelStatus, onModelDownload, removeLocalModel } from '../lib/localLlm'
import { saveReminderSettings, useReminderSettings } from '../lib/reminders'
import { saveGoals, useGoals } from '../lib/settings'
import { saveSplit, useSplit, WEEKDAYS } from '../lib/split'
import { syncOutbox } from '../lib/store'
import {
  appVersion,
  autoCheckPhoneUpdate,
  checkPhoneUpdate,
  installPhoneUpdate,
  onPhoneUpdate,
  onWatchAppPush,
  pushWatchApp,
  type PhoneUpdate,
} from '../lib/watch'
import { isNative } from '../lib/health'
import { Card, NumberField } from './Field'
import { ProfileCard } from './Profile'

interface SegmentedOption<T extends string> {
  value: T
  label: string
}

/** 2-4 secenekli tercih icin `select` yerine tek bakista secenek (PLAN-UI S11-5). */
function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T
  options: readonly SegmentedOption<T>[]
  onChange: (value: T) => void
}) {
  return (
    <div role="group" className="inline-flex rounded-pill bg-glass-inset p-0.5">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={option.value === value}
          onClick={() => onChange(option.value)}
          className={`min-h-10 rounded-pill px-3 text-xs ${
            option.value === value ? 'bg-glass-strong text-ink' : 'text-ink-faint'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

function NoteHistory() {
  const notes = useLiveQuery(() => db.note_log.orderBy('id').reverse().limit(40).toArray(), []) ?? []
  if (notes.length === 0) return <p className="text-xs text-ink-faint">Henüz not yok.</p>
  return (
    <ul className="space-y-3">
      {notes.map((n) => (
        <li key={n.id} className="border-l-2 border-edge-soft pl-3">
          <div className="text-xs text-ink-faint">
            {n.date} {n.at} · {n.via === 'voice' ? 'sesli' : 'yazılı'}
          </div>
          <p className="text-sm text-ink-dim">{n.text}</p>
          {n.applied.length > 0 && (
            <p className="mt-0.5 text-xs text-a1">{n.applied.join(' · ')}</p>
          )}
        </li>
      ))}
    </ul>
  )
}

/**
 * Saatteki uygulamayi telefondan gunceller. Telefon APK'yi yayindan indirir ve saate
 * kanalla akitir; onayi saat sorar. Saat kendi basina da guncellenebiliyor, ama kendi
 * interneti Bluetooth vekilinden gectigi icin megabaytlar surunuyor.
 *
 * Ilk kurulum buradan yapilamaz: saatte dinleyen uygulama yoksa kanal da yok.
 */
function WatchAppPush() {
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const handle = onWatchAppPush(setStatus)
    return () => {
      void handle.then((h) => h?.remove())
    }
  }, [])

  const send = async () => {
    setBusy(true)
    setStatus('Başlatılıyor…')
    try {
      setStatus((await pushWatchApp()).status)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card title="Saat uygulaması">
      <p className="text-xs text-ink-faint">
        Saatteki uygulamanın son sürümünü telefon indirir ve saate gönderir. Kurulumu saat
        sorar — onayı saatin ekranından ver. Saatte uygulama hiç yoksa bu düğme işe yaramaz;
        ilk kurulum kablosuz ADB ile yapılır.
      </p>
      <button
        type="button"
        onClick={() => void send()}
        disabled={busy}
        className="mt-3 w-full rounded-field bg-glass-strong py-3 text-sm disabled:opacity-50"
      >
        {busy ? 'Gönderiliyor…' : 'Saate gönder'}
      </button>
      {status && <p className="mt-2 text-xs text-ink-faint">{status}</p>}
    </Card>
  )
}

/**
 * Telefonun kendi guncellemesi. Saatle ayni evaitecOTA akisi: manifest -> karar -> indir ->
 * sistem yukleyicisi. Kontrol acilista ve en fazla gunde bir kendiliginden yapiliyor;
 * indirme ve kurulum her zaman kullanicinin onayiyla.
 */
function PhoneAppUpdate() {
  const [update, setUpdate] = useState<PhoneUpdate | null>(null)
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState(false)
  const [version, setVersion] = useState('')

  useEffect(() => {
    void appVersion().then(setVersion)
    void autoCheckPhoneUpdate().then(setUpdate)
    const handle = onPhoneUpdate(setStatus)
    return () => {
      void handle.then((h) => h?.remove())
    }
  }, [])

  const run = async (action: () => Promise<void>) => {
    setBusy(true)
    try {
      await action()
    } finally {
      setBusy(false)
    }
  }

  const available = update?.state === 'available'

  return (
    <Card title="Telefon uygulaması">
      <p className="text-xs text-ink-faint">
        Kurulu sürüm {version === '' ? '—' : version}.{' '}
        {available
          ? `Güncelleme var: ${update.versionName ?? ''}`
          : update?.state === 'upToDate'
            ? 'Güncelsin.'
            : update?.reason ?? 'Sürüm bilgisi henüz alınmadı.'}
      </p>
      <button
        type="button"
        onClick={() =>
          void run(async () => {
            if (available) {
              setStatus((await installPhoneUpdate()).status)
              setUpdate(await checkPhoneUpdate())
            } else {
              setStatus('')
              setUpdate(await checkPhoneUpdate())
            }
          })
        }
        disabled={busy}
        className="mt-3 w-full rounded-field bg-glass-strong py-3 text-sm disabled:opacity-50"
      >
        {busy ? 'Çalışıyor…' : available ? 'İndir ve kur' : 'Güncelleme denetle'}
      </button>
      {status && <p className="mt-2 text-xs text-ink-faint">{status}</p>}
    </Card>
  )
}

/**
 * Cihaz-ici Eva: sunucu yokken telefondaki model konussun. ~530 MB indirme, calisirken
 * ~1 GB RAM - o yuzden yalniz kullanici isterse. Web'de kart hic gorunmez (model yok).
 */
function LocalEva() {
  const [model, setModel] = useState<{ ready: boolean; sizeMb: number } | null>(null)
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    void localModelStatus().then(setModel)
    const handle = onModelDownload(setStatus)
    return () => {
      void handle.then((h) => h?.remove())
    }
  }, [])

  if (model === null) return null

  const run = async (action: () => Promise<void>) => {
    setBusy(true)
    try {
      await action()
      setModel(await localModelStatus())
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card title="Cihaz-içi Eva">
      <p className="text-xs text-ink-faint">
        {model.ready
          ? `Model telefonda (${model.sizeMb} MB). Sunucu kapalıyken Eva buradan yanıtlar.`
          : 'Sunucu kapalıyken de yanıt için Gemma 3 1B indirilebilir (~530 MB, Wi-Fi önerilir). İndirilmezse Eva yalnız hesaplanmış önerilerle yanıtlar.'}
      </p>
      <button
        type="button"
        onClick={() =>
          void run(async () => {
            if (model.ready) {
              await removeLocalModel()
              setStatus('Model silindi')
            } else {
              setStatus((await downloadLocalModel()).status)
            }
          })
        }
        disabled={busy}
        className="mt-3 w-full rounded-field bg-glass-strong py-3 text-sm disabled:opacity-50"
      >
        {busy ? 'Çalışıyor…' : model.ready ? 'Modeli sil' : 'Modeli indir'}
      </button>
      {status && <p className="mt-2 text-xs text-ink-faint">{status}</p>}
    </Card>
  )
}

const MUSCLES = ['göğüs', 'sırt', 'bacak', 'omuz', 'kol', 'karın'] as const
const MUSCLE_ABBR: Record<(typeof MUSCLES)[number], string> = {
  'göğüs': 'gö',
  'sırt': 'sı',
  'bacak': 'ba',
  'omuz': 'om',
  'kol': 'ko',
  'karın': 'ka',
}
/** getDay() sirasi (0 = pazar); matris satir basliklari. */
const DAY_ABBR = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt']

/**
 * Haftalik program: hangi gun hangi bolge. Cip kalabaligi yerine 7x6 matris - tek
 * ekranda biter (PLAN-UI S11-3). Kaydetme mantigi degismedi.
 */
function SplitEditor() {
  const split = useSplit()
  const toggle = (weekday: number, muscle: string) => {
    const current = split[weekday] ?? []
    const next = current.includes(muscle) ? current.filter((m) => m !== muscle) : [...current, muscle]
    void saveSplit({ ...split, [weekday]: next })
  }
  // Hafta pazartesiden okunur; getDay() pazari 0 verdigi icin sira boyle diziliyor.
  const order = [1, 2, 3, 4, 5, 6, 0]

  return (
    <div className="grid grid-cols-[2.5rem_repeat(6,1fr)] items-center justify-items-center">
      <span />
      {MUSCLES.map((muscle) => (
        <span key={muscle} className="text-[9px] text-ink-faint">
          {MUSCLE_ABBR[muscle]}
        </span>
      ))}
      {order.map((weekday) => (
        <Fragment key={weekday}>
          <span className="justify-self-start text-[11px] text-ink-faint">{DAY_ABBR[weekday]}</span>
          {MUSCLES.map((muscle) => {
            const on = (split[weekday] ?? []).includes(muscle)
            return (
              <button
                key={muscle}
                type="button"
                aria-label={`${WEEKDAYS[weekday]} ${muscle}`}
                aria-pressed={on}
                onClick={() => toggle(weekday, muscle)}
                className="p-1"
              >
                <span className={`block size-8 rounded-[8px] ${on ? 'bg-a1/90' : 'bg-glass-inset'}`} />
              </button>
            )
          })}
        </Fragment>
      ))}
    </div>
  )
}

/** Bos nudge = adaptif; segmented'de ucuncu bir deger olarak temsil edilir. */
const NUDGE_OPTIONS = [
  { value: 'adaptive', label: 'Uyarlanır' },
  { value: 'soft', label: 'Yumuşak' },
  { value: 'push', label: 'İtici' },
] as const satisfies readonly SegmentedOption<'adaptive' | 'soft' | 'push'>[]

/** Yikici islem tek basina, en altta ve iki adimli onayla (PLAN-UI S3). */
function DangerZone() {
  const [armed, setArmed] = useState(false)

  const click = () => {
    if (!armed) {
      setArmed(true)
      return
    }
    void db.delete().then(() => location.reload())
  }

  return (
    <button
      type="button"
      onClick={click}
      onBlur={() => setArmed(false)}
      className="mt-6 min-h-11 w-full rounded-field bg-glass-inset px-4 py-3 text-sm text-a3"
    >
      {armed ? 'Emin misin? Geri alınamaz — silmek için tekrar dokun' : 'Tüm veriyi sil'}
    </button>
  )
}

export function Settings() {
  const goals = useGoals()
  const reminders = useReminderSettings()
  const split = useSplit()
  const pending = useLiveQuery(() => db.outbox.count(), []) ?? 0
  const [token, setLocalToken] = useState(getToken())
  const [base, setLocalBase] = useState(getApiBase())
  const [status, setStatus] = useState('')

  const exportJson = async () => {
    const [daily_log, workout, retro, notes, wearable, meal, chat] = await Promise.all([
      db.daily_log.toArray(),
      db.workout.toArray(),
      db.retro.toArray(),
      db.note_log.toArray(),
      db.wearable.toArray(),
      db.meal.toArray(),
      db.chat.toArray(),
    ])
    // Fotograflar Blob; JSON'a giremez, yerine boyutu yaziliyor.
    const meals = meal.map(({ photo, ...rest }) => ({ ...rest, photo_bytes: photo instanceof Blob ? photo.size : 0 }))
    const blob = new Blob(
      [JSON.stringify({ exported_at: new Date().toISOString(), daily_log, workout, retro, notes, wearable, meals, chat }, null, 2)],
      { type: 'application/json' },
    )
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `wellness-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Bolum ozetleri gercek ayardan turer: acmadan ne oldugu okunur (PLAN-UI S3).
  const dailySummary = `protein ${goals.protein_g} g · %${goals.weekly_loss_pct.toLocaleString('tr-TR')}`
  const host = base.replace(/^https?:\/\//, '').replace(/\/$/, '')
  const dataSummary = `${host === '' ? 'varsayılan sunucu' : host} · ${
    pending === 0 ? 'kuyruk boş' : `${pending} bekliyor`
  }`

  return (
    <div>
      <Card id="ayar-gunluk" title="Günlük ayarlar" summary={dailySummary} collapsible defaultOpen>
        <ProfileCard />

        <Card title="Hedefler">
          <NumberField label="Günlük protein" unit="g" value={goals.protein_g} onCommit={(v) => void saveGoals({ ...goals, protein_g: v ?? 140 })} />
          <NumberField
            label="Haftalık kilo kaybı"
            unit="% / hafta"
            step={0.05}
            value={goals.weekly_loss_pct}
            // Hedef yuzdedir: ayni kilogram 60 ve 110 kiloda farkli seydir. Ust kirpma
            // %2 - fikir vermeyen bir yazim hatasini engeller, hedefi sessizce degistirmez.
            onCommit={(v) => void saveGoals({ ...goals, weekly_loss_pct: Math.min(Math.max(v ?? 0.7, 0), 2) })}
          />
          <p className="text-xs text-ink-faint">
            Vücut ağırlığının yüzdesi. Kanıtın işaret ettiği aralık %0,5-1; 0 bakım demek.
            {goals.weekly_weight_loss_kg != null &&
              ` Eski hedefin ${goals.weekly_weight_loss_kg} kg/hafta olarak duruyor ve kullanılıyor — bu alanı kaydedince yüzdeye geçer.`}
          </p>
          <NumberField label="Kas grubu başına set" value={goals.sets_per_group} onCommit={(v) => void saveGoals({ ...goals, sets_per_group: v ?? 10 })} />
        </Card>

        <Card title="Beslenme itmesi">
          <div className="flex min-h-11 items-center justify-between gap-3 py-2">
            <span className="text-sm text-ink-dim">Öneri dozu</span>
            <Segmented
              value={goals.nudge ?? 'adaptive'}
              options={NUDGE_OPTIONS}
              onChange={(v) => void saveGoals({ ...goals, nudge: v === 'adaptive' ? undefined : v })}
            />
          </div>
          <label className="flex min-h-11 items-center justify-between gap-3 py-2">
            <span className="text-sm text-ink-dim">Serbest öğün günü</span>
            <select
              value={goals.free_meal_day ?? 6}
              onChange={(e) => void saveGoals({ ...goals, free_meal_day: Number(e.target.value) })}
              className="min-h-11 rounded-field bg-glass-inset px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-a1"
            >
              {WEEKDAYS.map((label, day) => (
                <option key={label} value={day}>{label}</option>
              ))}
            </select>
          </label>
          <p className="mt-1 text-xs text-ink-faint">
            Uyarlanır: normal günlerde yumuşak, telafi gününde itici. Serbest öğün planlıdır — o gün telafi çıkmaz.
          </p>
        </Card>

        <Card title="Hatırlatmalar" collapsible summary={`${reminders.weigh_at} · ${reminders.retro_at}`}>
          <label className="flex min-h-11 items-center justify-between text-sm text-ink-dim">
            <span>Eksik girişleri hatırlat</span>
            <input
              type="checkbox"
              checked={reminders.enabled}
              onChange={(e) => void saveReminderSettings({ ...reminders, enabled: e.target.checked })}
              className="size-5 accent-a1"
            />
          </label>
          <div className="mt-3 flex gap-3">
            {([['weigh_at', 'Sabah tartısı'], ['retro_at', 'Akşam retrosu']] as const).map(([key, label]) => (
              <label key={key} className="flex-1 text-xs text-ink-faint">
                {label}
                <input
                  type="time"
                  value={reminders[key]}
                  onChange={(e) => void saveReminderSettings({ ...reminders, [key]: e.target.value })}
                  className="mt-1 min-h-11 w-full rounded-field bg-glass-inset px-3 py-2 text-sm text-ink-dim outline-none focus:ring-2 focus:ring-a1"
                />
              </label>
            ))}
          </div>
          <label className="mt-3 flex min-h-11 items-center justify-between gap-3">
            <span className="text-sm text-ink-dim">Bel ölçüsü günü</span>
            <select
              value={reminders.waist_day}
              onChange={(e) => void saveReminderSettings({ ...reminders, waist_day: Number(e.target.value) })}
              className="min-h-11 rounded-field bg-glass-inset px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-a1"
            >
              {WEEKDAYS.map((label, day) => (
                <option key={label} value={day}>{label}</option>
              ))}
            </select>
          </label>
          <p className="mt-2 text-xs text-ink-faint">
            Uygulama açıkken ekranın üstünde çıkar. Telefon bildirimi yalnız APK'da; tarayıcı
            uygulama kapalıyken bildirim atamaz.
          </p>
        </Card>

        <Card title="Haftalık program" collapsible summary={`${Object.values(split).filter((g) => g.length > 0).length}/7 gün dolu`}>
          <p className="mb-3 text-xs text-ink-faint">
            Hangi gün hangi bölge. Eva bugünün bölgesini bilir, o güne ait kaydı takip eder.
          </p>
          <SplitEditor />
        </Card>
      </Card>

      {/* Web'de cihaz bolgesi hic cizilmez: calismayan dugme, olmayan dugmeden kotudur. */}
      {isNative() && (
        <Card id="ayar-cihazlar" title="Cihazlar" collapsible>
          <PhoneAppUpdate />
          <LocalEva />
          <WatchAppPush />
        </Card>
      )}

      <Card id="ayar-veri" title="Veri ve sunucu" summary={dataSummary} collapsible>
        <Card title="Sunucu">
          <label className="block text-sm text-ink-dim">Sunucu adresi</label>
          <input
            type="url"
            inputMode="url"
            value={base}
            onChange={(e) => setLocalBase(e.target.value)}
            onBlur={() => setApiBase(base)}
            placeholder="https://fit.evaitec.com"
            className="mt-2 min-h-11 w-full rounded-field bg-glass-inset px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-a1"
          />
          <p className="mt-1 text-xs text-ink-faint">
            Boş bırakırsan varsayılan kullanılır. Ev ağındayken http://192.168.1.185:3011 gibi bir adres daha hızlıdır.
          </p>
          <label className="mt-4 block text-sm text-ink-dim">API token</label>
          <input
            type="password"
            value={token}
            onChange={(e) => setLocalToken(e.target.value)}
            onBlur={() => setToken(token)}
            placeholder=".env icindeki API_TOKEN"
            className="mt-2 min-h-11 w-full rounded-field bg-glass-inset px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-a1"
          />
          <div className="mt-3 flex items-center justify-between text-xs text-ink-faint">
            <span>{pending === 0 ? 'kuyruk boş' : `${pending} kayıt gönderilmeyi bekliyor`}</span>
            <button
              type="button"
              onClick={async () => {
                const sent = await syncOutbox()
                setStatus(sent > 0 ? `${sent} kayıt gönderildi` : pending > 0 ? 'gönderilemedi' : 'gönderilecek kayıt yok')
              }}
              className="min-h-11 rounded-field bg-glass-strong px-3 py-2 text-ink-dim"
            >
              Şimdi senkronla
            </button>
          </div>
          {status && <p className="mt-2 text-xs text-ink-faint">{status}</p>}
        </Card>

        <Card title="Notlar">
          <NoteHistory />
        </Card>

        <Card title="Dışa aktar">
          <button
            type="button"
            onClick={() => void exportJson()}
            className="min-h-11 w-full rounded-field bg-glass-strong py-3 text-sm active:bg-glass-strong"
          >
            JSON olarak dışa aktar
          </button>
        </Card>
      </Card>

      <DangerZone />
    </div>
  )
}
