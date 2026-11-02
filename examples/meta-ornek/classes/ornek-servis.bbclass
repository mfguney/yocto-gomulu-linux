# SPDX-License-Identifier: MIT
#
# ornek-servis: örnek ağ geçidinin systemd servisleri için ortak mantık (Bölüm 8)
#
# Kullanım (tarif içinde):
#
#   SRC_URI = "file://sensor-servis.service"
#   S = "${UNPACKDIR}"
#   inherit ornek-servis
#
# Sınıf şunları yapar:
#   1. systemd sınıfını devralır ve SYSTEMD_SERVICE değişkenini ayarlar,
#   2. servis dosyasını ${systemd_system_unitdir} altına kurar,
#   3. paketlemeden önce servis dosyasını denetleyen do_servis_denetle
#      görevini görev zincirine ekler.
#
# Not: Sınıf adı tire (-) içerdiğinden kabuk işlevleri EXPORT_FUNCTIONS ile
# dışa aktarılamaz; BitBake bu durumda ayrıştırmayı durdurur.

inherit systemd

# Servis dosyasının adı. Varsayılan: <tarif adı>.service
ORNEK_SERVIS_DOSYASI ?= "${BPN}.service"

SYSTEMD_SERVICE:${PN} ?= "${ORNEK_SERVIS_DOSYASI}"

# :append kullanıldığı için tarif kendi do_install görevini tanımlasa da
# bu satırlar görevin sonuna eklenir.
do_install:append() {
    install -d ${D}${systemd_system_unitdir}
    install -m 0644 ${UNPACKDIR}/${ORNEK_SERVIS_DOSYASI} ${D}${systemd_system_unitdir}/
}

python do_servis_denetle() {
    import os

    if not bb.utils.contains('DISTRO_FEATURES', 'systemd', True, False, d):
        bb.note("DISTRO_FEATURES içinde systemd yok; servis denetimi atlandı")
        return

    dosya = d.getVar('ORNEK_SERVIS_DOSYASI')
    yol = d.getVar('D') + d.getVar('systemd_system_unitdir') + '/' + dosya
    if not os.path.isfile(yol):
        bb.fatal("Servis dosyası kurulmamış: %s" % yol)

    with open(yol, encoding='utf-8') as f:
        satirlar = [s.strip() for s in f]

    if not any(s.startswith('ExecStart=') for s in satirlar):
        bb.fatal("%s: ExecStart= satırı bulunamadı" % dosya)
    if '[Install]' not in satirlar:
        bb.fatal("%s: [Install] bölümü yok; servis açılışta etkinleştirilemez" % dosya)

    bb.note("%s denetlendi: sorun bulunmadı" % dosya)
}
do_servis_denetle[doc] = "Kurulan systemd servis dosyasını paketlemeden önce denetler"
addtask servis_denetle after do_install before do_package
