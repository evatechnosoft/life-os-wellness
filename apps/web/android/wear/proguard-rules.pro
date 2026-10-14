# Data Layer servisleri manifest uzerinden yansimayla oruluyor; R8 silerse
# onDataChanged hicbir zaman cagrilmaz ve hata da vermez.
-keep class com.evaitec.wellness.wear.** { *; }
# Ortak OTA kodu (shared/): kucuk, guvenlik karari burada - R8 dokunmasin.
-keep class com.evaitec.ota.** { *; }
-keep class com.evaitec.wellness.ota.** { *; }
