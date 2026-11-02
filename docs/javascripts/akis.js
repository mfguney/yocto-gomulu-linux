/* Yocto Project ile Gömülü Linux — dosya akışı animasyonları
 *
 * Kullanım: <div class="akis" data-senaryo="tarif"></div>
 * Senaryolar: tarif, yeni-tarif, bbappend, ayristirma, imaj, devtool, sstate
 *
 * Her senaryo; istasyonlardan (dizinler veya kavramsal alanlar), dosya "çiplerinden" ve adımlardan
 * oluşur. Her adım dosyaları istasyonlar arasında taşır, kopyalar, oluşturur veya soluklaştırır.
 * Konum değişimleri FLIP tekniğiyle canlandırılır; prefers-reduced-motion etkinse animasyon atlanır.
 * Yollar Yocto 6.0 (Wrynose) varsayılanlarına göre, qemux86-64 makinesi ve poky dağıtımı için verilmiştir.
 */
(function () {
  "use strict";

  var W = "tmp/work/x86-64-v3-poky-linux/sensor-oku/1.0";
  var IW = "tmp/work/qemux86_64-poky-linux/ornek-image/1.0";

  var SENARYOLAR = {
    /* ---------------------------------------------------------------- */
    "tarif": {
      baslik: "sensor-oku tarifinin derlenmesi: dosyalar nereden nereye gider?",
      istasyonlar: [
        { id: "katman", ad: "Tarif dizini", yol: "meta-ornek/recipes-ornek/sensor-oku/" },
        { id: "dl", ad: "İndirme dizini (DL_DIR)", yol: ".bitbake-setup-downloads/" },
        { id: "src", ad: "Kaynak dizini (UNPACKDIR = S = B)", yol: W + "/sources/" },
        { id: "d", ad: "Geçici kök (D)", yol: W + "/image/" },
        { id: "pkg", ad: "Paketlere bölünmüş (PKGDEST)", yol: W + "/packages-split/" },
        { id: "rpm", ad: "Paket deposu (DEPLOY_DIR_RPM)", yol: "tmp/deploy/rpm/x86_64_v3/" },
        { id: "rootfs", ad: "Kök dosya sistemi (IMAGE_ROOTFS)", yol: IW + "/rootfs/" },
        { id: "img", ad: "İmajlar (DEPLOY_DIR_IMAGE)", yol: "tmp/deploy/images/qemux86-64/" }
      ],
      dosyalar: [
        { id: "bb", ad: "sensor-oku_1.0.bb", tur: "tarif", yer: "katman" },
        { id: "c", ad: "files/sensor-oku.c", tur: "kaynak", yer: "katman" }
      ],
      kod: {
        baslik: "sensor-oku_1.0.bb",
        satirlar: [
          'SUMMARY = "Örnek ağ geçidi için sensör okuma aracı"',
          'LICENSE = "MIT"',
          'LIC_FILES_CHKSUM = "file://${COMMON_LICENSE_DIR}/MIT;md5=0835ade6..."',
          '',
          'SRC_URI = "file://sensor-oku.c"',
          'S = "${UNPACKDIR}"',
          '',
          'do_compile() {',
          '    ${CC} ${CFLAGS} ${LDFLAGS} sensor-oku.c -o sensor-oku',
          '}',
          'do_install() {',
          '    install -d ${D}${bindir}',
          '    install -m 0755 sensor-oku ${D}${bindir}/',
          '}'
        ],
        tumunuGoster: true
      },
      adimlar: [
        { gorev: "Başlangıç", komut: "bitbake sensor-oku",
          aciklama: "BitBake tarifi ayrıştırır ve görev zincirini planlar. Başlangıçta yalnızca katmandaki iki dosya vardır: tarif ve C kaynak dosyası.",
          vurgula: ["katman"], kodSatir: [0, 1, 2] },
        { gorev: "do_fetch", komut: "bitbake -c fetch sensor-oku",
          aciklama: "SRC_URI'deki her öğe getirilir. file:// öğeleri katmanın içinde bulunduğundan indirilmez; DL_DIR boş kalır. git:// veya https:// kaynakları bu adımda DL_DIR'e indirilirdi.",
          islemler: [{ vurgu: "c" }, { not: "dl", metin: "file:// kaynakları indirilmez" }],
          vurgula: ["katman", "dl"], kodSatir: [4] },
        { gorev: "do_unpack", komut: "bitbake -c unpack sensor-oku",
          aciklama: "Kaynak dosyası UNPACKDIR dizinine (${WORKDIR}/sources) kopyalanır. Tarif S = \"${UNPACKDIR}\" tanımladığı için kaynak dizini de burasıdır.",
          islemler: [{ kopyala: "c", hedef: "src", yeniId: "c2", yeniAd: "sensor-oku.c" }, { notSil: "dl" }],
          vurgula: ["src"], kodSatir: [5] },
        { gorev: "do_patch → do_configure", komut: "bitbake -c configure sensor-oku",
          aciklama: "SRC_URI'de yama olmadığından do_patch bir değişiklik yapmaz. Tarif bir derleme sistemi sınıfı devralmadığından do_configure da boş geçer.",
          islemler: [{ not: "src", metin: "yama yok · yapılandırma adımı yok" }],
          vurgula: ["src"] },
        { gorev: "do_compile", komut: "bitbake -c compile sensor-oku",
          aciklama: "Çapraz derleyici (${CC}) çalışır ve hedef mimari için ELF ikili dosyası üretilir. B = S olduğundan çıktı aynı dizine yazılır. Günlük: temp/log.do_compile.",
          islemler: [{ notSil: "src" }, { olustur: { id: "elf", ad: "sensor-oku (ELF, x86-64)", tur: "ikili" }, hedef: "src", kaynak: "c2" }],
          vurgula: ["src"], kodSatir: [7, 8, 9] },
        { gorev: "do_install", komut: "bitbake -c install sensor-oku",
          aciklama: "İkili dosya, hedef sistemdeki konumuyla birlikte geçici köke kurulur: ${D}${bindir} = image/usr/bin/. Derleme makinesine hiçbir dosya kurulmaz.",
          islemler: [{ kopyala: "elf", hedef: "d", yeniId: "elf-d", yeniAd: "usr/bin/sensor-oku" }],
          vurgula: ["d"], kodSatir: [10, 11, 12, 13] },
        { gorev: "do_package", komut: "bitbake -c package sensor-oku",
          aciklama: "D önce PKGD'ye (package/) kopyalanır, hata ayıklama sembolleri ayrılır ve dosyalar FILES kurallarına göre paketlere bölünür: ana paket, -dbg (semboller) ve -src (hata ayıklama için kaynak).",
          islemler: [
            { kopyala: "elf-d", hedef: "pkg", yeniId: "p-ana", yeniAd: "sensor-oku/usr/bin/sensor-oku" },
            { olustur: { id: "p-dbg", ad: "sensor-oku-dbg/usr/bin/.debug/sensor-oku", tur: "ikili" }, hedef: "pkg", kaynak: "elf-d" },
            { olustur: { id: "p-src", ad: "sensor-oku-src/usr/src/debug/…/sensor-oku.c", tur: "kaynak" }, hedef: "pkg", kaynak: "c2" }
          ],
          vurgula: ["pkg"] },
        { gorev: "do_package_write_rpm", komut: "bitbake -c package_write_rpm sensor-oku",
          aciklama: "Her paket için bir RPM dosyası üretilir ve paket deposuna yazılır. Paket biçimini PACKAGE_CLASSES belirler; Poky varsayılanı rpm'dir. Mimari dizininde tire alt çizgiye dönüşür (x86_64_v3).",
          islemler: [
            { kopyala: "p-ana", hedef: "rpm", yeniId: "r-ana", yeniAd: "sensor-oku-1.0-r0.x86_64_v3.rpm", tur: "paket" },
            { kopyala: "p-dbg", hedef: "rpm", yeniId: "r-dbg", yeniAd: "sensor-oku-dbg-1.0-r0.x86_64_v3.rpm", tur: "paket" },
            { kopyala: "p-src", hedef: "rpm", yeniId: "r-src", yeniAd: "sensor-oku-src-1.0-r0.x86_64_v3.rpm", tur: "paket" }
          ],
          vurgula: ["rpm"] },
        { gorev: "ornek-image: do_rootfs", komut: "bitbake ornek-image",
          aciklama: "İmaj tarifi IMAGE_INSTALL listesindeki paketleri paket yöneticisiyle (dnf) boş bir kök dizine kurar. Yalnızca ana paket kurulur; -dbg ve -src paketleri imaja girmez.",
          islemler: [
            { kopyala: "r-ana", hedef: "rootfs", yeniId: "fs-bin", yeniAd: "/usr/bin/sensor-oku", tur: "ikili" },
            { soluk: "r-dbg" }, { soluk: "r-src" }
          ],
          vurgula: ["rootfs"] },
        { gorev: "do_image_* → do_image_complete", komut: "ls tmp/deploy/images/qemux86-64/",
          aciklama: "Kök dosya sistemi IMAGE_FSTYPES içindeki biçimlere dönüştürülür (QEMU makinelerinde tar.zst ve ext4.zst) ve DEPLOY_DIR_IMAGE'a kopyalanır. Yanına paket listesi (manifest) ve SPDX 3.0 SBOM dosyası yazılır.",
          islemler: [
            { olustur: { id: "ext4", ad: "ornek-image-qemux86-64.rootfs.ext4.zst", tur: "imaj" }, hedef: "img", kaynak: "fs-bin" },
            { olustur: { id: "man", ad: "ornek-image-qemux86-64.rootfs.manifest", tur: "metin" }, hedef: "img" },
            { olustur: { id: "spdx", ad: "ornek-image-qemux86-64.rootfs.spdx.json", tur: "metin" }, hedef: "img" }
          ],
          vurgula: ["img"] }
      ]
    },

    /* ---------------------------------------------------------------- */
    "yeni-tarif": {
      baslik: "Yeni bir tarifin oluşturulması: geliştiricinin adımları",
      istasyonlar: [
        { id: "ev", ad: "Geliştiricinin kaynak dizini", yol: "~/projeler/sensor-oku/" },
        { id: "katman", ad: "Ürün katmanı", yol: "meta-ornek/" },
        { id: "tarifdir", ad: "Tarif dizini", yol: "meta-ornek/recipes-ornek/sensor-oku/" },
        { id: "files", ad: "Tarif dosyaları", yol: "meta-ornek/recipes-ornek/sensor-oku/files/" },
        { id: "bitbake", ad: "BitBake'in tarif listesi", yol: "bitbake-layers show-recipes" }
      ],
      dosyalar: [
        { id: "c", ad: "sensor-oku.c", tur: "kaynak", yer: "ev" },
        { id: "lc", ad: "conf/layer.conf", tur: "conf", yer: "katman" },
        { id: "rd", ad: "recipes-ornek/", tur: "dizin", yer: "katman" }
      ],
      kod: {
        baslik: "sensor-oku_1.0.bb",
        satirlar: [
          'SUMMARY = "Örnek ağ geçidi için sensör okuma aracı"',
          'LICENSE = "MIT"',
          'LIC_FILES_CHKSUM = "file://${COMMON_LICENSE_DIR}/MIT;md5=0835ade698e0bcf8506ecda2f7b4f302"',
          '',
          'SRC_URI = "file://sensor-oku.c"',
          'S = "${UNPACKDIR}"',
          '',
          'do_compile() {',
          '    ${CC} ${CFLAGS} ${LDFLAGS} sensor-oku.c -o sensor-oku',
          '}',
          '',
          'do_install() {',
          '    install -d ${D}${bindir}',
          '    install -m 0755 sensor-oku ${D}${bindir}/',
          '}'
        ],
        tumunuGoster: false
      },
      adimlar: [
        { gorev: "Başlangıç", komut: "ls meta-ornek/",
          aciklama: "Katman mevcuttur (Bölüm 7), ancak henüz sensor-oku için bir tarif yoktur. Programın kaynak kodu geliştiricinin kendi dizinindedir.",
          vurgula: ["ev", "katman"] },
        { gorev: "Dizinleri oluştur", komut: "mkdir -p meta-ornek/recipes-ornek/sensor-oku/files",
          aciklama: "Tarif dizini, layer.conf'taki BBFILES deseni (recipes-*/*/*.bb) ile eşleşecek biçimde oluşturulur: recipes-<konu>/<tarif-adı>/. Yerel dosyalar files/ alt dizininde tutulur.",
          islemler: [{ olustur: { id: "td", ad: "sensor-oku/", tur: "dizin" }, hedef: "tarifdir", kaynak: "rd" }, { olustur: { id: "fd", ad: "files/", tur: "dizin" }, hedef: "files", kaynak: "rd" }],
          vurgula: ["tarifdir", "files"] },
        { gorev: "Kaynağı kopyala", komut: "cp ~/projeler/sensor-oku/sensor-oku.c meta-ornek/recipes-ornek/sensor-oku/files/",
          aciklama: "Küçük, ürüne özgü programların kaynağı tarifin yanında tutulabilir. Büyük projelerde kaynak ayrı bir git deposunda tutulur ve SRC_URI'de git:// ile gösterilir.",
          islemler: [{ kopyala: "c", hedef: "files", yeniId: "c2", yeniAd: "sensor-oku.c" }],
          vurgula: ["files"] },
        { gorev: "Tarif: tanım ve lisans", komut: "$EDITOR sensor-oku_1.0.bb",
          aciklama: "Dosya adı PN ve PV'yi belirler: sensor-oku_1.0.bb → PN = sensor-oku, PV = 1.0. Lisans bilgisi zorunludur; MIT metni OE-Core'daki COMMON_LICENSE_DIR altında hazırdır.",
          islemler: [{ olustur: { id: "bb", ad: "sensor-oku_1.0.bb", tur: "tarif" }, hedef: "tarifdir" }],
          vurgula: ["tarifdir"], kodGoster: [0, 1, 2], kodSatir: [0, 1, 2] },
        { gorev: "Tarif: kaynak", komut: "SRC_URI, S",
          aciklama: "SRC_URI, file:// önekiyle files/ dizinindeki dosyayı gösterir. Yerel dosyalar doğrudan UNPACKDIR'e açıldığı için S = \"${UNPACKDIR}\" yazılır.",
          islemler: [{ bag: "bb", hedefDosya: "c2" }],
          vurgula: ["tarifdir", "files"], kodGoster: [3, 4, 5], kodSatir: [4, 5] },
        { gorev: "Tarif: derleme ve kurulum", komut: "do_compile, do_install",
          aciklama: "Derleme komutu çapraz derleyici değişkenlerini (${CC}, ${CFLAGS}, ${LDFLAGS}) kullanır. Kurulum geçici köke (${D}) ve standart dizin değişkenlerine (${bindir}) yapılır.",
          vurgula: ["tarifdir"], kodGoster: [6, 7, 8, 9, 10, 11, 12, 13, 14], kodSatir: [7, 8, 11, 12, 13] },
        { gorev: "Tarifi doğrula", komut: "bitbake-layers show-recipes sensor-oku",
          aciklama: "BitBake katmanları yeniden ayrıştırır ve yeni tarifi listeler. Ardından bitbake sensor-oku ile derleme başlatılabilir (bkz. bir önceki animasyon).",
          islemler: [{ kopyala: "bb", hedef: "bitbake", yeniId: "liste", yeniAd: "sensor-oku 1.0 · meta-ornek", tur: "tarif" }],
          vurgula: ["bitbake"] }
      ]
    },

    /* ---------------------------------------------------------------- */
    "bbappend": {
      baslik: "base-files_%.bbappend: başka bir katmandaki tarifin değiştirilmesi",
      istasyonlar: [
        { id: "oe", ad: "OE-Core", yol: "meta/recipes-core/base-files/" },
        { id: "ornek", ad: "meta-ornek", yol: "recipes-core/base-files/" },
        { id: "birlesik", ad: "Ayrıştırılmış tarif", yol: "base-files (bellekte)" },
        { id: "arama", ad: "FILESPATH arama sırası", yol: "file:// dosyaları bu sırayla aranır" },
        { id: "src", ad: "UNPACKDIR", yol: "tmp/work/qemux86_64-poky-linux/base-files/3.0.14/sources/" },
        { id: "rootfs", ad: "Kök dosya sistemi", yol: IW + "/rootfs/etc/" }
      ],
      dosyalar: [
        { id: "bb", ad: "base-files_3.0.14.bb", tur: "tarif", yer: "oe" },
        { id: "motd-oe", ad: "base-files/motd", tur: "metin", yer: "oe" },
        { id: "app", ad: "base-files_%.bbappend", tur: "tarif", yer: "ornek" },
        { id: "motd-or", ad: "files/motd", tur: "metin", yer: "ornek" }
      ],
      kod: {
        baslik: "Ayrıştırma sonucu (tarif + tarif eki)",
        satirlar: [
          '# base-files_3.0.14.bb (OE-Core)',
          'SRC_URI = "file://rotation file://nsswitch.conf file://motd ..."',
          'hostname = "${MACHINE}"',
          '...',
          '# base-files_%.bbappend (meta-ornek), sona eklenir',
          'FILESEXTRAPATHS:prepend := "${THISDIR}/files:"',
          'hostname = "agecidi"'
        ],
        tumunuGoster: false
      },
      adimlar: [
        { gorev: "Başlangıç", komut: "bitbake-layers show-appends | grep -A2 base-files",
          aciklama: "OE-Core'da base-files tarifi ve onun motd dosyası vardır. meta-ornek katmanında ise yalnızca bir tarif eki ve aynı adlı motd dosyası bulunur. OE-Core'daki dosyalara dokunulmaz.",
          vurgula: ["oe", "ornek"] },
        { gorev: "Ayrıştırma: tarif", komut: "(BitBake ayrıştırması)",
          aciklama: "BitBake önce asıl tarifi okur. Bu aşamada hostname değeri MACHINE adıdır.",
          islemler: [{ kopyala: "bb", hedef: "birlesik", yeniId: "bb2", yeniAd: "base-files_3.0.14.bb" }],
          vurgula: ["birlesik"], kodGoster: [0, 1, 2, 3], kodSatir: [1, 2] },
        { gorev: "Ayrıştırma: tarif eki", komut: "(BitBake ayrıştırması)",
          aciklama: "Adı eşleşen her .bbappend, katman önceliği sırasıyla tarifin sonuna eklenmiş gibi işlenir. hostname yeniden atanır ve FILESEXTRAPATHS'in başına meta-ornek'in files/ dizini eklenir.",
          islemler: [{ kopyala: "app", hedef: "birlesik", yeniId: "app2", yeniAd: "+ base-files_%.bbappend" }],
          vurgula: ["birlesik"], kodGoster: [4, 5, 6], kodSatir: [5, 6] },
        { gorev: "FILESPATH oluşur", komut: "bitbake-getvar -r base-files FILESPATH",
          aciklama: "file:// dosyaları FILESPATH listesindeki dizinlerde sırayla aranır. Varsayılan liste tarif dizinindeki ${BP}, ${BPN} ve files alt dizinleridir; FILESEXTRAPATHS:prepend sayesinde meta-ornek dizini listenin başına geçer. (Her dizin ayrıca FILESOVERRIDES alt dizinleriyle denenir.)",
          islemler: [
            { olustur: { id: "y1", ad: "1 · meta-ornek/…/base-files/files/", tur: "dizin" }, hedef: "arama", kaynak: "app2" },
            { olustur: { id: "y2", ad: "2 · meta/…/base-files/base-files-3.0.14/", tur: "dizin" }, hedef: "arama", kaynak: "bb2" },
            { olustur: { id: "y3", ad: "3 · meta/…/base-files/base-files/", tur: "dizin" }, hedef: "arama", kaynak: "bb2" },
            { olustur: { id: "y4", ad: "4 · meta/…/base-files/files/", tur: "dizin" }, hedef: "arama", kaynak: "bb2" }
          ],
          vurgula: ["arama"] },
        { gorev: "do_fetch → do_unpack", komut: "bitbake -c unpack base-files",
          aciklama: "motd için ilk eşleşme meta-ornek'teki dosyadır ve UNPACKDIR'e o kopyalanır. OE-Core'daki motd gölgede kalır; kullanılmaz ama silinmez.",
          islemler: [{ kopyala: "motd-or", hedef: "src", yeniId: "motd-src", yeniAd: "motd (meta-ornek)" }, { soluk: "motd-oe" }],
          vurgula: ["src", "ornek"] },
        { gorev: "do_install → do_rootfs", komut: "bitbake ornek-image",
          aciklama: "do_install motd'u ${D}${sysconfdir}'e kurar ve /etc/hostname dosyasına hostname değerini (agecidi) yazar. Paketleme ve imaj oluşturma sonrasında her iki dosya kök dosya sisteminde yer alır.",
          islemler: [
            { kopyala: "motd-src", hedef: "rootfs", yeniId: "etc-motd", yeniAd: "/etc/motd" },
            { olustur: { id: "etc-host", ad: "/etc/hostname → agecidi", tur: "metin" }, hedef: "rootfs", kaynak: "app2" }
          ],
          vurgula: ["rootfs"] }
      ]
    },

    /* ---------------------------------------------------------------- */
    "ayristirma": {
      baslik: "Metadata'nın ayrıştırılma sırası",
      istasyonlar: [
        { id: "conf", ad: "Yapılandırma dosyaları", yol: "build/conf/ ve katmanların conf/ dizinleri" },
        { id: "genel", ad: "Genel veri deposu", yol: "tüm tariflerin ortak başlangıcı" },
        { id: "sinif", ad: "Genel sınıflar", yol: "INHERIT ile tüm tariflere" },
        { id: "tarif", ad: "Tarif dosyaları", yol: "meta-ornek/recipes-ornek/sensor-oku/" },
        { id: "tarifveri", ad: "Tarife özgü veri deposu", yol: "sensor-oku için (kopya)" }
      ],
      dosyalar: [
        { id: "bbl", ad: "bblayers.conf", tur: "conf", yer: "conf" },
        { id: "lc", ad: "<katman>/conf/layer.conf (×N)", tur: "conf", yer: "conf" },
        { id: "bbc", ad: "bitbake.conf", tur: "conf", yer: "conf" },
        { id: "local", ad: "site.conf · auto.conf · toolcfg.conf · local.conf", tur: "conf", yer: "conf" },
        { id: "frag", ad: "parçalar (OE_FRAGMENTS)", tur: "conf", yer: "conf" },
        { id: "mach", ad: "conf/machine/qemux86-64.conf", tur: "conf", yer: "conf" },
        { id: "dist", ad: "conf/distro/poky.conf", tur: "conf", yer: "conf" },
        { id: "base", ad: "base.bbclass + INHERIT", tur: "sinif", yer: "sinif" },
        { id: "bb", ad: "sensor-oku_1.0.bb", tur: "tarif", yer: "tarif" },
        { id: "app", ad: "sensor-oku_%.bbappend (varsa)", tur: "tarif", yer: "tarif" }
      ],
      adimlar: [
        { gorev: "Başlangıç", komut: "bitbake sensor-oku",
          aciklama: "BitBake, tarifleri ayrıştırmadan önce genel yapılandırmayı kurar. Sıra önemlidir: sonra okunan atama öncekini geçersiz kılabilir.",
          vurgula: ["conf"] },
        { gorev: "Katmanlar", komut: "conf/bblayers.conf → layer.conf",
          aciklama: "bblayers.conf'taki BBLAYERS listesi okunur, ardından her katmanın conf/layer.conf dosyası işlenir. BBPATH, BBFILES ve katman öncelikleri bu aşamada belirlenir.",
          islemler: [{ tasi: "bbl", hedef: "genel" }, { tasi: "lc", hedef: "genel" }],
          vurgula: ["genel"] },
        { gorev: "bitbake.conf", komut: "meta/conf/bitbake.conf",
          aciklama: "OE-Core'daki bitbake.conf varsayılan değişkenleri tanımlar ve diğer dosyaları sırayla içerir.",
          islemler: [{ tasi: "bbc", hedef: "genel" }],
          vurgula: ["genel"] },
        { gorev: "Yerel ayarlar ve parçalar", komut: "site.conf → auto.conf → toolcfg.conf → local.conf → addfragments",
          aciklama: "bitbake.conf; site.conf, auto.conf, toolcfg.conf (bitbake-config-build'in yönettiği dosya) ve local.conf dosyalarını içerir. Ardından OE_FRAGMENTS'taki parçalar ve yerleşik parçalar (machine/…, distro/…) uygulanır.",
          islemler: [{ tasi: "local", hedef: "genel" }, { tasi: "frag", hedef: "genel" }],
          vurgula: ["genel"] },
        { gorev: "Makine ve dağıtım", komut: "conf/machine/${MACHINE}.conf → conf/distro/${DISTRO}.conf",
          aciklama: "Makine dosyası, ardından dağıtım dosyası okunur. local.conf makine ve dağıtım dosyalarından ÖNCE okunduğu için, oradaki ?= atamaları bu dosyalara varsayılan sağlar; = atamaları ise bu dosyalarda yeniden atanabilir.",
          islemler: [{ tasi: "mach", hedef: "genel" }, { tasi: "dist", hedef: "genel" }],
          vurgula: ["genel"] },
        { gorev: "Genel sınıflar", komut: "base.bbclass, INHERIT",
          aciklama: "base.bbclass ve INHERIT değişkenindeki sınıflar genel kapsamda devralınır. Bu noktada genel veri deposu tamamlanır.",
          islemler: [{ tasi: "base", hedef: "genel" }],
          vurgula: ["genel", "sinif"] },
        { gorev: "Tarif ayrıştırması", komut: "sensor-oku_1.0.bb + .bbappend",
          aciklama: "Her tarif, genel veri deposunun bir KOPYASI üzerinde ayrıştırılır: tarif, devraldığı sınıflar ve eşleşen tarif ekleri sırasıyla işlenir. Bir tarifteki atama diğer tarifleri etkilemez.",
          islemler: [
            { olustur: { id: "kopya", ad: "genel deponun kopyası", tur: "conf" }, hedef: "tarifveri", kaynak: "bbc" },
            { tasi: "bb", hedef: "tarifveri" }, { tasi: "app", hedef: "tarifveri" }
          ],
          vurgula: ["tarifveri"] },
        { gorev: "Sonlandırma", komut: "bitbake-getvar -r sensor-oku <DEGISKEN>",
          aciklama: "Son olarak OVERRIDES'a göre koşullu değerler seçilir, :append, :prepend ve :remove işlemleri uygulanır ve anonim Python fonksiyonları çalışır. bitbake-getvar bu son durumu gösterir.",
          islemler: [{ olustur: { id: "son", ad: "sonuç: S, SRC_URI, DEPENDS, …", tur: "metin" }, hedef: "tarifveri", kaynak: "kopya" }],
          vurgula: ["tarifveri"] }
      ]
    },

    /* ---------------------------------------------------------------- */
    "imaj": {
      baslik: "ornek-image: paketlerden imaja (poky dağıtımı, qemux86-64; ÖrnekOS'ta init sistemi systemd olur)",
      istasyonlar: [
        { id: "tarif", ad: "İmaj tarifi", yol: "meta-ornek/recipes-core/images/ornek-image.bb" },
        { id: "liste", ad: "Kurulacak paketler", yol: "IMAGE_INSTALL + IMAGE_FEATURES + bağımlılıklar" },
        { id: "rpm", ad: "Paket deposu", yol: "tmp/deploy/rpm/{x86_64_v3, qemux86_64, noarch}/" },
        { id: "rootfs", ad: "Kök dosya sistemi", yol: IW + "/rootfs/" },
        { id: "img", ad: "İmajlar", yol: "tmp/deploy/images/qemux86-64/" }
      ],
      dosyalar: [
        { id: "bb", ad: "ornek-image.bb", tur: "tarif", yer: "tarif" }
      ],
      kod: {
        baslik: "ornek-image.bb",
        satirlar: [
          'SUMMARY = "Örnek ağ geçidi ürün imajı (ÖrnekOS)"',
          'LICENSE = "MIT"',
          'inherit core-image',
          'IMAGE_INSTALL = "packagegroup-core-boot ${CORE_IMAGE_EXTRA_INSTALL} sensor-oku"',
          'IMAGE_LINGUAS = ""'
        ],
        tumunuGoster: true
      },
      adimlar: [
        { gorev: "Başlangıç", komut: "bitbake ornek-image",
          aciklama: "İmaj tarifi kendi başına derlenecek kod içermez; hangi paketlerin hangi biçimde bir araya getirileceğini tanımlar. inherit core-image, rootfs ve imaj görevlerini ekler.",
          vurgula: ["tarif"], kodSatir: [2, 3] },
        { gorev: "Paket listesi", komut: "bitbake-getvar -r ornek-image IMAGE_INSTALL",
          aciklama: "IMAGE_INSTALL'daki öğeler ve IMAGE_FEATURES'tan gelen paketler listelenir. Paket grupları (packagegroup-*) başka paketlere çalışma bağımlılığı taşıyan boş paketlerdir.",
          islemler: [
            { olustur: { id: "pg", ad: "packagegroup-core-boot", tur: "paket" }, hedef: "liste", kaynak: "bb" },
            { olustur: { id: "so", ad: "sensor-oku", tur: "paket" }, hedef: "liste", kaynak: "bb" }
          ],
          vurgula: ["liste"], kodSatir: [3] },
        { gorev: "Bağımlılıklar çözülür", komut: "RDEPENDS / RRECOMMENDS",
          aciklama: "Paket grubunun ve paketlerin çalışma bağımlılıkları çözülür: busybox, base-files, init sistemi, C kütüphanesi vb. sensor-oku'nun libc bağımlılığı paketleme sırasında ELF taramasıyla otomatik eklenmişti.",
          islemler: [
            { olustur: { id: "bbx", ad: "busybox", tur: "paket" }, hedef: "liste", kaynak: "pg" },
            { olustur: { id: "bf", ad: "base-files", tur: "paket" }, hedef: "liste", kaynak: "pg" },
            { olustur: { id: "init", ad: "sysvinit · initscripts", tur: "paket" }, hedef: "liste", kaynak: "pg" },
            { olustur: { id: "libc", ad: "libc6", tur: "paket" }, hedef: "liste", kaynak: "so" }
          ],
          vurgula: ["liste"] },
        { gorev: "Paketler derlenir", komut: "(her paketin kendi görev zinciri)",
          aciklama: "Listede yer alan her paketin tarifi kendi görev zincirini çalıştırır (ya da çıktısı sstate'ten alınır) ve paket dosyaları paket deposuna yazılır.",
          islemler: [
            { kopyala: "so", hedef: "rpm", yeniId: "r-so", yeniAd: "sensor-oku-1.0-r0.x86_64_v3.rpm" },
            { kopyala: "bbx", hedef: "rpm", yeniId: "r-bbx", yeniAd: "busybox-….x86_64_v3.rpm" },
            { kopyala: "bf", hedef: "rpm", yeniId: "r-bf", yeniAd: "base-files-….qemux86_64.rpm" },
            { kopyala: "libc", hedef: "rpm", yeniId: "r-libc", yeniAd: "libc6-….x86_64_v3.rpm" }
          ],
          vurgula: ["rpm"] },
        { gorev: "do_rootfs", komut: "bitbake -c rootfs ornek-image",
          aciklama: "Paket yöneticisi (rpm için dnf) bir kök dizin oluşturur ve paketleri buraya kurar. Paketlerin kurulum sonrası betikleri de bu aşamada çalışır.",
          islemler: [
            { kopyala: "r-so", hedef: "rootfs", yeniId: "f1", yeniAd: "/usr/bin/sensor-oku", tur: "ikili" },
            { kopyala: "r-bbx", hedef: "rootfs", yeniId: "f2", yeniAd: "/bin/busybox + bağlantılar", tur: "ikili" },
            { kopyala: "r-bf", hedef: "rootfs", yeniId: "f3", yeniAd: "/etc/hostname · /etc/motd", tur: "metin" },
            { kopyala: "r-libc", hedef: "rootfs", yeniId: "f4", yeniAd: "/lib/libc.so.6", tur: "ikili" }
          ],
          vurgula: ["rootfs"] },
        { gorev: "Son düzenlemeler", komut: "ROOTFS_POSTPROCESS_COMMAND",
          aciklama: "Kök dosya sistemi üzerinde son işlemler yapılır: manifest yazılır, IMAGE_FEATURES'a göre ayarlar uygulanır (ör. boş parolalı root girişi yalnızca ilgili parça etkinse).",
          islemler: [{ olustur: { id: "mf", ad: "manifest (paket listesi)", tur: "metin" }, hedef: "rootfs" }],
          vurgula: ["rootfs"] },
        { gorev: "do_image_* → do_image_complete", komut: "ls -l tmp/deploy/images/qemux86-64/",
          aciklama: "IMAGE_FSTYPES içindeki her biçim için ayrı bir görev çalışır (QEMU makinelerinde do_image_tar ve do_image_ext4; sıkıştırma .zst ile). Tarih damgalı dosyalar ve bunlara işaret eden sabit adlı sembolik bağlantılar oluşturulur.",
          islemler: [
            { olustur: { id: "e4", ad: "ornek-image-qemux86-64.rootfs.ext4.zst", tur: "imaj" }, hedef: "img", kaynak: "f1" },
            { olustur: { id: "tz", ad: "ornek-image-qemux86-64.rootfs.tar.zst", tur: "imaj" }, hedef: "img", kaynak: "f2" },
            { kopyala: "mf", hedef: "img", yeniId: "mf2", yeniAd: "ornek-image-qemux86-64.rootfs.manifest", tur: "metin" },
            { olustur: { id: "sp", ad: "ornek-image-qemux86-64.rootfs.spdx.json", tur: "metin" }, hedef: "img" },
            { olustur: { id: "bz", ad: "bzImage (çekirdek)", tur: "ikili" }, hedef: "img" }
          ],
          vurgula: ["img"] }
      ]
    },

    /* ---------------------------------------------------------------- */
    "devtool": {
      baslik: "devtool ile değişiklik döngüsü",
      istasyonlar: [
        { id: "katman", ad: "Ürün katmanı", yol: "meta-ornek/recipes-ornek/sensor-oku/" },
        { id: "ws", ad: "devtool çalışma alanı katmanı", yol: "build/workspace/" },
        { id: "kaynak", ad: "Çalışma kaynağı (git deposu)", yol: "build/workspace/sources/sensor-oku/" },
        { id: "derleme", ad: "Derleme çıktısı", yol: "tmp/work/…/sensor-oku/1.0/" },
        { id: "hedef", ad: "Çalışan hedef (QEMU)", yol: "root@192.168.7.2:/usr/bin/" }
      ],
      dosyalar: [
        { id: "bb", ad: "sensor-oku_1.0.bb", tur: "tarif", yer: "katman" },
        { id: "c", ad: "files/sensor-oku.c", tur: "kaynak", yer: "katman" }
      ],
      adimlar: [
        { gorev: "Başlangıç", komut: "runqemu qemux86-64 nographic snapshot",
          aciklama: "Değiştirilecek tarif ürün katmanındadır. Hedef, SSH sunucusu içeren bir imajla (ör. ornek/gelistirici parçası etkin) çalışan bir QEMU örneğidir; varsayılan tap ağında adresi 192.168.7.2'dir.",
          vurgula: ["katman", "hedef"] },
        { gorev: "devtool modify", komut: "devtool modify sensor-oku",
          aciklama: "Kaynaklar çalışma alanına çıkarılır ve bir git deposu olarak hazırlanır. Çalışma alanı katmanına, tarifin kaynağını bu dizine yönlendiren bir .bbappend yazılır.",
          islemler: [
            { kopyala: "c", hedef: "kaynak", yeniId: "c2", yeniAd: "sensor-oku.c (git)" },
            { olustur: { id: "app", ad: "appends/sensor-oku_1.0.bbappend", tur: "tarif" }, hedef: "ws", kaynak: "bb" }
          ],
          vurgula: ["ws", "kaynak"] },
        { gorev: "Düzenle", komut: "$EDITOR workspace/sources/sensor-oku/sensor-oku.c",
          aciklama: "Değişiklikler doğrudan çalışma kaynağında yapılır ve isteğe bağlı olarak git ile commit edilir. Katmandaki orijinal dosya henüz değişmemiştir.",
          islemler: [{ yeniden: "c2", ad: "sensor-oku.c (değiştirildi)" }],
          vurgula: ["kaynak"] },
        { gorev: "devtool build", komut: "devtool build sensor-oku",
          aciklama: "Tarif, çalışma alanındaki kaynakla derlenir. Normal derlemeyle aynı görevler çalışır.",
          islemler: [{ olustur: { id: "elf", ad: "image/usr/bin/sensor-oku", tur: "ikili" }, hedef: "derleme", kaynak: "c2" }],
          vurgula: ["derleme"] },
        { gorev: "devtool deploy-target", komut: "devtool deploy-target sensor-oku root@192.168.7.2",
          aciklama: "do_install çıktısı SSH üzerinden çalışan hedefe kopyalanır. İmaj yeniden derlenmeden değişiklik cihazda denenebilir; devtool undeploy-target ile geri alınır.",
          islemler: [{ kopyala: "elf", hedef: "hedef", yeniId: "elf-h", yeniAd: "/usr/bin/sensor-oku" }],
          vurgula: ["hedef"] },
        { gorev: "devtool finish", komut: "devtool finish sensor-oku meta-ornek",
          aciklama: "Commit edilen değişiklikler yama (.patch) dosyası olarak tarif dizinine yazılır ve SRC_URI'ye eklenir. Tarif zaten hedef katmanda bulunduğundan tarifin kendisi güncellenir; tarif başka bir katmanda olsaydı hedef katmanda bir .bbappend oluşturulurdu. Çalışma alanındaki .bbappend kaldırılır.",
          islemler: [{ olustur: { id: "yama", ad: "files/0001-….patch", tur: "kaynak" }, hedef: "katman", kaynak: "c2" }, { yeniden: "bb", ad: "sensor-oku_1.0.bb (SRC_URI güncellendi)" }, { sil: "app" }],
          vurgula: ["katman", "ws"] }
      ]
    },

    /* ---------------------------------------------------------------- */
    "sstate": {
      baslik: "sstate: bir görev çalıştırılmalı mı, önbellekten mi alınmalı?",
      istasyonlar: [
        { id: "girdi", ad: "Görevin girdileri", yol: "sensor-oku:do_package_write_rpm" },
        { id: "imza", ad: "Görev imzası", yol: "taskhash → hash eşdeğerliği (BB_HASHSERVE) → unihash" },
        { id: "yerel", ad: "Yerel sstate dizini (SSTATE_DIR)", yol: ".sstate-cache/<ab>/<cd>/" },
        { id: "yansi", ad: "sstate yansısı", yol: "SSTATE_MIRRORS" },
        { id: "calis", ad: "Çalışma dizini", yol: W + "/" }
      ],
      dosyalar: [
        { id: "g1", ad: "değişkenler (CFLAGS, SRC_URI…)", tur: "conf", yer: "girdi" },
        { id: "g2", ad: "görev fonksiyonlarının gövdeleri", tur: "tarif", yer: "girdi" },
        { id: "g3", ad: "kaynak dosya sağlaması", tur: "kaynak", yer: "girdi" },
        { id: "g4", ad: "bağımlı görevlerin imzaları", tur: "metin", yer: "girdi" }
      ],
      adimlar: [
        { gorev: "Başlangıç", komut: "bitbake sensor-oku",
          aciklama: "Her görevin sonucu girdileri tarafından belirlenir: kullandığı değişkenler, fonksiyon gövdeleri, kaynak dosyaların sağlamaları ve bağımlı olduğu görevlerin imzaları. sstate nesnesi yalnızca belirli görevler için üretilir (do_populate_sysroot, do_package, do_packagedata, do_package_write_rpm, do_populate_lic, do_deploy …); do_compile gibi ara görevlerin kendi nesnesi yoktur.",
          vurgula: ["girdi"] },
        { gorev: "İmza hesaplanır", komut: "bitbake-dumpsig -t sensor-oku do_package_write_rpm",
          aciklama: "Girdilerden bir özet değer (taskhash) hesaplanır. Hash eşdeğerliği sunucusu etkinse taskhash sunucuya sorulur; aynı çıktıyı ürettiği daha önce kaydedilmiş bir imza varsa o imza (unihash) kullanılır, yoksa unihash taskhash'e eşittir. sstate nesneleri unihash ile adlandırıldığından bu sorgu önbellek aramasından ÖNCE yapılır.",
          islemler: [{ olustur: { id: "th", ad: "taskhash: 9b07…e4", tur: "metin" }, hedef: "imza", kaynak: "g2" }, { olustur: { id: "h", ad: "unihash: 3f9a…c1", tur: "metin" }, hedef: "imza", kaynak: "th" }],
          vurgula: ["imza"] },
        { gorev: "Yerel önbellek kontrolü", komut: "(setscene denetimi)",
          aciklama: "Bu unihash ile adlandırılmış bir sstate nesnesi önce yerel SSTATE_DIR'de aranır. Nesne bulunamazsa yapılandırılmış yansılar denenir.",
          islemler: [{ kopyala: "h", hedef: "yerel", yeniId: "h-ara", yeniAd: "aranıyor: …:3f9a…c1_package_write_rpm.tar.zst" }, { not: "yerel", metin: "bulunamadı" }],
          vurgula: ["yerel"] },
        { gorev: "Yansı kontrolü", komut: "SSTATE_MIRRORS",
          aciklama: "Yansıda bulunursa nesne indirilir ve yerel SSTATE_DIR'e yazılır; görevin kendisi çalıştırılmaz, yalnızca '_setscene' sürümü çıktıyı geri yükler.",
          islemler: [{ notSil: "yerel" }, { olustur: { id: "nesne", ad: "sstate:sensor-oku:…:3f9a…c1_package_write_rpm.tar.zst", tur: "paket" }, hedef: "yansi", kaynak: "h-ara" }],
          vurgula: ["yansi"] },
        { gorev: "Geri yükleme (setscene)", komut: "do_package_write_rpm_setscene",
          aciklama: "Nesne yerel önbelleğe alınır ve içeriği ilgili dizinlere açılır. Bu görevin çıktısı geri yüklenebildiğinden, ona giden do_fetch … do_compile görevleri hiç çalıştırılmaz. 'Sstate summary' satırındaki Mirrors sayısı bu durumu sayar.",
          islemler: [{ kopyala: "nesne", hedef: "yerel", yeniId: "nesne-yerel", yeniAd: "sstate:…_package_write_rpm.tar.zst" }, { kopyala: "nesne-yerel", hedef: "calis", yeniId: "cikti", yeniAd: "deploy/rpm çıktısı geri yüklendi", tur: "paket" }],
          vurgula: ["yerel", "calis"] },
        { gorev: "Alternatif: önbellekte yoksa", komut: "do_fetch … do_package_write_rpm çalışır",
          aciklama: "Nesne hiçbir yerde bulunamazsa görev zinciri normal biçimde çalışır; sstate destekli görevlerin çıktıları sstate nesnesi olarak SSTATE_DIR'e yazılır. Aynı imzayla yapılan sonraki derlemeler bu nesneleri kullanır.",
          islemler: [{ olustur: { id: "yeni", ad: "yeni sstate nesnesi yazıldı", tur: "paket" }, hedef: "yerel", kaynak: "cikti" }],
          vurgula: ["calis", "yerel"] }
      ]
    }
  };

  /* ================================================================ */
  /* Motor                                                             */
  /* ================================================================ */
  var TUR_ETIKET = { tarif: "BB", kaynak: "C", ikili: "ELF", paket: "PKG", imaj: "IMG", metin: "TXT", conf: "CONF", dizin: "DIR", sinif: "CLS" };
  var azHareket = typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function el(etiket, sinif, metin) {
    var e = document.createElement(etiket);
    if (sinif) { e.className = sinif; }
    if (metin !== undefined) { e.textContent = metin; }
    return e;
  }

  function Akis(kutu, senaryo) {
    this.kutu = kutu;
    this.s = senaryo;
    this.adim = 0;              // gösterilen adım (0 = başlangıç)
    this.oynuyor = false;
    this.zaman = null;
    this.hiz = 2600;
    this.kur();
  }

  Akis.prototype.kur = function () {
    var self = this, s = this.s;
    this.kutu.innerHTML = "";
    this.kutu.appendChild(el("p", "akis-baslik", s.baslik));

    var govde = el("div", "akis-govde" + (s.kod ? " kodlu" : ""));
    this.sahne = el("div", "akis-sahne");
    this.istasyonEl = {};
    s.istasyonlar.forEach(function (ist, i) {
      var k = el("section", "akis-ist");
      k.dataset.id = ist.id;
      var b = el("header", "akis-ist-bas");
      b.appendChild(el("span", "akis-no", String(i + 1)));
      var t = el("div", "akis-ist-ad");
      t.appendChild(el("strong", "", ist.ad));
      t.appendChild(el("code", "akis-yol", ist.yol));
      b.appendChild(t);
      k.appendChild(b);
      var yuva = el("div", "akis-yuva");
      k.appendChild(yuva);
      var not = el("div", "akis-not");
      not.hidden = true;
      k.appendChild(not);
      self.istasyonEl[ist.id] = { kutu: k, yuva: yuva, not: not };
      self.sahne.appendChild(k);
    });
    govde.appendChild(this.sahne);

    if (s.kod) {
      var kp = el("div", "akis-kod");
      kp.appendChild(el("div", "akis-kod-bas", s.kod.baslik));
      var pre = el("pre", "");
      this.kodSatirlari = s.kod.satirlar.map(function (sat) {
        var sp = el("span", "akis-satir", sat || " ");
        pre.appendChild(sp);
        return sp;
      });
      kp.appendChild(pre);
      govde.appendChild(kp);
    }
    this.kutu.appendChild(govde);

    // Açıklama paneli
    var panel = el("div", "akis-panel");
    panel.setAttribute("aria-live", "polite");
    this.gorevEl = el("span", "akis-gorev");
    this.komutEl = el("code", "akis-komut");
    this.aciklamaEl = el("p", "akis-aciklama");
    var ust = el("div", "akis-panel-ust");
    ust.appendChild(this.gorevEl);
    ust.appendChild(this.komutEl);
    panel.appendChild(ust);
    panel.appendChild(this.aciklamaEl);
    this.kutu.appendChild(panel);

    // Zaman çizelgesi
    var cizelge = el("ol", "akis-cizelge");
    this.noktalar = s.adimlar.map(function (a, i) {
      var li = el("li", "");
      var btn = el("button", "akis-nokta", a.gorev);
      btn.type = "button";
      btn.addEventListener("click", function () { self.dur(); self.git(i, false); });
      li.appendChild(btn);
      cizelge.appendChild(li);
      return btn;
    });
    this.kutu.appendChild(cizelge);

    // Denetimler
    var den = el("div", "akis-denetim");
    function dug(etiket, aria, fn) {
      var d = el("button", "md-button akis-dug", etiket);
      d.type = "button"; d.setAttribute("aria-label", aria);
      d.addEventListener("click", fn);
      den.appendChild(d);
      return d;
    }
    dug("⏮", "Başa dön", function () { self.dur(); self.git(0, false); });
    dug("◀", "Önceki adım", function () { self.dur(); self.git(Math.max(0, self.adim - 1), false); });
    this.oynatDug = dug("▶ Oynat", "Oynat veya duraklat", function () { self.oynuyor ? self.dur() : self.oynat(); });
    this.oynatDug.classList.add("md-button--primary");
    dug("▶|", "Sonraki adım", function () { self.dur(); self.ileri(); });
    this.sayac = el("span", "akis-sayac", "");
    den.appendChild(this.sayac);
    this.kutu.appendChild(den);

    this.git(0, false);
  };

  /* Durumu sıfırdan kur, 0..n adımlarını animasyonsuz uygula */
  Akis.prototype.git = function (n, animasyonlu) {
    var self = this;
    if (!animasyonlu) {
      Object.keys(this.istasyonEl).forEach(function (k) {
        self.istasyonEl[k].yuva.innerHTML = "";
        self.istasyonEl[k].not.hidden = true;
      });
      this.cipler = {};
      this.s.dosyalar.forEach(function (d) { self.cipEkle(d, d.yer); });
      if (this.kodSatirlari) {
        this.kodSatirlari.forEach(function (sp) { sp.classList.remove("acik", "isik"); if (self.s.kod.tumunuGoster) { sp.classList.add("acik"); } });
      }
      for (var i = 1; i <= n; i++) { this.uygula(this.s.adimlar[i], false); }
      if (this.s.adimlar[0].kodGoster) { this.kodGoster(this.s.adimlar[0].kodGoster); }
      for (var j = 0; j <= n; j++) { if (this.s.adimlar[j].kodGoster) { this.kodGoster(this.s.adimlar[j].kodGoster); } }
    } else {
      this.uygula(this.s.adimlar[n], true);
      if (this.s.adimlar[n].kodGoster) { this.kodGoster(this.s.adimlar[n].kodGoster); }
    }
    this.adim = n;
    this.paneliGuncelle();
  };

  Akis.prototype.ileri = function () {
    if (this.adim >= this.s.adimlar.length - 1) { return false; }
    this.git(this.adim + 1, !azHareket);
    return true;
  };

  Akis.prototype.oynat = function () {
    var self = this;
    if (this.adim >= this.s.adimlar.length - 1) { this.git(0, false); }
    this.oynuyor = true;
    this.oynatDug.textContent = "⏸ Duraklat";
    function tik() {
      if (!self.oynuyor) { return; }
      if (!self.ileri()) { self.dur(); return; }
      self.zaman = setTimeout(tik, self.hiz);
    }
    this.zaman = setTimeout(tik, 400);
  };

  Akis.prototype.dur = function () {
    this.oynuyor = false;
    clearTimeout(this.zaman);
    if (this.oynatDug) { this.oynatDug.textContent = "▶ Oynat"; }
  };

  Akis.prototype.paneliGuncelle = function () {
    var a = this.s.adimlar[this.adim], self = this;
    this.gorevEl.textContent = a.gorev;
    this.komutEl.textContent = a.komut || "";
    this.komutEl.hidden = !a.komut;
    this.aciklamaEl.textContent = a.aciklama;
    this.sayac.textContent = "Adım " + (this.adim + 1) + " / " + this.s.adimlar.length;
    this.noktalar.forEach(function (b, i) {
      b.classList.toggle("gecti", i < self.adim);
      b.classList.toggle("simdi", i === self.adim);
      if (i === self.adim) { b.setAttribute("aria-current", "step"); } else { b.removeAttribute("aria-current"); }
    });
    Object.keys(this.istasyonEl).forEach(function (k) {
      self.istasyonEl[k].kutu.classList.toggle("etkin", (a.vurgula || []).indexOf(k) !== -1);
    });
    if (this.kodSatirlari) {
      this.kodSatirlari.forEach(function (sp, i) { sp.classList.toggle("isik", (a.kodSatir || []).indexOf(i) !== -1); });
    }
  };

  Akis.prototype.kodGoster = function (liste) {
    var self = this;
    liste.forEach(function (i) { if (self.kodSatirlari[i]) { self.kodSatirlari[i].classList.add("acik"); } });
  };

  Akis.prototype.cipEkle = function (d, yer) {
    var c = el("div", "akis-cip tur-" + (d.tur || "metin"));
    c.dataset.id = d.id;
    var e = el("span", "akis-cip-tur", TUR_ETIKET[d.tur] || "•");
    c.appendChild(e);
    c.appendChild(el("span", "akis-cip-ad", d.ad));
    this.istasyonEl[yer].yuva.appendChild(c);
    this.cipler[d.id] = c;
    return c;
  };

  /* FLIP: öğeyi kaynak konumdan bugünkü konumuna kaydır */
  function kaydir(cip, ilkRect) {
    var son = cip.getBoundingClientRect();
    var dx = ilkRect.left - son.left, dy = ilkRect.top - son.top;
    cip.style.transition = "none";
    cip.style.transform = "translate(" + dx + "px," + dy + "px) scale(1.04)";
    cip.classList.add("ucuyor");
    void cip.offsetWidth;
    cip.style.transition = "transform .95s cubic-bezier(.2,.75,.2,1)";
    cip.style.transform = "";
    setTimeout(function () { cip.classList.remove("ucuyor"); cip.style.transition = ""; }, 1000);
  }

  function belir(cip) {
    cip.classList.add("yeni");
    setTimeout(function () { cip.classList.remove("yeni"); }, 1200);
  }

  Akis.prototype.uygula = function (adim, animasyonlu) {
    var self = this;
    (adim.islemler || []).forEach(function (op) {
      var kaynakCip, ilk, yeni;
      if (op.tasi) {
        kaynakCip = self.cipler[op.tasi];
        if (!kaynakCip) { return; }
        ilk = kaynakCip.getBoundingClientRect();
        self.istasyonEl[op.hedef].yuva.appendChild(kaynakCip);
        if (animasyonlu) { kaydir(kaynakCip, ilk); }
      } else if (op.kopyala) {
        kaynakCip = self.cipler[op.kopyala];
        if (!kaynakCip) { return; }
        ilk = kaynakCip.getBoundingClientRect();
        var turu = op.tur || (kaynakCip.className.match(/tur-(\w+)/) || [])[1];
        yeni = self.cipEkle({ id: op.yeniId, ad: op.yeniAd || kaynakCip.querySelector(".akis-cip-ad").textContent, tur: turu }, op.hedef);
        if (animasyonlu) { kaydir(yeni, ilk); belir(yeni); }
      } else if (op.olustur) {
        yeni = self.cipEkle(op.olustur, op.hedef);
        if (animasyonlu) {
          var k = op.kaynak && self.cipler[op.kaynak];
          if (k) { kaydir(yeni, k.getBoundingClientRect()); }
          belir(yeni);
        }
      } else if (op.soluk) {
        if (self.cipler[op.soluk]) { self.cipler[op.soluk].classList.add("soluk"); }
      } else if (op.sil) {
        var s = self.cipler[op.sil];
        if (s) {
          if (animasyonlu) { s.classList.add("siliniyor"); setTimeout(function () { s.remove(); }, 600); }
          else { s.remove(); }
          delete self.cipler[op.sil];
        }
      } else if (op.vurgu) {
        if (animasyonlu && self.cipler[op.vurgu]) { belir(self.cipler[op.vurgu]); }
      } else if (op.yeniden) {
        var r = self.cipler[op.yeniden];
        if (r) { r.querySelector(".akis-cip-ad").textContent = op.ad; r.classList.add("degisti"); if (animasyonlu) { belir(r); } }
      } else if (op.not) {
        var n = self.istasyonEl[op.not].not;
        n.textContent = op.metin; n.hidden = false;
      } else if (op.notSil) {
        self.istasyonEl[op.notSil].not.hidden = true;
      } else if (op.bag) {
        if (animasyonlu) {
          [op.bag, op.hedefDosya].forEach(function (id) { if (self.cipler[id]) { belir(self.cipler[id]); } });
        }
      }
    });
  };

  function hepsiniKur() {
    document.querySelectorAll(".md-typeset .akis").forEach(function (kutu) {
      if (kutu.dataset.kuruldu) { return; }
      var s = SENARYOLAR[kutu.dataset.senaryo];
      if (!s) { kutu.textContent = "Bilinmeyen senaryo: " + kutu.dataset.senaryo; return; }
      kutu.dataset.kuruldu = "1";
      new Akis(kutu, s);
    });
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { SENARYOLAR: SENARYOLAR };
    return;
  }
  if (window.document$ && typeof window.document$.subscribe === "function") {
    window.document$.subscribe(hepsiniKur);
  } else if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", hepsiniKur);
  } else { hepsiniKur(); }
})();
