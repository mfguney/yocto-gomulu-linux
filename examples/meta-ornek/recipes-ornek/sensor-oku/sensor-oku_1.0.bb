# SPDX-License-Identifier: MIT
SUMMARY = "Örnek ağ geçidi için sensör okuma aracı"
DESCRIPTION = "Sıcaklık sensörü okumalarını benzeten ve standart çıktıya \
yazan küçük bir C programı."
HOMEPAGE = "https://github.com/mfguney/yocto-gomulu-linux"
LICENSE = "MIT"
LIC_FILES_CHKSUM = "file://${COMMON_LICENSE_DIR}/MIT;md5=0835ade698e0bcf8506ecda2f7b4f302"

SRC_URI = "file://sensor-oku.c"

S = "${UNPACKDIR}"

do_compile() {
    ${CC} ${CFLAGS} ${LDFLAGS} sensor-oku.c -o sensor-oku
}

do_install() {
    install -d ${D}${bindir}
    install -m 0755 sensor-oku ${D}${bindir}/
}
