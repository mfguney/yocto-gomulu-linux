# SPDX-License-Identifier: MIT
SUMMARY = "Örnek ağ geçidi için Modbus aygıt tanımları"
HOMEPAGE = "https://github.com/mfguney/yocto-gomulu-linux"
LICENSE = "MIT"
LIC_FILES_CHKSUM = "file://${COMMON_LICENSE_DIR}/MIT;md5=0835ade698e0bcf8506ecda2f7b4f303"

SRC_URI = "file://modbus-aygitlar.conf"

S = "${UNPACKDIR}"

inherit allarch

do_install() {
    install -d ${D}${sysconfdir}/ornek
    install -m 0644 modbus-aygitlar.conf ${D}${sysconfdir}/ornek/
}
