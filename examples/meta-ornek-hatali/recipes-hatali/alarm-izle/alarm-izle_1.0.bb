# SPDX-License-Identifier: MIT
SUMMARY = "Örnek ağ geçidi için sıcaklık alarmı izleyicisi"
HOMEPAGE = "https://github.com/mfguney/yocto-gomulu-linux"
LICENSE = "MIT"
LIC_FILES_CHKSUM = "file://${COMMON_LICENSE_DIR}/MIT;md5=0835ade698e0bcf8506ecda2f7b4f302"

SRC_URI = "file://alarm-izle.c"

do_compile() {
    ${CC} ${CFLAGS} ${LDFLAGS} alarm-izle.c -o alarm-izle
}

do_install() {
    install -d ${D}${bindir}
    install -m 0755 alarm-izle ${D}${bindir}/
}
