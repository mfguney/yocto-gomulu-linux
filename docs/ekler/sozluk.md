# Terimler sözlüğü (TR–EN)

Yocto ekosisteminde İngilizce terimler yaygın olarak kullanılır. Bu kitapta Türkçe karşılıklar tercih
edilmiştir; ancak günlüklerde, belgelerde ve forumlarda İngilizce terimlerle karşılaşılır. Bu sözlük iki
dil arasındaki karşılıkları listeler.

| Türkçe | İngilizce | Kısa açıklama |
|---|---|---|
| tarif | recipe (`.bb`) | Tek bir yazılımın nasıl indirilip, derlenip paketleneceği |
| tarif eki | bbappend (`.bbappend`) | Var olan bir tarife dışarıdan yapılan ekleme |
| katman | layer | İlgili tariflerin ve ayarların bulunduğu klasör |
| sınıf | class (`.bbclass`) | Tariflerin `inherit` ile paylaştığı ortak mantık |
| makine | machine | Hedef donanım tanımı (`MACHINE`) |
| dağıtım | distro / distribution | Politika ve özellik seti (`DISTRO`) |
| değerlendirme sorusu | — | Bölüm sonlarındaki etkileşimli sorular |
| imaj | image | Cihaza yazılacak son ürün |
| görev | task | `do_fetch`, `do_compile` gibi adımlar |
| yapılandırma parçası | configuration fragment | İsimli, açıklamalı, açılıp kapanabilen ayar dosyası |
| yerleşik parça | built-in fragment | Tek bir değişkeni ayarlayan parça, ör. `machine/qemuarm64` |
| kurulum | setup (bitbake-setup) | `build/`, `config/`, `layers/` üçlüsü |
| derleme dizini | build directory | BitBake'in çalıştığı ve çıktı ürettiği dizin |
| paylaşılan durum önbelleği | shared state (sstate) cache | Görev çıktılarının yeniden kullanılabilir önbelleği |
| hash eşdeğerliği | hash equivalence | Aynı çıktıyı üreten girdileri tanıyıp yeniden derlemeyi önleme |
| çapraz derleme | cross-compilation | Bir mimaride başka bir mimari için derleme |
| araç takımı | toolchain | Derleyici, bağlayıcı, C kütüphanesi |
| kök dosya sistemi | root filesystem (rootfs) | Cihazın `/` dizini |
| geçici kök | destination directory (`D`) | `do_install` görevinin kurulum yaptığı dizin |
| derleme bağımlılığı | build-time dependency (`DEPENDS`) | Derlerken gereken tarif |
| çalışma bağımlılığı | runtime dependency (`RDEPENDS`) | Cihazda çalışırken gereken paket |
| sağlayıcı | provider (`PROVIDES`, `PREFERRED_PROVIDER`) | Sanal bir ihtiyacı (`virtual/kernel`) karşılayan tarif |
| zayıf varsayılan | weak default (`??=`) | Başka atama yoksa kullanılan değer |
| koşullu değer | override (`VAR:koşul`) | Belirli koşulda geçerli olan değer |
| yukarı akış | upstream | Yazılımın asıl geliştirildiği yer |
| yazılım malzeme listesi | SBOM | Bir üründeki tüm bileşenlerin listesi |
| kart destek paketi | BSP | Kartı çalıştırmak için gereken katman |
| önyükleyici | bootloader | U-Boot, GRUB vb. |
| aygıt ağacı | device tree | Donanımı çekirdeğe tanıtan veri yapısı |
| kalite denetimi | QA (insane.bbclass) | Paketleme sırasında yapılan otomatik kontroller |
| uzun süreli destek | LTS | 4 yıl desteklenen Yocto sürümleri |

!!! sss "Eksik terim bildirimi"
    Sözlüğe terim eklenmesi, kitaba katkının en kolay yoludur. Öneriler sayfanın üstündeki düzenleme
    düğmesiyle iletilebilir.
