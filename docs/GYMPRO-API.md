# GymPro üye API'si — uç ve sorgu referansı

> 2026-09-24 · Kaynak: Club Aydınoğlu APK `assets/index.bundle` (düz JS), tüm `webClient.get/post/put/delete` çağrıları.
> Canlı yanıt **doğrulanmadı** (üye girişi yok). Bağlam ve kararlar: `SALON-UYGULAMASI.md`.

## İstek kuralları

- Taban: `https://api.fitnessonline.net/v1`, başlık `Authorization: Bearer <access_token>` (login'den, `expires_in` misafirde 86400 sn).
- **Şube yolu:** istemci `get(path, loader=true, withBranch=true)`. `withBranch` açıksa ilk segmentten sonra
  şube kimliği eklenir: `Mobile/Measurements` → **`Mobile/{branchID}/Measurements`**. Kodda `,!0,!1` ile çağrılanlar şubesizdir (tabloda "şubesiz").
  `branchID`, `GET Mobile/MemberBranch` yanıtından (`data.branchID`).
- Yanıt zarfı: `{isSuccessful, errorCode, errorMessage, data, ...}`. `errorCode` 200/300/100 akış kodu, 900 = misafir menüsü, 401 = yetkisiz.

## Kimlik ve cihaz (şubesiz)

| Yöntem | Yol | Gövde / parametre |
|---|---|---|
| GET | `Mobile/GuestLogin/{appCode}` | misafir token (`smash`) — kişisel veri yok |
| POST | `Mobile/Login` | `{CompanyCode, UserName, Password, DeviceID, DeviceBrand, DeviceModel, OsName, OsVersion}` → `data.access_token`, `data.branches`; errorCode 100/300 = cihaz kaydı gerekiyor |
| POST | `Mobile/Devices/RegisterRequest` | Login ile aynı gövde → SMS gider |
| POST | `Mobile/Devices/RegisterComplated` | aynı + `ActivationCode` (SMS) |
| GET | `Mobile/MemberBranch` | aktif şube (`branchID`, `sportsClubName`, `branchName`) |
| GET | `Mobile/MemberProfile`, `Mobile/Parametres`, `Mobile/AllBranches` | profil, ayarlar, şubeler |
| POST | `Mobile/MemberPushTokenSet` | `{PushToken}` — **kullanma** (bildirimleri bize çeker) |

## Bizim kullanacaklarımız (şubeli)

| Yöntem | Yol | Ne döner | Plan |
|---|---|---|---|
| GET | `Mobile/{b}/QrCodeGenerate` | giriş QR metni, 5 sn'de yenile | S1b |
| GET | `Mobile/{b}/Measurements` | ölçüm listesi: `measurementID`, `measurementDateFormatted`, `fatPercent`, `fatKG`, `muscleKG`, `bmi`, aralıklar | S2 |
| GET | `Mobile/SpecialMeasurements/{measurementID}` (şubesiz) | ölçüme özel ek alanlar | S2 |
| GET | `Mobile/{b}/Measurements/SegmentalGraphic/{n}` | segmental grafik verisi | S2 (isteğe bağlı) |
| GET | `Mobile/{b}/Measurements/Comparison/{1\|2\|3}` | ilk / önceki / son ölçüm | gerekmez |
| GET | `Mobile/{b}/Workouts` | hoca programları: `programID`, `beginDateFormatted`, `fitnessConsultantName`, gün alanları (`mondayWorkoutDay`…`sundayCardioDay`) | S4 |
| GET | `Mobile/{b}/Workouts/Details/{programID}/{gün}/weight\|cardio` | `data.workout[]`: `workoutID`, `trackID`, `exerciseName`, `repeat`, `weight`, `imageLink`, `videoLink`, `isComplate` | S4 |
| GET | `Mobile/Workouts/WorkoutNotes` (şubesiz) | hoca notları (`noteID`, `isRead`) | isteğe bağlı |
| GET | `Mobile/{b}/MemberSummaryInformation` | üyelik özeti (kalan gün/kredi) | S5 |
| GET | `Mobile/{b}/MemberInfo`, `Mobile/{b}/Memberships/` | üye/üyelik ayrıntısı | S5 |
| GET | `Mobile/{b}/Lessons` | grup dersleri (`lessonName`, `lessonDetails`) | kapsam dışı |
| GET | `Mobile/{b}/GetPollingList/{yıl}/{ay}` (şube elle yazılır) | aylık yoklama listesi — **giriş geçmişi olabilir** (doğrulanmadı) | S1'de bak |
| GET | `Mobile/{b}/GetActivities` (şube elle yazılır) | aktiviteler — içeriği doğrulanmadı | S1'de bak |

## Kapsam dışı — dokunulmaz

Yazma yapan veya para/rezervasyon içerenler: `Workouts/Details/Set/{trackID}/{workoutID}/{bool}`, `MembershipSeanceReserve*`,
`PreRegistration*`, `IndividualReservations*`, `StudioReservations*`, `Messages/*`, `Sales/*`, `Payment/*` (Paratika/Vakıf POS),
`Password/*`, `SetAddress`, `FileUpload`, `NewMember`, `MemberIdentityApprove/{tc}`, `LikePersonalTrainer`.

## Manager

`POST /MobileManager/Login` + `CheckTenant`; ekranlar `https://manager-app.gympro.online/` web paneli (WebView). Üye verisi için gereksiz.
