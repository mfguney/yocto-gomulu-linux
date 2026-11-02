// SPDX-License-Identifier: GPL-2.0-only
/*
 * ornek_sensor: örnek ağ geçidi için sensör modülü (benzetim, Bölüm 12)
 *
 * Gerçek bir sürücü yerine, ağaç dışı modül tarifinin yapısını göstermek
 * amacıyla yalnızca bir modül parametresi tanımlar ve çekirdek günlüğüne yazar.
 */
#include <linux/init.h>
#include <linux/module.h>
#include <linux/moduleparam.h>

static unsigned int kanal_sayisi = 4;
module_param(kanal_sayisi, uint, 0444);
MODULE_PARM_DESC(kanal_sayisi, "Benzetilen sensor kanali sayisi (1-16)");

static int __init ornek_sensor_init(void)
{
	if (kanal_sayisi < 1 || kanal_sayisi > 16) {
		pr_err("ornek_sensor: gecersiz kanal_sayisi=%u\n", kanal_sayisi);
		return -EINVAL;
	}
	pr_info("ornek_sensor: %u kanal ile yuklendi\n", kanal_sayisi);
	return 0;
}

static void __exit ornek_sensor_exit(void)
{
	pr_info("ornek_sensor: kaldirildi\n");
}

module_init(ornek_sensor_init);
module_exit(ornek_sensor_exit);

MODULE_LICENSE("GPL");
MODULE_DESCRIPTION("Ornek ag gecidi sensor modulu (benzetim)");
MODULE_AUTHOR("Ornek Kurum");
