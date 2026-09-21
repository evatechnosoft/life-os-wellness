/**
 * Seans üreteci ve kural denetçisi. Zar atar ama programın kurallarına uyar
 * (docs/PROGRAM-2026-09.md): haftalık set hedefleri, hipertansiyon kısıtları.
 * Saf: DOM'a da ağa da dokunmaz - aynı dosya hem sayfada hem `node plan.test.mjs` içinde koşar.
 */
(function (root) {
  'use strict';

  /**
   * Hipertansiyon kısıtları (PROGRAM §67-68): Valsalva yok, yetmezlik yok,
   * baş gövde altında pozisyon yok, plank yerine dead bug / Pallof.
   * Serbest barbell hinge kaçınılmaz Valsalva ürettiği için havuz dışı.
   */
  var YASAK = {
    Plank: 'statik ıkınma - yerine dead bug / Pallof (PROGRAM §68)',
    Romanian_Deadlift: 'serbest barbell hinge, Valsalva kaçınılmaz',
  };

  /**
   * Havuzda kalır ama zar önce diğerlerini dener. Makine crunch omurga fleksiyonu +
   * ağırlık başın arkasında: tansiyonda ıkınmaya davet. Dead bug ve Pallof aynı işi
   * omurgayı bükmeden yapar (PROGRAM §68), o yüzden karın slotunda öncelik onların.
   */
  var IKINCIL = { Ab_Crunch_Machine: 'omurga fleksiyonu; dead bug/Pallof varken ikinci sırada' };

  /** Isınma/mobilite kayıtları seans hareketi değildir; zar bunları çekmez. */
  var ISINMA = [
    'Recumbent_Bike', 'Cat_Stretch', 'Ankle_Circles', 'Standing_Hip_Circles',
    'Kneeling_Hip_Flexor', 'Dynamic_Chest_Stretch',
  ];

  var GOGUS = ['göğüs'];
  var SIRT = ['kanat (latissimus)', 'orta sırt', 'trapez'];
  var OMUZ = ['omuz'];
  var QUAD = ['ön bacak'];
  var ARKA = ['arka bacak', 'kalça'];
  var KOL = ['biseps', 'triseps'];
  var KARIN = ['karın'];
  var BALDIR = ['baldır'];

  /**
   * İki sistem. Zar yalnız slotu HANGİ hareketin dolduracağını seçer; kas dağılımını
   * ve set sayısını şema sabitler. Haftalık hedef ikisinde de aynı yere varır
   * (PROGRAM §80: göğüs 9, sırt 9, quad 6+, arka zincir 5, omuz 6, kol 6).
   */
  var SISTEMLER = {
    tumVucut: {
      ad: 'Tüm vücut A/B',
      aciklama: 'Her seansta her kas grubu; hacim üç güne yayılır. 21 Eyl kararı.',
      gunler: [
        {
          ad: 'A / B günü',
          slots: [
            { key: 'gogus', label: 'Göğüs', sets: 3, muscles: GOGUS },
            { key: 'sirt', label: 'Sırt', sets: 3, muscles: SIRT },
            { key: 'quad', label: 'Ön bacak', sets: 3, muscles: QUAD },
            { key: 'arka', label: 'Arka zincir', sets: 3, muscles: ARKA },
            { key: 'omuz', label: 'Omuz', sets: 2, muscles: OMUZ },
            { key: 'kol', label: 'Kol', sets: 2, muscles: KOL },
            { key: 'karin', label: 'Karın', sets: 2, muscles: KARIN, core: true },
          ],
        },
      ],
    },
    bolunmus: {
      ad: 'Üç güne bölünmüş',
      aciklama: 'Klasik bölünme: sırt yalnız çekiş gününde. Kas grubu haftada bir, ama yüksek hacimle.',
      gunler: [
        {
          ad: 'İtiş (göğüs · omuz)',
          slots: [
            { key: 'gogus1', label: 'Göğüs 1', sets: 3, muscles: GOGUS },
            { key: 'gogus2', label: 'Göğüs 2', sets: 3, muscles: GOGUS },
            { key: 'gogus3', label: 'Göğüs 3', sets: 3, muscles: GOGUS },
            { key: 'omuz1', label: 'Omuz 1', sets: 3, muscles: OMUZ },
            { key: 'omuz2', label: 'Omuz 2', sets: 3, muscles: OMUZ },
            { key: 'karin', label: 'Karın', sets: 2, muscles: KARIN, core: true },
          ],
        },
        {
          ad: 'Çekiş (sırt · kol)',
          slots: [
            { key: 'sirt1', label: 'Sırt 1', sets: 3, muscles: SIRT },
            { key: 'sirt2', label: 'Sırt 2', sets: 3, muscles: SIRT },
            { key: 'sirt3', label: 'Sırt 3', sets: 3, muscles: SIRT },
            { key: 'kol1', label: 'Kol 1', sets: 3, muscles: KOL },
            { key: 'kol2', label: 'Kol 2', sets: 3, muscles: KOL },
            { key: 'karin', label: 'Karın', sets: 2, muscles: KARIN, core: true },
          ],
        },
        {
          ad: 'Bacak',
          slots: [
            { key: 'quad1', label: 'Ön bacak 1', sets: 3, muscles: QUAD },
            { key: 'quad2', label: 'Ön bacak 2', sets: 3, muscles: QUAD },
            { key: 'arka1', label: 'Arka zincir 1', sets: 3, muscles: ARKA },
            { key: 'arka2', label: 'Arka zincir 2', sets: 2, muscles: ARKA },
            { key: 'baldir', label: 'Baldır', sets: 3, muscles: BALDIR },
            { key: 'karin', label: 'Karın', sets: 2, muscles: KARIN, core: true },
          ],
        },
      ],
    },
  };

  /** Bir günün karın hariç ağırlık seti. Denetim bu sayıya bakar. */
  function agirlikHedefi(gun) {
    return gun.slots.reduce(function (s, sl) { return s + (sl.core ? 0 : sl.sets); }, 0);
  }

  /** Slotu doldurabilecek hareketler: doğru kas, yasaklı değil, ısınma değil. */
  function havuz(EX, slot) {
    return EX.filter(function (e) {
      return e.m.some(function (k) { return slot.muscles.indexOf(k) >= 0; }) &&
        !YASAK[e.id] && ISINMA.indexOf(e.id) < 0;
    });
  }

  /** Sistem + gün indeksinden günü verir; bilinmeyen ad tüm vücuda düşer. */
  function gunOf(sistemId, gunIndex) {
    var sis = SISTEMLER[sistemId] || SISTEMLER.tumVucut;
    return sis.gunler[gunIndex % sis.gunler.length];
  }

  /**
   * Zar. `avoid` geçen haftanın hareketleri: mümkünse başkası seçilir (kas şaşırtma).
   * Aynı seansta bir hareket iki slota düşemez. Havuz daralırsa kural bozmaktansa
   * önce tazelikten, sonra tekrarsızlıktan vazgeçilir - ikisi de mümkün değilse
   * slot yine dolar, denetim bunu gösterir.
   * `rnd` dışarıdan verilir ki test aynı zarı tekrar atabilsin.
   */
  function roll(EX, opts) {
    var o = opts || {};
    var avoid = o.avoid || [];
    // forbid: bu hareket bu seansa GİREMEZ (hafta içinde başka güne düştü).
    // avoid: mümkünse girmesin (geçen hafta seçilmişti) - havuz daralırsa feda edilir.
    var forbid = o.forbid || [];
    var rnd = o.rnd || Math.random;
    var gun = gunOf(o.sistem || 'tumVucut', o.gun || 0);
    var kullanilan = [];

    return gun.slots.map(function (slot) {
      var all = havuz(EX, slot).filter(function (e) { return forbid.indexOf(e.id) < 0; });
      if (all.length === 0) all = havuz(EX, slot); // yasak liste slotu boşaltıyorsa kural önce gelir
      var serbest = all.filter(function (e) { return kullanilan.indexOf(e.id) < 0; });
      var taze = serbest.filter(function (e) { return avoid.indexOf(e.id) < 0; });
      var from = taze.length > 0 ? taze : (serbest.length > 0 ? serbest : all);
      var oncelikli = from.filter(function (e) { return !IKINCIL[e.id]; });
      if (oncelikli.length > 0) from = oncelikli;
      var pick = from[Math.floor(rnd() * from.length)];
      kullanilan.push(pick.id);
      return { slot: slot.key, label: slot.label, sets: slot.sets, id: pick.id, name: pick.n, eq: pick.eq };
    });
  }

  /**
   * Denetçi: üretilmiş seans programa uyuyor mu. Her kural tek tek cevap verir -
   * "uydu" demek için hepsinin `ok` olması gerekir.
   */
  function check(EX, session, opts) {
    var o = opts || {};
    var gun = gunOf(o.sistem || 'tumVucut', o.gun || 0);
    var hedefSet = agirlikHedefi(gun);
    var ids = session.map(function (x) { return x.id; });
    var coreKeys = gun.slots.filter(function (sl) { return sl.core; }).map(function (sl) { return sl.key; });
    var agirlikSet = session.reduce(function (s, x) {
      return s + (coreKeys.indexOf(x.slot) >= 0 ? 0 : x.sets);
    }, 0);
    var yasakli = ids.filter(function (id) { return !!YASAK[id]; });
    var isinma = ids.filter(function (id) { return ISINMA.indexOf(id) >= 0; });
    var tekrarEden = ids.length !== new Set(ids).size;
    var bacak = session.filter(function (x) { return x.slot.indexOf('quad') === 0 || x.slot.indexOf('arka') === 0; }).length;
    var bacakBekleniyor = gun.slots.filter(function (sl) { return sl.key.indexOf('quad') === 0 || sl.key.indexOf('arka') === 0; }).length;

    return [
      { kural: 'Günün bütün slotları dolu', ok: session.length === gun.slots.length, deger: session.length + '/' + gun.slots.length },
      { kural: 'Bacak slotları eksiksiz', ok: bacak === bacakBekleniyor, deger: bacak + '/' + bacakBekleniyor },
      { kural: 'Ağırlık seti ' + hedefSet + ' (karın hariç)', ok: agirlikSet === hedefSet, deger: agirlikSet + ' set' },
      { kural: 'Yasaklı hareket yok (Valsalva/ıkınma)', ok: yasakli.length === 0, deger: yasakli.length === 0 ? 'temiz' : yasakli.join(', ') },
      { kural: 'Isınma hareketi seansa girmedi', ok: isinma.length === 0, deger: isinma.length === 0 ? 'temiz' : isinma.join(', ') },
      { kural: 'Aynı hareket iki slotta değil', ok: !tekrarEden, deger: tekrarEden ? 'tekrar var' : 'temiz' },
      { kural: 'Karın: dead bug / Pallof / crunch (plank değil)', ok: ids.indexOf('Plank') < 0, deger: 'temiz' },
    ];
  }

  /**
   * Haftanın üç seansını birlikte kurar. Tüm vücut sisteminde her seans aynı şemadır ama
   * hareketler farklı seçilir; bölünmüş sistemde üç gün zaten farklı şemadır.
   * `gunler` haftanın hangi günlerine düştüğü (JS getDay); aradaki dinlenme buradan denetlenir.
   */
  function rollWeek(EX, opts) {
    var o = opts || {};
    var sistemId = o.sistem || 'tumVucut';
    var sis = SISTEMLER[sistemId];
    var gunler = o.gunler || [1, 3, 5];
    var haftaIci = [];
    var seanslar = [];

    for (var i = 0; i < gunler.length; i++) {
      var gunIndex = sis.gunler.length > 1 ? i % sis.gunler.length : 0;
      var s = roll(EX, {
        sistem: sistemId, gun: gunIndex, rnd: o.rnd,
        forbid: haftaIci,      // hafta içinde aynı hareket iki güne düşmez
        avoid: o.avoid || [],  // geçen haftanınkiler tercihen atlanır
      });
      haftaIci = haftaIci.concat(s.map(function (x) { return x.id; }));
      seanslar.push({ weekday: gunler[i], gunIndex: gunIndex, ad: sis.gunler[gunIndex].ad, session: s });
    }
    return seanslar;
  }

  /**
   * Haftanın dinlenme aralığı. Kas grubu aynı hafta iki kez çalışıldıysa aradaki gün
   * sayısı en az 1 olmalı (48 saat kuralının pratik karşılığı). Hafta sonu iki gün boşsa
   * son seansla ilk seans arası zaten açılır - bu da ölçülür.
   */
  function checkWeek(seanslar) {
    var gunler = seanslar.map(function (s) { return s.weekday; });
    var araliklar = [];
    for (var i = 1; i < gunler.length; i++) araliklar.push(gunler[i] - gunler[i - 1]);
    var enDar = araliklar.length > 0 ? Math.min.apply(null, araliklar) : 7;
    // Haftanın son seansından bir sonraki haftanın ilkine kalan gün.
    var sarma = gunler.length > 0 ? 7 - gunler[gunler.length - 1] + gunler[0] : 7;

    var tumIds = [];
    seanslar.forEach(function (s) { s.session.forEach(function (x) { tumIds.push(x.id); }); });
    var benzersiz = new Set(tumIds).size;

    return [
      { kural: 'Seans sayısı 3', ok: seanslar.length === 3, deger: seanslar.length + ' seans' },
      { kural: 'Ardışık seanslar arası en az 1 gün', ok: enDar >= 2, deger: enDar + ' gün' },
      { kural: 'Hafta sonu toparlanma (son seans → yeni hafta)', ok: sarma >= 2, deger: sarma + ' gün' },
      { kural: 'Hafta içinde hareket tekrarı yok', ok: benzersiz === tumIds.length, deger: benzersiz + '/' + tumIds.length + ' benzersiz' },
    ];
  }

  var api = {
    SISTEMLER: SISTEMLER, YASAK: YASAK, ISINMA: ISINMA,
    havuz: havuz, roll: roll, check: check, gunOf: gunOf, agirlikHedefi: agirlikHedefi,
    rollWeek: rollWeek, checkWeek: checkWeek, IKINCIL: IKINCIL,
  };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.Plan = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
