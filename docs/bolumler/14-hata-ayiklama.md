# 14 · Hata ayıklama

<div class="kunye" markdown>
<span>Süre: ~55 dk + uygulama</span><span>Düzey: Orta</span><span>Ön koşul: Bölüm 4, 6 ve 13</span>
</div>

!!! hedef "Öğrenme hedefleri"
    Bu bölümün sonunda:

    - Bir BitBake hata çıktısından hatalı tarifi, görevi ve günlük dosyasını belirleyebilirsiniz.
    - Görev günlüklerini ve görev betiklerini kullanarak hatayı yeniden üretebilirsiniz.
    - `devshell`, `pydevshell`, `bitbake-getvar` ve bağımlılık grafiği araçlarını kullanabilirsiniz.
    - Sık karşılaşılan kalite denetimi (QA) hatalarının nedenini ve doğru çözümünü açıklayabilirsiniz.
    - Bir görevin neden yeniden çalıştırıldığını `bitbake-diffsigs` ile belirleyebilirsiniz.
    - Hedef cihazda `gdbserver`, hata ayıklama paketleri ve `perf` ile çalışabilirsiniz.

## 14.1 Sistematik yaklaşım

Yocto derlemesi binlerce görevden oluşur ve bir hata çoğunlukla ekranda çok sayıda satır üretir. Hata
analizi her zaman aynı üç soruyla başlar:

1. **Hangi tarif?** Hata satırındaki `<PN>-<PV>-<PR>` bilgisi (ör. `olcum-gunluk-1.0-r0`).
2. **Hangi görev?** `do_compile`, `do_install`, `do_package_qa` gibi görev adı.
3. **Günlük nerede?** `Logfile of failure stored in:` satırındaki dosya yolu.

Tipik bir hata çıktısı şu yapıdadır:

```text
ERROR: modbus-izle-1.0-r0 do_compile: Execution of '.../temp/run.do_compile.41872' failed with exit code 1  ← (1)
ERROR: Logfile of failure stored in: .../tmp/work/x86-64-v3-poky-linux/modbus-izle/1.0/temp/log.do_compile.41872
Log data follows:                                                                                     ← (2)
| DEBUG: Executing shell function do_compile
| ...
ERROR: Task (.../modbus-izle_1.0.bb:do_compile) failed with exit code '1'                                ← (3)
NOTE: Tasks Summary: Attempted 812 tasks of which 803 didn't need to be rerun and 1 failed.

Summary: 1 task failed:
  .../modbus-izle_1.0.bb:do_compile
    log: .../temp/log.do_compile.41872
```

(1) satırı tarif ve görevi, (2) bölümü günlüğün son kısmını, (3) satırı BitBake'in görev düzeyindeki
sonucunu gösterir. Asıl neden genellikle (2) bölümünde, derleyicinin veya betiğin **ilk** hata
mesajındadır. Sonraki satırlar çoğunlukla bu ilk hatanın sonuçlarıdır.

!!! iyi "Birden fazla hatanın birlikte görülmesi"
    `bitbake -k <hedef>` (`--continue`) seçeneği, bir görev başarısız olduğunda ona bağlı olmayan
    görevlerin çalışmaya devam etmesini sağlar. Derleme sonunda tüm başarısız görevler `Summary:`
    bölümünde listelenir. CI ortamında tek seferde birden fazla hatanın raporlanması için kullanışlıdır.

## 14.2 Görev günlükleri ve görev betikleri

Her tarifin `${WORKDIR}/temp` dizini (`T` değişkeni) hata ayıklamanın birincil kaynağıdır:

| Dosya | İçerik |
|---|---|
| `log.do_<görev>.<pid>` | Görevin tam çıktısı; her çalıştırma için ayrı dosya |
| `log.do_<görev>` | En son çalıştırmanın günlüğüne sembolik bağlantı |
| `run.do_<görev>.<pid>` | BitBake'in çalıştırdığı betiğin tam hali: tüm değişkenler genişletilmiş, fonksiyonlar birleştirilmiş |
| `log.task_order` | Görevlerin çalıştırılma sırası ve kullanılan günlük dosyaları |

`run.do_*` dosyası, BitBake değişkenlerinin görev çalışırken hangi değerleri aldığını gösterdiği için
özellikle değerlidir. Örneğin `run.do_compile` içinde `CC`, `CFLAGS` ve `LDFLAGS` değişkenlerinin
gerçek değerleri, `export` satırları olarak görülebilir. Derleme oturumunun genel günlüğü ise
`tmp/log/cooker/<makine>/` dizininde tutulur.

## 14.3 Etkileşimli ortamlar: `devshell` ve `pydevshell`

```bash
bitbake -c devshell sensor-oku
```

`devshell`, `do_patch` görevine kadar olan görevleri çalıştırır ve tarifin derleme ortamıyla yeni bir
terminal açar. Bu terminalde çalışma dizini `S` olur, `PATH` çapraz derleyiciyi içerir ve `CC`, `CFLAGS`
gibi değişkenler tanımlıdır. Bir görevi elle yeniden çalıştırmak için `../temp/run.do_compile` betiği
doğrudan çalıştırılabilir; bu, görevin BitBake tarafından çalıştırılmasıyla aynı sonucu verir. Açılan
terminal türü `OE_TERMINAL` değişkeniyle belirlenir (ör. `OE_TERMINAL = "tmux"`).

```bash
bitbake -c pydevshell sensor-oku
```

`pydevshell`, aynı noktada bir Python kabuğu açar. Bu kabukta BitBake veri deposu `d` nesnesi olarak
kullanılabilir:

```text
pydevshell> d.getVar("S")
'/home/.../tmp/work/x86-64-v3-poky-linux/sensor-oku/1.0/sources'
pydevshell> d.getVar("S", False)
'${UNPACKDIR}'
pydevshell> bb.build.exec_func("do_compile", d)
```

!!! dikkat "devshell içindeki değişiklikler kalıcı değildir"
    devshell içinde kaynak kodda veya derleme dizininde yapılan değişiklikler, tarifin bir sonraki
    temizliğinde (`bitbake -c clean`) ya da kaynakların yeniden açılmasında kaybolur. devshell yalnızca
    tanı amacıyla kullanılmalı; kalıcı düzeltmeler tarifte, tarif ekinde veya `devtool` ile yapılmalıdır
    (bkz. [Bölüm 13](13-devtool-sdk.md)).

## 14.4 Değişkenlerin ve bağımlılıkların sorgulanması

**Değişken değerleri.** `bitbake-getvar` bir değişkenin son değerini ve bu değere hangi dosyalarda,
hangi işlemlerle ulaşıldığını gösterir:

```bash
bitbake-getvar -r sensor-oku S              # değer ve atama geçmişi
bitbake-getvar -r sensor-oku --value S      # yalnızca değer
bitbake-getvar -r sensor-oku -f vardeps do_compile --value   # bir değişken bayrağı
```

`bitbake -e sensor-oku` aynı bilgiyi tarifin **tüm** değişkenleri ve fonksiyonları için üretir. Çıktı
çok uzun olduğundan genellikle `grep` ile süzülür:

```bash
bitbake -e sensor-oku | grep -E '^(S|B|D|WORKDIR)='
```

**Bağımlılık grafiği.** `bitbake -g` bir hedefin görev bağımlılıklarını Graphviz biçiminde çalışma
dizinine yazar (`task-depends.dot`, `pn-buildlist`). Büyük imajlarda bu dosya doğrudan okunamayacak
kadar büyüktür; `oe-depends-dot` ile sorgulanır:

```bash
bitbake -g ornek-image
oe-depends-dot -k python3 -w task-depends.dot     # python3 neden imaja giriyor?
oe-depends-dot -k sensor-oku -d task-depends.dot  # sensor-oku neye bağımlı?
bitbake -g -u taskexp ornek-image                 # grafik arayüzlü görev gezgini
```

Bir paketin imaja hangi çalışma bağımlılığı zinciriyle girdiğini görmek için imajın paket verileri de
kullanılabilir: `oe-pkgdata-util list-pkg-files <paket>` ve `oe-pkgdata-util find-path /usr/bin/<dosya>`.

## 14.5 Kalite denetimi (QA) hataları

`insane.bbclass`, paketleme sırasında ve sonrasında çok sayıda otomatik denetim uygular. Her denetimin
bir adı vardır; ad, hata mesajının sonunda köşeli parantez içinde görülür:

```text
ERROR: olcum-gunluk-1.0-r0 do_package_qa: QA Issue: File /usr/bin/olcum-gunluk in package olcum-gunluk doesn't have GNU_HASH (didn't pass LDFLAGS?) [ldflags]
```

Bir denetimin hata mı uyarı mı ürettiği, adının `ERROR_QA` veya `WARN_QA` listesinde bulunmasına bağlıdır.
6.0'da çoğu denetim varsayılan olarak `ERROR_QA` listesindedir. Sık karşılaşılan denetimler:

| Denetim | Görev | Neden | Doğru çözüm |
|---|---|---|---|
| `ldflags` | `do_package_qa` | İkili dosya Yocto'nun bağlayıcı bayrakları olmadan bağlanmış | Derleme komutuna `${LDFLAGS}` eklenir; Makefile `LDFLAGS` değişkenini kullanacak biçimde yamalanır |
| `installed-vs-shipped` | `do_package` | `do_install` ile kurulan bir dosya hiçbir pakete girmemiş | Dosya `FILES:${PN}` (veya uygun paket) kapsamına alınır ya da kurulmaz |
| `file-rdeps` | `do_package_qa` | Paketteki bir dosya (ör. betik yorumlayıcısı) başka bir pakete gerek duyuyor, ancak `RDEPENDS` eksik | İlgili paket `RDEPENDS:${PN}` değişkenine eklenir |
| `already-stripped` | `do_package` | Derleme sistemi ikili dosyayı kendisi soymuş (`strip`); hata ayıklama sembolleri ayrılamaz | Yukarı akış derleme sistemindeki soyma adımı (ör. `install -s`) kaldırılır |
| `license-checksum` | `do_populate_lic` | `LIC_FILES_CHKSUM` eksik ya da lisans dosyasının sağlaması değişmiş | Lisans metni incelenir; `LICENSE` hâlâ doğruysa yeni sağlama yazılır |
| `buildpaths` | `do_package_qa` | Paketlenen dosyalar derleme makinesine ait yolları içeriyor | Yolu gömen derleme seçeneği düzeltilir (tekrarlanabilirlik için önemlidir) |
| `dev-so` | `do_package_qa` | `.so` geliştirme bağlantısı ana pakete girmiş | Bağlantı `${PN}-dev` paketine bırakılır; gerçekten gerekiyorsa paketleme yeniden düzenlenir |
| `patch-status` | `do_patch` | Yamada geçerli `Upstream-Status:` satırı yok | Yama başlığına durum satırı eklenir (bkz. [Bölüm 13](13-devtool-sdk.md)) |

Bunlara ek olarak `do_unpack` görevinden sonra çalışan denetim, `S` değişkeninin gösterdiği dizin yoksa
şu uyarıyı üretir ve genellikle ardından `do_compile` görevi kaynak dosyayı bulamadan başarısız olur:

```text
WARNING: modbus-izle-1.0-r0 do_unpack: modbus-izle: the directory ${UNPACKDIR}/${BP} (.../sources/modbus-izle-1.0) pointed to by the S variable doesn't exist - please set S within the recipe to point to where the source has been unpacked to
```

!!! dikkat "`INSANE_SKIP` bir çözüm değildir"
    Bir denetim `INSANE_SKIP:${PN} = "ldflags"` ile atlanabilir. Ancak QA hataları çoğu durumda gerçek bir
    kusurun belirtisidir: bağlayıcı bayrakları olmadan üretilen ikili dosya güvenlik sertleştirmelerinden
    yoksun kalır; eksik `RDEPENDS` cihazda çalışma zamanı hatasına yol açar. `INSANE_SKIP` yalnızca
    denetimin yanlış alarm verdiği, nedeni tarifte bir yorum satırıyla açıklanmış durumlarda kullanılmalıdır.

## 14.6 Bir görev neden yeniden çalıştı?

BitBake her görev için, görevin girdilerinden (değişkenler, fonksiyon gövdeleri, dosya sağlamaları ve
bağımlı görevlerin imzaları) bir **imza** hesaplar (bkz. [Bölüm 15](15-sstate.md)). İmza değiştiğinde görev
yeniden çalışır. Beklenmeyen yeniden derlemeler, imzanın hangi girdisinin değiştiği bulunarak açıklanır.
İmza verileri `tmp/stamps/` altındaki `sigdata` dosyalarında ve sstate önbelleğindeki `siginfo`
dosyalarında saklanır.

| Komut | İşlevi |
|---|---|
| `bitbake-dumpsig -t <tarif> <görev>` | Görevin son imzasının tüm girdilerini listeler |
| `bitbake-diffsigs -t <tarif> <görev>` | Görevin son iki çalıştırmasının imzalarını karşılaştırır; değişiklik bir bağımlılıktaysa zinciri izler |
| `bitbake -S printdiff <hedef>` | Görevleri çalıştırmadan, mevcut imzaları önbellekteki en yakın eşleşmeyle karşılaştırır |

!!! lab "Uygulama 14.1 · Bir derleme hatasının analizi ve yeniden derleme nedeninin bulunması"
    **Bölüm A: hata analizi.** Alıştırma katmanı kuruluma eklenir ve ilk tarif derlenir:

    ```bash
    bitbake-layers add-layer ~/yocto-gomulu-linux/examples/meta-ornek-hatali
    bitbake olcum-gunluk
    ```

    ```text
    ERROR: olcum-gunluk-1.0-r0 do_package_qa: QA Issue: File /usr/bin/olcum-gunluk in package olcum-gunluk doesn't have GNU_HASH (didn't pass LDFLAGS?) [ldflags]
    ERROR: olcum-gunluk-1.0-r0 do_package_qa: Fatal QA errors were found, failing task.
    ```

    Tarif `olcum-gunluk`, görev `do_package_qa`, denetim `ldflags`'tir. Derleme komutunun gerçek hali
    görev betiğinde incelenir:

    ```bash
    T=$(bitbake-getvar -q -r olcum-gunluk --value T)
    grep -n 'olcum-gunluk.c' $T/run.do_compile
    grep -n '^export LDFLAGS' $T/run.do_compile
    ```

    Betikte `LDFLAGS` tanımlıdır (`-Wl,-O1 -Wl,--hash-style=gnu ...`), ancak derleme satırında
    kullanılmamaktadır. Tarifteki `do_compile` satırına `${LDFLAGS}` eklenir ve tarif yeniden derlenir.
    **Beklenen sonuç:** `bitbake olcum-gunluk` hatasız tamamlanır.

    **Bölüm B: yeniden derleme nedeni.** `build/conf/local.conf` dosyasına yalnızca bu tarifi etkileyen
    bir derleme seçeneği eklenir:

    ```bitbake
    CFLAGS:append:pn-sensor-oku = " -DORNEK_TANI"
    ```

    ```bash
    bitbake sensor-oku
    bitbake-diffsigs -t sensor-oku do_compile
    ```

    Çıktı şuna benzer:

    ```text
    basehash changed from 3f9c... to 81a2...
    Variable CFLAGS value changed:
    "-O2 -pipe -g -feliminate-unused-debug-types ... {+-DORNEK_TANI+}"
    ```

    `{+...+}` eklenen, `[-...-]` çıkarılan sözcükleri gösterir. Değişiklik bir bağımlılıktan gelseydi çıktı
    `Hash for task dependency ... changed` satırıyla başlar ve araç zinciri izleyerek asıl değişen
    görevi bulurdu. Alıştırma sonunda `local.conf` satırı kaldırılır.

## 14.7 Hedef cihazda hata ayıklama

Ürün imajındaki ikili dosyalar, boyutu küçültmek için **soyulmuş** (stripped) olarak paketlenir. Hata
ayıklama sembolleri `do_package` görevinde ayrılarak ayrı paketlere konur:

| Paket | İçerik |
|---|---|
| `${PN}-dbg` | Ayrılmış hata ayıklama sembolleri (`/usr/lib/debug/...`) |
| `${PN}-src` | Hata ayıklayıcının gösterdiği kaynak dosyalar (`/usr/src/debug/...`); varsayılan `PACKAGE_DEBUG_SPLIT_STYLE = "debug-with-srcpkg"` ile |

İmaja hata ayıklama araçlarını ekleyen özellikler (`EXTRA_IMAGE_FEATURES` veya imaj tarifinde
`IMAGE_FEATURES` ile):

| Özellik | Eklenen içerik |
|---|---|
| `tools-debug` | `gdb`, `gdbserver`, `strace` (ve glibc'de `mtrace`) |
| `tools-profile` | `perf` başta olmak üzere profil araçları |
| `dbg-pkgs` | İmajdaki tüm paketlerin `-dbg` paketleri (imaj boyutunu belirgin biçimde artırır) |

`meta-ornek` katmanındaki `ornek/gelistirici` parçası `tools-debug` özelliğini zaten içerir.

**gdbserver yöntemi.** Kısıtlı kaynaklara sahip cihazlarda GDB'nin sembolleri yüklemesi yavaştır.
Bunun yerine hedefte yalnızca küçük `gdbserver` programı çalıştırılır; semboller ve kaynak kodu ana
makinedeki çapraz GDB tarafından işlenir. Ana makinenin, cihazdaki ikili dosyaların soyulmamış
karşılıklarına erişebilmesi için imajla birlikte bir **hata ayıklama dosya sistemi** üretilir:

```bitbake
IMAGE_GEN_DEBUGFS = "1"
IMAGE_FSTYPES_DEBUGFS = "tar.bz2"
```

```text
root@agecidi:~# gdbserver :1234 /usr/bin/sensor-oku 3
```

Ana makinede, SDK ortamı yüklendikten sonra (veya `devtool ide-sdk` ile üretilen yapılandırmayla):

```text
$ $GDB
(gdb) set sysroot debugfs
(gdb) set substitute-path /usr/src/debug debugfs/usr/src/debug
(gdb) target remote 192.168.7.2:1234
(gdb) break main
(gdb) continue
```

Burada `debugfs`, imajın kök dosya sistemi arşivi ile `-dbg` arşivinin aynı dizine açılmasıyla
oluşturulur. Optimizasyon nedeniyle değişkenler `<optimized out>` görünüyorsa tarif `DEBUG_BUILD = "1"`
ile (veya `devtool modify --debug-build` ile) yeniden derlenir.

**debuginfod yöntemi.** `debuginfod` dağıtım özelliği OE-Core ve Poky varsayılanlarında etkindir. Ana
makinede `oe-debuginfod` çalıştırıldığında hata ayıklama bilgileri bir HTTP sunucusu üzerinden sunulur.
Hedefte `DEBUGINFOD_URLS="http://192.168.7.1:8002/"` tanımlandığında `gdb` gerekli sembolleri bu
sunucudan kendisi indirir; `-dbg` paketlerinin cihaza kurulması gerekmez.

**perf.** `tools-profile` özelliğiyle gelen `perf`, işlemci zamanının nerede harcandığını gösterir:

```text
root@agecidi:~# perf record -g sensor-oku 100
root@agecidi:~# perf report --stdio | head -20
```

Fonksiyon adlarının anlamlı görünmesi için ilgili paketlerin `-dbg` paketleri veya debuginfod erişimi
gereklidir.

!!! sss "Hata ayıklama araçları ürün imajında kalmalı mıdır?"
    Kalmamalıdır. `gdbserver` ağ üzerinden süreç denetimine olanak tanır; `tools-debug`, `dbg-pkgs` ve
    `root-login-with-empty-password` gibi özellikler yalnızca geliştirme yapılandırmalarında
    etkinleştirilmelidir. Bu nedenle kitapta bu ayarlar ürün tarifine değil, `ornek/gelistirici` gibi
    açıkça adlandırılmış parçalara konur (bkz. [Bölüm 11](11-distro.md) ve [Bölüm 17](17-guvenlik-guncelleme.md)).

## Özet

- Hata analizi tarif, görev ve günlük dosyasının belirlenmesiyle başlar; asıl neden genellikle günlükteki ilk hatadır.
- `temp/log.do_*` görevin çıktısını, `temp/run.do_*` görevin genişletilmiş betiğini içerir.
- `devshell` ve `pydevshell` tarif ortamında etkileşimli çalışmayı sağlar; değişiklikler kalıcı değildir.
- `bitbake-getvar`, `bitbake -e`, `bitbake -g` ve `oe-depends-dot` değişkenleri ve bağımlılıkları açıklar.
- QA hataları gerçek kusurları gösterir; çözüm tarifte yapılır, `INSANE_SKIP` istisnadır.
- `bitbake-diffsigs -t` bir görevin neden yeniden çalıştığını gösterir.
- Hedefte hata ayıklama için `gdbserver` + hata ayıklama dosya sistemi, debuginfod ve `perf` kullanılır.

## Değerlendirme soruları

<div class="quiz" data-id="b14-1">
<p class="quiz-soru">Bir derleme hatasında görevin çalıştırıldığı sırada <code>CFLAGS</code> değişkeninin gerçek değeri en doğrudan hangi dosyada görülür?</p>
<ul>
<li><code>build/conf/local.conf</code></li>
<li data-dogru><code>${WORKDIR}/temp/run.do_compile</code></li>
<li><code>tmp/log/cooker/&lt;makine&gt;/</code> altındaki oturum günlüğü</li>
<li>Tarif dosyasının kendisi</li>
</ul>
<p class="quiz-aciklama"><code>run.do_*</code> dosyası BitBake'in çalıştırdığı betiğin tam halidir; dışa aktarılan değişkenler genişletilmiş değerleriyle
<code>export</code> satırları olarak yer alır. Bu betik devshell içinde doğrudan çalıştırılarak görev yeniden üretilebilir.</p>
</div>

<div class="quiz" data-id="b14-2">
<p class="quiz-soru"><code>installed-vs-shipped</code> hatası neyi gösterir?</p>
<ul>
<li>Bir paketin imaja kurulmadığını</li>
<li data-dogru><code>do_install</code> ile <code>${D}</code> altına kurulan bir dosyanın hiçbir paketin <code>FILES</code> kapsamına girmediğini</li>
<li>Paketin hedef cihaza gönderilemediğini</li>
<li>Lisans dosyasının pakete eklenmediğini</li>
</ul>
<p class="quiz-aciklama">Kurulan her dosya bir pakete ait olmalıdır. Çözüm, dosyayı uygun paketin <code>FILES</code> değişkenine eklemek ya da
gereksizse hiç kurmamaktır.</p>
</div>

<div class="quiz" data-id="b14-3">
<p class="quiz-soru">Bir Python betiği kuran tarifte <code>file-rdeps</code> hatası alınmıştır. En uygun çözüm hangisidir?</p>
<ul>
<li><code>INSANE_SKIP:${PN} = "file-rdeps"</code></li>
<li><code>DEPENDS += "python3"</code></li>
<li data-dogru><code>RDEPENDS:${PN} += "python3-core"</code> (ve betiğin kullandığı diğer modüller)</li>
<li>Betiğin ilk satırının silinmesi</li>
</ul>
<p class="quiz-aciklama">Denetim, betiğin ilk satırındaki yorumlayıcının (<code>/usr/bin/python3</code>) çalışma bağımlılıkları arasında bulunmadığını tespit
etmiştir. Yorumlayıcı bir çalışma bağımlılığıdır ve <code>RDEPENDS</code> ile tanımlanır.</p>
</div>

<div class="quiz" data-id="b14-4">
<p class="quiz-soru">Hiçbir tarif değiştirilmediği halde bir görevin her derlemede yeniden çalıştığı gözlenmektedir. İlk kullanılacak araç hangisidir?</p>
<ul>
<li><code>bitbake -c cleanall</code></li>
<li><code>oe-depends-dot</code></li>
<li data-dogru><code>bitbake-diffsigs -t &lt;tarif&gt; &lt;görev&gt;</code></li>
<li><code>bitbake -c devshell</code></li>
</ul>
<p class="quiz-aciklama"><code>bitbake-diffsigs</code> son iki çalıştırmanın imzalarını karşılaştırır ve değişen girdiyi (değişken, dosya sağlaması veya
bağımlılık) gösterir. Sık görülen nedenler tarih/saat içeren değişkenler ve değişken içerikli dosyalardır.</p>
</div>

<div class="quiz" data-id="b14-5">
<p class="quiz-soru">gdbserver yönteminde hata ayıklama sembolleri nerede işlenir?</p>
<ul>
<li>Hedef cihazdaki <code>gdbserver</code> tarafından</li>
<li data-dogru>Ana makinedeki çapraz GDB tarafından; hedefteki ikili dosyalar soyulmuş kalabilir</li>
<li>QEMU tarafından</li>
<li>BitBake tarafından, derleme sırasında</li>
</ul>
<p class="quiz-aciklama">gdbserver yalnızca süreci denetler. Sembollerin ve kaynak dosyaların yüklenmesi gibi ağır işler ana makinedeki GDB'de yapılır;
bu nedenle ana makinenin soyulmamış ikili dosyalara (hata ayıklama dosya sistemi) erişmesi gerekir.</p>
</div>

!!! alistirma "Alıştırma: Hatalı tariflerin düzeltilmesi"
    `examples/meta-ornek-hatali` katmanındaki beş tarifin her biri tek bir hata içerir. Uygulama 14.1'de
    `olcum-gunluk` tarifi düzeltilmiştir. Kalan dört tarif için:

    ```bash
    bitbake -k kalibrasyon-veri alarm-izle modbus-ayar saglik-kontrol
    ```

    1. Her hata için tarifi, görevi ve (varsa) QA denetiminin adını belirleyin.
    2. Hatanın nedenini görev günlüğü veya `run.do_*` betiğiyle doğrulayın.
    3. Tarifi `INSANE_SKIP` kullanmadan düzeltin ve dört tarifin birlikte hatasız derlendiğini gösterin.
    4. Düzeltilmiş tarifleri bir imaja ekleyip QEMU'da `alarm-izle 25` ve `saglik-kontrol` komutlarını çalıştırın.

    ??? success "Örnek çözüm"
        | Tarif | Görev / denetim | Neden | Düzeltme |
        |---|---|---|---|
        | `olcum-gunluk` | `do_package_qa` / `ldflags` | `do_compile` içinde `${LDFLAGS}` yok | `${CC} ${CFLAGS} ${LDFLAGS} olcum-gunluk.c -o olcum-gunluk` |
        | `kalibrasyon-veri` | `do_package` / `installed-vs-shipped` | `${datadir}/ornek-kalibrasyon` varsayılan `FILES:${PN}` kapsamında değil (varsayılan yalnızca `${datadir}/${BPN}`) | `FILES:${PN} += "${datadir}/ornek-kalibrasyon"` ya da kurulum dizini `${datadir}/${BPN}` yapılır |
        | `alarm-izle` | `do_compile` (öncesinde `do_unpack` uyarısı) | `S` tanımlanmamış; varsayılan `${UNPACKDIR}/${BP}` dizini yok | `S = "${UNPACKDIR}"` |
        | `modbus-ayar` | `do_populate_lic` / `license-checksum` | `LIC_FILES_CHKSUM` içindeki md5 değeri lisans dosyasıyla eşleşmiyor | Hata mesajındaki yeni sağlama, lisans metni ve `LICENSE` değeri doğrulandıktan sonra yazılır: `md5=0835ade698e0bcf8506ecda2f7b4f302` |
        | `saglik-kontrol` | `do_package_qa` / `file-rdeps` | Betik `/usr/bin/python3` gerektiriyor, `RDEPENDS` yok | `RDEPENDS:${PN} += "python3-core"` |

        `modbus-ayar` için hata mesajı yeni sağlamayı doğrudan verir; ancak bu değer gözden geçirilmeden
        kopyalanmamalıdır. Sağlamanın değişmesi, lisans metninin değiştiği anlamına gelir ve `LICENSE`
        değerinin hâlâ geçerli olup olmadığı incelenmelidir. `saglik-kontrol` için kullanılan `os` ve
        `shutil` modülleri `python3-core` paketinde bulunur; betik başka modüller kullansaydı bunlar da
        eklenmeliydi. Doğrulama için `local.conf` dosyasına
        `IMAGE_INSTALL:append = " olcum-gunluk kalibrasyon-veri alarm-izle modbus-ayar saglik-kontrol"`
        satırı eklenerek imaj derlenir.

**Sonraki bölüm:** [15 · Derleme performansı: sstate ve hash eşdeğerliği →](15-sstate.md)
