# Kitabın kullanımı

## Bölüm yapısı

Tam yazılmış her bölüm aynı düzeni izler:

1. **Künye:** Tahmini çalışma süresi, düzey ve ön koşullar
2. **Öğrenme hedefleri:** Bölüm sonunda kazanılması beklenen yetkinlikler
3. **Kavramsal anlatım:** Konunun neden var olduğu, nasıl çalıştığı ve diğer kavramlarla ilişkisi
4. **Uygulama çalışmaları:** Kavramın gerçek bir kurulumda denendiği adımlar
5. **Özet**
6. **Değerlendirme soruları:** Etkileşimli, çoktan seçmeli sorular
7. **Alıştırma:** Daha kapsamlı, açık uçlu bir görev ve örnek çözüm

## Bilgi kutuları

!!! hedef "Öğrenme hedefleri"
    Bölümün başında, o bölümden sonra yapabilmeniz beklenen işleri listeler.

!!! iyi "İyi uygulama"
    Resmî belgelerde her zaman açıkça yer almayan, sektörde yerleşmiş çalışma yöntemleri.

!!! sss "Sık sorulan soru"
    Konuya yeni başlayanların sıklıkla takıldığı noktalar.

!!! dikkat "Dikkat"
    Sık yapılan hatalar ve önemli zaman kayıplarına yol açabilecek durumlar.

!!! lab "Uygulama çalışması"
    Komut satırında uygulanacak adımlar. Komutlar kopyalanabilir; beklenen çıktılar adımların yanında verilir.

!!! alistirma "Alıştırma"
    Bölüm sonundaki kapsamlı görev. Örnek çözüm katlanmış kutuda yer alır.

## Etkileşimli öğeler

- **Değerlendirme soruları:** Bir seçeneğe tıklandığında doğru/yanlış geri bildirimi ve açıklama gösterilir.
  Seçeneklerin sırası her açılışta değişir.
- **BitBake operatör simülatörü:** Değişken atama kurallarını derleme yapmadan, tarayıcıda denemeye
  olanak tanır ([Etkileşimli araçlar](oyun-alani/bitbake-operatorleri.md), [Bölüm 5](bolumler/05-bitbake-dili.md)).
- **Görev zinciri şemaları:** Bir tarifin veya imajın derleme adımlarını tıklanabilir biçimde gösterir.
- **Animasyonlu şemalar:** Bir işlem sırasında dosyaların hangi dizinler arasında taşındığını,
  kopyalandığını veya oluşturulduğunu gerçek dizin adlarıyla, adım adım canlandırır. Yedi şemanın tamamı
  [Animasyonlu şemalar](oyun-alani/animasyonlar.md) sayfasında da bir arada bulunur.

<div class="akis" data-senaryo="tarif"></div>

Örnek bir değerlendirme sorusu:

<div class="quiz" data-id="giris-1">
<p class="quiz-soru">Bu kitaptaki komut ve örnekler hangi Yocto Project sürümüne göre hazırlanmıştır?</p>
<ul>
<li>4.0 Kirkstone</li>
<li>5.0 Scarthgap</li>
<li data-dogru>6.0 Wrynose (LTS)</li>
<li>Sürüm fark etmez</li>
</ul>
<p class="quiz-aciklama">Kitap Yocto 6.0 <em>Wrynose</em> LTS sürümünü esas alır. Katmanlar hangi sürümlerle uyumlu
olduklarını <code>LAYERSERIES_COMPAT</code> değişkeniyle bildirir; bu nedenle sürüm seçimi önemlidir.</p>
</div>

## Uygulama ortamı

Uygulama çalışmaları için bir **Linux derleme makinesi** gereklidir. Yocto 6.0 belgelerinde önerilen
değerler şunlardır:

- **En az 32 GB RAM** ve **140 GB boş disk alanı.** Bu değerler 6.0 ile yükselmiştir; temel neden
  LLVM derlemesinin kaynak gereksinimidir.
- Desteklenen bir dağıtım (Ubuntu, Debian, Fedora, openSUSE vb.). 6.0 ile **Ubuntu 26.04**, **Fedora 43**
  ve **openSUSE Leap 16.0** desteklenen listeye eklenmiştir. Güncel liste için
  *Reference Manual → Supported Linux Distributions* bölümüne bakılmalıdır.
- Çok çekirdekli işlemci ve SSD. İlk derleme makineye bağlı olarak birkaç saat sürebilir; sonraki
  derlemeler önbellek sayesinde kısalır.

=== "Doğrudan Linux"

    Önerilen ortamdır. Gerekli paketler Bölüm 3'te listelenmiştir.

=== "Windows + WSL 2"

    Yocto belgeleri WSL 2'yi desteklenen ortamlar arasında sayar. İki koşula dikkat edilmelidir:

    1. Derleme, **WSL'nin kendi ext4 dosya sisteminde** (`~/` altında) yapılmalıdır. `/mnt/c` veya
       `/mnt/d` gibi Windows sürücülerinde derleme hem çok yavaştır hem de dosya izinleri nedeniyle hatalı
       sonuç verir.
    2. WSL'ye yeterli bellek atanmalıdır (`%UserProfile%\.wslconfig` dosyasında `memory=` ayarı).

    Kitabın kaynak dosyalarının (Markdown) Windows tarafında tutulmasında sakınca yoktur.

=== "Docker / Podman"

    Ana makinedeki dağıtım desteklenmiyorsa resmî belgelerde anlatılan konteyner yöntemi kullanılabilir.
    Derleme dizini konteynere bağlanmış (bind-mount) bir **Linux dosya sistemi** üzerinde olmalıdır.

## Örnek kodlar

Depodaki `examples/meta-ornek/` dizini, kitap boyunca geliştirilen örnek ürün katmanıdır:

```text
examples/meta-ornek/
├── conf/
│   ├── layer.conf                 # katman tanımı (Bölüm 7)
│   ├── machine/ornek-agecidi.conf # makine tanımı (Bölüm 10)
│   ├── distro/ornekos.conf        # dağıtım tanımı (Bölüm 11)
│   └── fragments/                 # yapılandırma parçaları (Bölüm 7, 16–18)
├── classes/ornek-servis.bbclass   # sınıf örneği (Bölüm 8)
├── recipes-ornek/                 # ürün tarifleri (Bölüm 6, 8)
├── recipes-core/                  # bbappend, imaj ve paket grupları (Bölüm 7, 9)
└── recipes-kernel/                # çekirdek parçası ve modül (Bölüm 12)
```

Ayrıca `examples/meta-ornek-hatali/` (Bölüm 14 alıştırması) ve `examples/ci/` (Bölüm 18) dizinleri bulunur.
