# 5 · BitBake dili

<div class="kunye" markdown>
<span>Süre: ~40 dk</span><span>Düzey: Orta</span><span>Ön koşul: Bölüm 3–4</span>
</div>

!!! hedef "Öğrenme hedefleri"
    Bu bölümün sonunda:

    - BitBake'in metadata dosyalarını hangi sırayla ve hangi kapsamda işlediğini açıklayabilirsiniz.
    - Atama operatörlerini ve bunların uygulanma zamanını ayırt edebilirsiniz.
    - Override sözdizimiyle koşullu değerler tanımlayabilirsiniz.
    - Görev fonksiyonları, satır içi Python ve değişken bayraklarını okuyabilir ve yazabilirsiniz.
    - Bir değişkenin gerçek değerini ve geçmişini sorgulayabilirsiniz.

## 5.1 Metadata türleri ve işlenme sırası

| Uzantı | Tür | İçerik |
|---|---|---|
| `.conf` | Yapılandırma | Genel ayarlar: `local.conf`, `layer.conf`, makine ve dağıtım dosyaları |
| `.bb` | Tarif | Tek bir yazılım bileşeninin tanımı |
| `.bbappend` | Tarif eki | Var olan bir tarife ekleme ve değişiklik |
| `.bbclass` | Sınıf | Tariflerin `inherit` ile kullandığı ortak mantık |
| `.inc` | Ortak parça | `require` veya `include` ile paylaşılan bölümler |

BitBake önce tüm `.conf` dosyalarını okuyarak **genel veri deposunu** oluşturur. Ardından her tarif, bu
genel deponun bir kopyası üzerinde ayrıştırılır. Bunun iki önemli sonucu vardır:

- Yapılandırma dosyalarında tanımlanan bir değişken **tüm tariflerde** görülür.
- Bir tarifte tanımlanan değişken **yalnızca o tarife** aittir; diğer tarifleri etkilemez.

Aşağıdaki animasyon, dosyaların hangi sırayla okunduğunu ve genel veri deposunun tarife özgü veri
deposuna nasıl dönüştüğünü adım adım gösterir. ▶ Oynat ile otomatik, ▶| ile adım adım izlenebilir.

<div class="akis" data-senaryo="ayristirma"></div>

Bu sıranın pratik bir sonucu vardır: `local.conf` makine ve dağıtım dosyalarından **önce** okunur.
Bu nedenle `local.conf`'taki `?=` atamaları bu dosyalara varsayılan değer sağlar; makine veya dağıtım
dosyasında `=` ile yapılan bir atama ise `local.conf`'taki `=` atamasını geçersiz kılar.

## 5.2 Atama operatörleri

Operatörler, **ne zaman uygulandıklarına** göre iki gruba ayrılır. Ayrıştırma sırasında uygulananlar,
satırın okunduğu anda değeri değiştirir. Genişletme sırasında uygulananlar ise değişken okunana kadar
bekletilir ve en son uygulanır.

| Operatör | Anlamı | Uygulanma zamanı |
|---|---|---|
| `A = "x"` | Atama; önceki değer geçersiz olur. İçindeki `${...}` ifadeleri **okunduğunda** genişletilir. | Ayrıştırma |
| `A ?= "x"` | A tanımsızsa atama (ilk atama geçerli olur) | Ayrıştırma |
| `A ??= "x"` | **Zayıf varsayılan:** başka bir atama yoksa kullanılır (son `??=` geçerlidir) | Ayrıştırma sonu |
| `A := "x"` | Sağ taraf **anında** genişletilir ve sabitlenir | Ayrıştırma |
| `A += "x"` / `A =+ "x"` | Sona / başa **boşlukla** ekleme | Ayrıştırma |
| `A .= "x"` / `A =. "x"` | Sona / başa **boşluksuz** ekleme | Ayrıştırma |
| `A:append = "x"` | Sona ekleme, **boşluk eklemez** | Genişletme |
| `A:prepend = "x"` | Başa ekleme, **boşluk eklemez** | Genişletme |
| `A:remove = "x"` | Kelime çıkarma | Genişletme (en son) |

!!! dikkat "`:append` boşluk eklemez"
    Liste türündeki değişkenlere ekleme yapılırken sık karşılaşılan hata:

    ```bitbake
    IMAGE_INSTALL:append = "htop"     # HATALI → "...packagegroup-core-boothtop"
    IMAGE_INSTALL:append = " htop"    # DOĞRU  → "... htop"
    ```

    Genel yapılandırma dosyalarında listelere ekleme yapılırken `+=` yerine `:append` tercih edilir:
    `+=` ayrıştırma anında uygulandığından sonradan gelen bir `=` ataması eklemeyi geçersiz kılabilir.
    `:append` ise en son uygulanır. Ancak boşluk açıkça yazılmalıdır.

### Etkileşimli simülatör

Aşağıdaki araç, BitBake atama kurallarının **eğitim amaçlı, basitleştirilmiş** bir modelini tarayıcıda
çalıştırır. Hazır örneklerden birini seçerek veya kodu değiştirerek sonuçları gözlemleyebilirsiniz.
Gerçek bir derlemede sonuç her zaman `bitbake-getvar` ile doğrulanmalıdır.

<div class="bbsim" data-hazir="bosluk"></div>

## 5.3 Override sözdizimi

`DEGISKEN:koşul` biçimi, "**koşul etkinse** değişkenin bu değerini kullan" anlamına gelir. Etkin koşulların
listesi, iki nokta ile ayrılmış `OVERRIDES` değişkenidir. Bu listede makine adı, mimari, dağıtım adı,
tarif sınıfı (`class-target`, `class-native`) ve başka koşullar bulunur. Listede **sağdaki koşul daha
yüksek önceliklidir**.

```bitbake
# Yalnızca qemuarm64 makinesinde geçerli:
KERNEL_EXTRA_ARGS:qemuarm64 = "..."

# Yalnızca hedef cihaz için derlenirken (derleme makinesi araçları için değil):
DEPENDS:append:class-target = " libornek"

# Belirli bir paketin çalışma bağımlılıkları (paket adı da bir koşul gibi kullanılır):
RDEPENDS:${PN} += "bash"
```

İki benzer yazım arasındaki fark önemlidir:

| Yazım | Anlamı |
|---|---|
| `A:append:koşul = "x"` | Koşul etkinse A'nın sonuna x eklenir |
| `A:koşul:append = "x"` | `A:koşul` varyantının sonuna x eklenir; koşul etkinse bu varyant A'nın **yerine geçer** |

!!! info ":material-history: Önceki sürümlerde: alt çizgi sözdizimi"
    Yocto 3.4 *Honister* öncesinde override ayracı alt çizgiydi: `RDEPENDS_${PN}`, `SRC_URI_append`,
    `DEPENDS_class-native`. Günümüzde `_append`, `_prepend` veya `_remove` içeren adlar **hata verir**.
    Daha riskli olan durum, `RDEPENDS_${PN}` gibi diğer eski yazımların sıradan bir değişken adı olarak
    kabul edilmesi ve **uyarı vermeden etkisiz kalmasıdır**. Eski tarifler uyarlanırken `_append` →
    `:append`, `_${PN}` → `:${PN}` dönüşümü yapılmalıdır. OE-Core'daki
    `scripts/contrib/convert-overrides.py` betiği bu dönüşümü otomatik gerçekleştirir.

Simülatörde **6 · Koşullu override** örneği seçilip `OVERRIDES` satırından `agecidi` koşulu kaldırılarak
`KONSOL_HIZI` değerinin nasıl değiştiği gözlemlenebilir.

## 5.4 Görev fonksiyonları

Tariflerdeki görevler birer fonksiyondur ve kabuk (shell) veya Python ile yazılabilir:

```bitbake
# Kabuk fonksiyonu (görev)
do_install() {
    install -d ${D}${bindir}
    install -m 0755 ${B}/sensor-oku ${D}${bindir}/
}

# Var olan bir görevin sonuna ekleme
do_install:append() {
    install -d ${D}${sysconfdir}
    echo "aralik=5" > ${D}${sysconfdir}/sensor.conf
}

# Python fonksiyonu ve yeni bir görevin zincire eklenmesi
python do_bilgi() {
    bb.plain("Tarif: %s, sürüm: %s" % (d.getVar("PN"), d.getVar("PV")))
}
addtask bilgi after do_fetch before do_build
```

`${D}`, `${bindir}` (`/usr/bin`) ve `${sysconfdir}` (`/etc`) gibi değişkenler sabit yollar yerine
kullanılmalıdır. Böylece dağıtım farklı bir dizin yerleşimi seçtiğinde tarifler değişiklik gerektirmez.

### Satır içi Python

```bitbake
DERLEME_TARIHI := "${@time.strftime('%Y%m%d', time.gmtime())}"
SERVIS = "${@bb.utils.contains('DISTRO_FEATURES', 'systemd', 'servis-systemd', 'servis-sysv', d)}"
```

`bb.utils.contains()` en sık kullanılan yardımcı fonksiyondur: belirtilen listede bir kelime varsa ilk
değeri, yoksa ikinci değeri döndürür. `=` ile atanan satır içi Python her okunuşta, `:=` ile atanan ise
yalnızca bir kez çalıştırılır.

## 5.5 Değişken bayrakları

Değişkenlere ve görevlere köşeli parantezle ek bilgi (bayrak) iliştirilebilir:

```bitbake
do_compile[depends] += "ornek-araclar-native:do_populate_sysroot"
do_install[dirs] = "${B}"
SRC_URI[sha256sum] = "9f86d0818...."
PACKAGECONFIG[modbus] = "--enable-modbus,--disable-modbus,libmodbus"
```

Override operatörleri (`:append` vb.) bayraklara uygulanamaz.

## 5.6 Değerlerin sorgulanması

Bir değişkenin gerçek değeri her zaman BitBake'e sorularak doğrulanmalıdır:

=== "bitbake-getvar (önerilen)"

    ```bash
    bitbake-getvar IMAGE_INSTALL -r core-image-minimal
    ```
    Değeri ve **hangi dosyanın hangi satırında nasıl değiştiğini** sırasıyla gösterir.

=== "bitbake -e"

    ```bash
    bitbake -e core-image-minimal | less     # tüm ortam (çok uzun)
    bitbake -e core-image-minimal | grep ^IMAGE_INSTALL=
    ```

!!! lab "Uygulama 5.1 · Değişken geçmişinin incelenmesi"
    ```bash
    bitbake-getvar -r busybox OVERRIDES
    bitbake-getvar -r busybox S
    bitbake-getvar -r busybox DISTRO_FEATURES
    ```
    Son komutun çıktısında `DISTRO_FEATURES` değerinin hangi dosyalardan oluştuğunu inceleyin: dağıtım
    dosyası, varsayılanlar, `:remove` satırları. Her satırda hangi operatörün kullanıldığını belirleyin.

## Özet

- Yapılandırma dosyaları genel kapsamlıdır; tarif değişkenleri yalnızca o tarife aittir.
- `=` tembel, `:=` anında genişletir. `?=` ilk atamayı, `??=` en zayıf varsayılanı tanımlar.
- `+=`/`=+` boşluklu, `.=`/`=.` boşluksuz ekler ve ayrıştırma anında uygulanır.
- `:append`, `:prepend` ve `:remove` en son uygulanır; `:append` boşluk eklemez.
- `DEGISKEN:koşul`, koşul `OVERRIDES` içinde yer alıyorsa geçerlidir; sağdaki koşul önceliklidir.
- Gerçek değer her zaman `bitbake-getvar` ile doğrulanmalıdır.

## Değerlendirme soruları

<div class="quiz" data-id="b05-1">
<p class="quiz-soru">Aşağıdaki satırların sonunda <code>INIT</code> değişkeninin değeri nedir?<br><code>INIT ??= "sysvinit"</code><br><code>INIT ?= "systemd"</code><br><code>INIT ??= "mdev-busybox"</code></p>
<ul>
<li><code>"sysvinit"</code></li>
<li data-dogru><code>"systemd"</code></li>
<li><code>"mdev-busybox"</code></li>
<li>Tanımsız</li>
</ul>
<p class="quiz-aciklama"><code>??=</code> yalnızca zayıf bir varsayılan bırakır, değişkene gerçek bir değer vermez. Bu nedenle <code>?=</code>
değişkeni tanımsız bulur ve atama yapar. Gerçek bir değer bulunduğundan zayıf varsayılanlar kullanılmaz.</p>
</div>

<div class="quiz" data-id="b05-2">
<p class="quiz-soru"><code>A = "1"</code>, <code>B = "${A}"</code>, <code>C := "${A}"</code>, <code>A = "2"</code> satırlarından sonra B ve C'nin değerleri nedir?</p>
<ul>
<li>B = 1, C = 1</li>
<li>B = 2, C = 2</li>
<li data-dogru>B = 2, C = 1</li>
<li>B = 1, C = 2</li>
</ul>
<p class="quiz-aciklama"><code>=</code> tembeldir: <code>${A}</code> ancak B okunduğunda çözülür ve o anda A = 2'dir. <code>:=</code> ise A'nın o anki
değerini (1) anında yerine koyar.</p>
</div>

<div class="quiz" data-id="b05-3">
<p class="quiz-soru"><code>DISTRO_FEATURES = "x11 x11-extra wifi"</code> ve <code>DISTRO_FEATURES:remove = "x11"</code> satırlarından sonra sonuç nedir?</p>
<ul>
<li><code>"wifi"</code></li>
<li data-dogru><code>" x11-extra wifi"</code> (baştaki boşluk dahil)</li>
<li><code>"-extra wifi"</code></li>
<li>Değişmez</li>
</ul>
<p class="quiz-aciklama"><code>:remove</code> alt dizgiyle değil, boşlukla ayrılmış tam kelimelerle eşleşir. Arta kalan boşluklar zararsızdır.</p>
</div>

<div class="quiz" data-id="b05-4">
<p class="quiz-soru">Eski bir katmanda <code>RDEPENDS_${PN} = "bash"</code> satırı bulunmaktadır. Yocto 6.0'da ne olur?</p>
<ul>
<li>Satır otomatik olarak yeni sözdizimine çevrilir</li>
<li>Derleme hata vererek durur</li>
<li data-dogru>Satır sıradan bir değişken olarak kabul edilir ve uyarı vermeden etkisiz kalır</li>
<li>bash paketi imajdan çıkarılır</li>
</ul>
<p class="quiz-aciklama">Yalnızca <code>_append</code>, <code>_prepend</code> ve <code>_remove</code> içeren adlar hata verir. Diğer eski yazımlar sessizce
etkisiz kalır; bu nedenle eski katmanlar <code>convert-overrides.py</code> ile dönüştürülmelidir.</p>
</div>

!!! alistirma "Alıştırma: Operatör sıralaması"
    Aşağıdaki kodu simülatöre yazın ve **çalıştırmadan önce** sonucu tahmin edin:

    ```bitbake
    OVERRIDES = "linux:arm:agecidi"
    PAKETLER = "a"
    PAKETLER += "b"
    PAKETLER:append = " c"
    PAKETLER:append:x86 = " d"
    PAKETLER:prepend:agecidi = "z "
    PAKETLER:remove = "b"
    PAKETLER = "${PAKETLER} e"
    ```

    ??? success "Örnek çözüm"
        Son satır hatalıdır. `PAKETLER = "${PAKETLER} e"` değişkenin `=` ile kendisine başvurmasıdır;
        bu sonsuz bir genişletmeye yol açar ve BitBake "variable references itself" hatası verir. Amaç
        buysa doğru yazım `PAKETLER += "e"` veya `PAKETLER := "${PAKETLER} e"` olur.

        Son satır çıkarıldığında sonuç `"z a  c"` olur: `a` → `+=` ile `a b` → `:append` ile `a b c` →
        `x86` etkin olmadığından `d` eklenmez → `:prepend:agecidi` ile `z a b c` → `:remove` ile `b` çıkarılır.

**Sonraki bölüm:** [6 · Tarifler ve görevler →](06-tarifler.md)
