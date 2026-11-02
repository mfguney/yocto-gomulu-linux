# SPDX-License-Identifier: MIT
# ÖrnekOS çekirdek yapılandırma parçası (Bölüm 12)
FILESEXTRAPATHS:prepend := "${THISDIR}/files:"

# Parça yalnızca ÖrnekOS dağıtımı etkinken uygulanır (DISTROOVERRIDES).
# Böylece katmanın eklenmesi tek başına diğer dağıtımların çekirdeğini değiştirmez.
SRC_URI:append:ornekos = " file://ornek-cekirdek.cfg"
