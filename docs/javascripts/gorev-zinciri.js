/* Yocto Project ile Gömülü Linux — tıklanabilir BitBake görev zinciri
 * Kullanım: <div class="zincir" data-tur="tarif"></div>
 *           <div class="zincir" data-tur="imaj"></div> */
(function () {
  "use strict";

  var ZINCIRLER = {
    tarif: [
      { ad: "do_fetch", ozet: "Kaynakları indir",
        detay: "<code>SRC_URI</code> içindeki her şeyi (tarball, git deposu, yama, yerel dosya) indirir ve <code>DL_DIR</code> (varsayılan <code>build/downloads/</code>) altında saklar. Ağ erişimi yalnızca bu görevde gerekir; indirilen kaynaklar sonraki derlemelerde yeniden kullanılır." },
      { ad: "do_unpack", ozet: "Aç", detay: "İndirilen arşivleri <code>UNPACKDIR</code> içine açar (varsayılan <code>${WORKDIR}/sources</code>). Kaynak dizini <code>S</code> varsayılan olarak <code>${UNPACKDIR}/${BP}</code> olur; yani <code>isim-sürüm</code>." },
      { ad: "do_patch", ozet: "Yamaları uygula", detay: "<code>SRC_URI</code> içindeki <code>.patch</code>/<code>.diff</code> dosyalarını sırayla <code>S</code> üzerine uygular. Yamalar katmanda tutulur; yukarı akış (upstream) kaynak kodu değiştirilmez." },
      { ad: "do_configure", ozet: "Yapılandır", detay: "Autotools için <code>./configure</code>, CMake için <code>cmake</code>, Meson için <code>meson setup</code> çalışır. Hangisi olacağını <code>inherit autotools / cmake / meson</code> satırı belirler. Çapraz derleme ayarları burada devreye girer." },
      { ad: "do_compile", ozet: "Derle", detay: "Çapraz derleyiciyle (<code>${CC}</code>, <code>${CXX}</code>) derler. Çıktı <code>B</code> dizinine (çoğu zaman <code>S</code> ile aynı) yazılır." },
      { ad: "do_install", ozet: "Sahte köke kur", detay: "Dosyaları gerçek sisteme değil, <code>D</code> denen sahte köke (<code>${WORKDIR}/image</code>) kurar. Örn. <code>install -m 0755 uygulama ${D}${bindir}</code>. Kurulmayan dosya pakete giremez." },
      { ad: "do_populate_sysroot", ozet: "Diğer tariflerle paylaş", detay: "Kütüphane ve başlık dosyalarını, bu tarife <code>DEPENDS</code> ile bağlı diğer tarifler kullanabilsin diye sysroot'a koyar." },
      { ad: "do_package", ozet: "Paketlere böl", detay: "<code>D</code> içindekileri <code>PACKAGES</code> ve <code>FILES:${PN}</code> kurallarına göre paketlere ayırır: <code>${PN}</code>, <code>${PN}-dev</code>, <code>${PN}-dbg</code>, <code>${PN}-doc</code>… Hata ayıklama sembolleri burada ayrılır, lisans bilgisi toplanır." },
      { ad: "do_package_write_*", ozet: "rpm / ipk / deb üret", detay: "<code>PACKAGE_CLASSES</code> ayarına göre gerçek paket dosyaları üretilir ve <code>tmp/deploy/rpm|ipk|deb</code> altına konur. Poky varsayılanı rpm'dir." },
      { ad: "do_build", ozet: "Bitti!", detay: "Kendisi bir şey yapmayan, tüm zincirin tamamlandığını gösteren varsayılan hedef. <code>bitbake sensor-oku</code> komutu aslında bu görevi ister." }
    ],
    imaj: [
      { ad: "tarifler", ozet: "Her paket kendi zincirini koşar", detay: "<code>IMAGE_INSTALL</code> içindeki her paket ve bağımlılıkları yukarıdaki tarif zincirinden geçer. BitBake bunları paralel çalıştırır (<code>BB_NUMBER_THREADS</code>)." },
      { ad: "do_rootfs", ozet: "Kök dosya sistemini kur", detay: "Paket yöneticisi (dnf/opkg/apt) üretilen paketleri boş bir dizine kurar. <code>IMAGE_FEATURES</code> (ör. <code>ssh-server-dropbear</code>) burada etki eder." },
      { ad: "do_image", ozet: "Son rötuşlar", detay: "<code>ROOTFS_POSTPROCESS_COMMAND</code> gibi kancalar çalışır. Kullanıcı ekleme, dosya izinleri gibi ayarlar burada yapılabilir." },
      { ad: "do_image_*", ozet: "ext4 / wic / tar.zst…", detay: "<code>IMAGE_FSTYPES</code> içindeki her biçim için ayrı görev oluşur: <code>do_image_ext4</code>, <code>do_image_wic</code>… Bölümlenmiş, karta yazılabilir disk imajı için <code>wic</code> kullanılır." },
      { ad: "do_image_complete", ozet: "deploy dizinine koy", detay: "İmajlar <code>tmp/deploy/images/${MACHINE}/</code> altına kopyalanır; yanlarına manifest (paket listesi) ve SPDX SBOM dosyaları da düşer." }
    ]
  };

  function kur(kutu) {
    if (kutu.dataset.kuruldu) { return; }
    kutu.dataset.kuruldu = "1";
    var adimlar = ZINCIRLER[kutu.dataset.tur || "tarif"];
    if (!adimlar) { return; }

    var serit = document.createElement("div");
    serit.className = "zincir-adimlar";
    var detay = document.createElement("div");
    detay.className = "zincir-detay";
    detay.innerHTML = "<em>Ayrıntı için bir göreve tıklayın ya da ▶ Oynat ile zinciri adım adım izleyin.</em>";
    var butonlar = [];

    function sec(i) {
      butonlar.forEach(function (b, j) { b.classList.toggle("secili", j === i); });
      detay.innerHTML = "<strong><code>" + adimlar[i].ad + "</code> · " + adimlar[i].ozet + "</strong><br>" + adimlar[i].detay;
    }

    adimlar.forEach(function (a, i) {
      if (i > 0) {
        var ok = document.createElement("span");
        ok.className = "zincir-ok"; ok.textContent = "→";
        serit.appendChild(ok);
      }
      var b = document.createElement("button");
      b.type = "button"; b.className = "zincir-adim"; b.textContent = a.ad;
      b.addEventListener("click", function () { sec(i); });
      butonlar.push(b);
      serit.appendChild(b);
    });

    var oynat = document.createElement("button");
    oynat.type = "button"; oynat.className = "md-button"; oynat.textContent = "▶ Oynat";
    oynat.style.marginTop = ".6rem";
    var zamanlayici = null;
    oynat.addEventListener("click", function () {
      clearInterval(zamanlayici);
      var i = 0;
      sec(0);
      zamanlayici = setInterval(function () {
        i++;
        if (i >= adimlar.length) { clearInterval(zamanlayici); return; }
        sec(i);
      }, 1800);
    });

    kutu.appendChild(serit);
    kutu.appendChild(oynat);
    kutu.appendChild(detay);
  }

  function hepsiniKur() { document.querySelectorAll(".md-typeset .zincir").forEach(kur); }
  if (window.document$ && typeof window.document$.subscribe === "function") {
    window.document$.subscribe(hepsiniKur);
  } else if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", hepsiniKur);
  } else { hepsiniKur(); }
})();
