# SPDX-License-Identifier: MIT
SUMMARY = "Örnek ağ geçidi için sensör okuma servisi"
DESCRIPTION = "sensor-oku aracını sistem açılışında bir kez çalıştıran systemd \
servisi. ornek-servis sınıfının kullanımını gösterir (Bölüm 8)."
HOMEPAGE = "https://github.com/mfguney/yocto-gomulu-linux"
LICENSE = "MIT"
LIC_FILES_CHKSUM = "file://${COMMON_LICENSE_DIR}/MIT;md5=0835ade698e0bcf8506ecda2f7b4f302"

SRC_URI = "file://sensor-servis.service"

S = "${UNPACKDIR}"

inherit ornek-servis

# Servis, sensor-oku programını çalıştırır
RDEPENDS:${PN} = "sensor-oku"
