/* Yocto Project ile Gömülü Linux — BitBake operatör simülatörü
 *
 * BitBake'in değişken atama kurallarının EĞİTİM AMAÇLI, basitleştirilmiş bir modelidir.
 * Desteklenenler: =  ?=  ??=  :=  +=  =+  .=  =.  :append  :prepend  :remove
 *                 koşullu override (A:foo, A:append:foo, A:foo:append), ${DEGISKEN}
 *                 genişletme, unset, # yorum satırları.
 * Desteklenmeyenler: ${@python}, bayraklar (VAR[flag]), export, satır devamı (\).
 * Gerçek davranış için her zaman `bitbake-getvar` / `bitbake -e` ile doğrulayın.
 *
 * Kullanım: <div class="bbsim" data-hazir="temel"></div> */
(function () {
  "use strict";

  var HAZIRLAR = {
    temel: {
      ad: "1 · = ve ?= : hangisi geçerli olur?",
      kod: [
        '# ?= yalnızca değişken henüz TANIMSIZSA atama yapar',
        'INIT_SISTEMI ?= "sysvinit"',
        'INIT_SISTEMI ?= "systemd"     # INIT_SISTEMI artık tanımlı, bu satır atlanır',
        '',
        'PAKET_BICIMI = "rpm"',
        'PAKET_BICIMI ?= "ipk"         # atlanır',
        'PAKET_BICIMI = "deb"          # = her zaman önceki değeri ezer'
      ].join("\n")
    },
    zayif: {
      ad: "2 · ??= zayıf varsayılan (BitBake kılavuzu örneği)",
      kod: [
        '# ??= "başka bir atama yoksa bu değer kullanılsın" anlamına gelir.',
        '# Son ??= geçerlidir; ancak herhangi bir gerçek atama tümünü geçersiz kılar.',
        'W ??= "x"',
        'A := "${W}"   # bu noktada W = x',
        'W ??= "y"',
        'B := "${W}"   # bu noktada W = y',
        'W ??= "z"',
        'C = "${W}"    # = tembeldir: değer okunduğunda hesaplanır',
        'W ?= "i"      # W\'nin gerçek bir değeri yoktu, ?= atama yapar'
      ].join("\n")
    },
    hemen: {
      ad: "3 · = (tembel) ve := (anında) genişletme",
      kod: [
        'SURUM = "1.0"',
        'TEMBEL = "uygulama-${SURUM}"',
        'ANINDA := "uygulama-${SURUM}"',
        'SURUM = "2.0"',
        '# TEMBEL okunduğu anda hesaplanır: 2.0',
        '# ANINDA atandığı anda sabitlenmişti: 1.0'
      ].join("\n")
    },
    bosluk: {
      ad: "4 · += ile :append farkı (boşluk hatası)",
      kod: [
        'IMAGE_INSTALL = "packagegroup-core-boot"',
        'IMAGE_INSTALL += "sensor-oku"         # += boşluğu kendisi ekler',
        'IMAGE_INSTALL:append = "htop"         # :append boşluk EKLEMEZ',
        'IMAGE_INSTALL:append = " nano"        # doğru kullanım: baştaki boşluk',
        '',
        '# Sonuçta "sensor-okuhtop" adlı, var olmayan bir paket aranır ve derleme başarısız olur.'
      ].join("\n")
    },
    remove: {
      ad: "5 · :remove kelime bazında çalışır",
      kod: [
        'DISTRO_FEATURES = "x11 wayland opengl x11-extra bluetooth"',
        'DISTRO_FEATURES:remove = "x11"',
        '# "x11-extra" silinmez; :remove alt dizgiyle değil, tam kelimeyle eşleşir.',
        '',
        'PAKETLER = "a b c"',
        'PAKETLER:remove = "b"',
        'PAKETLER:append = " b"   # :remove her zaman EN SON uygulanır; b geri eklenmez'
      ].join("\n")
    },
    override: {
      ad: "6 · Koşullu override (OVERRIDES)",
      kod: [
        '# OVERRIDES, iki nokta ile ayrılmış etkin koşullar listesidir.',
        '# Sağdaki koşul daha yüksek önceliklidir. Aşağıdaki listeyi değiştirerek deneyin.',
        'OVERRIDES = "linux:arm:agecidi"',
        '',
        'KONSOL_HIZI = "115200"',
        'KONSOL_HIZI:arm = "57600"',
        'KONSOL_HIZI:agecidi = "9600"',
        '',
        'OZELLIKLER = "ethernet"',
        'OZELLIKLER:append:agecidi = " modbus"',
        'OZELLIKLER:append:x86 = " pcie"   # x86 etkin değil, eklenmez'
      ].join("\n")
    },
    zayifEkleme: {
      ad: "7 · ??= ardından += kullanımı",
      kod: [
        '# Kılavuza göre += zayıf varsayılanın ÜZERİNE ekleme yapmaz.',
        'PAKET_DEPOSU ??= "ana"',
        'PAKET_DEPOSU += "yedek"',
        '# Sonuç " yedek" olur, "ana" kaybolur. Çözüm: :append kullanmak.',
        '',
        'DEPO2 ??= "ana"',
        'DEPO2:append = " yedek"'
      ].join("\n")
    }
  };

  /* ---------------------------------------------------------------- */
  /* Yorumlayıcı                                                       */
  /* ---------------------------------------------------------------- */
  var SATIR_RE = /^([A-Za-z_][A-Za-z0-9_\-]*)((?::[A-Za-z0-9_\-]+)*)\s*(\?\?=|\?=|:=|\+=|=\+|\.=|=\.|=)\s*(?:"((?:[^"\\]|\\.)*)"|'((?:[^'\\]|\\.)*)')\s*(?:#.*)?$/;
  var UNSET_RE = /^unset\s+([A-Za-z_][A-Za-z0-9_\-]*)((?::[A-Za-z0-9_\-]+)*)\s*$/;
  var OPLAR = { append: 1, prepend: 1, remove: 1 };

  function Durum(ovrAlan) {
    this.depo = {};          // anahtar ("A" ya da "A:foo") -> kayıt
    this.sira = [];          // değişkenlerin görülme sırası (temel adlar)
    this.ovrAlan = ovrAlan;  // kutudan gelen OVERRIDES (metin tanımlamazsa)
  }
  Durum.prototype.kayit = function (anahtar, olustur) {
    if (!this.depo[anahtar] && olustur) {
      this.depo[anahtar] = { deger: undefined, zayif: undefined, oplar: [] };
    }
    return this.depo[anahtar];
  };
  Durum.prototype.etkinOverrides = function () {
    var k = this.depo.OVERRIDES;
    var ham = (k && (k.deger !== undefined ? k.deger : k.zayif)) || this.ovrAlan || "";
    return ham.split(":").map(function (s) { return s.trim(); }).filter(Boolean);
  };
  Durum.prototype.kosulUyar = function (kosul, etkin) {
    if (!kosul) { return true; }
    return kosul.split(":").every(function (k) { return etkin.indexOf(k) !== -1; });
  };
  Durum.prototype.oplariUygula = function (deger, kayit, etkin) {
    var self = this;
    var ekler = kayit.oplar.filter(function (o) { return o.tur === "append" && self.kosulUyar(o.kosul, etkin); });
    var onekler = kayit.oplar.filter(function (o) { return o.tur === "prepend" && self.kosulUyar(o.kosul, etkin); });
    ekler.forEach(function (o) { deger = deger + o.metin; });
    onekler.forEach(function (o) { deger = o.metin + deger; });
    return deger;
  };
  Durum.prototype.silmeleriTopla = function (kayit, etkin) {
    var self = this;
    return kayit.oplar.filter(function (o) { return o.tur === "remove" && self.kosulUyar(o.kosul, etkin); });
  };
  /* Bir değişkenin o anki, tamamen genişletilmiş değeri */
  Durum.prototype.getVar = function (ad, derinlik) {
    derinlik = derinlik || 0;
    if (derinlik > 25) { throw new Error("Özyinelemeli genişletme: " + ad + " kendine referans veriyor olabilir."); }
    var etkin = this.etkinOverrides();
    var temel = this.depo[ad];
    var deger;
    var silmeler = [];

    // 1) Etkin override varyantlarından en yüksek öncelikliyi bul (sağdaki kazanır)
    var secilen = null;
    for (var i = 0; i < etkin.length; i++) {
      var v = this.depo[ad + ":" + etkin[i]];
      if (v && (v.deger !== undefined || v.zayif !== undefined || v.oplar.length)) { secilen = v; }
    }
    if (secilen) {
      deger = secilen.deger !== undefined ? secilen.deger : (secilen.zayif !== undefined ? secilen.zayif : "");
      deger = this.oplariUygula(deger, secilen, etkin);
      silmeler = silmeler.concat(this.silmeleriTopla(secilen, etkin));
    } else if (temel) {
      deger = temel.deger !== undefined ? temel.deger : temel.zayif;
    }
    if (!temel && !secilen) { return undefined; }

    // 2) Temel değişkenin :append / :prepend işlemleri
    if (temel) {
      var hicDegerYok = deger === undefined;
      if (hicDegerYok) { deger = ""; }
      var once = deger;
      deger = this.oplariUygula(deger, temel, etkin);
      silmeler = silmeler.concat(this.silmeleriTopla(temel, etkin));
      if (hicDegerYok && once === deger && !silmeler.length) { return undefined; }
    }

    // 3) ${...} genişlet
    deger = this.genislet(deger, derinlik + 1);

    // 4) :remove en son, kelime bazında
    if (silmeler.length) {
      var self = this;
      var silinecek = [];
      silmeler.forEach(function (o) {
        self.genislet(o.metin, derinlik + 1).split(/\s+/).filter(Boolean).forEach(function (k) { silinecek.push(k); });
      });
      deger = deger.split(/(\s+)/).map(function (parca) {
        return silinecek.indexOf(parca) !== -1 ? "" : parca;
      }).join("");
    }
    return deger;
  };
  Durum.prototype.genislet = function (metin, derinlik) {
    var self = this;
    return metin.replace(/\$\{([A-Za-z_][A-Za-z0-9_\-:]*)\}/g, function (tam, ad) {
      var d = self.getVar(ad, derinlik);
      return d === undefined ? tam : d;
    });
  };

  function calistir(kod, ovrAlan) {
    var d = new Durum(ovrAlan);
    var gunluk = [];
    var hatalar = [];
    kod.split("\n").forEach(function (hamSatir, no) {
      var satir = hamSatir.trim();
      var etiket = "satır " + (no + 1) + ": ";
      if (!satir || satir.charAt(0) === "#") { return; }
      satir = satir.replace(/^export\s+/, "");
      var u = satir.match(UNSET_RE);
      if (u) {
        delete d.depo[u[1] + (u[2] || "")];
        gunluk.push(etiket + "unset " + u[1] + (u[2] || "") + " → değişken silindi");
        return;
      }
      var m = satir.match(SATIR_RE);
      if (!m) {
        hatalar.push(etiket + "anlaşılamadı → " + hamSatir.trim());
        return;
      }
      var ad = m[1];
      var parcalar = (m[2] || "").split(":").filter(Boolean);
      var op = m[3];
      var metin = (m[4] !== undefined ? m[4] : m[5]).replace(/\\(.)/g, "$1");
      if (d.sira.indexOf(ad) === -1) { d.sira.push(ad); }

      // :append / :prepend / :remove var mı?
      var opIndeks = -1;
      for (var i = 0; i < parcalar.length; i++) { if (OPLAR[parcalar[i]]) { opIndeks = i; break; } }
      if (opIndeks !== -1) {
        var onceki = parcalar.slice(0, opIndeks).join(":");
        var tur = parcalar[opIndeks];
        var kosul = parcalar.slice(opIndeks + 1).join(":");
        var anahtar = ad + (onceki ? ":" + onceki : "");
        if (op !== "=") {
          gunluk.push(etiket + "⚠ :" + tur + " ile genelde düz = kullanılır; '" + op + "' burada = gibi yorumlandı");
        }
        d.kayit(anahtar, true).oplar.push({ tur: tur, metin: metin, kosul: kosul });
        gunluk.push(etiket + anahtar + ":" + tur + (kosul ? ":" + kosul : "") + ' ← "' + metin + '" (genişletme anında uygulanacak)');
        return;
      }

      var anahtar2 = ad + (parcalar.length ? ":" + parcalar.join(":") : "");
      var k = d.kayit(anahtar2, true);
      var mevcut = k.deger;
      switch (op) {
        case "=":
          k.deger = metin;
          gunluk.push(etiket + anahtar2 + ' = "' + metin + '"');
          break;
        case "?=":
          if (mevcut === undefined) {
            k.deger = metin;
            gunluk.push(etiket + anahtar2 + ' tanımsızdı → "' + metin + '" atandı');
          } else {
            gunluk.push(etiket + anahtar2 + ' zaten tanımlı ("' + mevcut + '") → ?= atlandı');
          }
          break;
        case "??=":
          k.zayif = metin;
          gunluk.push(etiket + anahtar2 + ' zayıf varsayılanı = "' + metin + '"');
          break;
        case ":=":
          var simdi = d.genislet(metin, 0);
          k.deger = simdi;
          gunluk.push(etiket + anahtar2 + ' := "' + simdi + '" (hemen genişletildi)');
          break;
        case "+=":
          k.deger = (mevcut === undefined ? "" : mevcut) + " " + metin;
          gunluk.push(etiket + anahtar2 + ' += → "' + k.deger + '"');
          break;
        case "=+":
          k.deger = metin + " " + (mevcut === undefined ? "" : mevcut);
          gunluk.push(etiket + anahtar2 + ' =+ → "' + k.deger + '"');
          break;
        case ".=":
          k.deger = (mevcut === undefined ? "" : mevcut) + metin;
          gunluk.push(etiket + anahtar2 + ' .= → "' + k.deger + '"');
          break;
        case "=.":
          k.deger = metin + (mevcut === undefined ? "" : mevcut);
          gunluk.push(etiket + anahtar2 + ' =. → "' + k.deger + '"');
          break;
      }
    });

    var sonuclar = [];
    d.sira.forEach(function (ad) {
      try {
        var v = d.getVar(ad, 0);
        sonuclar.push({ ad: ad, deger: v });
      } catch (e) { hatalar.push(ad + ": " + e.message); }
    });
    return { sonuclar: sonuclar, gunluk: gunluk, hatalar: hatalar, etkin: d.etkinOverrides() };
  }

  /* ---------------------------------------------------------------- */
  /* Arayüz                                                            */
  /* ---------------------------------------------------------------- */
  function kacis(s) {
    return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; });
  }
  function gorunurBosluk(s) {
    return kacis(s).replace(/^ +| +$/g, function (b) { return b.replace(/ /g, "␣"); });
  }

  function kur(kutu) {
    if (kutu.dataset.kuruldu) { return; }
    kutu.dataset.kuruldu = "1";
    var hazirAd = kutu.dataset.hazir || "temel";

    var secenekler = Object.keys(HAZIRLAR).map(function (k) {
      return '<option value="' + k + '"' + (k === hazirAd ? " selected" : "") + ">" + kacis(HAZIRLAR[k].ad) + "</option>";
    }).join("");

    kutu.innerHTML =
      '<div class="bbsim-arac">' +
      '<label>Örnek: <select class="bbsim-hazir" id="bbsim-hazir">' + secenekler + "</select></label>" +
      '<label>OVERRIDES (metin tanımlamazsa): <input type="text" class="bbsim-ovr" value="linux:arm" size="18" id="bbsim-ovr"></label>' +
      "</div>" +
      '<textarea class="bbsim-kod" spellcheck="false" wrap="off" aria-label="BitBake kodu"></textarea>' +
      '<div class="bbsim-arac">' +
      '<button class="md-button md-button--primary bbsim-calis" type="button">▶ Çalıştır</button>' +
      '<button class="md-button bbsim-sifirla" type="button">Örneği geri yükle</button>' +
      "<small>Ctrl+Enter ile de çalıştırılabilir. ␣ = baştaki/sondaki boşluk.</small>" +
      "</div>" +
      '<div class="bbsim-cikti"></div>';

    var kod = kutu.querySelector(".bbsim-kod");
    var ovr = kutu.querySelector(".bbsim-ovr");
    var cikti = kutu.querySelector(".bbsim-cikti");
    var sec = kutu.querySelector(".bbsim-hazir");

    function yukle() { kod.value = HAZIRLAR[sec.value].kod; goster(); }
    function goster() {
      var r = calistir(kod.value, ovr.value);
      var html = "";
      if (r.hatalar.length) {
        html += '<p class="bbsim-hata">' + r.hatalar.map(kacis).join("<br>") + "</p>";
      }
      html += "<table><thead><tr><th>Değişken</th><th>Son (genişletilmiş) değer</th></tr></thead><tbody>";
      r.sonuclar.forEach(function (s) {
        html += "<tr><td><code>" + kacis(s.ad) + "</code></td><td>" +
          (s.deger === undefined ? "<em>tanımsız</em>" : "<code>\"" + gorunurBosluk(s.deger) + "\"</code>") + "</td></tr>";
      });
      html += "</tbody></table>";
      html += "<p><small>Etkin OVERRIDES: <code>" + kacis(r.etkin.join(":") || "(yok)") + "</code></small></p>";
      html += '<details><summary>Adım adım ne oldu?</summary><div class="bbsim-log">' +
        r.gunluk.map(kacis).join("\n") + "</div></details>";
      cikti.innerHTML = html;
    }

    sec.addEventListener("change", yukle);
    kutu.querySelector(".bbsim-calis").addEventListener("click", goster);
    kutu.querySelector(".bbsim-sifirla").addEventListener("click", yukle);
    ovr.addEventListener("change", goster);
    kod.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); goster(); }
    });
    kod.value = HAZIRLAR[sec.value].kod;
    goster();
  }

  function hepsiniKur() { document.querySelectorAll(".md-typeset .bbsim").forEach(kur); }

  // Node.js ile test edebilmek için
  if (typeof module !== "undefined" && module.exports) {
    module.exports = { calistir: calistir, HAZIRLAR: HAZIRLAR };
    return;
  }
  if (window.document$ && typeof window.document$.subscribe === "function") {
    window.document$.subscribe(hepsiniKur);
  } else if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", hepsiniKur);
  } else { hepsiniKur(); }
})();
