# Sürüm takvimi

Yocto yılda iki sürüm çıkarır (nisan ve ekim civarı). İki yılda bir çıkan sürüm **LTS** olur ve dört yıl
desteklenir. Diğer sürümler yaklaşık yedi ay desteklenir.

| Sürüm | Kod adı | Çıkış | Tür | Destek sonu | BitBake |
|---|---|---|---|---|---|
| 6.2 | Garburn | Nisan 2027 (planlanan) | Kararlı | Ekim 2027 (planlanan) | 2.22 |
| 6.1 | Blacksail | Eylül 2026 | Kararlı | Nisan 2027 | 2.20 |
| **6.0** | **Wrynose** | **Nisan 2026** | **LTS** | **Nisan 2030** | 2.18 |
| 5.3 | Whinlatter | 2025 sonu | Kararlı | sona erdi | 2.16 |
| 5.2 | Walnascar | Nisan 2025 | Kararlı | sona erdi | 2.12 |
| 5.1 | Styhead | Eylül 2024 | Kararlı | sona erdi | 2.10 |
| 5.0 | Scarthgap | Nisan 2024 | LTS | Nisan 2028 | 2.8 |
| 4.0 | Kirkstone | Nisan 2022 | LTS | sona erdi | 2.0 |

<small>Kaynak: [wiki.yoctoproject.org/wiki/Releases](https://wiki.yoctoproject.org/wiki/Releases) ve dashboard.yoctoproject.org, Kasım 2026.
Tarihler değişebilir; güncel bilgi için bu sayfaya bakın.</small>

## 6.0 *Wrynose* öne çıkanlar (önceki LTS 5.0'a göre)

Aşağıdakilerin bir kısmı 5.1–5.3 ara sürümlerinde geldi; 6.0 bunların hepsini içeren ilk LTS'tir.

- Linux 6.18 LTS, GCC 15.2, glibc 2.43, LLVM 22.1, Rust 1.94, Go 1.26
- **`bitbake-setup`** (5.3'ten beri): resmî kurulum aracı. Varsayılan olarak sstate paylaşımı, yerel değişiklikleri koruyarak
  güncelleme, VS Code entegrasyonu
- **Yapılandırma parçaları** ve `bitbake-config-build` (5.2'den beri)
- Clang ile derleme kolaylaştı (`PREFERRED_TOOLCHAIN_TARGET`)
- `cve-check` yerine **`sbom-cve-check`**; SPDX 3.0'da PURL ve “concluded license”; SPDX 2.2 kaldırıldı
- OpenSSL'de TLS 1.0/1.1 varsayılan olarak kapalı
- `nodistro` için varsayılan init sistemi **systemd** (Poky sysvinit'te kaldı)
- Yeni desteklenen derleme makineleri: Ubuntu 26.04, Fedora 43, openSUSE Leap 16.0
- Önerilen derleme makinesi: **32 GB RAM, 140 GB disk**

## Eski sürümden geçenler için kontrol listesi

- [ ] Poky deposu yerine `bitbake-setup` (Poky deposu artık güncellenmiyor)
- [ ] `S = "${WORKDIR}..."` satırlarını `UNPACKDIR` kullanacak şekilde değiştir; git tariflerinde `S`'yi sil (5.1 / 5.3)
- [ ] `KERNEL_IMAGETYPE = "fitImage"` yerine ayrı FIT tarifi (5.3)
- [ ] `DISTRO_FEATURES_BACKFILL*` → `DISTRO_FEATURES_DEFAULTS` / `DISTRO_FEATURES_OPTED_OUT` (6.0)
- [ ] `INHERIT += "cve-check"` → `core/yocto/sbom-cve-check` parçası (6.0)
- [ ] `.wks` dosyalarını katmanın `files/wic/` dizinine taşı (6.0)
- [ ] pkg-config kullanan tariflerde `inherit pkgconfig` (6.0)
- [ ] `npm`/`npmsw` getiricileri devre dışı (6.0)
- [ ] Atamalarda `=` işaretinin iki yanında boşluk (`FOO = "bar"`). Boşluksuz yazım 5.3 ile uyarı veriyor

Ayrıntılar: [Yocto Migration Guides](https://docs.yoctoproject.org/migration-guides/)
