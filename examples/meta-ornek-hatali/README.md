# meta-ornek-hatali

"Yocto Project ile Gömülü Linux" kitabının [Bölüm 14 · Hata ayıklama](../../docs/bolumler/14-hata-ayiklama.md)
alıştırmasında kullanılan alıştırma katmanıdır. Katmandaki beş tarifin her biri **kasıtlı olarak**
bir hata içerir. Hataların yeri tariflerde belirtilmemiştir; amaç, hatanın BitBake çıktısı ve görev
günlükleri incelenerek bulunmasıdır.

> **Uyarı:** Bu katman ürün derlemelerine eklenmemelidir. Alıştırma tamamlandıktan sonra
> `bitbake-layers remove-layer meta-ornek-hatali` ile kurulumdan çıkarılmalıdır.

| | |
|---|---|
| Katman kimliği | `ornekhatali` |
| Uyumlu sürüm | Yocto Project 6.0 *Wrynose* |
| Bağımlılıklar | `openembedded-core` (meta) |
| Lisans | MIT |

## Kullanım

```bash
source ~/bitbake-builds/<kurulum-adı>/build/init-build-env
bitbake-layers add-layer /yol/yocto-gomulu-linux/examples/meta-ornek-hatali

# Tarifler ayrı ayrı derlenir; -k seçeneği bir hata sonrasında diğer görevlerin sürmesini sağlar
bitbake -k olcum-gunluk kalibrasyon-veri alarm-izle modbus-ayar saglik-kontrol
```

## Tarifler

| Tarif | Açıklama |
|---|---|
| `olcum-gunluk` | Ölçümleri zaman damgasıyla yazan C programı |
| `kalibrasyon-veri` | Sensör kalibrasyon tablosunu kuran veri paketi |
| `alarm-izle` | Sıcaklık eşik değerini denetleyen C programı |
| `modbus-ayar` | Modbus aygıt tanımlarını içeren yapılandırma paketi |
| `saglik-kontrol` | Sistem sağlık göstergelerini yazdıran Python betiği |

Her tarif için düzeltme tarif dosyasında yapılmalıdır. Kalite denetimlerinin `INSANE_SKIP` ile
atlanması geçerli bir çözüm olarak kabul edilmez. Örnek çözümler Bölüm 14'teki alıştırmanın
"Örnek çözüm" kutusunda yer alır.
