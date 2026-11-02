# Yocto Project ile Gömülü Linux

**Yocto Project ve OpenEmbedded üzerine açık kaynak, Türkçe başvuru ve öğretim kitabı.**

Kitap, gömülü cihazlar için özel Linux dağıtımı üretme sürecini temel kavramlardan ürünleştirmeye kadar
sistematik biçimde ele alır. Her bölüm kavramsal anlatım, uygulama çalışmaları, özet, etkileşimli
değerlendirme soruları ve bir alıştırmadan oluşur. Örnekler, ekransız bir endüstriyel sensör ağ geçidi
için tanımlanan **ÖrnekOS** dağıtımı üzerinden ilerler.

- **Çevrimiçi sürüm:** https://mfguney.github.io/yocto-gomulu-linux/
- **Sürüm kapsamı:** Yocto Project 6.0 *Wrynose* (LTS, Nisan 2030'a kadar destekli); `bitbake-setup` ve yapılandırma parçaları dahil
- **Etkileşimli öğeler:** değerlendirme soruları, BitBake operatör simülatörü, görev zinciri şemaları ve dosyaların dizinler arasındaki hareketini gösteren 7 animasyonlu şema
- **Örnekler:**
  - [`examples/meta-ornek`](examples/meta-ornek): kitap boyunca geliştirilen ürün katmanı
  - [`examples/meta-ornek-hatali`](examples/meta-ornek-hatali): Bölüm 14'teki hata ayıklama alıştırması için kasıtlı olarak hatalı tarifler
  - [`examples/ci`](examples/ci): bitbake-setup şablonu, kas dosyası, GitHub Actions iş akışı ve Dockerfile (Bölüm 18)

## Durum

| Kısım | Bölümler | Durum |
|---|---|---|
| I · Temeller | 1 Gömülü Linux ve Yocto · 2 Ekosistem · 3 İlk derleme · 4 Build dizini | Tamamlandı |
| II · BitBake ve metadata | 5 BitBake dili · 6 Tarifler · 7 Katmanlar · 8 Sınıflar | Tamamlandı |
| III · Dağıtım tasarımı | 9 İmajlar · 10 Makine/BSP · 11 Dağıtım · 12 Çekirdek | Tamamlandı |
| IV · Geliştirme süreçleri | 13 devtool/SDK · 14 Hata ayıklama · 15 Derleme performansı | Tamamlandı |
| V · Ürünleştirme | 16 Lisans/SBOM/CVE · 17 Güvenlik/güncelleme · 18 Sürekli entegrasyon | Tamamlandı |

Sürüm 1.0: tüm bölümler yazılmış ve Yocto 6.0 kaynak kodu ile belgelerine göre teknik incelemeden
geçmiştir. Uygulama çalışmaları henüz gerçek bir derleme ortamında uçtan uca çalıştırılmamıştır;
geri bildirimler issue olarak bildirilebilir.

Yol haritası ve öneriler: [ONERILER.md](ONERILER.md)

## Yerel önizleme

```bash
python3 -m venv .venv && . .venv/bin/activate
pip install -r requirements.txt
mkdocs serve          # http://127.0.0.1:8000
```

Windows (PowerShell):

```powershell
py -m venv .venv; .venv\Scripts\Activate.ps1
pip install -r requirements.txt
mkdocs serve
```

## GitHub Pages'te yayınlama

1. GitHub'da `mfguney/yocto-gomulu-linux` adlı boş bir depo oluşturun ve bu klasörü `main` dalına gönderin.
2. Depo ayarlarında **Settings → Pages → Source: GitHub Actions** seçeneğini etkinleştirin.
3. `main` dalına yapılan her gönderimde `.github/workflows/yayinla.yml` siteyi derler ve
   https://mfguney.github.io/yocto-gomulu-linux/ adresinde yayınlar.

## Katkı

Katkı süreci: [CONTRIBUTING.md](CONTRIBUTING.md)

## Lisans

- Kitap metni ve görseller: [CC BY-SA 4.0](LICENSE)
- `examples/` altındaki kodlar ve sitedeki JavaScript dosyaları: [MIT](examples/meta-ornek/COPYING.MIT)

Yocto Project, Linux Foundation'ın tescilli markasıdır. Bu kitap bağımsız bir topluluk çalışmasıdır;
Yocto Project tarafından yayımlanmamış veya onaylanmamıştır. Teknik bilgiler resmî
[Yocto Project belgelerinden](https://docs.yoctoproject.org/) yararlanılarak özgün olarak yazılmıştır.
