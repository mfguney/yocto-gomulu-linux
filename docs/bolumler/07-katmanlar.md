# 7 · Katmanlar ve bbappend

<div class="kunye" markdown>
<span>Süre: ~35 dk + uygulama</span><span>Düzey: Orta</span><span>Ön koşul: Bölüm 6</span>
</div>

!!! hedef "Öğrenme hedefleri"
    Bu bölümün sonunda:

    - Katman mimarisinin bakım açısından sağladığı faydaları açıklayabilirsiniz.
    - Bir katman oluşturabilir ve `layer.conf` dosyasının bileşenlerini açıklayabilirsiniz.
    - Başka bir katmandaki tarifi `.bbappend` ile değiştirebilirsiniz.
    - Katmanları ve tarif eklerini komut satırından sorgulayabilirsiniz.
    - Katmana özgü yapılandırma parçaları tanımlayabilirsiniz.

## 7.1 Temel ilke

> **Başka bir ekibe veya projeye ait katman doğrudan değiştirilmez. Değişiklikler kurumun kendi
> katmanında, `.bbappend` dosyalarıyla yapılır.**

Bu ilkenin üç temel faydası vardır:

1. **Güncellenebilirlik:** Yukarı akıştaki katmanlar (OE-Core, BSP katmanları) çakışma olmadan güncellenebilir.
2. **İzlenebilirlik:** Ürüne özgü tüm değişiklikler tek bir yerde, kurumun katmanında görülür.
3. **Yeniden kullanılabilirlik:** Aynı ürün katmanı farklı kartlarla veya farklı ürün varyantlarıyla birlikte kullanılabilir.

## 7.2 Katman oluşturma

```bash
bitbake-layers create-layer --layerid ornek --priority 10 ../layers/meta-ornek
bitbake-layers add-layer ../layers/meta-ornek
```

`--layerid` verilmezse katman kimliği dizin adından (`meta-ornek`), öncelik ise 6 olarak belirlenir.
Katmanın en önemli dosyası `conf/layer.conf`'tur:

```bitbake title="examples/meta-ornek/conf/layer.conf"
# Katmandaki tarif ve tarif eklerinin konumu
BBPATH .= ":${LAYERDIR}"
BBFILES += "${LAYERDIR}/recipes-*/*/*.bb \
            ${LAYERDIR}/recipes-*/*/*.bbappend"

BBFILE_COLLECTIONS += "ornek"                         # (1)!
BBFILE_PATTERN_ornek = "^${LAYERDIR}/"
BBFILE_PRIORITY_ornek = "10"                          # (2)!

LAYERDEPENDS_ornek = "core"                           # (3)!
LAYERSERIES_COMPAT_ornek = "wrynose"                  # (4)!
```

1.  **Katman kimliği.** Diğer değişkenlerde `_ornek` soneki olarak kullanılır. Aynı zamanda katmandaki
    yapılandırma parçalarının önekidir: `ornek/...`
2.  **Öncelik.** Aynı tarif birden fazla katmanda bulunduğunda önceliği yüksek olan katman geçerli olur;
    tarif eklerinin uygulanma sırasını da bu değer belirler. OE-Core'un önceliği 5'tir.
3.  **Bağımlılık.** Katman `core` (OE-Core) olmadan çalışmaz. `meta-oe` gerekiyorsa `"core openembedded-layer"` yazılır.
4.  **Uyumluluk.** Katmanın test edildiği Yocto sürüm serileri. Birden fazla seri boşlukla ayrılarak
    yazılabilir: `"scarthgap wrynose"`.

Önerilen dizin yapısı:

```text
meta-ornek/
├── conf/
│   ├── layer.conf
│   ├── distro/            # dağıtım yapılandırmaları   (Bölüm 11)
│   ├── machine/           # makine tanımları          (Bölüm 10)
│   └── fragments/         # yapılandırma parçaları
├── classes/               # katmana özgü .bbclass dosyaları
├── recipes-ornek/         # ürün tarifleri (recipes-<konu>/<tarif>/)
├── recipes-core/          # diğer katmanlardaki tariflere ekler
├── COPYING.MIT
└── README.md              # bağımlılıklar, bakımcı, kullanım
```

## 7.3 Tarif ekleri (`.bbappend`)

Bir `.bbappend` dosyası, aynı adlı `.bb` dosyasının **sonuna eklenmiş gibi** işlenir. Dosya adı tarifin
adıyla eşleşmelidir. `%` joker karakteri sürüm kısmının her değeriyle eşleşir:

| Tarif | Eşleşen tarif eki |
|---|---|
| `base-files_3.0.14.bb` | `base-files_3.0.14.bbappend` veya `base-files_%.bbappend` |
| `busybox_1.37.0.bb` | `busybox_%.bbappend` (sürüm değişikliklerinden etkilenmez; önerilir) |

Eşleşen bir tarifi olmayan tarif eki BitBake'in hata vermesine neden olur. Bu davranış, yukarı akışta
kaldırılan veya adı değişen tariflerin fark edilmesini sağlar.

!!! lab "Uygulama 7.1 · Cihaz adı ve oturum açma mesajı"
    `examples/meta-ornek/recipes-core/base-files/` dizininde iki dosya bulunur:

    ```bitbake title="base-files_%.bbappend"
    # Katmanın files/ dizinini arama yolunun başına ekle
    FILESEXTRAPATHS:prepend := "${THISDIR}/files:"

    # /etc/hostname içeriği (varsayılan değer MACHINE adıdır)
    hostname = "agecidi"
    ```

    ```text title="files/motd"

      ÖrnekOS · Endüstriyel sensör ağ geçidi
      Yetkisiz erişim yasaktır.

    ```

    `base-files` tarifinin `SRC_URI` değişkeninde `file://motd` zaten bulunmaktadır. Tarif ekiyle yalnızca
    **aynı adlı dosya** öne alınır: `FILESEXTRAPATHS` sayesinde BitBake önce katmanın kendi dizininde arama
    yapar ve dosyayı orada bulur.

    ```bash
    bitbake-layers show-appends | grep -A2 base-files    # ek görünüyor mu?
    bitbake core-image-minimal
    runqemu qemux86-64 nographic snapshot
    ```

    **Beklenen sonuç:** `agecidi login:` istemi ve oturum açıldıktan sonra yukarıdaki mesaj görüntülenir.

Aşağıdaki animasyon, tarif ekinin ayrıştırmaya nasıl katıldığını, FILESPATH arama sırasının nasıl
oluştuğunu ve meta-ornek'teki `motd` dosyasının OE-Core'daki dosyayı nasıl gölgede bıraktığını gösterir:

<div class="akis" data-senaryo="bbappend"></div>

!!! dikkat "`FILESEXTRAPATHS` satırındaki iki ayrıntı"
    ```bitbake
    FILESEXTRAPATHS:prepend := "${THISDIR}/files:"
    ```

    - **`:=` kullanılmalıdır.** `THISDIR` "o anda okunan dosyanın dizini" anlamına gelir. `=` kullanılırsa
      değişken daha sonra, başka bir dosya okunurken genişletilir ve yanlış dizini gösterir.
    - **Sondaki `:` karakteri** yol ayracıdır. Yazılmazsa eklenen yol bir sonraki yolla birleşir ve her
      ikisi de geçersiz hale gelir.

## 7.4 Katmanların sorgulanması

| Komut | Çıktı |
|---|---|
| `bitbake-layers show-layers` | Etkin katmanlar, yolları ve öncelikleri |
| `bitbake-layers show-recipes "sensor*"` | Tarifler ve bulundukları katmanlar |
| `bitbake-layers show-appends` | Hangi tarife hangi tarif eklerinin uygulandığı |
| `bitbake-layers show-overlayed` | Başka bir katmandaki tarifin gölgesinde kalan tarifler |
| `bitbake-layers layerindex-fetch meta-oe` | Layer Index'ten katmanı bağımlılıklarıyla birlikte indirme |

!!! iyi "Katman sorumluluklarının ayrılması ve denetimi"
    Kurumsal projelerde yerleşik uygulama şudur: **BSP katmanı** yalnızca makine ayarlarını, **dağıtım
    katmanı** yalnızca politikaları, **yazılım katmanı** yalnızca tarifleri içerir. Bir katmanın yalnızca
    eklenmesi derlemenin sonucunu değiştirmemelidir; değişiklik ancak bir `MACHINE`, `DISTRO` veya parça
    seçildiğinde devreye girmelidir.

    Paylaşılacak katmanlar OE-Core'daki `yocto-check-layer` betiğiyle test edilmelidir. Bu betik, katmanın
    eklendiği sistemin geri kalanını değiştirip değiştirmediğini denetler. Testi geçen katmanlar
    "Yocto Project Compatible" programına başvurabilir.

## 7.5 Katmana özgü yapılandırma parçaları

Katmanın `conf/fragments/` dizinindeki her `.conf` dosyası bir yapılandırma parçasıdır. Parça adı,
katman kimliği ile dosya yolundan oluşur. Her parça bir özet ve açıklama içermelidir:

```bitbake title="examples/meta-ornek/conf/fragments/gelistirici.conf"
BB_CONF_FRAGMENT_SUMMARY = "Geliştirici imajı ayarları"
BB_CONF_FRAGMENT_DESCRIPTION = "SSH sunucusu, hata ayıklama araçları ve paket yönetimi \
ekler. Yalnızca geliştirme içindir; ürün imajlarında kullanılmamalıdır."

EXTRA_IMAGE_FEATURES += "ssh-server-dropbear tools-debug package-management"
```

```bash
bitbake-config-build list-fragments | grep ornek
bitbake-config-build enable-fragment ornek/gelistirici
```

Parçalar, aynı katmandan geliştirme ve ürün yapılandırmalarının ayrı ayrı ve açıkça adlandırılmış
biçimde sunulmasını sağlar.

## Özet

- Başka katmanlar değiştirilmez; değişiklikler kurumun kendi katmanında `.bbappend` ile yapılır.
- `layer.conf`: `BBFILE_COLLECTIONS`, `BBFILE_PRIORITY`, `LAYERDEPENDS`, `LAYERSERIES_COMPAT`.
- `%` joker karakterli tarif ekleri ve `FILESEXTRAPATHS:prepend := "${THISDIR}/files:"` kullanılır.
- Katmanlar `bitbake-layers show-*` komutlarıyla sorgulanır, `yocto-check-layer` ile denetlenir.
- `conf/fragments/` ile katmana özgü yapılandırma parçaları sunulur.

## Değerlendirme soruları

<div class="quiz" data-id="b07-1">
<p class="quiz-soru">İki katmanda da <code>ornek-panel_1.0.bb</code> bulunmaktadır: biri öncelik 6, diğeri öncelik 10. Hangisi derlenir?</p>
<ul>
<li>Önce bulunan</li>
<li>İkisi de</li>
<li data-dogru>Öncelik 10 olan katmandaki</li>
<li>BitBake hata verir</li>
</ul>
<p class="quiz-aciklama">Katman önceliği, tarif sürümünden bağımsız olarak geçerlidir. En yüksek sürüm ancak aynı öncelikteki tarifler arasında
seçilir. Gölgede kalan tarifler <code>bitbake-layers show-overlayed</code> ile görülür; belirli bir sürümü zorlamak için
<code>PREFERRED_VERSION</code> kullanılır.</p>
</div>

<div class="quiz" data-id="b07-2">
<p class="quiz-soru">OE-Core'daki <code>busybox_1.37.0.bb</code> tarifine, sürüm güncellemelerinden etkilenmeyecek bir ek yapılmak isteniyor. Dosya adı ne olmalıdır?</p>
<ul>
<li><code>busybox.bbappend</code></li>
<li data-dogru><code>busybox_%.bbappend</code></li>
<li><code>busybox_1.37.0.bb</code></li>
<li><code>busybox-append.bb</code></li>
</ul>
<p class="quiz-aciklama"><code>%</code> joker karakteri alt çizgiden sonraki sürüm kısmıyla eşleşir. Sürüm değiştiğinde ek çalışmaya devam eder.</p>
</div>

<div class="quiz" data-id="b07-3">
<p class="quiz-soru"><code>FILESEXTRAPATHS:prepend</code> satırında neden <code>=</code> yerine <code>:=</code> kullanılır?</p>
<ul>
<li>Daha hızlı ayrıştırıldığı için</li>
<li data-dogru><code>THISDIR</code> değerinin, o anda okunan dosyanın dizini olarak sabitlenmesi için</li>
<li>Boşluk eklemesi için</li>
<li>Değişkeni zayıf varsayılan yapmak için</li>
</ul>
<p class="quiz-aciklama"><code>THISDIR</code> okunan dosyaya göre değişir. <code>:=</code> değeri anında genişleterek tarif ekinin kendi dizinini sabitler.</p>
</div>

!!! alistirma "Alıştırma: BusyBox'a yeni bir komut ekleme"
    `core-image-minimal` içindeki BusyBox, komutlarını (`ls`, `watch`, `telnet` vb.) Kconfig seçenekleriyle
    etkinleştirir veya devre dışı bırakır.

    1. `bitbake -c devshell busybox` ile açılan kabukta `.config` dosyasını inceleyin ve **devre dışı**
       bir komut seçin (`# CONFIG_XXX is not set` satırları).
    2. `meta-ornek` içinde bir `busybox_%.bbappend` yazarak bu komutu kalıcı olarak etkinleştirin.
    3. İmajı derleyerek komutun QEMU'da çalıştığını doğrulayın.

    ??? success "Örnek çözüm"
        `recipes-core/busybox/files/yeni-komut.cfg` (seçilen seçeneğin adıyla):
        ```text
        CONFIG_XXX=y
        ```
        `recipes-core/busybox/busybox_%.bbappend`:
        ```bitbake
        FILESEXTRAPATHS:prepend := "${THISDIR}/files:"
        SRC_URI += "file://yeni-komut.cfg"
        ```
        BusyBox tarifi `SRC_URI` içindeki `.cfg` dosyalarını yapılandırma parçası olarak birleştirir. Bazı
        seçenekler başka seçeneklere bağlıdır; derleme sonrasında seçenek hâlâ kapalıysa bağımlılığı da
        eklenmelidir. Kalıcı değişiklikler her zaman tarif eki ve `.cfg` ile yapılmalıdır;
        `menuconfig` ile yapılan değişiklikler temizlik sonrasında kaybolur.

**Sonraki bölüm:** [8 · Sınıflar, include, require →](08-siniflar.md)
