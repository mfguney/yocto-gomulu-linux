# Katkı rehberi

Bu kitap topluluk katkısına açıktır. Yazım düzeltmeleri, terim önerileri, yeni değerlendirme soruları ve
bölüm yazımı aynı ölçüde değerlidir.

## Tarayıcı üzerinden katkı

1. Düzeltilecek sayfanın üstündeki :material-file-edit-outline: düğmesine tıklayın.
2. GitHub depoyu sizin hesabınıza çatallar (fork) ve düzenleyiciyi açar.
3. Değişikliği yapın, kısa bir açıklama yazın ve **Propose changes** ile gönderin.

## Yerel çalışma ortamı

```bash
git clone https://github.com/mfguney/yocto-gomulu-linux.git
cd yocto-gomulu-linux
python3 -m venv .venv && . .venv/bin/activate
pip install -r requirements.txt
mkdocs serve            # http://127.0.0.1:8000 adresinde canlı önizleme
```

## Yazım ilkeleri

- **Üslup:** Resmî, açık ve nesnel bir dil kullanılır. Edilgen yapı veya "siz" hitabı tercih edilir;
  günlük konuşma dili ve şaka kullanılmaz.
- **Bölüm yapısı:** Künye, öğrenme hedefleri, kavramsal anlatım, uygulama çalışmaları, özet,
  değerlendirme soruları (en az üç) ve alıştırma. Örnek için [6 · Tarifler ve görevler](../bolumler/06-tarifler.md).
- **Önce kavram:** Her konu önce *ne olduğu* ve *neden var olduğu* açısından anlatılır; komutlar bunu izler.
- **Terimler:** [Terimler sözlüğü](sozluk.md)ndeki karşılıklar kullanılır. Terimin ilk geçtiği yerde
  İngilizcesi parantez içinde verilir.
- **Doğruluk:** Her komut ve tarif gerçek bir 6.0 kurulumunda denenir; resmî belgelere bağlantı verilir.
- **Telif:** Resmî belgelerden veya başka kaynaklardan **çeviri yapılmaz, özgün metin yazılır**. Kısa
  alıntılarda kaynak belirtilir. Yocto belgeleri CC BY-SA 2.0 UK lisanslıdır; uyarlama yapılırsa kaynak
  ve değişiklik belirtilmelidir.
- **Örnek proje:** Örnekler, `examples/meta-ornek` katmanındaki endüstriyel sensör ağ geçidi senaryosuyla tutarlı olmalıdır.

## Değerlendirme sorusu ekleme

```html
<div class="quiz" data-id="b06-4">
<p class="quiz-soru">Soru metni?</p>
<ul>
<li>Yanlış seçenek</li>
<li data-dogru>Doğru seçenek</li>
<li>Yanlış seçenek</li>
</ul>
<p class="quiz-aciklama">Doğru yanıtın gerekçesi.</p>
</div>
```

`data-id` tüm kitapta benzersiz olmalıdır (`b<bölüm>-<sıra>`). Seçeneklerin sırası her açılışta değişir.
Sorular bölüm sonundaki "Değerlendirme soruları" başlığı altına eklenir.

## Bilgi kutuları

```markdown
!!! hedef "Öğrenme hedefleri"   → bölüm başı
!!! iyi "İyi uygulama"           → yerleşik çalışma yöntemi
!!! sss "Sık sorulan soru"       → sık karşılaşılan soru
!!! dikkat "Dikkat"              → sık yapılan hata
!!! lab "Uygulama 6.1 · Başlık"  → uygulama çalışması
!!! alistirma "Alıştırma"        → bölüm sonu görevi (çözüm ??? success içinde)
```

## Lisans

Gönderilen metin katkıları **CC BY-SA 4.0**, kod katkıları **MIT** lisansıyla yayımlanır.
