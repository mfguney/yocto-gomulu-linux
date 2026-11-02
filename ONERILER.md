# Öneriler ve yol haritası

Bu belge, kitabın yapısına ilişkin kararları ve sonraki adımları özetler. Kasım 2026'da yapılan
araştırmaya dayanır.

## 1. İlerleme durumu (v1.0)

| Ölçüt | Durum |
|---|---|
| Bölümler | 18 / 18 tamamlandı (~37.000 kelime, 78 değerlendirme sorusu) |
| Ekler | Sözlük, komut özeti, sürüm takvimi, kaynakça, katkı rehberi |
| Etkileşimli araçlar | Değerlendirme soruları, BitBake operatör simülatörü, görev zinciri şemaları, 7 animasyonlu dosya akışı şeması |
| Örnekler | `meta-ornek` (ürün katmanı), `meta-ornek-hatali` (hata ayıklama alıştırması), `ci/` (bitbake-setup, kas, GitHub Actions, Dockerfile) |
| Teknik inceleme | Tüm bölümler Yocto 6.0 kaynak kodu ve belgelerine karşı bağımsız olarak incelendi |
| Uçtan uca doğrulama | Henüz yapılmadı: uygulama çalışmaları gerçek bir derleme ortamında çalıştırılmalıdır |

## 2. Araştırma bulguları

**Türkçe kaynak eksikliği.** GitHub'da ve web'de kapsamlı, güncel bir Türkçe Yocto kaynağı
bulunamamıştır. Mevcut kaynaklar kurs notları ve kişisel deneme depolarıyla sınırlıdır.

**İngilizce kaynakların güncelliği.** Yocto 5.2, 5.3 ve 6.0 sürümleriyle köklü değişiklikler gelmiştir:

- Poky deposu artık güncellenmemektedir; resmî yöntem `bitbake-setup`tır.
- Ayarlar yapılandırma parçalarıyla yönetilmektedir (`bitbake-config-build`).
- `UNPACKDIR` gelmiş, `S = "${WORKDIR}..."` kullanımı hata verir hale gelmiştir.
- `cve-check` yerine `sbom-cve-check` gelmiş, SPDX 2.2 kaldırılmıştır.

GitHub'daki yaygın eğitim depolarının ve basılı kitapların büyük kısmı önceki yöntemi anlatmaktadır.
**Doğrudan 6.0 için yazılmış olmak kitabın temel ayırt edici özelliğidir.**

**Yararlanılabilecek açık kaynaklar:**

| Kaynak | Lisans | Katkısı |
|---|---|---|
| [Yocto Project belgeleri](https://docs.yoctoproject.org/) | CC BY-SA 2.0 UK | Teknik doğruluk için temel kaynak |
| [Bootlin Yocto eğitimi](https://bootlin.com/training/yocto/) ([kaynak](https://github.com/bootlin/training-materials)) | CC BY-SA | Wrynose'a güncel uygulama akışı ve kart seçimleri |
| [Heading for the Yocto Project](https://github.com/CollaborativeWritersHub/heading-for-the-yocto-project) | CC BY-SA 4.0 | Çeviri katkısına açık kısa kitapçık |
| [siemens/kas](https://github.com/siemens/kas) | MIT | Sürekli entegrasyon bölümü için alternatif kurulum aracı |

## 3. Yayın altyapısı

**Seçilen: Material for MkDocs + GitHub Pages.** Markdown tabanlıdır, katkı eşiği düşüktür, Türkçe arayüz
ve arama desteği sunar; Mermaid diyagramları, sekmeler ve kod açıklamaları hazırdır.

!!! warning "Material for MkDocs 5 Mayıs 2027'de bakım dışı kalacaktır"
    Aynı ekip halef olarak **[Zensical](https://zensical.org/)**'ı (MIT) geliştirmektedir. Zensical
    `mkdocs.yml` dosyasını doğrudan okur ve kitabın mevcut hali Zensical ile hatasız derlenmektedir.
    Etkileşimli öğeler eklentilere değil, bağımsız JavaScript dosyalarına dayandırılmıştır.

    Geçiş planı: 2027 başında Zensical ile deneme derlemesi, Mayıs 2027'den önce CI'ın Zensical'a
    taşınması. **MkDocs 2.0** geriye uyumsuz olduğundan `requirements.txt` içinde `mkdocs<2` sabitlenmiştir.

## 4. Lisans

- **Metin: CC BY-SA 4.0.** Yocto belgeleri (CC BY-SA 2.0 UK) ve Bootlin materyalleri (CC BY-SA) ile
  uyumludur; CC BY-SA'nın önceki sürümleri uyarlamaların sonraki sürümlerle yayımlanmasına izin verir.
  Çeviri yerine özgün metin yazılmalı, uyarlanan yerlerde kaynak belirtilmelidir.
- **Kod: MIT.** Örnek katman parçaları ticari ürünlerde serbestçe kullanılabilir.
- **Marka:** "Yocto Project" adı ve logosu Linux Foundation'ın tescilli markasıdır. Kitapta logo
  kullanılmamış, bağımsız çalışma notu her sayfaya eklenmiştir. Yocto Project marka yönergelerinin
  incelenmesi önerilir.

## 5. Yapı kararları (v0.2)

- Hikâye ve karakterler kaldırılmış, **kavramsal ve kurumsal anlatım** benimsenmiştir.
- Her bölüm: öğrenme hedefleri → kavramsal anlatım → uygulama → özet → değerlendirme soruları → alıştırma.
- Bilgi kutuları: öğrenme hedefleri, iyi uygulama, sık sorulan soru, dikkat, uygulama çalışması, alıştırma.
- Örnek proje: ekransız **endüstriyel sensör ağ geçidi**, dağıtım adı **ÖrnekOS**, katman `meta-ornek`.
- Etkileşimli öğeler: değerlendirme soruları, BitBake operatör simülatörü, görev zinciri şemaları ve
  animasyonlu dosya akışı şemaları. Puan ve rütbe sistemi kaldırılmıştır.

## 6. Önerilen sonraki adımlar

1. **Uçtan uca doğrulama:** Tüm uygulama çalışmalarının gerçek bir Wrynose kurulumunda çalıştırılması ve
   örnek çıktıların gerçek çıktılarla değiştirilmesi.
2. **CI ile doğrulama:** `examples/ci` altındaki iş akışıyla `meta-ornek` katmanının her değişiklikte derlenmesi.
3. **Kuruma özgü BSP eki:** Kullanılan karta yönelik bir ek bölüm.
4. **Hazır QEMU imajı:** Derleme altyapısı olmayan okurlar için GitHub Releases üzerinden `ornek-image` dağıtımı.
5. **PDF/EPUB çıktısı:** Çevrimdışı okuma ve kurum içi eğitim materyali olarak kullanım için.
6. **Eğitim paketi:** Kısım I–II'nin kurum içi işe alışma (onboarding) programı olarak düzenlenmesi.

## 7. Kalite ve sürdürülebilirlik

- **Sürüm politikası:** `main` dalı güncel LTS'i (6.0) izler. Sonraki LTS (7.0, 2028) yayımlandığında
  `wrynose` dalı dondurulur. Ara sürümlerdeki değişiklikler "Önceki sürümlerde" notlarıyla belirtilir.
- **CI denetimleri:** Mevcut: `mkdocs build --strict`. Eklenebilecekler: bağlantı denetimi (lychee),
  markdownlint, kurum içi çalıştırıcıda `meta-ornek` için `bitbake -p` ve `yocto-check-layer`.
- **Katkı akışı:** Issue şablonları ("bölüm önerisi", "hata bildirimi", "terim önerisi") ve
  `good first issue` etiketleri.

## 8. Duyuru planı

1. GitHub deposu ve GitHub Pages yayını
2. Yocto Project tartışma forumu / e-posta listesi
3. Türkiye'deki açık kaynak ve gömülü sistem toplulukları, üniversiteler, mesleki ağlar
4. Her yeni bölüm için kısa duyuru

## 9. Kurumsal projelerde kullanım

- Kuruma özgü bilgiler (kart şemaları, kapalı katmanlar, müşteri adları) bu depoya eklenmemelidir.
- `meta-ornek` yapısı, kurum katmanı için **şablon** olarak kullanılabilir.
- Kuruma özgü kartlarla edinilen deneyimler genelleştirilerek Bölüm 10'a (BSP) katkı olarak verilebilir.
