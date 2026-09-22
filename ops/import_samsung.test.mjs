import assert from 'node:assert/strict'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'

import { collect, localDay, parseCsv } from './import_samsung.mjs'

test('localDay: ofset eklenir, gun geri atilmaz', () => {
  // 21:30 UTC + 03:00 = ertesi gun 00:30 yerel. Ham toISOString bir gun geri atardi.
  assert.equal(localDay('2026-09-20 21:30:00.000', 'UTC+0300'), '2026-09-21')
  assert.equal(localDay('2026-09-21 05:13:52.268', 'UTC+0300'), '2026-09-21')
  assert.equal(localDay('2026-09-21 22:00:00.000', 'UTC-0500'), '2026-09-21')
  // Ofset yoksa damga oldugu gibi okunur.
  assert.equal(localDay('2026-09-21 05:13:52.268', ''), '2026-09-21')
})

test('parseCsv: tirnakli alan ve ikilenmis tirnak', () => {
  assert.deepEqual(parseCsv('a,b\n1,"x,y"\n'), [['a', 'b'], ['1', 'x,y']])
  assert.deepEqual(parseCsv('"a""b",c\n'), [['a"b', 'c']])
})

function fixture() {
  const dir = mkdtempSync(join(tmpdir(), 'sh-test-'))
  writeFileSync(join(dir, 'com.samsung.shealth.step_daily_trend.1.csv'),
    'meta,1,2\nsource_type,count,day_time\n' +
    '-2,7445,2026-09-20 00:00:00.000\n' +
    '10,7445,2026-09-20 00:00:00.000\n' +   // telefon kaydi: ayni gun, alinmamali
    '0,7445,2026-09-20 00:00:00.000\n')     // saat kaydi: ayni gun, alinmamali
  writeFileSync(join(dir, 'com.samsung.health.weight.1.csv'),
    'meta,1,2\nstart_time,weight,time_offset\n' +
    '2026-09-21 05:13:52.268,107.54,UTC+0300\n')
  writeFileSync(join(dir, 'com.samsung.shealth.blood_pressure.1.csv'),
    'meta,1,2\ncom.samsung.health.blood_pressure.start_time,' +
    'com.samsung.health.blood_pressure.systolic,' +
    'com.samsung.health.blood_pressure.diastolic,' +
    'com.samsung.health.blood_pressure.time_offset\n' +
    '2026-09-20 18:00:00.000,132.0,89.0,UTC+0300\n' +
    '2026-09-20 19:00:00.000,0.0,0.0,UTC+0300\n')  // bozuk olcum: elenmeli
  return dir
}

test('collect: --from oncesi atlanir', () => {
  const { wearable, daily } = collect(fixture(), '2026-09-21')
  assert.deepEqual(daily.map(([d]) => d), ['2026-09-21'])
  assert.equal(wearable.every((r) => r.date >= '2026-09-21'), true)
})

test('collect: gunluk adim uce katlanmaz, kilo yuvarlanir, bozuk tansiyon elenir', () => {
  const { wearable, daily } = collect(fixture())

  const steps = wearable.filter((r) => r.metric === 'steps')
  assert.equal(steps.length, 1, 'yalniz birlesik (source_type=-2) satir alinir')
  assert.deepEqual(steps[0], { date: '2026-09-20', source: 'samsung_csv', metric: 'steps', value: 7445 })

  const days = Object.fromEntries(daily)
  assert.equal(days['2026-09-21'].weight_kg, 107.5)
  assert.equal(days['2026-09-20'].bp_systolic, 132)
  assert.equal(days['2026-09-20'].bp_diastolic, 89)
  assert.equal(wearable.filter((r) => r.metric === 'bp_systolic').length, 1)
})
