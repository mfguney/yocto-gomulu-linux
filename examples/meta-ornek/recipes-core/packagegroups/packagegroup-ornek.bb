# SPDX-License-Identifier: MIT
SUMMARY = "Örnek ağ geçidi paket grupları"
DESCRIPTION = "İmaj tariflerinde kullanılan paket grupları (Bölüm 9)."
LICENSE = "MIT"

inherit packagegroup

# Birden fazla paket grubu üreten tariflerde PACKAGES, inherit satırından
# sonra tanımlanır. Sınıf, her grup için -dbg ve -dev paketlerini (ptest
# dağıtım özelliği etkinse -ptest paketlerini de) ekler.
PACKAGES = "\
    ${PN}-uygulama \
    ${PN}-tani \
"

SUMMARY:${PN}-uygulama = "Ürün uygulamaları"
RDEPENDS:${PN}-uygulama = "\
    sensor-oku \
    sensor-servis \
"

SUMMARY:${PN}-tani = "Saha ve laboratuvar tanılama araçları"
RDEPENDS:${PN}-tani = "\
    ethtool \
    iproute2 \
    iproute2-ss \
    lsof \
    procps \
"
