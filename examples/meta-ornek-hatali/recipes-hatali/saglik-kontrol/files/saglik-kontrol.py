#!/usr/bin/python3
# SPDX-License-Identifier: MIT
"""Örnek ağ geçidinin temel sağlık göstergelerini yazdırır."""

import os
import shutil

yuk1, yuk5, yuk15 = os.getloadavg()
disk = shutil.disk_usage("/")

print(f"Yük ortalaması : {yuk1:.2f} {yuk5:.2f} {yuk15:.2f}")
print(f"Kök dizin      : %{100 * disk.used / disk.total:.0f} dolu")
