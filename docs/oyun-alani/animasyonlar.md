# Animasyonlu şemalar

Bu sayfa, kitapta kullanılan dosya akışı animasyonlarını bir arada sunar. Her animasyon, bir işlem
sırasında dosyaların hangi dizinler arasında taşındığını, kopyalandığını veya oluşturulduğunu gerçek
dizin adlarıyla gösterir. Yollar Yocto 6.0 varsayılanlarına göre, qemux86-64 makinesi ve poky dağıtımı
için verilmiştir.

**Kullanım:** ▶ Oynat ile animasyon otomatik ilerler; ▶| ve ◀ ile adım adım gezinilir; alttaki adım
adlarına tıklanarak doğrudan ilgili adıma geçilir. İşletim sisteminde hareketi azaltma ayarı etkinse
geçişler animasyonsuz gösterilir.

| Renk etiketi | Anlamı |
|---|---|
| `BB` | Tarif, tarif eki |
| `C` | Kaynak dosya |
| `ELF` | Derlenmiş ikili dosya |
| `PKG` | Paket veya sstate nesnesi |
| `IMG` | Disk veya dosya sistemi imajı |
| `CONF` | Yapılandırma dosyası |
| `DIR` | Dizin |
| `TXT` | Metin, liste, belge |

## 1. Metadata'nın ayrıştırılma sırası

Bkz. [Bölüm 5](../bolumler/05-bitbake-dili.md).

<div class="akis" data-senaryo="ayristirma"></div>

## 2. Yeni bir tarifin oluşturulması

Bkz. [Bölüm 6](../bolumler/06-tarifler.md).

<div class="akis" data-senaryo="yeni-tarif"></div>

## 3. Bir tarifin derlenmesi: dosyaların yolu

Bkz. [Bölüm 6](../bolumler/06-tarifler.md).

<div class="akis" data-senaryo="tarif"></div>

## 4. Tarif ekiyle başka bir katmandaki tarifin değiştirilmesi

Bkz. [Bölüm 7](../bolumler/07-katmanlar.md).

<div class="akis" data-senaryo="bbappend"></div>

## 5. İmajın oluşturulması

Bkz. [Bölüm 9](../bolumler/09-imajlar.md).

<div class="akis" data-senaryo="imaj"></div>

## 6. devtool ile değişiklik döngüsü

Bkz. [Bölüm 13](../bolumler/13-devtool-sdk.md).

<div class="akis" data-senaryo="devtool"></div>

## 7. sstate: önbellekten geri yükleme

Bkz. [Bölüm 15](../bolumler/15-sstate.md).

<div class="akis" data-senaryo="sstate"></div>
