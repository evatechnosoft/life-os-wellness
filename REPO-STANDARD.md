# Repo Standardı — evaitec/layers projeleri ortak düzeni

> Amaç: HRCenter, Life OS Finance ve gelecekteki servisler **aynı klasör/dosya
> düzenini, secret disiplinini ve CI/CD mantığını** paylaşır. Yeni repo bu şablonla açılır.
> Bu dosya "tek gerçek"tir; sapma görülürse düzeltilir.

## 1. Klasör düzeni (standart)

```
<repo>/
├─ apps/ | <service>/     # Deploy edilen uygulama birimleri (api, web, portal, worker)
│                         #   Life OS Finance'te: finance/ (api+ai+db) ve portal/web
├─ infra/                 # IaC — Bicep + parameters.<env>.json + deploy/destroy scriptleri
├─ pipelines/             # Azure DevOps YAML (servis başına: deploy-<service>.yml)
├─ .github/workflows/     # GitHub Actions (cron job'lar, hosting deploy)
├─ ops/                   # Operasyonel scriptler (deploy_aca.py, add_firebase_domain.py, smoke test)
├─ docs/                  # Proje seviyesi doküman (HANDOFF, migration-plan, mimari kararlar)
├─ .secrets/  (gitignored)# Yerel secret'lar — ASLA commit edilmez (tercihen repoda hiç tutulmaz)
└─ kök: sadece yapılandırma  # package.json, turbo.json, docker-compose.yml, Dockerfile,
                              # .gitignore, .dockerignore, README.md, requirements.txt, REPO-STANDARD.md
```

**Kurallar**
- Bir servisin kendi iç dokümanı servis klasöründe kalır (ör. `finance/rules.md`, `finance/decisions.md`) — `docs/`'a taşınmaz; iç bağlam servise aittir.
- Kök dizinde gevşek script/JSON export/log **bulunmaz**. Script → `ops/`, doküman → `docs/`, IaC → `infra/`.
- Başka projeye ait dosya bu repoya **girmez** (ör. HRCenter export'u Life OS reposunda olmaz).

## 2. Secret disiplini (mutlak)

- Kaynak kodda / YAML / Bicep / script'te **hardcoded secret, API key, subscription id, PAT, şifre YOK.**
- Secret'lar: yerelde `.env` (gitignored), CI'da GitHub Secrets / ADO Variable Group, runtime'da Azure Key Vault + Managed Identity.
- Service account JSON **image'a gömülmez**; runtime'da env (`FIREBASE_SA`) olarak enjekte edilir.
- Her repoda `.gitignore` baseline'ı (aşağıda) bulunur; `*.example.json` şablonları commit edilir, gerçek veri edilmez.
- Sızıntı olursa: (1) key'i **rotate et**, (2) history'den `git-filter-repo` ile temizle, (3) force-push. Silmek tek başına yetmez — git history'de kalır.

## 3. Branch & commit

- `prod` (canlı) → `test` (QA) → `dev` (aktif). `main/prod/dev`'e **doğrudan commit yok**.
- Geliştirme adlı dalda: `feature/<ID>-<ad>`, `fix/<ID>-<ad>`, `chore/<ad>`.
- Commit: Conventional Commits (`feat:`, `fix:`, `chore:`, `security:`). ADO iş öğesi varsa mesaja `#<ID>`.
- Commit öncesi: lint/typecheck + ilgili testler yeşil.

## 4. CI/CD mantığı (Build Once, Deploy Many)

- Immutable build: image bir kez build edilir (`$(Build.BuildId)` tag), aynı image `dev → test → prod` promote edilir.
- Path filtering: servis başına pipeline yalnız kendi klasörü değişince tetiklenir.
- Ortam seçimi **branch adından** türetilir (dev/test/prod), hardcode edilmez.
- Zero hardcoding: `azureSubscription`, `acrName`, `location`, RG → Variable Group (`lifeos-global-config`). YAML'da sadece `- group: ...`.
- Ortam onayları ADO Environments ile (branch değil).
- ACA auth: ACR admin key değil, **Managed Identity + AcrPull**.

## 5. .gitignore baseline (her repoda)

```
.env
.env.*
!.env.example
*serviceaccount*.json
*-firebase-adminsdk-*.json
*_Release_Pipeline.json      # ADO export artifact'ları
*<ForeignProject>*.json      # başka projeye ait export'lar
__pycache__/
*.pyc
node_modules/
*.db
*.log
*_logs.txt
.turbo/
.firebase/
```

## 6. Dosya adlandırma

- Dosyalar `snake_case`, sınıflar `PascalCase`.
- Ortam-özel dosyalar ortam önde: `parameters.dev.json`, `parameters.prod.json`.
- Şablonlar `.example` son ekiyle: `positions.example.json`, `.env.example`.

---
_Life OS Finance bu standarda göre düzenlendi (chore/repo-hardening). Yeni projeler bu dosyayı kopyalayıp uyarlar._
