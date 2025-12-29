# 🔄 Ürün Senkronizasyon Rehberi

Bu rehber, mağazalar arası ürün senkronizasyonu özelliğinin nasıl kullanılacağını açıklar.

## 📋 İçindekiler

1. [Özellikler](#özellikler)
2. [Ayarlar](#ayarlar)
3. [Manuel Senkronizasyon](#manuel-senkronizasyon)
4. [Otomatik Senkronizasyon](#otomatik-senkronizasyon)
5. [Shopify İzinleri](#shopify-izinleri)

## ✨ Özellikler

### Senkronize Edilebilir Özellikler

Aşağıdaki ürün özellikleri senkronize edilebilir:

- ✅ **Ürün Başlığı** - Ürün adı
- ✅ **Açıklama** - Ürün detay açıklaması (HTML)
- ✅ **Fiyat** - Satış fiyatı
- ✅ **Karşılaştırma Fiyatı** - İndirimli fiyat gösterimi için
- ✅ **SKU** - Stok kodu (ürün eşleştirmesi için kritik)
- ✅ **Barkod** - Ürün barkodu
- ✅ **Stok Miktarı** - Envanter sayısı
- ✅ **Görseller** - Ürün fotoğrafları
- ✅ **Etiketler** - Ürün tag'leri
- ✅ **Tedarikçi** - Vendor bilgisi
- ✅ **Ürün Tipi** - Kategori/tip bilgisi
- ✅ **Ağırlık** - Ürün ağırlığı (kargo için)
- ✅ **Yayın Durumu** - Aktif/Pasif durumu

### Senkronizasyon Mantığı

1. **SKU Tabanlı Eşleştirme**: Eğer hedef mağazada aynı SKU'ya sahip ürün varsa, o ürün güncellenir
2. **Yeni Ürün Oluşturma**: SKU eşleşmesi yoksa, yeni ürün oluşturulur
3. **Seçici Senkronizasyon**: Ayarlardan sadece istediğiniz özellikleri seçebilirsiniz

## ⚙️ Ayarlar

### Ayarlar Sayfası

1. Sol menüden **"Ayarlar"** sayfasına gidin
2. Senkronize etmek istediğiniz özellikleri seçin
3. **"Tümünü Seç"** veya **"Tümünü Kaldır"** ile hızlı seçim yapabilirsiniz
4. **"Ayarları Kaydet"** butonuna tıklayın

### Öneri Senaryoları

**Senaryo 1: Yeni Mağaza Açıyorsunuz**
```
✅ Tüm özellikleri seçin
→ Ürünleriniz tam olarak kopyalanır
```

**Senaryo 2: Sadece Stok Senkronizasyonu**
```
✅ Sadece "Stok Miktarı" seçin
→ Fiyatlar ve diğer özellikler korunur, sadece stok güncellenir
```

**Senaryo 3: Fiyat Güncellemesi**
```
✅ "Fiyat" ve "Karşılaştırma Fiyatı" seçin
→ Sadece fiyatlar güncellenir
```

**Senaryo 4: Görseller Hariç Her Şey**
```
✅ Tümünü seç
❌ "Görseller" seçeneğini kaldır
→ Görseller hariç her şey senkronize edilir
```

## 🖱️ Manuel Senkronizasyon

### Adım Adım Kullanım

1. **"Ürün Aktar"** sayfasına gidin

2. **Kaynak Mağaza** seçin (ürünlerin kopyalanacağı mağaza)

3. **Hedef Mağaza** seçin (ürünlerin gideceği mağaza)

4. Ürünler listelenir, iki seçeneğiniz var:
   - **Seçici Aktarım**: Listedenbelirli ürünleri işaretleyin
   - **Toplu Aktarım**: "Tüm Ürünleri Aktar" checkbox'ını işaretleyin

5. **"X Ürünü Aktar"** butonuna tıklayın

6. Onay verin

7. Senkronizasyon başlar ve sonuç gösterilir:
   ```
   ✅ 15 ürün başarıyla senkronize edildi
   
   Toplam: 15
   Başarılı: 15
   Yeni Oluşturulan: 8
   Güncellenen: 7
   Hatalı: 0
   ```

### İpuçları

- ⚠️ İlk kez aktarıyorsanız önce **test** yapın (1-2 ürün seçin)
- ⚠️ Ayarları kontrol edin - hangi özelliklerin aktarılacağından emin olun
- ⚠️ SKU'ların doğru olduğundan emin olun (eşleştirme için kritik)
- ✅ Küçük partiler halinde aktarım yapın (timeout'u önlemek için)

## 🤖 Otomatik Senkronizasyon

### Shopify Webhooks ile (Önerilen)

Yeni ürün eklendiğinde otomatik senkronizasyon için Shopify webhook'ları kullanabilirsiniz.

#### 1. Webhook Endpoint Oluşturma

Netlify function oluşturun:

```javascript
// netlify/functions/webhook-product-create.js
const { syncProducts } = require('./sync-products');

exports.handler = async (event, context) => {
  // Shopify webhook doğrulaması
  const hmac = event.headers['x-shopify-hmac-sha256'];
  // HMAC doğrulaması yapın (güvenlik için önemli)

  const product = JSON.parse(event.body);
  
  // Kaynak mağazayı belirle
  const shopDomain = event.headers['x-shopify-shop-domain'];
  
  // Hedef mağaza(lar)ı belirle ve senkronize et
  // ...
  
  return {
    statusCode: 200,
    body: JSON.stringify({ success: true })
  };
};
```

#### 2. Shopify'da Webhook Kurulumu

1. Shopify Admin → **Settings** → **Notifications**
2. **Webhooks** bölümüne git
3. **Create webhook** butonuna tıkla
4. Ayarlar:
   - **Event**: `Product creation`
   - **Format**: `JSON`
   - **URL**: `https://your-app.netlify.app/api/webhook-product-create`
5. **Save** butonuna tıkla

#### 3. Diğer Webhook'lar

```
Product update: /api/webhook-product-update
Product delete: /api/webhook-product-delete
Inventory update: /api/webhook-inventory-update
```

### Scheduled Sync (Netlify Pro)

Netlify Pro plan ile scheduled functions kullanabilirsiniz:

```javascript
// netlify/functions/scheduled-sync.js
const { schedule } = require('@netlify/functions');

const handler = async () => {
  // Tüm kullanıcıların autoSync=true olan ayarlarını al
  // Her kullanıcı için senkronizasyon yap
  
  return {
    statusCode: 200
  };
};

// Her saat çalıştır
exports.handler = schedule('@hourly', handler);
```

### Cron Job (Harici Servis)

Ücretsiz alternatif: [cron-job.org](https://cron-job.org) gibi servisleri kullanın:

1. Cron-job.org'a kayıt olun
2. Yeni cron job oluşturun
3. URL: `https://your-app.netlify.app/api/sync-products`
4. Method: `POST`
5. Body: 
   ```json
   {
     "sourceStoreId": "xxx",
     "targetStoreId": "yyy",
     "syncAll": true
   }
   ```
6. Schedule: Her saat, her gün, vb.

## 🔑 Shopify İzinleri

### Gerekli İzinler

Ürün senkronizasyonu için Shopify App'inizde şu izinlere ihtiyacınız var:

**Okuma İzinleri:**
- ✅ `read_products`
- ✅ `read_inventory`
- ✅ `read_locations`

**Yazma İzinleri (Senkronizasyon için):**
- ✅ `write_products`
- ✅ `write_inventory`

### İzinleri Ekleme

1. Shopify Admin → **Settings** → **Apps and sales channels**
2. **Develop apps** → App'inizi seçin
3. **Configuration** → **Admin API integration**
4. **Edit** butonuna tıklayın
5. Yukarıdaki izinleri ekleyin
6. **Save** butonuna tıklayın
7. **Reinstall app** (yeni izinleri aktive etmek için)

⚠️ **Önemli**: App'i reinstall ettikten sonra yeni access token alacaksınız. Uygulamada mağaza bilgilerini güncellemeyi unutmayın!

## 🚨 Önemli Notlar

### Dikkat Edilmesi Gerekenler

1. **SKU Tutarlılığı**
   - SKU'lar benzersiz olmalı
   - Eşleştirme için SKU kullanılır
   - SKU yoksa her seferinde yeni ürün oluşturulur

2. **Görseller**
   - Görseller URL olarak kopyalanır
   - Shopify otomatik indirir
   - Büyük görseller için zaman alabilir

3. **Variants (Varyantlar)**
   - Tüm varyantlar kopyalanır
   - Option1, Option2, Option3 korunur
   - Her varyantın kendi SKU'su olmalı

4. **Stok Miktarı**
   - İlk location'a aktarılır
   - Birden fazla location varsa manuel ayarlama gerekebilir

5. **Fiyatlar**
   - Para birimi dönüşümü yapılmaz
   - Farklı currency kullanan mağazalar için dikkatli olun

6. **Rate Limiting**
   - Shopify API: 2 istek/saniye (free)
   - Çok ürün aktarırken yavaş olabilir
   - Timeout'u önlemek için küçük partiler halinde aktarın

## 📊 Örnek Kullanım Senaryoları

### Senaryo 1: Yeni E-ihracat Mağazası Açma

**Durum**: Türkiye mağazanız var, yeni UK mağazası açıyorsunuz

**Çözüm**:
1. UK mağazasını ekleyin
2. Ayarlardan tüm özellikleri seçin (Stok Miktarı hariç)
3. Tüm ürünleri UK mağazasına aktarın
4. UK mağazasında fiyatları GBP'ye manuel çevirin
5. Stokları lokasyon bazlı ayarlayın

### Senaryo 2: B2B ve B2C Mağazaları

**Durum**: Aynı ürünler, farklı fiyatlar

**Çözüm**:
1. Ayarlardan "Fiyat" seçeneğini kaldırın
2. Ürünleri aktarın (fiyatlar hariç)
3. Her mağazada fiyatları manuel ayarlayın
4. Sadece stok senkronizasyonu yapın (düzenli)

### Senaryo 3: Dropshipping

**Durum**: Tedarikçi mağazanızdan müşteri mağazalarınıza

**Çözüm**:
1. Webhook kurulumu yapın
2. Yeni ürün eklenince otomatik aktarılsın
3. Fiyatlara marj ekleyin (manuel veya script ile)
4. Stok güncellemelerini webhook ile senkronize edin

## 💡 Best Practices

1. **Test Edin**: İlk kez kullanırken az ürünle test edin
2. **Backup Alın**: Önemli işlemlerden önce Shopify export yapın
3. **SKU Kullanın**: Her ürüne benzersiz SKU verin
4. **Ayarları Dokümante Edin**: Hangi ayarlarla aktarım yaptığınızı not alın
5. **Monitör Edin**: Hataları takip edin ve düzeltin

## ❓ Sık Sorulan Sorular

**S: Aynı ürün tekrar aktarılırsa ne olur?**
C: SKU eşleşirse güncelleme yapılır, yeni ürün oluşturulmaz.

**S: Hedef mağazadaki ekstra bilgiler silinir mi?**
C: Hayır, sadece seçtiğiniz özellikler güncellenir.

**S: Koleksiyonlar da aktarılır mı?**
C: Şu anda hayır, sadece ürün özellikleri aktarılır.

**S: Kaç ürün aktarabilirim?**
C: Limit yok, ancak çok ürün için küçük partiler önerilir.

**S: Otomatik senkronizasyon ücretsiz mi?**
C: Webhook kurulumu ücretsiz, scheduled functions Netlify Pro gerektirir.

---

Daha fazla bilgi için [README.md](README.md) dosyasına bakabilirsiniz.


