# SPDX-License-Identifier: MIT
# Ürün imajının tüm tanımını devralan geliştirme varyantı (Bölüm 9)
require ornek-image.bb

SUMMARY = "Örnek ağ geçidi geliştirme imajı"
DESCRIPTION = "ornek-image içeriğine ek olarak servis, tanılama araçları, SSH \
sunucusu ve hata ayıklama araçları içerir. Sahaya gönderilmez."

IMAGE_INSTALL += "packagegroup-ornek-uygulama packagegroup-ornek-tani"

IMAGE_FEATURES += "ssh-server-dropbear tools-debug"

# Geliştirme sırasında dosya kopyalamak için 64 MB ek boş alan (KB)
IMAGE_ROOTFS_EXTRA_SPACE = "65536"
