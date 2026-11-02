# SPDX-License-Identifier: MIT
SUMMARY = "Örnek ağ geçidi ürün imajı (ÖrnekOS)"
LICENSE = "MIT"

inherit core-image

# İmaj tarifinin kendisi olduğu için burada = kullanılabilir
IMAGE_INSTALL = "packagegroup-core-boot ${CORE_IMAGE_EXTRA_INSTALL} sensor-oku"

IMAGE_LINGUAS = ""
