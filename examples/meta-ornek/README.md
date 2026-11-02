# meta-ornek

"Yocto Project ile Gömülü Linux" kitabının örnek ürün katmanı. Kitap boyunca ele alınan örnek
ürün, ekransız bir **endüstriyel sensör ağ geçidi**dir; dağıtımın adı **ÖrnekOS**'tur.

| | |
|---|---|
| Uyumlu sürüm | Yocto Project 6.0 *Wrynose* |
| Bağımlılıklar | `openembedded-core` (meta). `ornekos` distro'su için `meta-poky` (meta-yocto deposu) |
| Lisans | MIT |

## Kullanım

```bash
source ~/bitbake-builds/<kurulum-adı>/build/init-build-env
bitbake-layers add-layer /yol/yocto-gomulu-linux/examples/meta-ornek

bitbake sensor-oku                # yalnızca tarif
bitbake ornek-image               # örnek imaj

# İsteğe bağlı
bitbake-config-build enable-fragment ornek/gelistirici   # geliştirici özellikleri
bitbake-config-build enable-fragment distro/ornekos      # ÖrnekOS dağıtımı (Bölüm 11)
```

## İçerik

| Dosya | Bölüm |
|---|---|
| `conf/layer.conf` | 7 |
| `conf/fragments/gelistirici.conf` | 7 |
| `recipes-ornek/sensor-oku/` | 6 |
| `recipes-core/base-files/base-files_%.bbappend` | 7 |
| `classes/ornek-servis.bbclass` | 8 |
| `recipes-ornek/sensor-servis/` | 8 |
| `recipes-core/images/ornek-image.bb`, `ornek-image-dev.bb` | 9 |
| `recipes-core/packagegroups/packagegroup-ornek.bb` | 9 |
| `files/wic/ornek-disk-pcbios.wks` | 9 |
| `conf/machine/ornek-agecidi.conf` | 10 |
| `conf/distro/ornekos.conf` | 11 |
| `recipes-kernel/linux/linux-yocto_%.bbappend`, `files/ornek-cekirdek.cfg` | 12 |
| `recipes-kernel/ornek-sensor-mod/` | 12 |
| `conf/fragments/urun.conf`, `sbom.conf`, `ci.conf` | 16–18 |
