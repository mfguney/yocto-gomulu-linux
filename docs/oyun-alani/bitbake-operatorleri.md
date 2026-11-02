# BitBake operatör simülatörü

Bu araç, BitBake değişken atama kurallarını derleme yapmadan, tarayıcıda denemeye olanak tanır. Hazır
örneklerden biri seçilebilir veya kod değiştirilerek sonuçlar gözlemlenebilir. Kuralların ayrıntılı
açıklaması için bkz. [Bölüm 5](../bolumler/05-bitbake-dili.md).

<div class="bbsim" data-hazir="temel"></div>

## Desteklenen sözdizimi

| Yazım | Örnek |
|---|---|
| Atamalar | `A = "x"` · `A ?= "x"` · `A ??= "x"` · `A := "${B}"` |
| Ekleme | `A += "x"` · `A =+ "x"` · `A .= "x"` · `A =. "x"` |
| Override işlemleri | `A:append = " x"` · `A:prepend = "x "` · `A:remove = "x"` |
| Koşullu değerler | `A:arm = "x"` · `A:append:arm = " x"` · `A:arm:append = " x"` |
| Diğer | `unset A` · `# yorum` · `${A}` genişletme |

!!! dikkat "Kapsam ve sınırlılıklar"
    Simülatör eğitim amacıyla **basitleştirilmiş** bir modeldir. Satır içi Python (`${@...}`), bayraklar
    (`VAR[flag]`), satır devamı (`\`), `include`/`require` yönergeleri ve BitBake'in bazı uç durumları
    desteklenmez. Gerçek derlemede kesin sonuç için:

    ```bash
    bitbake-getvar -r <tarif> <DEGISKEN>
    ```

## Çalışma soruları

1. 4 numaralı örnekte `IMAGE_INSTALL` değerini, `htop` paketi doğru eklenecek biçimde düzeltin.
2. 5 numaralı örnekte `:remove` ile çıkarılan `b` değerinin geri eklenebilmesi için bir yöntem geliştirin.
   *İpucu:* Çıkarılacak kelime bir ara değişkende tutulup `:remove = "${CIKARILACAK}"` biçiminde
   kullanılabilir; ara değişkenin değeri değiştirilerek davranış denetlenir.
3. 6 numaralı örnekte `OVERRIDES` sırasını `linux:agecidi:arm` olarak değiştirin. `KONSOL_HIZI` değerinin
   neden değiştiğini açıklayın.
