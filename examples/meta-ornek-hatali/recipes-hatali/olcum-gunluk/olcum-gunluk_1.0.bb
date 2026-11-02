# SPDX-License-Identifier: MIT
SUMMARY = "Örnek ağ geçidi için ölçüm günlüğü aracı"
HOMEPAGE = "https://github.com/mfguney/yocto-gomulu-linux"
LICENSE = "MIT"
LIC_FILES_CHKSUM = "file://${COMMON_LICENSE_DIR}/MIT;md5=0835ade698e0bcf8506ecda2f7b4f302"

SRC_URI = "file://olcum-gunluk.c"

S = "${UNPACKDIR}"

do_compile() {
    ${CC} ${CFLAGS} olcum-gunluk.c -o olcum-gunluk
}

do_install() {
    install -d ${D}${bindir}
    install -m 0755 olcum-gunluk ${D}${bindir}/
}
