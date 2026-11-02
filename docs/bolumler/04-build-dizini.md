# 4 · Build dizininin yapısı

<div class="kunye" markdown>
<span>Süre: ~25 dk</span><span>Düzey: Başlangıç</span><span>Ön koşul: Bölüm 3'teki derleme</span>
</div>

!!! hedef "Öğrenme hedefleri"
    Bu bölümün sonunda:

    - Derleme sırasında oluşan dizinlerin işlevlerini açıklayabilirsiniz.
    - Hangi dizinlerin güvenle silinebileceğini, hangilerinin korunması gerektiğini ayırt edebilirsiniz.
    - Bir tarifin çalışma dizinini, günlüklerini ve ürettiği paketleri bulabilirsiniz.
    - Temizlik komutlarının kapsamını açıklayabilirsiniz.

## 4.1 Genel yapı

Yocto derlemesi, girdileri ve çıktıları açıkça ayrılmış bir dizin yapısı kullanır. Bu ayrım hem disk
yönetimi hem de derleme sorunlarının çözümü açısından önemlidir.

```text
~/bitbake-builds/
├── site.conf
├── .bitbake-setup-downloads/  indirilen kaynaklar (DL_DIR)       → korunmalı, paylaşılabilir
├── .sstate-cache/             görev çıktıları (SSTATE_DIR)       → korunmalı, paylaşılabilir
└── <kurulum>/
    ├── layers/                metadata (git depoları)            → sürüm kontrolüyle yönetilir
    ├── config/                kurulum kaydı (git deposu)
    └── build/
        ├── conf/              yapılandırma dosyaları             → küçük ama kritik
        ├── cache/             kalıcı veriler (PERSISTENT_DIR)    → çoğunlukla silinebilir
        └── tmp/               tüm geçici çıktılar (TMPDIR)       → silinebilir, yeniden üretilir
```

Dizinler, değerlerine göre üç gruba ayrılabilir:

| Grup | Dizinler | Kaybedilirse |
|---|---|---|
| **Kaynak tanımı** | `layers/`, `build/conf/`, `config/` | Yapılandırma kaybolur; sürüm kontrolünden geri alınmalıdır |
| **Önbellekler** | indirme dizini (`DL_DIR`), sstate dizini (`SSTATE_DIR`) | Her şey yeniden indirilir ve derlenir; saatler sürebilir |
| **Türetilmiş çıktılar** | `tmp/`, `cache/` | Önbelleklerden dakikalar içinde yeniden üretilir |

!!! iyi "Dizin konumlarının sorgulanması"
    İndirme ve sstate dizinlerinin konumu kurulum yöntemine göre değişir. `bitbake-setup` bu dizinleri
    paylaşım amacıyla üst dizinde, **gizli** dizinler olarak tutar. Eski `oe-init-build-env` yöntemi ise
    bunları `build/downloads` ve `build/sstate-cache` olarak oluşturur. Kesin konumlar BitBake'e sorularak
    öğrenilmelidir:

    ```bash
    bitbake-getvar --value DL_DIR
    bitbake-getvar --value SSTATE_DIR
    bitbake-getvar --value TMPDIR
    ```

## 4.2 Yapılandırma dizini: `build/conf/`

| Dosya | İşlevi |
|---|---|
| `bblayers.conf` | Derlemede kullanılan katmanların listesi (`BBLAYERS`). `bitbake-layers add-layer` bu dosyayı günceller. |
| `local.conf` | Derleme dizinine özgü ayarlar. 6.0 kurulumlarında neredeyse boştur. |
| `toolcfg.conf` | `bitbake-config-build` ile etkinleştirilen parçalar (`OE_FRAGMENTS`). Elle değil, komutla düzenlenmelidir. |

## 4.3 Geçici çıktılar: `tmp/`

`tmp/` en çok yer kaplayan, ancak en kolay yeniden üretilebilen dizindir.

??? example "`tmp/work/`: tarif çalışma dizinleri"
    Her tarif için ayrı bir çalışma dizini (`WORKDIR`) oluşturulur:

    ```text
    tmp/work/<hedef-sistem>/<tarif-adı>/<sürüm>/
    ```

    Örnek: `tmp/work/x86-64-v3-poky-linux/busybox/<sürüm>/`. Hedef sistem adı mimariye (`x86-64-v3`) veya
    makineye özgü tariflerde makine adına (`qemux86_64-poky-linux`) göre belirlenir.

    | Alt dizin | Değişken | İçerik |
    |---|---|---|
    | `sources/` | `UNPACKDIR` | Açılmış kaynaklar; `S` genellikle `sources/<ad>-<sürüm>` |
    | `build/` | `B` | Ayrı dizinde derleme yapan projelerde (CMake, Meson) derleme çıktısı |
    | `image/` | `D` | `do_install` görevinin kurulum yaptığı geçici kök dizin |
    | `package/`, `packages-split/` | | Paketlere ayrılmış dosyalar |
    | `recipe-sysroot/`, `recipe-sysroot-native/` | | Tarifin bağımlılıklarına ait başlık ve kütüphaneler |
    | `temp/` | `T` | **Günlükler ve betikler:** `log.do_compile`, `run.do_compile` vb. |

??? example "`tmp/deploy/`: derleme ürünleri"
    ```text
    tmp/deploy/
    ├── images/qemux86-64/   # çekirdek, rootfs, wic imajları, manifest ve SBOM dosyaları
    ├── rpm/                 # paketler (PACKAGE_CLASSES ayarına göre ipk/ veya deb/)
    ├── licenses/            # paketlerin lisans metinleri
    └── spdx/                # SPDX 3.0 belgeleri
    ```

    `images/` altındaki dosya adlarının çoğu, tarih damgalı asıl dosyayı gösteren **sembolik
    bağlantılardır**. Örneğin `core-image-minimal-qemux86-64.rootfs.ext4.zst` her zaman son derlenen imajı
    gösterir. QEMU makinelerinde varsayılan biçimler `tar.zst` ve `ext4.zst`'dir (`IMAGE_FSTYPES`).

??? example "`tmp/log/`, `tmp/stamps/`, `tmp/cache/`"
    - `tmp/log/cooker/<makine>/`: her `bitbake` çalıştırmasının ana günlüğü.
    - `tmp/stamps/`: her görevin hangi imzayla tamamlandığını gösteren damga dosyaları. BitBake bir görevin
      yeniden çalıştırılıp çalıştırılmayacağına bu damgalara ve sstate'e bakarak karar verir.
    - `tmp/cache/`: tarif ayrıştırma önbelleği.

!!! sss "`build/cache/` dizini neyi içerir?"
    Bu dizin `PERSISTENT_DIR` değişkeniyle tanımlanır. Kod ayrıştırıcı önbelleği, getirici (*fetcher*)
    verileri ve yerel hash eşdeğerliği veritabanı (`hashserv.db`) burada tutulur. Silinmesi çoğunlukla
    zararsızdır, ancak sonraki derlemenin biraz yavaşlamasına yol açar.

!!! dikkat "Önbellek dizinlerinin silinmesi"
    `tmp/` güvenle silinebilir. İndirme (`DL_DIR`) ve sstate (`SSTATE_DIR`) dizinlerinin silinmesi ise tüm
    kaynakların yeniden indirilmesine ve her şeyin sıfırdan derlenmesine yol açar. Disk temizliği için
    önerilen yöntemler:

    ```bash
    rm -rf tmp/                                   # güvenli
    # eski sstate dosyalarını budamak için OE-Core betiği:
    ../layers/openembedded-core/scripts/sstate-cache-management.py --help
    ```

## 4.4 Bir tarifin izlenmesi

!!! lab "Uygulama 4.1 · BusyBox tarifinin incelenmesi"
    BusyBox, `core-image-minimal` içindeki temel komutların (`ls`, `cat`, `sh` vb.) çoğunu tek bir ikili
    dosyada toplar. Aşağıdaki adımlarla bu tarifin derleme süreci izlenir:

    ```bash
    # 1) Çalışma dizini
    bitbake-getvar -r busybox --value WORKDIR

    # 2) Derleme günlüğü
    less $(bitbake-getvar -r busybox --value WORKDIR)/temp/log.do_compile

    # 3) Üretilen paketler ve busybox paketinin içeriği
    oe-pkgdata-util list-pkgs -p busybox
    oe-pkgdata-util list-pkg-files busybox | head

    # 4) İmaja giren paketler
    less tmp/deploy/images/qemux86-64/core-image-minimal-qemux86-64.rootfs.manifest
    ```

    **Beklenen sonuç:** Manifest dosyasında `busybox` paketi ve sürümü yer alır.

!!! sss "`run.do_compile` ile `log.do_compile` arasındaki fark nedir?"
    `run.do_compile`, BitBake'in ilgili görev için ürettiği ve tüm değişkenlerin genişletilmiş halini
    içeren **çalıştırılabilir betiktir**. `log.do_compile` ise bu betiğin **çıktısıdır**. Hata analizinde
    önce günlük dosyası, bir komutun neden belirli bir biçimde çalıştığı araştırılırken betik incelenir.

## 4.5 Temizlik komutları

| Komut | Kapsam | Kullanım durumu |
|---|---|---|
| `bitbake -c clean <tarif>` | Tarifin WORKDIR'ı ve damgaları | Tarifin baştan derlenmesi |
| `bitbake -c cleansstate <tarif>` | Yukarıdakiler + tarifin sstate çıktıları | Önbellek yerine gerçek derleme yapılması |
| `bitbake -c cleanall <tarif>` | Yukarıdakiler + indirilmiş kaynaklar | Bozuk bir indirmeden şüphelenilmesi |
| `rm -rf tmp/` | Tüm geçici çıktılar | Disk temizliği, tutarsızlık şüphesi |

## Özet

- Dizinler üç gruba ayrılır: kaynak tanımı (korunmalı), önbellekler (korunmalı) ve türetilmiş çıktılar (silinebilir).
- Her tarifin `WORKDIR` dizininde `sources/` (UNPACKDIR), `image/` (D) ve `temp/` (günlükler) bulunur.
- Değişkenlerin gerçek değerleri `bitbake-getvar` ile sorgulanır.
- Paket içerikleri `oe-pkgdata-util`, imaj içeriği manifest dosyası ile incelenir.

## Değerlendirme soruları

<div class="quiz" data-id="b04-1">
<p class="quiz-soru">Disk alanı acilen boşaltılmalıdır. Hangi dizin herhangi bir veri kaybı olmadan silinebilir?</p>
<ul>
<li><code>.bitbake-setup-downloads/</code> (DL_DIR)</li>
<li><code>layers/</code></li>
<li data-dogru><code>build/tmp/</code></li>
<li><code>build/conf/</code></li>
</ul>
<p class="quiz-aciklama"><code>tmp/</code> tamamen yeniden üretilebilir. İndirme ve sstate dizinleri uzun süren indirme ve derlemelerin
birikimidir. <code>conf/</code> ve <code>layers/</code> silindiğinde ise yapılandırma kaybolur.</p>
</div>

<div class="quiz" data-id="b04-2">
<p class="quiz-soru">Bir tarifin <code>do_install</code> görevi dosyaları ilk olarak nereye kurar?</p>
<ul>
<li>Derleme makinesinin <code>/usr/bin</code> dizinine</li>
<li>SSH üzerinden hedef cihaza</li>
<li data-dogru>WORKDIR içindeki <code>image/</code> dizinine, yani <code>D</code> değişkeninin gösterdiği geçici köke</li>
<li>İndirme dizinine</li>
</ul>
<p class="quiz-aciklama">Her tarif kendi geçici kök dizininde (<code>${D}</code>) kurulum yapar ve paketleme bu dizinden gerçekleştirilir.
Derleme makinesine herhangi bir dosya kurulmaz.</p>
</div>

<div class="quiz" data-id="b04-3">
<p class="quiz-soru">Bir tarifin derleme hatasının ayrıntıları öncelikle hangi dosyada aranmalıdır?</p>
<ul>
<li><code>build/conf/local.conf</code></li>
<li data-dogru><code>${WORKDIR}/temp/log.do_compile</code></li>
<li><code>tmp/deploy/images/…/manifest</code></li>
<li><code>bblayers.conf</code></li>
</ul>
<p class="quiz-aciklama">Her görevin çıktısı tarifin <code>temp/</code> dizinindeki <code>log.do_&lt;görev&gt;</code> dosyasına yazılır.</p>
</div>

!!! alistirma "Alıştırma: Dosyanın kaynağının bulunması"
    `core-image-minimal` imajındaki `/etc/hostname` dosyası hangi tariften gelmektedir, içeriği nedir ve bu
    içerik nereden belirlenir?

    ??? success "Örnek çözüm"
        ```bash
        oe-pkgdata-util find-path /etc/hostname
        ```
        Bu komut dosyanın `base-files` paketinden geldiğini gösterir. Dosyanın içeriği `base-files`
        tarifindeki `hostname` değişkeninden gelir ve varsayılan değeri `MACHINE` adıdır; bu nedenle
        `qemux86-64` yazar. Doğrulamak için:
        ```bash
        bitbake-getvar -r base-files hostname
        ```
        Bu değişken Bölüm 7'de bir `.bbappend` dosyasıyla değiştirilecektir.

**Sonraki bölüm:** [5 · BitBake dili →](05-bitbake-dili.md)
