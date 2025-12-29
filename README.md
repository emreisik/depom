# 🏪 Depom - Shopify Mağazalar Arası Stok Yönetimi

**Depom**, Shopify mağazalarınız arasında otomatik ürün ve stok senkronizasyonu sağlayan güçlü bir uygulamadır.

[![Netlify Status](https://api.netlify.com/api/v1/badges/your-badge-id/deploy-status)](https://app.netlify.com/sites/lighthearted-licorice-c736cb/deploys)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## ✨ Özellikler

### 🔄 Otomatik Senkronizasyon
- Tek tıkla tüm ürünleri senkronize edin
- Stok seviyelerini anlık güncelle
- Fiyat ve ürün bilgilerini eşitle

### 📦 Esnek Yönetim
- Birden fazla mağaza bağlantısı
- Özel koleksiyon eşleştirmeleri
- Seçici ürün aktarımı
- Vendor ve koleksiyon bazlı filtreleme

### 📊 Detaylı Raporlama
- Senkronizasyon geçmişi
- Başarı/hata logları
- Ürün bazında takip
- İstatistiksel özetler

### 🚀 Hızlı ve Güvenli
- AES-256 şifreleme
- SSL güvenli bağlantı
- Shopify Best Practices
- GDPR uyumlu

---

## 🛠️ Teknoloji Stack

### Frontend
- **React 18** - Modern UI framework
- **React Router v6** - Routing
- **Axios** - HTTP client
- **Vite** - Build tool

### Backend
- **Netlify Functions** - Serverless
- **Node.js** - Runtime
- **PostgreSQL (Neon)** - Database
- **Shopify Admin API 2024-01** - Integration

### Security
- **AES-256** - Token encryption
- **SSL/TLS** - Secure communication
- **HMAC** - Webhook verification

---

## 🚀 Kurulum

### 1. Repository'yi Clone'la

```bash
git clone https://github.com/emreisik/depom.git
cd depom
```

### 2. Dependencies Yükle

```bash
# Root dependencies
npm install

# Netlify Functions dependencies
cd netlify/functions
npm install
cd ../..
```

### 3. Environment Variables

`ENV-TEMPLATE.md` dosyasına bakın ve gerekli değişkenleri ayarlayın:

```bash
# .env dosyası oluştur
cp ENV-TEMPLATE.md .env
# Sonra .env dosyasını düzenle
```

Gerekli değişkenler:
- `SHOPIFY_API_KEY` - Partner Dashboard'dan
- `SHOPIFY_API_SECRET` - Partner Dashboard'dan
- `DATABASE_URL` - Neon PostgreSQL
- `ENCRYPTION_KEY` - 32+ karakter random
- `JWT_SECRET` - Session güvenliği için

### 4. Lokal Çalıştır

```bash
netlify dev
```

Tarayıcıda: http://localhost:8888

---

## 📱 Shopify App Store'a Yayınlama

Detaylı adımlar için `SHOPIFY-APP-STORE.md` dosyasına bakın.

### Hızlı Özet:

1. **Shopify Partner hesabı oluştur**
   👉 https://partners.shopify.com

2. **Public App oluştur**
   - App URL: `https://your-domain.app/install`
   - OAuth Redirect: `https://your-domain.app/api/auth-callback`

3. **Environment Variables ekle**
   ```bash
   netlify env:set SHOPIFY_API_KEY "your_key"
   netlify env:set SHOPIFY_API_SECRET "your_secret"
   # ... diğer değişkenler
   ```

4. **GDPR Webhooks yapılandır**
   - `customers/data_request`
   - `customers/redact`
   - `shop/redact`

5. **App listing oluştur**
   - İkon, screenshots, description
   - Privacy Policy & Terms
   - Pricing

6. **Test et ve gönder!**

---

## 🏗️ Proje Yapısı

```
depom/
├── src/                      # Frontend
│   ├── components/          # React components
│   ├── pages/               # Route pages
│   │   ├── Install.jsx      # App installation
│   │   ├── PrivacyPolicy.jsx
│   │   ├── TermsOfService.jsx
│   │   └── ...
│   ├── utils/               # Utilities
│   └── App.jsx              # Main app
├── netlify/
│   └── functions/           # Serverless functions
│       ├── auth-callback.js # OAuth handler
│       ├── install.js       # Installation
│       ├── gdpr-webhooks.js # GDPR compliance
│       ├── stores.js        # Store management
│       ├── sync-full.js     # Full sync
│       ├── sync-inventory-only.js
│       └── utils/           # Helpers
│           ├── db.js        # Database
│           ├── shopify.js   # Shopify API
│           ├── crypto.js    # Encryption
│           └── cors.js      # CORS handling
├── netlify.toml             # Netlify config
├── package.json
├── SHOPIFY-APP-STORE.md     # App Store guide
├── ENV-TEMPLATE.md          # Environment variables
└── README.md                # This file
```

---

## 🔐 Güvenlik

### API Token Şifreleme
Tüm Shopify API token'ları AES-256 ile şifrelenir:

```javascript
const encryptedToken = encryptToken(accessToken);
// Stored encrypted, decrypted only when needed
```

### HMAC Doğrulama
Tüm Shopify webhook'ları HMAC signature ile doğrulanır:

```javascript
const isValid = verifyWebhook(body, hmac);
```

### SQL Injection Koruması
Prepared statements kullanılır:

```javascript
await pool.query('SELECT * FROM stores WHERE id = $1', [storeId]);
```

---

## 📊 Database Schema

### Tablolar:
- `stores` - Mağaza bilgileri
- `integrations` - Mağaza eşleştirmeleri
- `sync_logs` - Senkronizasyon logları
- `product_mappings` - Ürün eşleştirmeleri
- `collection_mappings` - Koleksiyon eşleştirmeleri
- `sync_settings` - Senkronizasyon ayarları

Detaylar için: `netlify/functions/utils/db.js`

---

## 🧪 Test

### Development Store Oluştur
Partner Dashboard → Development stores → Create store

### Test Scenarios
- [ ] OAuth akışı
- [ ] Mağaza bağlantısı
- [ ] Ürün senkronizasyonu
- [ ] Stok güncelleme
- [ ] Koleksiyon eşleştirme
- [ ] GDPR webhooks
- [ ] App uninstall

---

## 🚀 Deployment

### Netlify ile (Önerilen)

```bash
# İlk deploy
netlify init
netlify deploy --prod

# Güncellemeler
git push  # Otomatik deploy (GitHub bağlandıysa)
# veya
netlify deploy --prod
```

### Environment Variables (Production)
Netlify Dashboard → Site → Environment variables

Tüm değişkenleri `ENV-TEMPLATE.md`'den ekle.

---

## 📝 API Endpoints

### Public
- `GET /api/install` - App installation
- `GET /api/auth-callback` - OAuth callback
- `POST /api/gdpr-webhooks` - GDPR compliance

### Protected (Authorization required)
- `GET /api/stores` - List stores
- `POST /api/stores` - Add store
- `DELETE /api/stores` - Remove store
- `GET /api/integrations` - List integrations
- `POST /api/sync-full` - Full synchronization
- `POST /api/sync-inventory-only` - Inventory only
- `GET /api/sync-logs` - Sync history

---

## 🤝 Contributing

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👤 Author

**Emre IŞIK**

- Email: emreisik20@gmail.com
- GitHub: [@emreisik](https://github.com/emreisik)

---

## 🙏 Acknowledgments

- [Shopify](https://shopify.dev/) - API documentation
- [Netlify](https://netlify.com/) - Hosting platform
- [Neon](https://neon.tech/) - PostgreSQL database

---

## 📚 Documentation

- [Shopify App Store Guide](SHOPIFY-APP-STORE.md)
- [Environment Variables](ENV-TEMPLATE.md)
- [Database Setup](NEON-SETUP.md)
- [Sync Guide](SYNC-GUIDE.md)

---

## 🆘 Support

Sorularınız mı var? Yardıma mı ihtiyacınız var?

- 📧 Email: emreisik20@gmail.com
- 🐛 Issues: [GitHub Issues](https://github.com/emreisik/depom/issues)
- 📖 Docs: [Documentation](SHOPIFY-APP-STORE.md)

---

**⭐ Projeyi beğendiyseniz yıldız vermeyi unutmayın!**

Made with ❤️ for Shopify merchants
