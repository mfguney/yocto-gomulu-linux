# 6 · Tarifler ve görevler

<div class="kunye" markdown>
<span>Süre: ~45 dk + uygulama</span><span>Düzey: Orta</span><span>Ön koşul: Bölüm 3–5</span>
</div>

!!! hedef "Öğrenme hedefleri"
    Bu bölümün sonunda:

    - Bir tarifin zorunlu ve isteğe bağlı bileşenlerini açıklayabilirsiniz.
    - Yerel dosyadan ve git deposundan kaynak alan tarifler yazabilirsiniz.
    - Görev zincirini ve her görevin çıktısını açıklayabilirsiniz.
    - Derleme ve çalışma bağımlılıklarını doğru biçimde tanımlayabilirsiniz.
    - Bir tarifi imaja ekleyip QEMU'da doğrulayabilirsiniz.

## 6.1 Tarifin rolü

Tarif, tek bir yazılım bileşeni için şu soruları yanıtlar:

1. **Kaynak nerededir?** (`SRC_URI`, `SRCREV`)
2. **Lisansı nedir ve nasıl doğrulanır?** (`LICENSE`, `LIC_FILES_CHKSUM`)
3. **Nasıl derlenir ve kurulur?** (görevler veya `inherit` edilen sınıf)
4. **Neye bağımlıdır?** (`DEPENDS`, `RDEPENDS`)
5. **Hangi paketlere bölünür?** (`PACKAGES`, `FILES`)

Tarif dosyasının adı `<ad>_<sürüm>.bb` biçimindedir. BitBake bu addan `PN` (paket adı) ve `PV` (paket
sürümü) değişkenlerini türetir: `sensor-oku_1.0.bb` → `PN = "sensor-oku"`, `PV = "1.0"`,
`BP = "sensor-oku-1.0"`.

## 6.2 Tarifin yapısı

Örnek ürünün ilk bileşeni, sensör okumalarını gösteren küçük bir C programıdır. Aşağıdaki animasyon,
bu tarifin oluşturulması sırasında geliştiricinin yaptığı işlemleri (dizinlerin açılması, kaynak
dosyanın kopyalanması ve tarifin satır satır yazılması) gösterir:

<div class="akis" data-senaryo="yeni-tarif"></div>

Tarifin tamamı ve satırların açıklamaları:

```bitbake title="examples/meta-ornek/recipes-ornek/sensor-oku/sensor-oku_1.0.bb"
SUMMARY = "Örnek ağ geçidi için sensör okuma aracı"                   # (1)!
DESCRIPTION = "Sıcaklık sensörü okumalarını benzeten ve standart çıktıya \
yazan küçük bir C programı."
HOMEPAGE = "https://github.com/mfguney/yocto-gomulu-linux"
LICENSE = "MIT"                                                       # (2)!
LIC_FILES_CHKSUM = "file://${COMMON_LICENSE_DIR}/MIT;md5=0835ade698e0bcf8506ecda2f7b4f302"

SRC_URI = "file://sensor-oku.c"                                       # (3)!

S = "${UNPACKDIR}"                                                    # (4)!

do_compile() {
    ${CC} ${CFLAGS} ${LDFLAGS} sensor-oku.c -o sensor-oku             # (5)!
}

do_install() {
    install -d ${D}${bindir}
    install -m 0755 sensor-oku ${D}${bindir}/                         # (6)!
}
```

1.  **Tanımlayıcı bilgiler.** `SUMMARY` kısa, `DESCRIPTION` uzun açıklamadır. Paket yöneticisinde ve SBOM'da yer alır.
2.  **Lisans bilgisi zorunludur.** `LIC_FILES_CHKSUM`, lisans metninin sağlamasıdır. Yukarı akıştaki lisans
    metni değiştiğinde derleme durur ve uyarı verir. Yaygın lisansların metinleri OE-Core'da
    `COMMON_LICENSE_DIR` altında bulunur.
3.  **Kaynak konumu.** `file://` önekli dosyalar tarif dizininin yanındaki `files/`, `sensor-oku/` veya
    `sensor-oku-1.0/` alt dizinlerinde aranır.
4.  **Kaynak dizini.** Varsayılan `S` değeri `${UNPACKDIR}/${BP}`'dir. Yerel dosyalar doğrudan `UNPACKDIR`
    içine açıldığından burada `S` değeri `UNPACKDIR` olarak ayarlanır.
5.  **Çapraz derleyici.** `gcc` doğrudan yazılmamalıdır. `${CC}` hedef mimariye uygun derleyiciyi ve sysroot
    ayarlarını içerir; `${LDFLAGS}` doğru bağlayıcı bayraklarını taşır.
6.  **Geçici köke kurulum.** `${D}` geçici kök dizin, `${bindir}` ise `/usr/bin`'dir.

!!! dikkat "`S = "${WORKDIR}"` kullanımı artık hatalıdır"
    Eski kaynaklardaki yerel dosya tarifleri `S = "${WORKDIR}"` kullanır. Yocto 5.1'den itibaren kaynaklar
    `UNPACKDIR` altına açılmaktadır (5.1–5.2'de `sources-unpack`, 5.3'ten itibaren `${WORKDIR}/sources`).
    5.3 ile `S = "${WORKDIR}/..."` kullanımı hata verir. Doğru kullanım:

    - Yerel dosyalar: `S = "${UNPACKDIR}"`
    - Git kaynakları: `S` **tanımlanmaz**. 5.3'ten itibaren git deposu `${UNPACKDIR}/${BP}` içine açılır ve
      bu değer zaten varsayılan `S` değeridir. Eski `S = "${WORKDIR}/git"` satırları kaldırılmalıdır.

!!! dikkat "`doesn't have GNU_HASH (didn't pass LDFLAGS?)` hatası"
    `do_compile` içinde `${LDFLAGS}` kullanılmazsa derleme tamamlanır, ancak paketleme aşamasında kalite
    denetimi (QA, `ldflags` kontrolü) bu hatayla durur. Hata, ikili dosyanın Yocto'nun bağlayıcı ayarları
    olmadan üretildiğini gösterir. Çözüm `${LDFLAGS}` değişkenini derleme komutuna eklemektir; QA
    kontrolünün devre dışı bırakılması bir çözüm değildir.

## 6.3 Görev zinciri

`bitbake sensor-oku` komutu çalıştırıldığında aşağıdaki görevler sırasıyla yürütülür. Ayrıntı için
adımlara tıklayabilirsiniz:

<div class="zincir" data-tur="tarif"></div>

### Dosyaların izlediği yol

Görev zinciri, dosyaların derleme dizinleri arasında izlediği yol olarak da okunabilir. Aşağıdaki
animasyon `sensor-oku.c` dosyasının katmandan başlayarak paket deposuna ve oradan imaja kadar
izlediği yolu gerçek dizin adlarıyla gösterir (qemux86-64 makinesi, poky dağıtımı):

<div class="akis" data-senaryo="tarif"></div>

Görevlerle çalışmak için:

```bash
bitbake -c listtasks sensor-oku        # tarifin tüm görevleri
bitbake -c compile -f sensor-oku       # tek bir görevi zorla yeniden çalıştırma
bitbake -c devshell sensor-oku         # tarif ortamında kabuk (Bölüm 14)
```

## 6.4 Bağımlılıklar

Yocto'da iki tür bağımlılık birbirinden açıkça ayrılır:

| | `DEPENDS` | `RDEPENDS:${PN}` |
|---|---|---|
| Gerekli olduğu an | **Derleme** sırasında | **Çalışma** sırasında (hedef cihazda) |
| Değerleri | Tarif adları | Paket adları |
| Örnek | `DEPENDS = "openssl"` (başlık dosyaları gerekli) | `RDEPENDS:${PN} = "python3-core"` (betik çalışırken gerekli) |
| Etkisi | Bağımlılık önce derlenir ve sysroot'a eklenir | Paket imaja eklenirken bağımlılık da eklenir |

!!! iyi "Paylaşılan kütüphaneler için RDEPENDS gerekmez"
    Bir program `libssl.so` gibi paylaşılan bir kütüphaneye bağlıysa `RDEPENDS` tanımlanması gerekmez.
    Yocto paketleme sırasında ELF dosyalarını tarar ve kütüphane bağımlılıklarını **otomatik** ekler.
    Python modülleri, kabuk betiklerinin çağırdığı komutlar ve `dlopen` ile yüklenen eklentiler ise
    otomatik algılanamaz; bunlar elle tanımlanmalıdır.

## 6.5 Git kaynaklı ve derleme sistemi kullanan tarifler

Uygulamada tariflerin çoğu bir git deposundan kaynak alır ve bir derleme sistemi sınıfı kullanır:

```bitbake title="ornek-panel_git.bb (örnek)"
SUMMARY = "Ağ geçidi yönetim paneli"
LICENSE = "Apache-2.0"
LIC_FILES_CHKSUM = "file://LICENSE;md5=<lisans dosyasının md5 değeri>"

SRC_URI = "git://github.com/ORNEK/ornek-panel.git;protocol=https;branch=main"
SRCREV = "0123456789abcdef0123456789abcdef01234567"   # sabit commit: tekrarlanabilirlik
PV = "1.2+git"

DEPENDS = "libmodbus"

inherit cmake

EXTRA_OECMAKE = "-DORNEK_PANEL_TESTLER=OFF"
```

Bu tarifte `do_configure`, `do_compile` ve `do_install` tanımlanmamıştır; `inherit cmake` bu görevleri
CMake'e uygun biçimde tanımlar. Benzer sınıflar: `autotools`, `meson`, `cargo`,
`python_setuptools_build_meta`, `go` (bkz. [Bölüm 8](08-siniflar.md)).

!!! dikkat "`SRCREV = "${AUTOREV}"` kullanımı"
    `AUTOREV`, her derlemede dalın en son commit'ini kullanır. Geliştirme aşamasında pratiktir, ancak
    **tekrarlanabilirliği ortadan kaldırır**: bugün derlenen imaj altı ay sonra aynı biçimde üretilemez.
    Ürün tariflerinde her zaman sabit bir `SRCREV` kullanılmalıdır.

!!! sss "Tarifler elle mi yazılmalıdır?"
    Taslak tarif üretmek için iki araç bulunur:

    - `recipetool create -o yeni.bb <URL>`: kaynağı inceleyerek derleme sistemini ve lisansı tahmin eden bir taslak üretir.
    - `devtool add <ad> <URL>`: aynı işi yapar ve kaynak üzerinde çalışmak için bir çalışma alanı açar (bkz. [Bölüm 13](13-devtool-sdk.md)).

    Üretilen taslaklar, özellikle lisans satırları, her zaman gözden geçirilmelidir.

## 6.6 Tarifin imaja eklenmesi

!!! lab "Uygulama 6.1 · `sensor-oku` tarifinin derlenmesi ve doğrulanması"
    Kitap deposundaki `examples/meta-ornek` katmanı derleme kurulumuna eklenir:

    ```bash
    git clone https://github.com/mfguney/yocto-gomulu-linux.git ~/yocto-gomulu-linux

    source ~/bitbake-builds/<kurulum-adı>/build/init-build-env
    bitbake-layers add-layer ~/yocto-gomulu-linux/examples/meta-ornek
    bitbake-layers show-layers        # meta-ornek listede olmalı
    ```

    Tarif tek başına derlenir ve üretilen paket incelenir:

    ```bash
    bitbake sensor-oku
    oe-pkgdata-util list-pkg-files sensor-oku
    ```

    Tarifi imaja eklemek için `build/conf/local.conf` dosyasının sonuna şu satır yazılır (baştaki boşluğa dikkat):

    ```bitbake
    IMAGE_INSTALL:append = " sensor-oku"
    ```

    ```bash
    bitbake core-image-minimal
    runqemu qemux86-64 nographic snapshot
    ```

    QEMU içinde:

    ```text
    root@qemux86-64:~# sensor-oku 3
    Örnek ağ geçidi · sensör okuması
      sensor0  okuma 1     21.0 C
      sensor0  okuma 2     21.4 C
      sensor0  okuma 3     21.8 C
    ```

## Özet

- Tarif adı `ad_sürüm.bb` biçimindedir; `PN`, `PV` ve `BP` bu addan türetilir.
- `LICENSE` ve `LIC_FILES_CHKSUM` zorunludur.
- Yerel dosyalarda `S = "${UNPACKDIR}"` kullanılır; git kaynaklarında `S` tanımlanmaz.
- `${CC}`, `${CFLAGS}`, `${LDFLAGS}`, `${D}` ve `${bindir}` gibi değişkenler kullanılmalı; sabit yol ve `gcc` yazılmamalıdır.
- `DEPENDS` derleme, `RDEPENDS` çalışma bağımlılığıdır.
- Ürün tariflerinde `AUTOREV` yerine sabit `SRCREV` kullanılır.

## Değerlendirme soruları

<div class="quiz" data-id="b06-1">
<p class="quiz-soru">Hedef mimari ARM olan bir tarifte <code>do_compile</code> içinde <code>gcc main.c -o app</code> yazılmıştır. Sonuç ne olur?</p>
<ul>
<li>BitBake gcc'yi otomatik olarak ARM derleyicisiyle değiştirir</li>
<li data-dogru>Derleme makinesinin kendi derleyicisi kullanılır ve x86 ikili üretilir; QA denetimi bunu yakalar</li>
<li>Program hem x86 hem ARM üzerinde çalışır</li>
<li>Derleme başlamaz</li>
</ul>
<p class="quiz-aciklama">Sabit yazılmış <code>gcc</code>, derleme makinesinin derleyicisidir. Yanlış mimaride üretilen ikili dosya paketleme
QA'sı tarafından yakalanır. <code>${CC}</code>, <code>${CXX}</code> ve <code>${LDFLAGS}</code> kullanılmalı ya da bir derleme sınıfı devralınmalıdır.</p>
</div>

<div class="quiz" data-id="b06-2">
<p class="quiz-soru">Bir Python betiğini cihaza kuran tarifte, betiğin cihazda çalışabilmesi için Python nasıl tanımlanmalıdır?</p>
<ul>
<li><code>DEPENDS = "python3"</code></li>
<li data-dogru><code>RDEPENDS:${PN} = "python3-core"</code> (ve gereken diğer python3 modülleri)</li>
<li>Tarifin içinde <code>IMAGE_INSTALL += "python3"</code></li>
<li>Gerek yoktur; Yocto bunu otomatik algılar</li>
</ul>
<p class="quiz-aciklama">Betik yorumlayıcısı bir çalışma bağımlılığıdır. ELF taraması Python betiklerine uygulanmadığından RDEPENDS
elle tanımlanmalıdır. <code>IMAGE_INSTALL</code> tariflerde değil, imaj tariflerinde veya yapılandırmada kullanılır.</p>
</div>

<div class="quiz" data-id="b06-3">
<p class="quiz-soru">Yocto 6.0'da git deposundan kaynak alan bir tarifte <code>S</code> değişkeni için önerilen yaklaşım hangisidir?</p>
<ul>
<li><code>S = "${WORKDIR}/git"</code></li>
<li><code>S = "${UNPACKDIR}/git"</code></li>
<li data-dogru><code>S</code> tanımlanmaz; varsayılan <code>${UNPACKDIR}/${BP}</code> kullanılır</li>
<li><code>S = "${D}"</code></li>
</ul>
<p class="quiz-aciklama">5.3'ten itibaren git getiricisi depoyu <code>${UNPACKDIR}/${BP}</code> dizinine açar. Bu, varsayılan <code>S</code> değeriyle
aynıdır; eski <code>S</code> satırları kaldırılmalıdır.</p>
</div>

!!! alistirma "Alıştırma: Yapılandırma dosyası ekleme"
    `sensor-oku` programının okuma aralığını `/etc/sensor.conf` dosyasından okuyacağı varsayılsın. Tarifi
    aşağıdaki gibi genişletin:

    1. Tarif dizinine `files/sensor.conf` dosyasını ekleyin (içerik: `aralik=5`).
    2. Dosyayı `SRC_URI`'ye ekleyin ve `do_install` ile `${sysconfdir}` altına kurun.
    3. Paket güncellenirken kullanıcının düzenlediği dosyanın korunması için dosyayı **yapılandırma
       dosyası** olarak işaretleyin.

    ??? success "Örnek çözüm"
        ```bitbake
        SRC_URI = "file://sensor-oku.c \
                   file://sensor.conf"

        do_install() {
            install -d ${D}${bindir} ${D}${sysconfdir}
            install -m 0755 sensor-oku ${D}${bindir}/
            install -m 0644 ${UNPACKDIR}/sensor.conf ${D}${sysconfdir}/
        }

        CONFFILES:${PN} = "${sysconfdir}/sensor.conf"
        ```
        `${sysconfdir}` altındaki dosyalar varsayılan `FILES:${PN}` kapsamında olduğundan ana pakete girer.
        `CONFFILES`, paket yöneticisine bu dosyanın güncelleme sırasında korunması gerektiğini bildirir.

**Sonraki bölüm:** [7 · Katmanlar ve bbappend →](07-katmanlar.md)
