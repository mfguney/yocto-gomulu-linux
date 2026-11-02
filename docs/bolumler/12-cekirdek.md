# 12 · Linux çekirdeği

<div class="kunye" markdown>
<span>Süre: ~55 dk + uygulama</span><span>Düzey: Orta–İleri</span><span>Ön koşul: Bölüm 7, 10 ve 11 (ÖrnekOS etkin)</span>
</div>

!!! hedef "Öğrenme hedefleri"
    Bu bölümün sonunda:

    - Çekirdek tarifinin nasıl seçildiğini ve `linux-yocto` ile üretici çekirdekleri arasındaki farkı açıklayabilirsiniz.
    - Çekirdek yapılandırmasını `.cfg` parçaları ve `KERNEL_FEATURES` ile kalıcı biçimde değiştirebilirsiniz.
    - `menuconfig` ile yapılan değişiklikleri `diffconfig` ile parçaya dönüştürebilirsiniz.
    - Çekirdeğe yama ekleyebilir ve `devtool` ile çekirdek kaynağında çalışabilirsiniz.
    - Ağaç dışı (out-of-tree) bir çekirdek modülü için tarif yazabilirsiniz.
    - 5.3 ile değişen FIT imajı üretim yöntemini uygulayabilirsiniz.

## 12.1 Çekirdek tarifleri ve sağlayıcı seçimi

Yocto'da çekirdek, `virtual/kernel` sanal hedefini karşılayan sıradan bir tariftir. Hangi tarifin
kullanılacağı makine dosyasında belirlenir:

```bitbake
PREFERRED_PROVIDER_virtual/kernel ??= "linux-yocto"          # qemu.inc
PREFERRED_PROVIDER_virtual/kernel ??= "linux-raspberrypi"    # meta-raspberrypi
```

Çekirdek tarifleri iki gruba ayrılır:

| | `linux-yocto` ailesi | Üretici çekirdekleri |
|---|---|---|
| Örnekler | `linux-yocto`, `linux-yocto-rt`, `linux-yocto-tiny` | `linux-raspberrypi`, `linux-imx`, `linux-ti-staging` |
| Kaynak | Yocto Project'in çekirdek deposu (LTS dalları) | Üreticinin çekirdek çatalı |
| Temel yapılandırma | `yocto-kernel-cache` içindeki BSP tanımları (`KMACHINE`) | Çoğunlukla bir `defconfig` (`KBUILD_DEFCONFIG`) |
| Kapsam | QEMU makineleri ve başvuru kartları | Üreticinin kart ve işlemcileri |

Yocto 6.0'ın `linux-yocto` sürümü **Linux 6.18**'dir; Poky `PREFERRED_VERSION_linux-yocto ?= "6.18%"`
satırını içerir. Üretici çekirdeklerinin çoğu `linux-yocto.inc` dosyasını devralır; bu nedenle bu bölümde
anlatılan yapılandırma parçası yöntemi onlarda da çalışır. Kendi çekirdek deposunu kullanmak isteyen
kurumlar için OE-Core'daki `meta-skeleton/recipes-kernel/linux/linux-yocto-custom.bb` tarifi bir
şablondur.

!!! dikkat "`OLDEST_KERNEL` sınırı"
    6.0'da `OLDEST_KERNEL = "5.15"` değeri geçerlidir: C kütüphanesi en az Linux 5.15 çekirdeğinde
    çalışacak biçimde derlenir. Üreticinin BSP'si daha eski bir çekirdek kullanıyorsa kullanıcı alanı
    açılışta çalışmayabilir. BSP seçiminde çekirdek sürümü bu nedenle de denetlenmelidir.

!!! info ":material-history: Önceki sürümlerde: çekirdek sürümleri"
    5.0 *Scarthgap* `linux-yocto` 6.6 ile yayımlanmıştı. 5.0'dan 6.0'a geçişte çekirdek ana sürümü
    değiştiği için kurumun çekirdek yamaları ve yapılandırma parçaları yeniden doğrulanmalıdır.
    6.0 ile ayrıca `KERNEL_FEATURES` değişkenine `rust` eklenerek çekirdekte Rust desteği etkinleştirilebilir;
    Rust ile yazılmış ağaç dışı modüller için `module-rust` sınıfı eklenmiştir.

## 12.2 Çekirdek görev zinciri

`linux-yocto` tarifinde standart görevlere çekirdeğe özgü görevler eklenir:

| Görev | İşlev |
|---|---|
| `do_kernel_checkout` | Çekirdek deposunda `KBRANCH` dalını hazırlar |
| `do_kernel_metadata` | `yocto-kernel-cache` ve `SRC_URI` içindeki `.scc`/`.cfg` dosyalarını işler |
| `do_patch` | Yamaları uygular |
| `do_kernel_configme` | Parçaları birleştirerek `.config` dosyasını oluşturur |
| `do_kernel_configcheck` | İstenen seçeneklerin `.config` dosyasına girip girmediğini denetler |
| `do_compile`, `do_compile_kernelmodules` | Çekirdeği ve modülleri derler |
| `do_shared_workdir` | Modül derlemesi için gereken dosyaları paylaşılan dizine kopyalar |
| `do_deploy` | Çekirdek imajını ve aygıt ağaçlarını `tmp/deploy/images/<makine>/` altına yerleştirir |

Çekirdek kaynağı tarifin kendi çalışma dizininde değil, `tmp/work-shared/<makine>/kernel-source`
dizininde (`STAGING_KERNEL_DIR`) tutulur. Ağaç dışı modüller bu dizine karşı derlenir.

## 12.3 Yapılandırma parçaları ve `KERNEL_FEATURES`

Çekirdek yapılandırması (`.config`) tek bir dosya olarak tutulmaz; **yapılandırma parçalarından**
(*configuration fragments*) birleştirilir. Bir parça, yalnızca değiştirilmek istenen `CONFIG_` satırlarını
içeren `.cfg` uzantılı bir dosyadır. Bu yaklaşımın üstünlükleri:

- Kuruma özgü değişiklikler küçük ve okunabilir kalır; neyin neden değiştiği görülür.
- Yukarı akıştaki yapılandırma güncellendiğinde kurumun parçası yeniden uygulanır, çakışma oluşmaz.
- Aynı parça farklı makinelerde ve çekirdek sürümlerinde kullanılabilir.

Örnek ürünün parçası ve onu uygulayan tarif eki:

```text title="examples/meta-ornek/recipes-kernel/linux/files/ornek-cekirdek.cfg"
# Yazılım bekçi köpeği (watchdog) çekirdeğe gömülü olsun
CONFIG_WATCHDOG=y
CONFIG_SOFT_WATCHDOG=y

# CAN veri yolu desteği (modül olarak)
CONFIG_CAN=m
CONFIG_CAN_RAW=m
CONFIG_CAN_DEV=m
CONFIG_CAN_VCAN=m
```

```bitbake title="examples/meta-ornek/recipes-kernel/linux/linux-yocto_%.bbappend"
FILESEXTRAPATHS:prepend := "${THISDIR}/files:"

# Parça yalnızca ÖrnekOS dağıtımı etkinken uygulanır (DISTROOVERRIDES)
SRC_URI:append:ornekos = " file://ornek-cekirdek.cfg"
```

`SRC_URI` içindeki `.cfg` dosyaları `kernel-yocto` sınıfı tarafından otomatik olarak tanınır ve
yapılandırmaya birleştirilir. `:ornekos` koşulu, katmanın yalnızca eklenmesinin başka dağıtımlarla yapılan
derlemelerin çekirdeğini değiştirmemesini sağlar ([Bölüm 7](07-katmanlar.md)'deki ilke).

**`KERNEL_FEATURES`**, `yocto-kernel-cache` içinde hazır bulunan özellik tanımlarını (`.scc` dosyaları)
etkinleştirir. Bir `.scc` dosyası bir veya daha fazla `.cfg` parçasını ve gerekiyorsa yamaları bir arada
tanımlar:

```bitbake
KERNEL_FEATURES:append = " features/can/can.scc"
```

QEMU makineleri bu yöntemle `cfg/virtio.scc` gibi özellikleri ekler. Kurum da kendi `.scc` dosyalarını
katmanında tanımlayıp `SRC_URI` ile verebilir; birden fazla parçanın tek bir adla yönetilmesi gerektiğinde
bu yöntem tercih edilir.

!!! dikkat "Parçadaki seçenek `.config` dosyasına girmeyebilir"
    Kconfig, bağımlılıkları karşılanmayan seçenekleri sessizce yok sayar. Örneğin `CONFIG_CAN_VCAN=m`
    satırı `CONFIG_CAN` etkin değilse sonuca yansımaz. `do_kernel_configcheck` görevi bu durumda
    `specified values did not make it into the kernel's final configuration` uyarısını, istenen ve
    gerçekleşen değerlerle birlikte verir. Bu uyarılar göz ardı edilmemeli; eksik bağımlılık parçaya
    eklenmelidir.

## 12.4 `menuconfig` → `diffconfig` → `.cfg` iş akışı

Hangi seçeneğin gerektiği çoğu zaman `menuconfig` arayüzünde incelenerek bulunur. Ancak `menuconfig`
yalnızca çalışma dizinindeki `.config` dosyasını değiştirir; `bitbake -c cleansstate` veya bir sürüm
güncellemesinden sonra bu değişiklik kaybolur. Kalıcı hale getirmek için fark bir parçaya dönüştürülür:

```bash
bitbake -c kernel_configme -f virtual/kernel    # bilinen bir başlangıç .config dosyası
bitbake -c menuconfig virtual/kernel            # değişiklikler arayüzde yapılır
bitbake -c diffconfig virtual/kernel            # fark WORKDIR/fragment.cfg dosyasına yazılır
```

`diffconfig` çıktısının yeri şu komutla bulunur:

```bash
ls $(bitbake-getvar -r virtual/kernel --value WORKDIR)/fragment.cfg
```

Dosya incelenir, anlamlı bir adla katmanın `files/` dizinine kopyalanır, tarif ekindeki `SRC_URI`
değişkenine eklenir ve yapılandırma denetlenir:

```bash
bitbake -c kernel_configcheck -f virtual/kernel
```

!!! iyi "Tek bir büyük `defconfig` yerine konuya göre parçalar"
    Yapılandırma parçaları konularına göre ayrılmalıdır (`watchdog.cfg`, `can.cfg`, `guvenlik.cfg` gibi).
    `menuconfig` sonrasında tam bir `.config` dosyasını `defconfig` olarak katmana kopyalamak, yukarı
    akıştaki tüm yapılandırma kararlarının kurum tarafından sahiplenilmesi anlamına gelir ve sürüm
    geçişlerini zorlaştırır. `diffconfig` çıktısında, arayüzde dolaylı olarak değişen seçenekler de
    bulunabilir; parçaya yalnızca gerçekten istenen satırlar alınmalıdır.

## 12.5 Yamalar ve `devtool` ile çekirdek geliştirme

Çekirdek kaynağında değişiklik gerektiğinde (sürücü düzeltmesi, kart desteği) değişiklik bir yama olarak
tarif ekine eklenir:

```bitbake
SRC_URI:append:ornekos = " file://0001-ornek-sensor-surucusu-duzeltme.patch"
```

Yamaların elle hazırlanması yerine `devtool` kullanılabilir. `devtool`, çekirdek kaynağını bir git
çalışma alanına çıkarır, değişikliklerin derlenmesini sağlar ve sonunda commit'leri yamaya dönüştürür
(ayrıntılar için [Bölüm 13](13-devtool-sdk.md)):

```bash
devtool modify linux-yocto                   # kaynak: build/workspace/sources/linux-yocto
cd workspace/sources/linux-yocto
# ... değişiklikler yapılır ...
git commit -a -m "ornek: sensör sürücüsü düzeltmesi"
cd -
devtool build linux-yocto
devtool build-image ornek-image              # değiştirilmiş çekirdekle imaj
devtool finish linux-yocto ~/yocto-gomulu-linux/examples/meta-ornek
```

`devtool finish`, commit'leri katmanın `recipes-kernel/linux/` dizinine yama olarak yazar ve tarif ekini
günceller. Komut çalıştırıldıktan sonra tarif ekinin içeriği gözden geçirilmeli, `:ornekos` gibi koşulların
korunduğu doğrulanmalıdır. Yapılandırma için de `devtool menuconfig linux-yocto` komutu bulunur; bu komut
farkı çalışma alanında bir parça olarak saklar.

## 12.6 Ağaç dışı çekirdek modülü

Kurumun geliştirdiği bir sürücü çekirdek kaynağına eklenmek yerine ayrı bir tarifle **ağaç dışı**
(*out-of-tree*) modül olarak derlenebilir. Bu yöntem, sürücünün çekirdekten bağımsız bir sürüm döngüsüne
sahip olmasını sağlar. OE-Core'daki `meta-skeleton/recipes-kernel/hello-mod` tarifi resmî şablondur.
Örnek ürünün modül tarifi bu şablonu izler:

```bitbake title="examples/meta-ornek/recipes-kernel/ornek-sensor-mod/ornek-sensor-mod_1.0.bb"
SUMMARY = "Örnek ağ geçidi için sensör çekirdek modülü"
LICENSE = "GPL-2.0-only"                                               # (1)!
LIC_FILES_CHKSUM = "file://${COMMON_LICENSE_DIR}/GPL-2.0-only;md5=801f80980d171dd6425610833a22dbe6"

inherit module                                                         # (2)!

SRC_URI = "file://Makefile \
           file://ornek_sensor.c \
          "

S = "${UNPACKDIR}"                                                     # (3)!

RPROVIDES:${PN} += "kernel-module-ornek-sensor"                        # (4)!

KERNEL_MODULE_AUTOLOAD += "ornek_sensor"                               # (5)!
```

1.  **Lisans.** Çekirdek modülleri çekirdekle bağlandığından genellikle GPL-2.0 lisanslıdır; kaynaktaki
    `MODULE_LICENSE("GPL")` bildirimi de buna uygun olmalıdır.
2.  **`module` sınıfı.** Derleme ve kurulum görevlerini tanımlar, çekirdek derlemesine bağımlılık ekler ve
    Makefile'a `KERNEL_SRC` değişkenini (`STAGING_KERNEL_DIR`) iletir.
3.  **Kaynak dizini.** Yerel dosyalar `UNPACKDIR` içine açıldığı için 6.0'daki doğru kullanım budur
    ([Bölüm 6](06-tarifler.md)).
4.  **Paket adı.** Sınıf, `ornek_sensor.ko` dosyasını `kernel-module-ornek-sensor-<çekirdek sürümü>` adlı
    pakete ayırır (alt çizgiler tireye dönüşür); bu paket sürümsüz adı da sağlar. Ana paket (`PN`) boş bir
    üst pakettir ve modül paketlerine bağımlıdır. Bu satır, ana paketin modül adıyla da istenebilmesini
    sağlar.
5.  **Otomatik yükleme.** Değer `.ko` dosyasının adıdır (`ornek_sensor`). Paketleme sırasında
    `modules-load.d` dizinine `ornek_sensor.conf` dosyası yazılır. systemd kullanan ÖrnekOS'ta bu dizin
    `/usr/lib/modules-load.d`, diğer init sistemlerinde `/etc/modules-load.d`'dir.

Makefile, çekirdeğin Kbuild sistemini çağıran standart biçimdedir:

```make title="examples/meta-ornek/recipes-kernel/ornek-sensor-mod/files/Makefile (kısaltılmış)"
obj-m := ornek_sensor.o

SRC := $(shell pwd)

all:
	$(MAKE) -C $(KERNEL_SRC) M=$(SRC)

modules_install:
	$(MAKE) -C $(KERNEL_SRC) M=$(SRC) modules_install
```

Modül imaja üç yoldan biriyle eklenir: imaj tarifinde veya bir parçada `IMAGE_INSTALL` ile; donanıma
bağlı bir sürücü ise makine dosyasında `MACHINE_EXTRA_RRECOMMENDS += "kernel-module-ornek-sensor"` ile
ya da açılış için zorunluysa `MACHINE_ESSENTIAL_EXTRA_RDEPENDS` ile.

!!! info ":material-history: Önceki sürümlerde: modül tariflerindeki eski kalıplar"
    Eski kaynaklardaki modül tarifleri genellikle `S = "${WORKDIR}"` satırını içerir; bu satır 5.1'den
    itibaren hata verir ve `S = "${UNPACKDIR}"` olarak değiştirilmelidir. Ayrıca otomatik yükleme için
    eskiden kullanılan `module_autoload_<ad>` değişkeni yerini `KERNEL_MODULE_AUTOLOAD` değişkenine
    bırakmıştır. Modül parametreleri ise `KERNEL_MODULE_PROBECONF` ve `module_conf_<ad>` ile verilir.

## 12.7 FIT imajları

**FIT** (*Flattened Image Tree*), çekirdeği, aygıt ağaçlarını, isteğe bağlı bir initramfs'i ve bunların
imzalarını tek bir dosyada birleştiren U-Boot biçimidir. FIT imajı, U-Boot'un doğrulanmış önyükleme
(*verified boot*) özelliğinin temelidir ([Bölüm 17](17-guvenlik-guncelleme.md)).

5.3'ten itibaren FIT imajı çekirdek tarifinde değil, ayrı bir tarifte üretilir. Bunun için iki ayar
gerekir:

```bitbake title="Makine dosyası"
KERNEL_CLASSES += "kernel-fit-extra-artifacts"
```

```bash
bitbake linux-yocto-fitimage
```

`kernel-fit-extra-artifacts` sınıfı, FIT imajına girecek çekirdek çıktılarını `DEPLOY_DIR_IMAGE` dizinine
koyar; `linux-yocto-fitimage` tarifi `kernel-fit-image` sınıfını kullanarak `fitImage` dosyasını üretir.
FIT imajı kök dosya sistemindeki çekirdeğin yerini alacaksa makine dosyasına ayrıca şunlar eklenir:

```bitbake
RRECOMMENDS:${KERNEL_PACKAGE_NAME}-base = ""
MACHINE_ESSENTIAL_EXTRA_RDEPENDS += "linux-yocto-fitimage"
KERNEL_DEPLOY_DEPEND = "linux-yocto-fitimage:do_deploy"
```

Üretici çekirdeği kullanan kartlar için, `linux-yocto-fitimage` tarifinin bir kopyası o çekirdeğe göre
uyarlanarak (ör. `linux-raspberrypi-fitimage`) kullanılabilir. 6.0 ile FIT imajına isteğe bağlı ek
yükler (`FIT_LOADABLES`) ve yapılandırma eşlemeleri (`FIT_CONF_MAPPINGS`) eklenebilmektedir.

!!! info ":material-history: Önceki sürümlerde: `KERNEL_IMAGETYPE = "fitImage"`"
    5.2 ve öncesinde FIT imajı `kernel-fitimage` sınıfıyla çekirdek tarifinin içinde üretilir ve
    `KERNEL_IMAGETYPE = "fitImage"` yazılarak etkinleştirilirdi. 5.3 ile bu sınıf kaldırılmıştır. Eski
    ayar kullanıldığında derleme
    `fitImage is no longer supported as a KERNEL_IMAGETYPE(S). FIT images are built by the linux-yocto-fitimage recipe.`
    hatasıyla durur.

!!! lab "Uygulama 12.1 · Çekirdek parçası ve `ornek-sensor-mod` modülü"
    Bu uygulama `qemux86-64` makinesi ve ÖrnekOS dağıtımıyla yapılır:

    ```bash
    bitbake-config-build enable-fragment machine/qemux86-64 distro/ornekos
    bitbake-layers show-appends linux-yocto
    bitbake-getvar -r linux-yocto --value SRC_URI | tr ' ' '\n' | grep cfg
    ```

    Beklenen çıktı, tarif ekinin uygulandığını ve parçanın `SRC_URI` içinde olduğunu gösterir:

    ```text
    === Matched appended recipes ===
    linux-yocto_6.18.bb:
      .../meta-ornek/recipes-kernel/linux/linux-yocto_%.bbappend
    file://ornek-cekirdek.cfg
    ```

    Çekirdek yapılandırılır ve denetlenir; ardından sonuç `.config` dosyasında doğrulanır:

    ```bash
    bitbake -c kernel_configcheck -f virtual/kernel
    grep -E "CONFIG_(SOFT_WATCHDOG|CAN_VCAN)=" $(bitbake-getvar -r virtual/kernel --value B)/.config
    ```

    ```text
    CONFIG_SOFT_WATCHDOG=y
    CONFIG_CAN_VCAN=m
    ```

    Modül tarifi derlenir ve üretilen paketler listelenir:

    ```bash
    bitbake ornek-sensor-mod
    oe-pkgdata-util list-pkgs -p ornek-sensor-mod | grep kernel-module
    ```

    ```text
    kernel-module-ornek-sensor-6.18.<x>-yocto-standard
    ```

    Modül imaja eklenir. `build/conf/local.conf` dosyasının sonuna şu satır yazılır:

    ```bitbake
    IMAGE_INSTALL:append = " ornek-sensor-mod"
    ```

    ```bash
    bitbake ornek-image
    runqemu qemux86-64 nographic snapshot
    ```

    QEMU içinde (adres ve zaman değerleri farklı olacaktır):

    ```text
    root@agecidi:~# grep ornek /proc/modules
    ornek_sensor 12288 0 - Live 0xffffffffc0200000 (O)
    root@agecidi:~# dmesg | grep ornek_sensor
    [    4.812345] ornek_sensor: loading out-of-tree module taints kernel.
    [    4.813210] ornek_sensor: 4 kanal ile yuklendi
    root@agecidi:~# cat /usr/lib/modules-load.d/ornek_sensor.conf
    ornek_sensor
    root@agecidi:~# zcat /proc/config.gz | grep -E "CONFIG_(SOFT_WATCHDOG|CAN_VCAN)="
    CONFIG_SOFT_WATCHDOG=y
    CONFIG_CAN_VCAN=m
    ```

    `(O)` işareti ve `taints kernel` iletisi, modülün çekirdek ağacı dışında derlendiğini gösterir; bu
    bir hata değildir. Modül, `KERNEL_MODULE_AUTOLOAD` sayesinde açılışta systemd tarafından yüklenmiştir.

## Özet

- Çekirdek `virtual/kernel` sağlayıcısıdır ve makine dosyasında `PREFERRED_PROVIDER_virtual/kernel` ile seçilir. 6.0'ın `linux-yocto` sürümü 6.18'dir.
- Yapılandırma `.cfg` parçaları ve `KERNEL_FEATURES` ile değiştirilir; parçalar tarif ekiyle `SRC_URI` değişkenine eklenir.
- `menuconfig` değişiklikleri kalıcı değildir; `diffconfig` ile parçaya dönüştürülmeli, `kernel_configcheck` ile denetlenmelidir.
- Yamalar tarif ekiyle eklenir; `devtool modify` / `finish` bu süreci otomatikleştirir.
- Ağaç dışı modüller `inherit module` ile derlenir; paket adı `kernel-module-<ad>` biçimindedir, otomatik yükleme `KERNEL_MODULE_AUTOLOAD` ile yapılır.
- 5.3'ten itibaren FIT imajı `kernel-fit-extra-artifacts` sınıfı ve `linux-yocto-fitimage` tarifiyle üretilir.

## Değerlendirme soruları

<div class="quiz" data-id="b12-1">
<p class="quiz-soru">Bir geliştirici <code>bitbake -c menuconfig virtual/kernel</code> ile bir seçeneği etkinleştirip imajı derlemiştir. Değişikliğin kalıcı olması için ne yapılmalıdır?</p>
<ul>
<li>Hiçbir şey; değişiklik sstate önbelleğinde saklanır</li>
<li>Çalışma dizinindeki <code>.config</code> dosyası sürüm denetimine eklenir</li>
<li data-dogru><code>bitbake -c diffconfig virtual/kernel</code> ile üretilen parça katmana kopyalanır ve tarif ekiyle <code>SRC_URI</code> değişkenine eklenir</li>
<li><code>local.conf</code> dosyasına <code>CONFIG_</code> satırı yazılır</li>
</ul>
<p class="quiz-aciklama"><code>menuconfig</code> yalnızca çalışma dizinindeki <code>.config</code> dosyasını değiştirir; temizlik veya sürüm güncellemesiyle kaybolur.
<code>diffconfig</code> farkı <code>fragment.cfg</code> olarak yazar; bu dosya katmanda kalıcı hale getirilir.</p>
</div>

<div class="quiz" data-id="b12-2">
<p class="quiz-soru">5.0'dan 6.0'a taşınan bir makine dosyasında <code>KERNEL_IMAGETYPE = "fitImage"</code> satırı bulunmaktadır. Sonuç ve doğru yaklaşım nedir?</p>
<ul>
<li>FIT imajı eskisi gibi üretilir</li>
<li>BitBake satırı yok sayar ve <code>Image</code> üretir</li>
<li data-dogru>Derleme hata verir; <code>KERNEL_CLASSES += "kernel-fit-extra-artifacts"</code> eklenmeli ve FIT imajı <code>linux-yocto-fitimage</code> tarifiyle üretilmelidir</li>
<li>Satır <code>KERNEL_IMAGETYPE = "uImage"</code> olarak değiştirilmelidir</li>
</ul>
<p class="quiz-aciklama">5.3 ile <code>kernel-fitimage</code> sınıfı kaldırılmıştır. FIT imajı artık ayrı bir tarifte, <code>kernel-fit-image</code> sınıfıyla üretilir.</p>
</div>

<div class="quiz" data-id="b12-3">
<p class="quiz-soru">Ağaç dışı bir modül tarifi <code>can_kopru.ko</code> dosyasını üretmektedir. Modülü makine dosyasında isteğe bağlı olarak imaja eklemek için hangi yazım doğrudur?</p>
<ul>
<li><code>MACHINE_EXTRA_RRECOMMENDS += "can_kopru.ko"</code></li>
<li data-dogru><code>MACHINE_EXTRA_RRECOMMENDS += "kernel-module-can-kopru"</code></li>
<li><code>KERNEL_FEATURES += "can_kopru"</code></li>
<li><code>DEPENDS += "kernel-module-can-kopru"</code></li>
</ul>
<p class="quiz-aciklama">Paket adı, <code>kernel-module-</code> önekine <code>.ko</code> uzantısı çıkarılmış dosya adının eklenmesiyle oluşur; alt çizgiler tireye dönüşür.
Paket bir çalışma bağımlılığıdır; <code>DEPENDS</code> derleme bağımlılığı içindir.</p>
</div>

<div class="quiz" data-id="b12-4">
<p class="quiz-soru">Bir yapılandırma parçasında <code>CONFIG_CAN_VCAN=m</code> bulunmasına rağmen seçenek son <code>.config</code> dosyasında görülmemektedir. Sorunu ortaya çıkaran görev hangisidir?</p>
<ul>
<li><code>do_fetch</code></li>
<li data-dogru><code>do_kernel_configcheck</code></li>
<li><code>do_deploy</code></li>
<li><code>do_rootfs</code></li>
</ul>
<p class="quiz-aciklama"><code>do_kernel_configcheck</code>, istenen değerleri son yapılandırmayla karşılaştırır ve eşleşmeyenleri uyarı olarak bildirir. Olası neden,
<code>CONFIG_CAN</code> gibi bir bağımlılığın etkin olmamasıdır.</p>
</div>

<div class="quiz" data-id="b12-5">
<p class="quiz-soru">Örnek katmandaki çekirdek tarif ekinde neden <code>SRC_URI += ...</code> yerine <code>SRC_URI:append:ornekos = ...</code> kullanılmıştır?</p>
<ul>
<li>Sözdizimi gereği <code>+=</code> çekirdek tariflerinde çalışmaz</li>
<li data-dogru>Parçanın yalnızca ÖrnekOS dağıtımı etkinken uygulanması ve katmanın eklenmesinin tek başına diğer derlemeleri değiştirmemesi için</li>
<li>Parça her makinede iki kez uygulanmasın diye</li>
<li>Derleme süresini kısaltmak için</li>
</ul>
<p class="quiz-aciklama"><code>DISTRO</code> değeri <code>DISTROOVERRIDES</code> aracılığıyla bir koşullu değer adıdır. Koşullu ekleme, katmanın davranışını
açıkça seçilen bir dağıtıma bağlar; bu, <code>yocto-check-layer</code> ilkeleriyle de uyumludur.</p>
</div>

!!! alistirma "Alıştırma: Modül parametresinin yapılandırılması"
    `ornek_sensor` modülü varsayılan olarak 4 kanalla yüklenmektedir. Ürün donanımında 8 kanal bulunur.

    1. Modülün açılışta `kanal_sayisi=8` parametresiyle yüklenmesini, kaynak kodu değiştirmeden sağlayın.
    2. Değişikliği `ornek-sensor-mod` tarifinde yapın ve oluşan `modprobe.d` dosyasının yolunu belirleyin.
    3. QEMU'da `/sys/module/ornek_sensor/parameters/kanal_sayisi` değerini doğrulayın.

    ??? success "Örnek çözüm"
        Tarife şu satırlar eklenir:

        ```bitbake
        KERNEL_MODULE_PROBECONF += "ornek_sensor"
        module_conf_ornek_sensor = "options ornek_sensor kanal_sayisi=8"
        ```

        Paketleme sırasında `modprobe.d` dizinine `ornek_sensor.conf` dosyası yazılır. systemd kullanan
        ÖrnekOS'ta yol `/usr/lib/modprobe.d/ornek_sensor.conf`, diğer init sistemlerinde
        `/etc/modprobe.d/ornek_sensor.conf`'tur. Doğrulama:

        ```text
        root@agecidi:~# cat /usr/lib/modprobe.d/ornek_sensor.conf
        options ornek_sensor kanal_sayisi=8
        root@agecidi:~# cat /sys/module/ornek_sensor/parameters/kanal_sayisi
        8
        ```

        `module_conf_ornek_sensor` tanımlanıp modül `KERNEL_MODULE_PROBECONF` listesine eklenmezse BitBake
        hata verir. Parametre değeri ürüne özgü bir ayarsa satırlar tarif yerine katmandaki bir tarif ekine
        veya makine dosyasına da yazılabilir.

**Sonraki bölüm:** [13 · devtool ve SDK →](13-devtool-sdk.md)
