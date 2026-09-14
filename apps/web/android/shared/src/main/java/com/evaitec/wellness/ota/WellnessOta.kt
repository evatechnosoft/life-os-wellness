package com.evaitec.wellness.ota

/**
 * evaitecOTA'nin wellness yapilandirmasi - kitin **projeye ozel tek dosyasi**.
 * Baska bir projeye kopyalarken degisen yalniz burasi; com.evaitec.ota paketi aynen kalir.
 *
 * Repo public: indirmede kimlik dogrulama yok, dolayisiyla APK'da saglayici sirri tasinamaz
 * (AGENTS.md: secret kodda yok).
 */
object WellnessOta {

    /** `releases/latest/download/...` her zaman en son yayina gider; etiket kodlanmiyor. */
    const val MANIFEST_URL =
        "https://github.com/evatechnosoft/life-os-wellness/releases/latest/download/latest.json"

    /** Manifestteki kalem kimlikleri (.github/workflows/apk.yml ile ayni). */
    const val WEAR_ID = "wellness-wear"
    const val PHONE_ID = "wellness-phone"
}
