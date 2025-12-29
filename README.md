# 📦 Stok Kontrol - Shopify Mağaza Yönetimi

Shopify mağazalar arası stok kontrolü ve yönetimi için geliştirilmiş modern web uygulaması.

## ✨ Özellikler

- 🏪 **Çoklu Mağaza Desteği**: Birden fazla Shopify mağazasını tek bir panelden yönetin
- 📊 **Gerçek Zamanlı Stok Takibi**: Tüm mağazalarınızın stok seviyelerini anlık görüntüleyin
- ⚠️ **Akıllı Uyarılar**: Düşük stok ve tükenen ürünler için otomatik bildiriler
- 📈 **Detaylı İstatistikler**: Toplam ürün, stok seviyeleri ve lokasyon bazlı analiz
- 🔄 **Ürün Senkronizasyonu**: Mağazalar arası ürün ve özellik aktarımı
- ⚙️ **Esnek Ayarlar**: Hangi özelliklerin senkronize edileceğini seçebilme
- 🔒 **Güvenli**: API token'ları şifrelenmiş olarak saklanır
- 🚀 **Netlify Hosting**: Ücretsiz ve hızlı hosting ile çalışır
- 💻 **Modern UI**: Responsive ve kullanıcı dostu arayüz

## 🛠️ Teknoloji Stack

### Frontend
- React 18
- React Router v6
- Axios
- Vite (Build tool)
- Modern CSS

### Backend
- Netlify Functions (Serverless)
- Node.js
- MongoDB (Database)
- Shopify Admin API 2024-01

## 📋 Gereksinimler

- Node.js 18+ 
- MongoDB Atlas hesabı (ücretsiz)
- Shopify mağaza(lar) ve Admin API access token
- Netlify hesabı (ücretsiz)

## 🚀 Kurulum

### 1. Projeyi Klonlayın

```bash
git clone https://github.com/username/stok-kontrol.git
cd stok-kontrol
```

### 2. Bağımlılıkları Yükleyin

```bash
# Root dependencies
npm install

# Netlify functions dependencies
cd netlify/functions
npm install
cd ../..
```

### 3. Environment Variables Ayarlayın

`.env.example` dosyasını `.env` olarak kopyalayın ve düzenleyin:

```bash
cp .env.example .env
```

`.env` dosyasını düzenleyin:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/stok-kontrol
ENCRYPTION_KEY=your-64-character-hex-encryption-key
JWT_SECRET=your-jwt-secret-key
```

**Encryption Key Oluşturma:**

```bash
# Mac/Linux
openssl rand -hex 32

# Windows (Node.js ile)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4. MongoDB Atlas Kurulumu

1. [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) hesabı oluşturun
2. Ücretsiz cluster oluşturun
3. Database user oluşturun
4. Network Access'te IP adresinizi ekleyin (veya 0.0.0.0/0 - herkese açık)
5. Connection string'i alın ve `.env` dosyasına ekleyin

### 5. Yerel Geliştirme

```bash
# Netlify Dev ile çalıştırın (önerilen)
npm install -g netlify-cli
netlify dev

# Veya sadece frontend
npm run dev
```

Uygulama http://localhost:8888 adresinde çalışacak.

## 🌐 Netlify'a Deploy

### Yöntem 1: GitHub ile Otomatik Deploy

1. GitHub'da repo oluşturun ve push edin
2. [Netlify Dashboard](https://app.netlify.com)'a gidin
3. "Add new site" → "Import an existing project"
4. GitHub repo'nuzu seçin
5. Build settings otomatik gelecek (netlify.toml sayesinde)
6. Environment variables ekleyin:
   - `MONGODB_URI`
   - `ENCRYPTION_KEY`
   - `JWT_SECRET`
7. Deploy butonuna tıklayın!

### Yöntem 2: Netlify CLI ile Manuel Deploy

```bash
# Login
netlify login

# Init
netlify init

# Deploy
netlify deploy --prod
```

## 🔑 Shopify Kurulumu

Her mağaza için Admin API access token almanız gerekiyor:

### Adımlar:

1. Shopify Admin paneline giriş yapın
2. **Settings → Apps and sales channels** menüsüne gidin
3. **"Develop apps"** sekmesine tıklayın
4. **"Create an app"** ile yeni app oluşturun (örn: "Stok Kontrol API")
5. **Configuration → Admin API integration** bölümüne gidin
6. Aşağıdaki izinleri ekleyin:
   - ✅ `read_products`
   - ✅ `read_inventory`
   - ✅ `read_locations`
   - ✅ `write_products` (ürün senkronizasyonu için)
   - ✅ `write_inventory` (stok senkronizasyonu için)
7. **"Install app"** butonuna tıklayın
8. **Admin API access token**'ı kopyalayın
9. Uygulamada "Mağaza Ekle" bölümünde bu token'ı kullanın

## 📱 Kullanım

### 1. Mağaza Ekleme

- "Mağazalar" sayfasına gidin
- "Yeni Mağaza Ekle" butonuna tıklayın
- Shop domain ve access token'ı girin
- "Bağlantıyı Test Et" ile doğrulayın
- "Mağazayı Ekle" ile kaydedin

### 2. Dashboard

Dashboard'da tüm mağazalarınızın:
- Toplam ürün sayısı
- Stok seviyeleri
- Düşük stok uyarıları
- Lokasyon bazlı detaylar

görüntülenir.

### 3. Stok Kontrolü

Her mağaza kartında:
- Ürün listesi
- SKU bilgileri
- Fiyatlar
- Stok miktarları
- Durum badge'leri (Normal/Düşük/Tükendi)

### 4. Ürün Senkronizasyonu

**Ayarlar Sayfası:**
- Hangi ürün özelliklerinin aktarılacağını seçin
- Başlık, açıklama, fiyat, stok, görseller, vb.
- Ayarlarınızı kaydedin

**Ürün Aktar Sayfası:**
- Kaynak ve hedef mağazayı seçin
- Aktarılacak ürünleri seçin veya tümünü işaretleyin
- "Ürünü Aktar" butonuna tıklayın
- Senkronizasyon sonuçlarını görün

Detaylı kullanım için: [SYNC-GUIDE.md](SYNC-GUIDE.md)

## 🔒 Güvenlik

- ✅ API token'ları AES-256-CBC ile şifrelenir
- ✅ Sadece HTTPS üzerinden çalışır (Netlify otomatik SSL)
- ✅ CORS koruması
- ✅ Rate limiting (Shopify tarafında)
- ✅ Environment variables güvenli saklanır

## 🎨 Özelleştirme

### Renkler

`src/index.css` dosyasındaki CSS değişkenlerini düzenleyin:

```css
:root {
  --primary-color: #5c6ac4;
  --success-color: #00a650;
  --warning-color: #ffb800;
  --danger-color: #ed6347;
}
```

### Düşük Stok Eşiği

`src/pages/Dashboard.jsx` dosyasında değiştirilebilir (şu an 10):

```javascript
product.inventory < 10 ? 'low-stock' : ''
```

## 📊 API Endpoints

### POST `/api/test-connection`
Shopify bağlantısını test eder

**Body:**
```json
{
  "shopDomain": "mystore.myshopify.com",
  "accessToken": "shpat_xxx"
}
```

### GET `/api/stores`
Kullanıcının tüm mağazalarını listeler

### POST `/api/stores`
Yeni mağaza ekler

### DELETE `/api/stores?id={storeId}`
Mağazayı siler (soft delete)

### GET `/api/stocks`
Tüm mağazaların stok bilgilerini getirir

### GET `/api/stocks?storeId={id}`
Belirli bir mağazanın stok bilgilerini getirir

### GET `/api/settings`
Kullanıcının senkronizasyon ayarlarını getirir

### PUT `/api/settings`
Senkronizasyon ayarlarını günceller

### POST `/api/sync-products`
Mağazalar arası ürün senkronizasyonu yapar

**Body:**
```json
{
  "sourceStoreId": "store-id-1",
  "targetStoreId": "store-id-2",
  "productIds": ["product-1", "product-2"],
  "syncAll": false
}
```

## 🐛 Sorun Giderme

### "Bağlantı başarısız" hatası

- Shop domain'in doğru olduğundan emin olun (.myshopify.com dahil)
- Access token'ın geçerli olduğunu kontrol edin
- Shopify app'inizin gerekli izinlere sahip olduğunu doğrulayın

### "MongoDB bağlantı hatası"

- MongoDB URI'nin doğru olduğunu kontrol edin
- IP whitelist'te Netlify IP'lerinin ekli olduğundan emin olun (veya 0.0.0.0/0)
- Database user'ın doğru şifreye sahip olduğunu doğrulayın

### Netlify Functions timeout

- Free plan'de 10 saniye limit var
- Çok fazla mağaza varsa Pro plan'e geçmeyi düşünün
- Veya mağazaları sırayla senkronize edin

## 💰 Maliyet

**Tamamen ücretsiz başlayabilirsiniz:**

- ✅ Netlify Free Tier: 100 GB bandwidth, 300 build dakikası
- ✅ MongoDB Atlas Free Tier: 512 MB storage
- ✅ Shopify API: Ücretsiz (rate limit: 2 req/saniye)

## 🤝 Katkıda Bulunma

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing`)
3. Commit edin (`git commit -m 'Add amazing feature'`)
4. Push edin (`git push origin feature/amazing`)
5. Pull Request açın

## 📝 Lisans

MIT License - Detaylar için [LICENSE](LICENSE) dosyasına bakın.

## 📧 İletişim

Sorularınız için issue açabilirsiniz.

## 🙏 Teşekkürler

- [Shopify Admin API](https://shopify.dev/docs/api/admin)
- [Netlify](https://www.netlify.com/)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- [React](https://react.dev/)
- [Vite](https://vitejs.dev/)

---

**Not:** Bu uygulama Shopify App Store'da yayınlanmış resmi bir app değildir. Kendi sunucunuzda barındırdığınız private bir araçtır.

