# SPDX-License-Identifier: MIT
SUMMARY = "Örnek ağ geçidi sensörleri için kalibrasyon tablosu"
HOMEPAGE = "https://github.com/mfguney/yocto-gomulu-linux"
LICENSE = "MIT"
LIC_FILES_CHKSUM = "file://${COMMON_LICENSE_DIR}/MIT;md5=0835ade698e0bcf8506ecda2f7b4f302"

SRC_URI = "file://kalibrasyon.csv"

S = "${UNPACKDIR}"

inherit allarch

do_install() {
    install -d ${D}${datadir}/ornek-kalibrasyon
    install -m 0644 kalibrasyon.csv ${D}${datadir}/ornek-kalibrasyon/
}
