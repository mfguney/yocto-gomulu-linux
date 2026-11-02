# SPDX-License-Identifier: MIT
SUMMARY = "Örnek ağ geçidi için sistem sağlık kontrolü betiği"
HOMEPAGE = "https://github.com/mfguney/yocto-gomulu-linux"
LICENSE = "MIT"
LIC_FILES_CHKSUM = "file://${COMMON_LICENSE_DIR}/MIT;md5=0835ade698e0bcf8506ecda2f7b4f302"

SRC_URI = "file://saglik-kontrol.py"

S = "${UNPACKDIR}"

inherit allarch

do_install() {
    install -d ${D}${bindir}
    install -m 0755 saglik-kontrol.py ${D}${bindir}/saglik-kontrol
}
