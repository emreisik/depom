# ⚡ Hızlı Başlangıç Rehberi

Bu rehber, projeyi 5 dakikada çalıştırmanızı sağlar.

## 🎯 Adım 1: Bağımlılıkları Yükleyin

```bash
cd stok-kontrol

# Root dependencies
npm install

# Functions dependencies
cd netlify/functions
npm install
cd ../..
```

## 🔑 Adım 2: Environment Variables

`.env` dosyası oluşturun:

```bash
cp .env.example .env
```

`.env` dosyasını düzenleyin:

```env
# MongoDB Atlas connection string
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/stok-kontrol

# 64-character hex key (generate with: openssl rand -hex 32)
ENCRYPTION_KEY=your-64-char-hex-key-here

# JWT secret
JWT_SECRET=your-jwt-secret-here
```

**Hızlı Key Oluşturma:**

```bash
# Mac/Linux
openssl rand -hex 32

# Windows
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 🗄️ Adım 3: MongoDB Atlas (2 dakika)

1. [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) → Sign up (ücretsiz)
2. **Create Free Cluster** → **Frankfurt** → Create
3. **Database Access** → Add User → Username/Password belirle
4. **Network Access** → Add IP → **Allow from Anywhere** (0.0.0.0/0)
5. **Database** → Connect → **Connect your application** → Copy connection string
6. Connection string'i `.env` dosyasına yapıştır

## 🚀 Adım 4: Uygulamayı Çalıştırın

```bash
# Netlify Dev (önerilen - functions da çalışır)
npm install -g netlify-cli
netlify dev

# Veya sadece frontend
npm run dev
```

Tarayıcıda aç: http://localhost:8888 (veya 5173)

## 🏪 Adım 5: İlk Mağazanızı Ekleyin

### Shopify'da:

1. Admin panel → **Settings** → **Apps and sales channels**
2. **Develop apps** → **Create an app** (isim: "Stok Kontrol")
3. **Configuration** → **Admin API integration** → Configure
4. İzinleri seç:
   - ✅ read_products
   - ✅ read_inventory  
   - ✅ read_locations
5. **Install app** → Copy **Admin API access token**

### Uygulamada:

1. **Mağazalar** → **Yeni Mağaza Ekle**
2. Shop domain: `yourstore.myshopify.com`
3. Access token: yapıştır
4. **Bağlantıyı Test Et** → ✅ Başarılı
5. **Mağazayı Ekle**
6. **Dashboard**'a git ve stoklarınızı görün! 🎉

## 🌐 Deploy (Opsiyonel)

```bash
# GitHub'a push et
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/username/stok-kontrol.git
git push -u origin main

# Netlify'a deploy
netlify login
netlify init
netlify env:set MONGODB_URI "your-mongo-uri"
netlify env:set ENCRYPTION_KEY "your-encryption-key"
netlify env:set JWT_SECRET "your-jwt-secret"
netlify deploy --prod
```

## ❓ Sorun mu Yaşıyorsunuz?

### "Cannot connect to MongoDB"
- MongoDB Atlas'ta Network Access'te 0.0.0.0/0 var mı?
- Connection string'de username/password doğru mu?

### "Shopify API Error"
- Shop domain `.myshopify.com` ile bitiyor mu?
- Access token doğru kopyalandı mı?
- App'te gerekli izinler verildi mi?

### "Port already in use"
```bash
# Portu değiştir
PORT=3000 npm run dev
```

## 📚 Daha Fazla Bilgi

- [README.md](README.md) - Detaylı dokümantasyon
- [DEPLOYMENT.md](DEPLOYMENT.md) - Netlify deployment rehberi

---

🎉 **Hoş geldiniz!** Artık stok kontrolünüz tek yerden yönetiliyor!


