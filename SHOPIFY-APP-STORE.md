# 🏪 Shopify App Store Yayın Kılavuzu

Bu dokümantasyon, Depom'u Shopify App Store'a yayınlamak için gereken tüm adımları içerir.

---

## 📋 ÖN GEREKSINIMLER

### 1. Shopify Partner Hesabı
👉 https://partners.shopify.com/signup

- Ücretsiz hesap oluştur
- Partner Dashboard'a erişim

### 2. Domain (Önerilen)
- `depom.app` gibi özel bir domain
- SSL sertifikası (Netlify otomatik sağlar)

### 3. Environment Variables
Aşağıdaki değişkenler Netlify'de tanımlı olmalı:

```bash
# Shopify API Credentials
SHOPIFY_API_KEY=your_api_key_here
SHOPIFY_API_SECRET=your_api_secret_here
SHOPIFY_SCOPES=read_products,write_products,read_inventory,write_inventory

# App URLs
APP_URL=https://depom.app (veya Netlify URL'in)

# Database
DATABASE_URL=postgresql://...
ENCRYPTION_KEY=your_encryption_key
JWT_SECRET=your_jwt_secret
```

---

## 🚀 ADIM 1: SHOPIFY PARTNER APP OLUŞTURMA

### 1.1. Partner Dashboard'a Git
👉 https://partners.shopify.com/

### 1.2. Yeni App Oluştur
1. **Apps** menüsüne tıkla
2. **Create app** → **Public app** seç
3. App bilgilerini doldur:

```
App name: Depom
App URL: https://depom.app/install
```

### 1.3. App Credentials Al
- **API key** ve **API secret key** kopyala
- Netlify environment variables'a ekle

### 1.4. App Setup Yapılandırması

#### **App URL:**
```
https://depom.app/install
```

#### **Allowed redirection URL(s):**
```
https://depom.app/api/auth-callback
https://depom.app
```

#### **App proxy** (Opsiyonel):
```
Subpath prefix: apps
Subpath: depom
Proxy URL: https://depom.app/api
```

---

## 🔐 ADIM 2: APP SCOPES (İzinler)

Depom'un ihtiyaç duyduğu izinler:

```
✅ read_products
✅ write_products
✅ read_inventory
✅ write_inventory
✅ read_locations (Otomatik dahil)
```

**Nasıl Eklenir:**
1. Partner Dashboard → App → **API credentials**
2. **Configure** → **Protected customer data access**
3. Yukarıdaki scope'ları seç

---

## 📱 ADIM 3: APP LISTING (Mağaza Listeleme)

### 3.1. App Listing Oluştur
Partner Dashboard → App → **App listing**

### 3.2. Gerekli Bilgiler

#### **App name:**
```
Depom - Mağazalar Arası Stok Yönetimi
```

#### **App subtitle:**
```
Shopify mağazalarınız arasında otomatik ürün ve stok senkronizasyonu
```

#### **App description:**
```markdown
# Depom ile Çoklu Mağaza Yönetimini Kolaylaştırın!

Birden fazla Shopify mağazanız mı var? Depom ile tüm mağazalarınızdaki ürün ve stok bilgilerini otomatik olarak senkronize edin.

## ✨ Özellikler:

🔄 **Otomatik Senkronizasyon**
- Tek tıkla tüm ürünleri senkronize edin
- Stok seviyelerini anlık güncelle
- Fiyat ve ürün bilgilerini eşitle

📦 **Esnek Yönetim**
- Birden fazla mağaza bağlantısı
- Özel koleksiyon eşleştirmeleri
- Seçici ürün aktarımı

📊 **Detaylı Raporlama**
- Senkronizasyon geçmişi
- Başarı/hata logları
- Ürün bazında takip

🚀 **Hızlı ve Güvenli**
- AES-256 şifreleme
- SSL güvenli bağlantı
- Shopify Best Practices

## 💎 Kimler İçin?

- Çoklu mağaza sahipleri
- Toptan ve perakende satıcılar
- Franchise işletmeler
- E-ticaret ajansları

## 🎯 Nasıl Çalışır?

1. Depom'u mağazanıza yükleyin
2. Senkronize etmek istediğiniz diğer mağazaları bağlayın
3. Entegrasyonları yapılandırın
4. Senkronizasyonu başlatın!

## 🆓 Fiyatlandırma

Şu anda ÜCRETSIZ!
```

#### **App category:**
```
Store management
```

#### **Pricing:**
```
Free
```

### 3.3. App İkon ve Ekran Görüntüleri

#### **App icon** (512x512 px):
- Logo oluştur (Canva veya Figma)
- PNG format, şeffaf background

#### **Screenshots** (minimum 3, maksimum 5):
1. **Dashboard** - Ana sayfa görünümü
2. **Mağaza Bağlantısı** - Store connection sayfası
3. **Senkronizasyon** - Sync işlemi
4. **Entegrasyonlar** - Integration list
5. **Ayarlar** - Settings page

Çözünürlük: **1280x800 px** (desktop) veya **750x1334 px** (mobile)

---

## 📄 ADIM 4: LEGAL PAGES (Yasal Sayfalar)

### 4.1. Privacy Policy URL:
```
https://depom.app/privacy-policy
```

### 4.2. Terms of Service URL (Opsiyonel):
```
https://depom.app/terms-of-service
```

### 4.3. Support Email:
```
emreisik20@gmail.com
```

### 4.4. Support URL (Opsiyonel):
```
https://depom.app
```

---

## 🔔 ADIM 5: WEBHOOKS YAPFLANDIRMASI

### 5.1. GDPR Webhooks (ZORUNLU)

Partner Dashboard → App → **Webhooks**

```
📌 customers/data_request
URL: https://depom.app/api/gdpr-webhooks
Format: JSON
Version: 2024-01

📌 customers/redact
URL: https://depom.app/api/gdpr-webhooks
Format: JSON
Version: 2024-01

📌 shop/redact
URL: https://depom.app/api/gdpr-webhooks
Format: JSON
Version: 2024-01
```

### 5.2. App Lifecycle Webhooks (Opsiyonel)

```
📌 app/uninstalled
URL: https://depom.app/api/webhooks/uninstall
```

---

## ✅ ADIM 6: APP TEST EDİN

### 6.1. Development Store Oluştur
Partner Dashboard → **Development stores** → **Create store**

### 6.2. App'i Development Store'a Yükle
```
https://depom.app/install?shop=your-dev-store.myshopify.com
```

### 6.3. Test Checklist

- [ ] OAuth flow çalışıyor
- [ ] Store başarıyla bağlanıyor
- [ ] Ürün senkronizasyonu çalışıyor
- [ ] Stok güncellemesi çalışıyor
- [ ] GDPR webhooks yanıt veriyor
- [ ] Privacy Policy sayfası açılıyor
- [ ] App uninstall çalışıyor

---

## 🚀 ADIM 7: APP YAYINLAMA

### 7.1. App Review Gönder
Partner Dashboard → App → **Distribution** → **Submit for review**

### 7.2. Review Checklist (Shopify)

#### **Teknik:**
- [x] OAuth 2.0 implemented
- [x] GDPR webhooks active
- [x] SSL certificate
- [x] Error handling
- [x] Rate limiting

#### **UX:**
- [x] Clear onboarding
- [x] Intuitive interface
- [x] Mobile responsive
- [x] Help documentation
- [x] Error messages

#### **Legal:**
- [x] Privacy policy
- [x] Terms of service
- [x] Support contact
- [x] GDPR compliant

### 7.3. Approval Süresi
- Ortalama 1-2 hafta
- Shopify geri bildirimleri takip et
- Düzeltmeler yapılırsa tekrar gönder

---

## 📊 ADIM 8: YAYINDAN SONRA

### 8.1. Analytics Takibi
- Google Analytics ekle
- Kullanıcı davranışlarını izle
- Conversion rate takibi

### 8.2. Müşteri Desteği
- Email: emreisik20@gmail.com
- Response time: < 24 hours
- Bug raporları takibi

### 8.3. Güncelleme ve Bakım
- Düzenli güvenlik güncellemeleri
- Shopify API version güncellemeleri
- Feature requests takibi

---

## 🆘 SORUN GİDERME

### OAuth Hatası
```
Error: redirect_uri mismatch
```
**Çözüm:** Partner Dashboard'da Allowed redirection URL'leri kontrol et

### GDPR Webhook Hatası
```
Error: 401 Unauthorized
```
**Çözüm:** HMAC signature doğrulamasını kontrol et

### Rate Limit
```
Error: 429 Too Many Requests
```
**Çözüm:** `delay()` fonksiyonunu kontrol et, 500ms olmalı

---

## 📚 KAYNAKLAR

- **Shopify Partner Docs:** https://shopify.dev/docs/apps
- **App Store Requirements:** https://shopify.dev/docs/apps/store/requirements
- **OAuth Guide:** https://shopify.dev/docs/apps/auth/oauth
- **GDPR Webhooks:** https://shopify.dev/docs/apps/webhooks/configuration/mandatory-webhooks

---

## ✉️ İLETİŞİM

Sorularınız için:
- Email: emreisik20@gmail.com
- GitHub: https://github.com/emreisik/depom

---

**🎉 BAŞARILAR!** Depom'u Shopify App Store'da görmek için sabırsızlanıyoruz!

