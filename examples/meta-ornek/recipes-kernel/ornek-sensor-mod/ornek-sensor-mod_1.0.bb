# SPDX-License-Identifier: MIT
SUMMARY = "Örnek ağ geçidi için sensör çekirdek modülü"
DESCRIPTION = "Sensör kanallarını benzeten, ağaç dışında derlenen basit bir \
Linux çekirdek modülü (Bölüm 12)."
HOMEPAGE = "https://github.com/mfguney/yocto-gomulu-linux"
LICENSE = "GPL-2.0-only"
LIC_FILES_CHKSUM = "file://${COMMON_LICENSE_DIR}/GPL-2.0-only;md5=801f80980d171dd6425610833a22dbe6"

inherit module

SRC_URI = "file://Makefile \
           file://ornek_sensor.c \
          "

S = "${UNPACKDIR}"

# module sınıfı, ornek_sensor.ko dosyasını "kernel-module-ornek-sensor-<çekirdek
# sürümü>" adlı pakete ayırır. Ana paket (PN) bu paketlere bağımlı boş bir
# üst pakettir; aşağıdaki satır tarifin modül adıyla da istenebilmesini sağlar.
RPROVIDES:${PN} += "kernel-module-ornek-sensor"

# Açılışta otomatik yükleme: modules-load.d altına ornek_sensor.conf yazılır
KERNEL_MODULE_AUTOLOAD += "ornek_sensor"
