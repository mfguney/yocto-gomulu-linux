# 3 · İlk derleme

<div class="kunye" markdown>
<span>Süre: ~30 dk okuma + 1–4 saat derleme</span><span>Düzey: Başlangıç</span><span>Ön koşul: Linux derleme makinesi (32 GB RAM, 140 GB disk önerilir)</span>
</div>

!!! hedef "Öğrenme hedefleri"
    Bu bölümün sonunda:

    - Derleme makinesini Yocto 6.0 için hazırlayabilirsiniz.
    - `bitbake-setup` ile bir kurulum (setup) oluşturabilir ve yapısını açıklayabilirsiniz.
    - Yapılandırma parçalarını listeleyip etkinleştirebilirsiniz.
    - Bir imaj derleyip QEMU emülatöründe çalıştırabilirsiniz.

Bu bölümde donanım kullanılmadan, **QEMU** emülatöründe çalışan bir Linux imajı derlenir. Bölüm boyunca
kullanılan iki araç, 6.0 sürümünün kurulum ve yapılandırma modelini oluşturur:

| Araç | Görevi | İlk sürüm |
|---|---|---|
| `bitbake-setup` | Gerekli git depolarını çekmek, derleme dizinini hazırlamak, kurulumu güncel tutmak | 5.3 |
| `bitbake-config-build` | Yapılandırma parçalarını listelemek, etkinleştirmek ve devre dışı bırakmak | 5.2 |

6.0 *Wrynose*, bu iki aracı içeren ilk LTS sürümdür.

## 3.1 Derleme makinesinin hazırlanması

!!! lab "Uygulama 3.1 · Gerekli paketler"

    === "Ubuntu / Debian"

        ```bash
        sudo apt update
        sudo apt install build-essential chrpath cpio debianutils diffstat file gawk gcc git \
             iputils-ping libacl1 libcrypt-dev locales lz4 python3 python3-git python3-jinja2 \
             python3-pexpect python3-pip python3-subunit python3-venv socat texinfo unzip wget \
             xz-utils zstd
        sudo locale-gen en_US.UTF-8   # Ubuntu; Debian'da: sudo dpkg-reconfigure locales
        ```

    === "Fedora"

        ```bash
        sudo dnf install bzip2 ccache chrpath cpio cpp diffstat diffutils file findutils gawk gcc \
             gcc-c++ git glibc-devel glibc-langpack-en gzip hostname libacl lz4 make patch perl \
             perl-Data-Dumper perl-File-Compare perl-File-Copy perl-FindBin perl-Text-ParseWords \
             perl-Thread-Queue perl-bignum perl-locale python python3 python3-GitPython \
             python3-jinja2 python3-pexpect python3-pip python3-websockets rpcgen socat tar \
             texinfo unzip util-linux-script wget which xz zstd
        ```

    Paket listesi sürümler arasında değişebilir. Güncel liste için *Yocto Reference Manual → System
    Requirements → Required Packages for the Build Host* bölümüne bakılmalıdır.

!!! dikkat "WSL 2 kullanımında dosya sistemi"
    WSL 2 ortamında derleme `/mnt/c/...` veya `/mnt/d/...` gibi Windows sürücülerinde yapılmamalıdır.
    Bu sürücülerde derleme hem çok yavaştır hem de büyük-küçük harf ve izin farklılıkları nedeniyle hatalı
    sonuç verir. Derleme WSL'nin kendi ext4 dosya sisteminde (`~/` altında) yapılmalıdır.

## 3.2 `bitbake-setup` kurulumu

`bitbake-setup`, Python sanal ortamına kurulabilir:

```bash
python3 -m venv --clear ~/bitbake-setup-venv
. ~/bitbake-setup-venv/bin/activate
pip install bitbake-setup
```

Tüm kurulumların tek bir üst dizinde toplanması için genel ayar yapılır:

```bash
bitbake-setup settings set --global default top-dir-prefix $HOME
```

Bu ayardan sonra kurulumlar `~/bitbake-builds/` altında oluşturulur. Bu dizindeki indirme ve sstate
önbellekleri tüm kurulumlar arasında paylaşılır.

## 3.3 Kurulumun oluşturulması

```bash
bitbake-setup init
```

Araç etkileşimli olarak şu seçimleri ister:

1. **Yapılandırma şablonu:** 6.0 için `poky-wrynose`. Mevcut şablonlar `bitbake-setup list` komutuyla görüntülenir.
2. **Yapılandırma:** `poky` veya `poky-with-sstate`. İkincisi Yocto Project'in hazır sstate yansısını
   (`core/yocto/sstate-mirror-cdn` parçası) baştan etkinleştirir ve ilk derlemeyi önemli ölçüde kısaltır.
3. **Makine (MACHINE):** `machine/qemux86-64`
4. **Dağıtım (DISTRO):** `distro/poky`
5. **Kurulum dizininin adı:** önerilen ad kabul edilebilir.

Aynı seçimler komut satırından da verilebilir:

```bash
bitbake-setup init --non-interactive poky-wrynose poky distro/poky machine/qemux86-64
```

Oluşan yapı:

```text
~/bitbake-builds/
├── site.conf                      # tüm kurulumların paylaştığı ayarlar
├── .bitbake-setup-downloads/      # indirilen kaynaklar (DL_DIR), paylaşılır
├── .sstate-cache/                 # görev çıktıları önbelleği (SSTATE_DIR), paylaşılır
└── <kurulum-adı>/
    ├── build/                     # BitBake derleme dizini
    │   ├── conf/                  # local.conf, bblayers.conf…
    │   └── init-build-env         # ortamı hazırlayan betik
    ├── config/                    # seçimlerin kaydı (bir git deposu)
    └── layers/                    # bitbake, openembedded-core, meta-yocto…
```

`bitbake-setup status` kurulumun şablondan farklılaşıp farklılaşmadığını, `bitbake-setup update` ise
kurulumu şablonla eşitlemeyi sağlar. Bu yaklaşım, aynı kurulumun ekip içinde tekrarlanabilir biçimde
oluşturulmasına olanak tanır.

## 3.4 Ortamın yüklenmesi ve yapılandırma parçaları

Her yeni terminal oturumunda önce derleme ortamı yüklenir:

```bash
source ~/bitbake-builds/<kurulum-adı>/build/init-build-env
```

Bu komut çalışma dizinini `build/` olarak ayarlar ve `bitbake`, `bitbake-layers`, `runqemu` gibi komutları
`PATH`'e ekler.

**Yapılandırma parçaları** (*configuration fragments*), eskiden `local.conf` dosyasına satır satır
yazılan ayarların adlandırılmış, açıklamalı ve yeniden kullanılabilir birimlere dönüştürülmüş halidir.
İki türü vardır:

- **Standart parçalar:** Bir katmanın `conf/fragments/` dizinindeki `.conf` dosyalarıdır. Adları
  `<katman-kimliği>/<dosya-yolu>` biçimindedir (ör. `core/yocto/sstate-mirror-cdn`).
- **Yerleşik parçalar:** Tek bir değişkeni ayarlar. `machine/<ad>` → `MACHINE`, `distro/<ad>` → `DISTRO`.

Etkinleştirilen parçalar `build/conf/toolcfg.conf` dosyasına `OE_FRAGMENTS` değişkeni olarak yazılır.

```bash
bitbake-config-build list-fragments
bitbake-config-build enable-fragment core/yocto/sstate-mirror-cdn
bitbake-config-build enable-fragment core/yocto/root-login-with-empty-password
```

`poky-with-sstate` seçildiyse ilk parça zaten etkindir.

!!! dikkat "Geliştirme amaçlı parçalar"
    `root-login-with-empty-password` parçası **yalnızca geliştirme ortamı içindir**. Sahaya gönderilen bir
    imajda etkin kalması ciddi bir güvenlik açığıdır. Ürün yapılandırması geliştirme yapılandırmasından
    ayrı tutulmalıdır (bkz. [Bölüm 11](11-distro.md)).

!!! sss "`local.conf` dosyasının rolü nedir?"
    `local.conf` hâlâ desteklenir. Ancak `bitbake-setup` ile oluşturulan kurulumlarda neredeyse boştur.
    Makine, dağıtım ve sık kullanılan ayarlar parçalarla yönetilir. `local.conf` lisans onayları gibi
    yalnızca o derleme dizinine özgü birkaç ayar için kullanılır. Örneğin hedef makinenin değiştirilmesi
    artık tek bir komutla yapılır:

    ```bash
    bitbake-config-build enable-fragment machine/qemuarm64
    ```

## 3.5 Derleme

!!! lab "Uygulama 3.2 · İlk imaj"
    ```bash
    bitbake core-image-minimal
    ```

    `core-image-minimal`, konsol erişimi sağlayan en küçük referans imajdır. Grafik arayüzlü bir örnek
    için `core-image-sato` kullanılabilir; derleme süresi belirgin biçimde daha uzundur.

    Derleme sırasında şuna benzer bir çıktı görülür:

    ```text
    Loading cache: 100% |###########################################| Time: 0:00:00
    Parsing recipes: 100% |#########################################| Time: 0:00:41
    NOTE: Resolving any missing task queue dependencies
    Sstate summary: Wanted 1180 Local 0 Mirrors 1102 Missed 78 Current 0 (93% match, 0% complete)
    NOTE: Executing Tasks
    Currently 8 running tasks (2243 of 3215)  69% |############          |
    ```

    `Mirrors` değeri, sstate yansısından hazır olarak indirilen görev çıktılarının sayısını gösterir.
    Bu oran yükseldikçe derleme süresi kısalır.

Bir imajın derlenmesi, aşağıdaki görev zincirinin sonucudur. Ayrıntı için adımlara tıklayabilirsiniz:

<div class="zincir" data-tur="imaj"></div>

## 3.6 QEMU'da çalıştırma

```bash
runqemu qemux86-64 nographic snapshot
```

- `nographic`: grafik pencere açmadan, aynı terminalde seri konsol sağlar.
- `snapshot`: çalışma sırasında yapılan değişiklikler kapanışta atılır, imaj değişmeden kalır. QEMU
  makinelerinde kök dosya sistemi sıkıştırılmış (`.ext4.zst`) üretildiğinden runqemu bu imajları yalnızca
  `snapshot` kipinde çalıştırır.

Açılış tamamlandığında:

```text
Poky (Yocto Project Reference Distro) 6.0.x qemux86-64 ttyS0

qemux86-64 login: root
root@qemux86-64:~# uname -a
Linux qemux86-64 6.18.x-yocto-standard ... x86_64 GNU/Linux
```

QEMU'dan çıkmak için ++ctrl+a++ ve ardından ++x++ tuşlarına basılır ya da sistem içinden `poweroff`
komutu kullanılır.

!!! iyi "İlk derlemeden sonra yapılması önerilenler"
    1. Disk kullanımını inceleyin: `du -sh ~/bitbake-builds/* ~/bitbake-builds/.[!.]*`. `tmp/` dizini
       silinebilir; asıl değerli veriler `.bitbake-setup-downloads/` ve `.sstate-cache/` dizinlerindedir.
    2. Üretilen dosyaları inceleyin: `ls tmp/deploy/images/qemux86-64/` (bkz. [Bölüm 4](04-build-dizini.md)).
    3. Aynı derleme komutunu yeniden çalıştırın. Tüm çıktılar önbellekte olduğundan derleme saniyeler içinde tamamlanır.

??? info ":material-history: Önceki sürümlerde (5.0 Scarthgap ve öncesi)"
    ```bash
    git clone -b scarthgap git://git.yoctoproject.org/poky
    cd poky
    source oe-init-build-env        # build/ dizinini oluşturur
    # build/conf/local.conf içinde MACHINE ?= "qemux86-64" satırı düzenlenir
    bitbake core-image-minimal
    runqemu qemux86-64 nographic
    ```
    Bu yöntem 5.0 LTS için geçerliliğini korur. Parçalar 5.2'de, `bitbake-setup` 5.3'te gelmiştir.
    Alternatif bir kurulum aracı olarak YAML tabanlı [kas](https://github.com/siemens/kas) da yaygın
    kullanılır (bkz. [Bölüm 18](18-ci.md)).

## Özet

- Derleme makinesi için 32 GB RAM ve 140 GB disk önerilir; WSL 2'de derleme Linux dosya sisteminde yapılmalıdır.
- `bitbake-setup init` kurulumu oluşturur: `build/`, `config/`, `layers/` ve paylaşılan önbellekler.
- `bitbake-config-build` ile yapılandırma parçaları yönetilir; makine ve dağıtım da birer parçadır.
- `bitbake core-image-minimal` ile imaj derlenir, `runqemu` ile QEMU'da çalıştırılır.

## Değerlendirme soruları

<div class="quiz" data-id="b03-1">
<p class="quiz-soru"><code>bitbake-setup init</code> komutunun çektiği git depoları (bitbake, openembedded-core, meta-yocto) hangi dizinde bulunur?</p>
<ul>
<li><code>build/tmp/</code></li>
<li data-dogru><code>layers/</code></li>
<li><code>config/</code></li>
<li><code>/usr/share/yocto/</code></li>
</ul>
<p class="quiz-aciklama"><code>layers/</code>, bitbake-setup'ın yönettiği depoları içerir. <code>config/</code> seçimlerin kaydını tutar,
<code>build/</code> ise derleme dizinidir.</p>
</div>

<div class="quiz" data-id="b03-2">
<p class="quiz-soru">Yeni açılan bir terminalde <code>bitbake: command not found</code> hatası alınmaktadır. Olası neden nedir?</p>
<ul>
<li>bitbake-setup'ın yeniden kurulması gerekir</li>
<li data-dogru>Derleme ortamı <code>source …/build/init-build-env</code> ile yüklenmemiştir</li>
<li>Bilgisayarın yeniden başlatılması gerekir</li>
<li>Komutun <code>sudo</code> ile çalıştırılması gerekir</li>
</ul>
<p class="quiz-aciklama">Ortam betiği her terminal oturumunda yeniden yüklenmelidir. BitBake root yetkisiyle çalıştırılmaz; böyle bir
denemeyi kendisi reddeder.</p>
</div>

<div class="quiz" data-id="b03-3">
<p class="quiz-soru">Hedef makineyi qemux86-64'ten qemuarm64'e değiştirmenin 6.0'daki önerilen yolu hangisidir?</p>
<ul>
<li>Yeni bir Poky deposu klonlamak</li>
<li><code>bitbake -m qemuarm64</code></li>
<li data-dogru><code>bitbake-config-build enable-fragment machine/qemuarm64</code></li>
<li>Çekirdeği elle derlemek</li>
</ul>
<p class="quiz-aciklama"><code>machine/…</code> ve <code>distro/…</code> yerleşik parçalardır; her biri tek bir değişkeni (MACHINE veya DISTRO) ayarlar.</p>
</div>

<div class="quiz" data-id="b03-4">
<p class="quiz-soru"><code>poky-with-sstate</code> yapılandırmasını <code>poky</code> yapılandırmasından ayıran nedir?</p>
<ul>
<li>Farklı bir Yocto sürümü kullanması</li>
<li data-dogru>Yocto Project'in hazır sstate yansısını kullanan parçayı baştan etkinleştirmesi</li>
<li>Grafik arayüzlü imaj üretmesi</li>
<li>İnternet bağlantısı gerektirmemesi</li>
</ul>
<p class="quiz-aciklama"><code>poky-with-sstate</code>, <code>core/yocto/sstate-mirror-cdn</code> parçasını içerir. Böylece görev çıktılarının önemli bir
kısmı yansıdan indirilir.</p>
</div>

!!! alistirma "Alıştırma: Farklı mimariye geçiş"
    Aynı kurulumda hedef makineyi **qemuarm64** olarak değiştirin, imajı derleyin ve QEMU'da `uname -m`
    komutunun `aarch64` döndürdüğünü doğrulayın. `Sstate summary` satırını önceki derlemeyle
    karşılaştırın: x86 derlemesindeki görev çıktılarının bir kısmı neden yeniden kullanılabilmiştir?

    ??? success "Örnek çözüm"
        ```bash
        bitbake-config-build enable-fragment machine/qemuarm64
        bitbake core-image-minimal
        runqemu qemuarm64 nographic snapshot
        ```
        Derleme makinesinde çalışan araçlar (`-native` tarifleri, ör. `cmake-native`) hedef mimariden
        bağımsızdır. Bu nedenle x86 derlemesinde üretilen sstate çıktıları ARM derlemesinde de doğrudan
        kullanılır. Yalnızca hedef mimariye ait paketler yeniden derlenir.

**Sonraki bölüm:** [4 · Build dizininin yapısı →](04-build-dizini.md)
