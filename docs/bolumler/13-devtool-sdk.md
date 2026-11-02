# 13 · devtool ve SDK

<div class="kunye" markdown>
<span>Süre: ~50 dk + uygulama</span><span>Düzey: Orta</span><span>Ön koşul: Bölüm 6, 7 ve 9</span>
</div>

!!! hedef "Öğrenme hedefleri"
    Bu bölümün sonunda:

    - Uygulama geliştirme için devtool, standart SDK ve genişletilebilir SDK arasındaki farkı açıklayabilirsiniz.
    - devtool çalışma alanının yapısını ve `externalsrc` mekanizmasını açıklayabilirsiniz.
    - Var olan bir tarifin kaynağını `devtool modify` ile değiştirip hedef cihazda deneyebilirsiniz.
    - Değişiklikleri `devtool finish` ile yama olarak kurumun katmanına aktarabilirsiniz.
    - Bir imaja uygun SDK üretip kurabilir ve SDK ile çapraz derleme yapabilirsiniz.
    - VS Code yapılandırmasını `bitbake-setup` ve `devtool ide-sdk` ile oluşturabilirsiniz.

## 13.1 Geliştirme döngüsü sorunu

Bir uygulama dosyasında yapılan küçük bir değişikliğin imaj derlenerek denenmesi, geliştirme
döngüsünü gereksiz yere uzatır: tarifin değiştirilmesi, imajın yeniden üretilmesi, cihaza yazılması ve
cihazın yeniden başlatılması gerekir. Yocto Project bu döngüyü kısaltmak için iki yaklaşım sunar:

1. **Derleme ortamı içinde çalışmak (devtool):** Geliştirici BitBake kurulumuna erişebilir. Kaynak kod
   geçici bir çalışma alanına alınır, yalnızca ilgili tarif derlenir ve çıktı ağ üzerinden cihaza gönderilir.
2. **Derleme ortamı dışında çalışmak (SDK):** Uygulama geliştiricisine yalnızca çapraz derleyici ve hedef
   kütüphaneleri içeren bir kurulum paketi verilir. Geliştiricinin Yocto bilgisine gereksinimi yoktur.

| | devtool | Standart SDK | Genişletilebilir SDK (eSDK) | `devtool ide-sdk` |
|---|---|---|---|---|
| Çalışma yeri | BitBake kurulumu | Bağımsız kurulum (`/opt/...`) | Bağımsız kurulum (`~/..._sdk`) | BitBake kurulumu |
| İçerik | Tüm metadata | Araç takımı + sysroot | Araç takımı + devtool + sstate | Tarife özgü araç takımı + IDE yapılandırması |
| Tarif değişikliği | Evet | Hayır | Evet (devtool ile) | Evet |
| Tipik kullanıcı | Sistem/BSP geliştiricisi | Uygulama geliştiricisi | Uygulama geliştiricisi | IDE kullanan geliştirici |

## 13.2 devtool çalışma alanı

devtool, ilk çalıştırıldığında derleme dizininde `workspace` adlı bir katman oluşturur ve bu katmanı
`bblayers.conf` dosyasına ekler:

```text
build/workspace/
├── conf/layer.conf      # çalışma alanı katmanının tanımı
├── appends/             # devtool'un oluşturduğu tarif ekleri (sensor-oku_1.0.bbappend)
├── recipes/             # devtool add ile oluşturulan yeni tarifler
├── sources/             # üzerinde çalışılan kaynak ağaçları (her biri bir git deposu)
└── attic/               # sıfırlanan tariflerin korunan kaynak ağaçları
```

Mekanizmanın merkezinde `externalsrc` sınıfı bulunur. `devtool modify` komutu, tarif için
`appends/` altında bir tarif eki yazar. Bu ek `inherit externalsrc` satırını ve
`EXTERNALSRC:pn-<tarif>` değişkenini içerir. Böylece BitBake `do_fetch`, `do_unpack` ve `do_patch`
görevlerini atlar ve doğrudan `sources/<tarif>` dizinindeki kodu derler. Asıl tarif dosyasında hiçbir
değişiklik yapılmaz.

!!! dikkat "Çalışma alanı geçicidir"
    `build/workspace` sürüm kontrolüne eklenmemeli ve ekip arasında paylaşılmamalıdır. Çalışma alanındaki
    bir tarif eki, aynı tarifin tüm derlemelerini geliştiricinin yerel kaynak ağacına yönlendirir.
    Çalışma tamamlandığında değişiklikler `devtool finish` ile kurumun katmanına aktarılmalıdır.
    `devtool status` komutu çalışma alanındaki tarifleri listeler.

## 13.3 Var olan bir tarifin değiştirilmesi

Bu iş akışı dört komuttan oluşur:

| Komut | İşlevi |
|---|---|
| `devtool modify <tarif>` | Kaynağı `workspace/sources/<tarif>` altına açar, git deposu oluşturur, tarif ekini yazar |
| `devtool build <tarif>` | Tarifi çalışma alanındaki kaynaktan derler (`do_populate_sysroot` ve `do_packagedata` görevlerine kadar) |
| `devtool deploy-target <tarif> <kullanıcı@adres>` | `do_install` çıktısını (`${D}`) SSH üzerinden çalışan hedefe kopyalar |
| `devtool finish <tarif> <katman>` | git commit'lerini yamaya dönüştürüp katmana yazar, çalışma alanını temizler |

`devtool modify` komutu kaynağı açtıktan sonra `devtool-base` etiketli bir başlangıç commit'i oluşturur
ve `devtool` adlı bir dala geçer. Tarifte yamalar varsa her yama ayrı bir commit olarak uygulanır.
`devtool finish` bu başlangıç noktasından sonraki commit'leri yamalara dönüştürür. **Commit edilmemiş
değişiklikler aktarılmaz;** kaynak ağacı temiz değilse `devtool finish` hata verir.

`devtool finish` komutunun sonucu, tarifin bulunduğu katmanla hedef katmanın ilişkisine bağlıdır:

- **Hedef katman, tarifin kendi katmanıysa** (`sensor-oku` için `meta-ornek`): yama dosyası tarif
  dizinine yazılır ve tarifin `SRC_URI` değişkeni doğrudan güncellenir. Tarif eki oluşturulmaz.
- **Hedef katman farklıysa** (ör. OE-Core'daki bir tarif için `meta-ornek`): kurumun katmanında
  `<tarif>_%.bbappend` dosyası ve yanında yama dosyası oluşturulur. Başka bir katmandaki tarif
  değiştirilmez (bkz. [Bölüm 7](07-katmanlar.md)).

Ardından tarif eki çalışma alanından silinir ve kaynak ağacı `workspace/attic/sources/` altına taşınır
(`-r` seçeneğiyle tamamen silinir).

Aşağıdaki animasyon, `sensor-oku` tarifi için bu iş akışını adım adım gösterir.

<div class="akis" data-senaryo="devtool"></div>

!!! dikkat "Yamalarda `Upstream-Status` satırı zorunludur"
    OE-Core'un `patch-status` kalite denetimi, tarifteki her yamada geçerli bir `Upstream-Status:`
    satırı arar ve bulamazsa hata verir. devtool commit mesajını yamanın başlığına aktardığı için bu satır
    commit mesajının gövdesine yazılmalıdır:

    ```text
    sensor-oku: print average of readings

    Upstream-Status: Inappropriate [ürüne özgü değişiklik]
    ```

    Geçerli değerler `Pending`, `Submitted`, `Backport`, `Denied`, `Inappropriate` ve
    `Inactive-Upstream`'dir. Yamaların yukarı akışa gönderilebilmesi için commit mesajlarının İngilizce
    yazılması yaygın bir uygulamadır.

!!! lab "Uygulama 13.1 · `sensor-oku` programının devtool ile değiştirilmesi"
    **Hazırlık.** Hedefe SSH ile erişilebilmesi için geliştirici parçaları etkinleştirilir ve imaj derlenir:

    ```bash
    source ~/bitbake-builds/<kurulum-adı>/build/init-build-env
    bitbake-config-build enable-fragment ornek/gelistirici
    bitbake-config-build enable-fragment core/yocto/root-login-with-empty-password
    bitbake ornek-image
    ```

    İkinci bir terminalde QEMU başlatılır (varsayılan ağ yapılandırmasında hedefin adresi `192.168.7.2`'dir):

    ```bash
    runqemu qemux86-64 ornek-image nographic snapshot
    ```

    **1. Kaynağın çalışma alanına alınması:**

    ```bash
    devtool modify sensor-oku
    ```

    ```text
    INFO: Source tree extracted to /home/<kullanıcı>/bitbake-builds/<kurulum-adı>/build/workspace/sources/sensor-oku
    INFO: Recipe sensor-oku now set up to build from /home/<kullanıcı>/bitbake-builds/<kurulum-adı>/build/workspace/sources/sensor-oku
    ```

    ```bash
    cd workspace/sources/sensor-oku
    git log --oneline        # tek commit: "Initial commit from upstream at version 1.0"
    grep EXTERNALSRC ../../appends/sensor-oku_1.0.bbappend
    ```

    **2. Değişiklik.** `sensor-oku.c` dosyasında döngü, okumaların ortalamasını da yazdıracak biçimde
    düzenlenir:

    ```c
        double toplam = 0.0;

        printf("Örnek ağ geçidi · sensör okuması\n");
        for (int i = 0; i < adet; i++) {
            double deger = 21.0 + (i % 5) * 0.4;
            toplam += deger;
            printf("  sensor0  okuma %-3d  %5.1f C\n", i + 1, deger);
        }
        printf("  sensor0  ortalama   %5.1f C\n", toplam / adet);
    ```

    **3. Derleme ve hedefe gönderme:**

    ```bash
    devtool build sensor-oku
    devtool deploy-target -c sensor-oku root@192.168.7.2
    ```

    ```text
    INFO: Successfully deployed /home/<kullanıcı>/.../tmp/work/x86-64-v3-poky-linux/sensor-oku/1.0/image
    ```

    `-c` seçeneği SSH ana makine anahtarı denetimini kapatır; `snapshot` kipinde QEMU her açılışta yeni
    anahtar ürettiğinden geliştirme ortamında kullanışlıdır. QEMU içinde:

    ```text
    root@agecidi:~# sensor-oku 3
    Örnek ağ geçidi · sensör okuması
      sensor0  okuma 1     21.0 C
      sensor0  okuma 2     21.4 C
      sensor0  okuma 3     21.8 C
      sensor0  ortalama    21.4 C
    ```

    Sonuç beklendiği gibi değilse kod düzenlenir ve 3. adım tekrarlanır. İmaj yeniden derlenmez.

    **4. Değişikliğin katmana aktarılması:**

    ```bash
    git commit -a -m "sensor-oku: print average of readings" \
                  -m "Upstream-Status: Inappropriate [ürüne özgü değişiklik]"
    cd ../../..              # build/ dizinine dönüş
    devtool finish sensor-oku meta-ornek
    ```

    ```text
    INFO: Adding new patch 0001-sensor-oku-print-average-of-readings.patch
    INFO: Updating recipe sensor-oku_1.0.bb
    INFO: Cleaning sysroot for recipe sensor-oku...
    INFO: Preserving source tree in .../build/workspace/attic/sources/sensor-oku.<tarih>
    ```

    **Beklenen sonuç:** `meta-ornek/recipes-ornek/sensor-oku/files/` altında yeni yama dosyası bulunur ve
    tarifin `SRC_URI` değişkenine `file://0001-sensor-oku-print-average-of-readings.patch` eklenmiştir.
    Değişiklik katmanın git deposunda `git status` ve `git diff` ile incelenir. `bitbake sensor-oku`
    komutu artık yamayı `do_patch` görevinde uygular. Gönderilen dosyalar hedeften kaldırılmak istenirse
    `devtool undeploy-target sensor-oku root@192.168.7.2` kullanılır.

!!! sss "Değişiklik yama yerine doğrudan dosyaya yazılabilir mi?"
    `sensor-oku` gibi kaynağı yalnızca `file://` dosyalarından oluşan tariflerde, **commit edilmemiş**
    değişiklikler `devtool update-recipe sensor-oku` ile doğrudan katmandaki özgün dosyanın üzerine
    kopyalanır; yama üretilmez. Kurum kendi yazılımının kaynağını katmanda tutuyorsa bu yaklaşım yama
    birikmesini önler. Yukarı akıştan alınan kaynaklarda ise değişiklikler her zaman yama olarak tutulmalıdır.

Diğer yararlı komutlar:

| Komut | İşlevi |
|---|---|
| `devtool status` | Çalışma alanındaki tarifleri ve kaynak dizinlerini listeler |
| `devtool update-recipe <tarif> [-a <katman>]` | Çalışma alanını kapatmadan tarifi veya (`-a` ile) bir tarif ekini günceller |
| `devtool reset <tarif>` | Değişiklikleri aktarmadan tarifi çalışma alanından çıkarır |
| `devtool modify --debug-build <tarif>` | Tarif ekine `DEBUG_BUILD = "1"` ekler (optimizasyonsuz, hata ayıklamaya uygun derleme) |
| `devtool build-image <imaj>` | Çalışma alanındaki tarifleri içeren imajı derler |

## 13.4 Yeni tarif oluşturma: `devtool add`

`devtool add`, bir kaynak ağacından veya URL'den taslak tarif oluşturur ve kaynağı aynı çalışma alanına
alır. Derleme sistemi (CMake, Meson, Autotools, Cargo, setuptools vb.) ve lisans dosyaları kaynaktan
tahmin edilir:

```bash
devtool add modbus-izle https://git.example.com/ornek/modbus-izle.git --srcrev <commit>
devtool edit-recipe modbus-izle     # taslağın düzenleyicide açılması
devtool build modbus-izle
devtool finish modbus-izle meta-ornek
```

Tarif çalışma alanındaki `recipes/` dizininde oluşturulduğundan `devtool finish`, tarif dosyasını ve
yanındaki dosyaları hedef katmana **taşır**. `--srcrev` (`-S`) verilmezse dalın son commit'i sabit
`SRCREV` olarak yazılır; `--autorev` ise `AUTOREV` kullanır ve ürün tariflerinde önerilmez
(bkz. [Bölüm 6](06-tarifler.md)).

!!! iyi "Taslak tarifin gözden geçirilmesi"
    `devtool add` ve `recipetool create` tarafından üretilen tarifler başlangıç noktasıdır. Özellikle
    `LICENSE` ifadesi, `LIC_FILES_CHKSUM` satırları, `DEPENDS` listesi ve `SUMMARY`/`HOMEPAGE` alanları
    katmana alınmadan önce elle doğrulanmalıdır. Lisansı belirlenemeyen dosyalar için araç `CLOSED` veya
    `Unknown` yazabilir; bu değerler ürün katmanında bırakılmamalıdır (bkz. [Bölüm 16](16-lisans-sbom.md)).

## 13.5 Standart SDK

Standart SDK, belirli bir imaj için üretilen; çapraz derleyiciyi, hata ayıklayıcıyı ve imajdaki
kütüphanelerin geliştirme dosyalarını (başlık dosyaları, `.so` bağlantıları) içeren, kendi kendine
kurulan bir betiktir. SDK'nın hedef sysroot'u imajın paket listesinden türetildiğinden, SDK ile derlenen
bir uygulama yalnızca **aynı imajı** çalıştıran cihazlarla uyumludur.

```bash
bitbake -c populate_sdk ornek-image
ls tmp/deploy/sdk/
```

Kurulum betiğinin adı `SDK_NAME` ve `SDK_VERSION` değişkenlerinden türetilir. ÖrnekOS (Poky tabanlı)
için ad şu bileşenlerden oluşur:

```text
ornekos-glibc-x86_64-ornek-image-x86-64-v3-qemux86-64-toolchain-0.1.sh
DISTRO  TCLIBC SDKMACHINE imaj  TUNE_PKGARCH MACHINE           SDK_VERSION
```

```bash
./tmp/deploy/sdk/ornekos-glibc-x86_64-ornek-image-x86-64-v3-qemux86-64-toolchain-0.1.sh
# Enter target directory for SDK (default: /opt/ornekos/0.1):
```

Varsayılan kurulum dizini Poky tabanlı dağıtımlarda `SDKPATHINSTALL = "/opt/${DISTRO}/${SDK_VERSION}"`
ile belirlenir. `-d <dizin>` seçeneğiyle değiştirilebilir; `-y` verildiğinde onay sorulmaz. Kullanım
için ortam betiği yüklenir:

```bash
source /opt/ornekos/0.1/environment-setup-x86-64-v3-poky-linux
echo $CC          # x86_64-poky-linux-gcc -m64 -march=x86-64-v3 ... --sysroot=/opt/ornekos/0.1/sysroots/...
$CC $CFLAGS $LDFLAGS sensor-oku.c -o sensor-oku
file sensor-oku   # ELF 64-bit LSB ... x86-64 ...
```

Ortam betiği `CC`, `CXX`, `CFLAGS`, `LDFLAGS`, `PKG_CONFIG_SYSROOT_DIR`, `CMAKE_TOOLCHAIN_FILE` gibi
değişkenleri ayarlar. Bu nedenle CMake, Meson veya Autotools kullanan projeler SDK içinde ek ayar
gerektirmeden çapraz derlenebilir.

SDK içeriğini belirleyen başlıca değişkenler:

| Değişken | İşlevi |
|---|---|
| `SDKIMAGE_FEATURES` | Hedef sysroot'a eklenen tamamlayıcı paketler; varsayılan `dev-pkgs dbg-pkgs src-pkgs` |
| `TOOLCHAIN_TARGET_TASK` | Hedef sysroot'a eklenecek ek paketler (ör. imajda olmayan statik kütüphaneler) |
| `TOOLCHAIN_HOST_TASK` | SDK'nın ana makine tarafına eklenecek `nativesdk-` paketleri |
| `SDKMACHINE` | SDK'nın çalışacağı ana makine mimarisi (varsayılan: derleme makinesinin mimarisi) |

## 13.6 Genişletilebilir SDK (eSDK)

Genişletilebilir SDK, standart SDK'ya ek olarak devtool'u, metadata'nın bir kopyasını ve sstate
önbelleğini içerir. Uygulama geliştiricisi eSDK içinde `devtool add`, `devtool modify`, `devtool build`
ve `devtool deploy-target` komutlarını kullanabilir; tam bir BitBake ortamına geçmeden kurulumunu
genişletebilir.

```bash
bitbake -c populate_sdk_ext ornek-image
./tmp/deploy/sdk/ornekos-glibc-x86_64-ornek-image-x86-64-v3-qemux86-64-toolchain-ext-0.1.sh
# varsayılan kurulum dizini: ~/ornekos_sdk
source ~/ornekos_sdk/environment-setup-x86-64-v3-poky-linux
devtool modify sensor-oku
```

| Değişken | Değer | Etkisi |
|---|---|---|
| `SDK_EXT_TYPE` | `full` (varsayılan) | Gerekli tüm sstate nesneleri SDK'ya gömülür; kurulum betiği büyüktür, çevrim dışı çalışır |
| | `minimal` | sstate nesneleri gömülmez; gerektiğinde `SSTATE_MIRRORS` ile yayımlanmış bir yansıdan indirilir |
| `SDK_INCLUDE_TOOLCHAIN` | `full` türünde `1` | Araç takımının SDK'ya dahil edilmesi |

eSDK dağıtıldıktan sonra kurum, güncellenmiş metadata'yı ve sstate nesnelerini bir sunucuda
yayımlayabilir. Geliştiriciler `devtool sdk-update` ile SDK'larını güncelleyebilir, `devtool sdk-install
<tarif>` ile SDK'ya yeni bileşen ekleyebilir. Bu dağıtım modeli bir sstate yansısının işletilmesini
gerektirir (bkz. [Bölüm 15](15-sstate.md)).

!!! sss "Hangi SDK türü seçilmelidir?"
    Uygulama ekibi yalnızca kendi programını derleyip cihaza kopyalıyorsa standart SDK yeterlidir ve
    bakımı kolaydır. Uygulama ekibinin tarif yazması veya imaja paket eklemesi gerekiyorsa eSDK ya da
    doğrudan BitBake kurulumu tercih edilir. Uygulamada birçok kurum, uygulama geliştiricilerine de
    `bitbake-setup` ile tekrarlanabilir bir kurulum ve paylaşılan bir sstate yansısı sağlamayı tercih
    etmektedir; bu durumda `devtool ide-sdk` eSDK'nın sunduğu işlevlerin çoğunu karşılar.

## 13.7 VS Code entegrasyonu

6.0'da VS Code desteği iki düzeyde sağlanır.

**Metadata düzeyi: `bitbake-setup init --init-vscode`.** Kurulum oluşturulurken kurulum dizininde
`bitbake.code-workspace` dosyası üretilir. Bu çalışma alanı dosyası `layers/` altındaki git depolarını ve
`build/conf` dizinini klasör olarak içerir, **Yocto Project BitBake** eklentisini
(`yocto-project.yocto-bitbake`) önerir ve eklentinin derleme ortamını bulabilmesi için gerekli ayarları
yazar. Seçeneğin varsayılan değeri, `code` komutunun `PATH` üzerinde bulunup bulunmadığına göre belirlenir;
dosyanın üretilmesi istenmiyorsa `--no-init-vscode` verilir.

```bash
bitbake-setup init --init-vscode poky-wrynose poky distro/poky machine/qemux86-64
code ~/bitbake-builds/<kurulum-adı>/bitbake.code-workspace
```

**Uygulama düzeyi: `devtool ide-sdk`.** `devtool modify` ile çalışma alanına alınmış bir tarif için
çapraz derleme ve uzaktan hata ayıklama yapılandırması üretir. Komut, bir veya daha fazla tarifin yanında
bir imaj tarifi de ister; hata ayıklama yapılandırması bu imaja göre hazırlanır:

```bash
devtool modify --debug-build ornek-panel
devtool ide-sdk ornek-panel ornek-image --target root@192.168.7.2
code workspace/sources/ornek-panel
```

Komut, kaynak dizininde `.vscode/` altına `settings.json`, `extensions.json`, `tasks.json` ve
`launch.json` dosyalarını yazar. CMake kullanan tariflerde BitBake'in kullandığı ayarlar bir CMake
önayarına (preset), Meson kullanan tariflerde bir sarmalayıcı betiğe aktarılır; böylece IDE içindeki
derleme BitBake ile aynı sonucu üretir. `tasks.json` içindeki görevler çıktıyı hedefe gönderir ve hedefte
`gdbserver` başlatır; `launch.json` ana makinedeki çapraz GDB'yi bu sunucuya bağlar. Uzaktan hata
ayıklama için imajda `gdbserver` bulunmalı (`tools-debug` özelliği veya `IMAGE_INSTALL`) ve imaj
`IMAGE_GEN_DEBUGFS = "1"` ile `IMAGE_CLASSES += "image-combined-dbg"` ayarlarıyla derlenmelidir. Eksik
ayarlar komut tarafından uyarı olarak bildirilir.

`--mode shared` seçeneği ise tarife özgü sysroot yerine paylaşılan sysroot kullanan, standart SDK'ya
benzer bir ortam betiği üretir. Varsayılan `modified` kipi, CMake ve Meson tabanlı tariflerde en kapsamlı
yapılandırmayı sağlar; `sensor-oku` gibi derleme sistemi kullanmayan tariflerde IDE'nin derleme
yapılandırması sınırlı kalır.

??? info ":material-history: Önceki sürümlerde: `oe-init-build-env` ile VS Code ayarları"
    5.0 ile `oe-init-build-env` betiği, `code` komutu bulunduğunda ve `.vscode` dizini henüz yoksa
    başlangıç niteliğinde bir `.vscode/settings.json` dosyası oluşturabiliyordu. 6.0 ile bu destek
    `oe-init-build-env` betiğinden kaldırılmıştır; resmî öneri `bitbake-setup` kullanılmasıdır.
    `devtool ide-sdk` de 6.0'da önce `bitbake-setup`'ın oluşturduğu `init-build-env` betiğini, bulamazsa
    `oe-init-build-env` betiğini arar.

!!! dikkat "IDE'nin derleme dizinini taraması"
    Bazı VS Code eklentileri (Python, C/C++ dizinleyiciler) açılan klasörün tamamını tarar. `build/tmp`
    gibi yüz binlerce dosya içeren bir dizin tarandığında bellek tükenebilir. Bu nedenle VS Code doğrudan
    derleme dizininde değil, `bitbake.code-workspace` dosyası veya `workspace/sources/<tarif>` dizini
    üzerinden açılmalıdır.

## Özet

- devtool, derleme ortamı içinde ve asıl tarifi değiştirmeden çalışmayı sağlar; mekanizmanın temeli `externalsrc` sınıfıdır.
- `devtool modify` → `devtool build` → `devtool deploy-target` → `devtool finish` döngüsü imaj derlemeden geliştirme sağlar.
- `devtool finish` yalnızca commit edilmiş değişiklikleri aktarır; aynı katmanda tarifi günceller, farklı katmanda tarif eki oluşturur.
- Yamalar `Upstream-Status:` satırı içermelidir; aksi halde `patch-status` denetimi hata verir.
- Standart SDK `populate_sdk`, eSDK `populate_sdk_ext` göreviyle üretilir; SDK yalnızca üretildiği imajla uyumludur.
- 6.0'da VS Code yapılandırması `bitbake-setup init --init-vscode` ve `devtool ide-sdk` ile oluşturulur.

## Değerlendirme soruları

<div class="quiz" data-id="b13-1">
<p class="quiz-soru"><code>devtool modify sensor-oku</code> komutundan sonra BitBake, <code>sensor-oku</code> tarifini derlerken kaynağı nereden alır?</p>
<ul>
<li>Tarifin <code>SRC_URI</code> değişkenindeki dosyalardan, her derlemede yeniden açarak</li>
<li data-dogru><code>build/workspace/sources/sensor-oku</code> dizininden; çalışma alanındaki tarif eki <code>externalsrc</code> sınıfını etkinleştirir</li>
<li><code>DL_DIR</code> altındaki arşivden</li>
<li>sstate önbelleğinden</li>
</ul>
<p class="quiz-aciklama"><code>devtool modify</code>, <code>workspace/appends/</code> altına <code>inherit externalsrc</code> ve <code>EXTERNALSRC:pn-sensor-oku</code> içeren bir tarif eki yazar.
Bu durumda <code>do_fetch</code>, <code>do_unpack</code> ve <code>do_patch</code> atlanır; asıl tarif değiştirilmez.</p>
</div>

<div class="quiz" data-id="b13-2">
<p class="quiz-soru">Çalışma alanındaki kaynakta değişiklik yapılmış, ancak <code>git commit</code> çalıştırılmamıştır. <code>devtool finish sensor-oku meta-ornek</code> komutunun davranışı nedir?</p>
<ul>
<li>Değişiklikleri otomatik olarak commit eder ve yama üretir</li>
<li>Değişiklikleri yok sayar ve çalışma alanını temizler</li>
<li data-dogru>Kaynak ağacının temiz olmadığını bildirerek durur; <code>-f</code> verilmedikçe devam etmez</li>
<li>Değişiklikleri bir tarif ekine yazar</li>
</ul>
<p class="quiz-aciklama"><code>devtool finish</code>, iş kaybını önlemek için kaynak ağacının temiz olmasını şart koşar. Yamalar commit'lerden üretildiğinden
değişikliklerin önce commit edilmesi gerekir.</p>
</div>

<div class="quiz" data-id="b13-3">
<p class="quiz-soru">OE-Core'daki <code>busybox</code> tarifi <code>devtool modify</code> ile değiştirilmiş ve <code>devtool finish busybox meta-ornek</code> çalıştırılmıştır. Sonuç nedir?</p>
<ul>
<li>OE-Core'daki <code>busybox</code> tarifi güncellenir</li>
<li data-dogru><code>meta-ornek</code> içinde <code>busybox_%.bbappend</code> ve yanında yama dosyası oluşturulur</li>
<li>Tarif <code>meta-ornek</code>'e kopyalanır ve OE-Core'daki tarif gölgede kalır</li>
<li>Komut hata verir; yalnızca tarifin kendi katmanı hedef olabilir</li>
</ul>
<p class="quiz-aciklama">Hedef katman tarifin bulunduğu katmandan farklıysa devtool bir tarif eki oluşturur. Bu davranış, başka bir katmanın doğrudan
değiştirilmemesi ilkesiyle uyumludur.</p>
</div>

<div class="quiz" data-id="b13-4">
<p class="quiz-soru"><code>ornek-image</code> için üretilen standart SDK ile derlenen bir uygulamanın hangi cihazlarda sorunsuz çalışması beklenir?</p>
<ul>
<li>Aynı mimarideki tüm Linux cihazlarda</li>
<li data-dogru><code>ornek-image</code> imajının aynı sürümünü çalıştıran cihazlarda</li>
<li>Yalnızca QEMU'da</li>
<li>SDK'nın kurulduğu ana makinede</li>
</ul>
<p class="quiz-aciklama">SDK'nın hedef sysroot'u imajın paket listesinden türetilir. Kütüphane sürümleri imajla eşleşir; farklı bir imajda kütüphane
sürümleri veya derleme seçenekleri farklı olabilir.</p>
</div>

<div class="quiz" data-id="b13-5">
<p class="quiz-soru">6.0'da bir kurulum için VS Code çalışma alanı dosyası hangi yöntemle üretilir?</p>
<ul>
<li><code>source oe-init-build-env</code></li>
<li data-dogru><code>bitbake-setup init --init-vscode</code></li>
<li><code>bitbake -c vscode</code></li>
<li><code>devtool create-workspace --vscode</code></li>
</ul>
<p class="quiz-aciklama">6.0 ile VS Code desteği <code>oe-init-build-env</code> betiğinden kaldırılmıştır. <code>bitbake-setup init</code>, kurulum dizininde
<code>bitbake.code-workspace</code> dosyasını üretir. Tarif düzeyindeki yapılandırma için <code>devtool ide-sdk</code> kullanılır.</p>
</div>

!!! alistirma "Alıştırma: SDK ile derleme ve devtool ile karşılaştırma"
    1. `ornek-image` için standart SDK üretin ve `~/sdk/ornekos` dizinine onay sorulmadan kurun.
    2. SDK ortamında `sensor-oku.c` dosyasını derleyin ve elde edilen ikili dosyayı `scp` ile QEMU'ya
       kopyalayıp çalıştırın.
    3. `$CC` değişkeninin içeriğini inceleyin ve derleyicinin `x86_64-poky-linux-gcc` adıyla doğrudan
       çağrılmasının neden önerilmediğini açıklayın.
    4. Bu yöntemin `devtool deploy-target` yöntemine göre eksik kalan yönlerini belirtin.

    ??? success "Örnek çözüm"
        ```bash
        bitbake -c populate_sdk ornek-image
        ./tmp/deploy/sdk/ornekos-glibc-x86_64-ornek-image-x86-64-v3-qemux86-64-toolchain-0.1.sh \
            -y -d ~/sdk/ornekos

        source ~/sdk/ornekos/environment-setup-x86-64-v3-poky-linux
        $CC $CFLAGS $LDFLAGS sensor-oku.c -o sensor-oku
        echo $CC

        scp sensor-oku root@192.168.7.2:/usr/bin/
        ssh root@192.168.7.2 sensor-oku 2
        ```
        `$CC` yalnızca derleyici adını değil, hedef mimari bayraklarını (`-m64 -march=x86-64-v3`),
        güvenlik bayraklarını ve `--sysroot=<SDK>/sysroots/x86-64-v3-poky-linux` seçeneğini de içerir.
        Derleyici doğrudan çağrıldığında bu bayraklar eksik kalır; başlık dosyaları ve kütüphaneler yanlış
        yerden aranabilir ya da üretilen kod hedef işlemciyle uyumsuz olabilir. Bu nedenle SDK içinde de,
        tariflerde olduğu gibi, her zaman `$CC`, `$CFLAGS` ve `$LDFLAGS` kullanılmalıdır.

        Elle kopyalama yönteminde tarif güncellenmez; `do_install` görevinde tanımlanan izinler,
        yapılandırma dosyaları ve diğer kurulum adımları uygulanmaz; hedefte hangi dosyaların
        değiştirildiği kaydedilmez. `devtool deploy-target` ise `${D}` içeriğinin tamamını gönderir,
        hedefte bir dosya listesi tutar ve `devtool undeploy-target` ile geri alınabilir.

**Sonraki bölüm:** [14 · Hata ayıklama →](14-hata-ayiklama.md)
