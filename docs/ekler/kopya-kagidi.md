# Komut özeti

Sık kullanılan komut ve değişkenlerin hızlı başvuru listesi.

## Kurulum (6.0+)

```bash
python3 -m venv ~/bitbake-setup-venv && . ~/bitbake-setup-venv/bin/activate && pip install bitbake-setup
bitbake-setup settings set --global default top-dir-prefix $HOME
bitbake-setup list                       # şablonlar
bitbake-setup init                       # yeni kurulum (etkileşimli)
bitbake-setup status                     # şablondan sapma var mı?
bitbake-setup update                     # şablonla eşitle
source ~/bitbake-builds/<kurulum>/build/init-build-env
```

## Yapılandırma parçaları

```bash
bitbake-config-build list-fragments
bitbake-config-build enable-fragment machine/qemuarm64
bitbake-config-build enable-fragment core/yocto/sstate-mirror-cdn
bitbake-config-build disable-fragment <parça>
```

## Derleme

```bash
bitbake <hedef>                          # tarif veya imaj
bitbake -c <görev> <tarif>               # tek görev: fetch, compile, install, devshell, menuconfig…
bitbake -c <görev> -f <tarif>            # zorla yeniden çalıştır
bitbake -c listtasks <tarif>
bitbake -k <hedef>                       # hata olsa da devam et (ne kadar kırık olduğunu görmek için)
bitbake --runall=fetch <imaj>            # her şeyi önceden indir (çevrimdışı hazırlık)
bitbake -c populate_sdk <imaj>           # SDK üret
```

## Sorgulama

```bash
bitbake-getvar -r <tarif> <DEGISKEN>     # değer + geçmişi
bitbake-getvar --value <DEGISKEN>        # sadece değer (genel)
bitbake -e <tarif> | grep ^DEGISKEN=
bitbake-layers show-layers | show-recipes | show-appends | show-overlayed
oe-pkgdata-util list-pkgs -p <tarif>
oe-pkgdata-util list-pkg-files <paket>
oe-pkgdata-util find-path /usr/bin/<dosya>
```

## Temizlik

```bash
bitbake -c clean <tarif>                 # WORKDIR + damgalar
bitbake -c cleansstate <tarif>           # + sstate
bitbake -c cleanall <tarif>              # + indirilenler
rm -rf tmp/                              # güvenli; DL_DIR ve SSTATE_DIR korunmalı
```

## Çalıştırma

```bash
runqemu <makine> nographic snapshot      # Ctrl+A X ile çık
runqemu <makine> slirp                   # root yetkisi gerektirmeyen ağ
```

## Atama operatörleri

| | Ne yapar? | Ne zaman? |
|---|---|---|
| `=` | ata (tembel genişletme) | ayrıştırma |
| `?=` | tanımsızsa ata | ayrıştırma |
| `??=` | zayıf varsayılan | ayrıştırma sonu |
| `:=` | hemen genişlet | ayrıştırma |
| `+=` `=+` | boşluklu ekle (sona/başa) | ayrıştırma |
| `.=` `=.` | boşluksuz ekle (sona/başa) | ayrıştırma |
| `:append` `:prepend` | boşluksuz ekle | okunurken |
| `:remove` | kelime sil | okunurken, en son |

## Sık kullanılan yol değişkenleri

| Değişken | Değer |
|---|---|
| `${bindir}` | `/usr/bin` |
| `${sbindir}` | `/usr/sbin` |
| `${libdir}` | `/usr/lib` (64-bit multilib'de `/usr/lib64` olabilir) |
| `${sysconfdir}` | `/etc` |
| `${datadir}` | `/usr/share` |
| `${localstatedir}` | `/var` |
| `${systemd_system_unitdir}` | `/usr/lib/systemd/system` (usrmerge ile; yoksa `/lib/systemd/system`) |
| `${D}` | sahte kök (`${WORKDIR}/image`) |
| `${S}` | kaynak dizini (varsayılan `${UNPACKDIR}/${BP}`) |
| `${B}` | derleme dizini |
| `${UNPACKDIR}` | `${WORKDIR}/sources` |

## Minimal tarif

```bitbake
SUMMARY = "..."
LICENSE = "MIT"
LIC_FILES_CHKSUM = "file://${COMMON_LICENSE_DIR}/MIT;md5=0835ade698e0bcf8506ecda2f7b4f302"
SRC_URI = "file://ornek.c"
S = "${UNPACKDIR}"
do_compile() { ${CC} ${CFLAGS} ${LDFLAGS} ornek.c -o ornek; }
do_install() { install -Dm0755 ornek ${D}${bindir}/ornek; }
```
