# 🚀 Netlify Deployment Rehberi

Bu rehber, Stok Kontrol uygulamasını Netlify'a deploy etmek için adım adım talimatlar içerir.

## 📋 Ön Hazırlık

### 1. MongoDB Atlas Kurulumu

1. [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)'a ücretsiz kayıt olun
2. **Create a New Cluster** butonuna tıklayın
3. **FREE Shared Cluster** seçeneğini seçin
4. Region olarak size en yakın bölgeyi seçin (örn: Frankfurt)
5. **Create Cluster** butonuna tıklayın

**Database User Oluşturma:**

1. Sol menüden **Database Access** seçin
2. **Add New Database User** butonuna tıklayın
3. Authentication Method: **Password**
4. Username ve şifre belirleyin (not alın!)
5. Database User Privileges: **Read and write to any database**
6. **Add User** butonuna tıklayın

**Network Access Ayarları:**

1. Sol menüden **Network Access** seçin
2. **Add IP Address** butonuna tıklayın
3. **Allow Access from Anywhere** seçin (0.0.0.0/0)
   - ⚠️ Güvenlik için production'da daha spesifik IP'ler ekleyebilirsiniz
4. **Confirm** butonuna tıklayın

**Connection String Alma:**

1. Sol menüden **Database** seçin
2. Cluster'ınızda **Connect** butonuna tıklayın
3. **Connect your application** seçin
4. Driver: **Node.js**, Version: **4.1 or later**
5. Connection string'i kopyalayın:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. `<username>` ve `<password>` kısımlarını gerçek değerlerle değiştirin
7. Son kısmı şu şekilde düzenleyin:
   ```
   mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/stok-kontrol?retryWrites=true&w=majority
   ```

### 2. Encryption Key Oluşturma

Terminal'de aşağıdaki komutu çalıştırın:

**Mac/Linux:**
```bash
openssl rand -hex 32
```

**Windows (Node.js yüklüyse):**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Çıktıyı not alın (64 karakterli hex string):
```
a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2
```

### 3. JWT Secret Oluşturma

Aynı şekilde:
```bash
openssl rand -hex 32
```

## 🌐 Netlify'a Deploy

### Yöntem 1: GitHub ile Otomatik Deploy (Önerilen)

#### Adım 1: GitHub Repository Oluşturma

1. [GitHub](https://github.com/new)'da yeni repo oluşturun
2. Repo adı: `stok-kontrol` (veya istediğiniz isim)
3. **Public** veya **Private** seçin
4. **Create repository** butonuna tıklayın

#### Adım 2: Kodu GitHub'a Push Edin

Terminal'de:

```bash
cd /Users/emre/stok-kontrol

# Git init (eğer henüz yapılmadıysa)
git init

# Tüm dosyaları ekle
git add .

# İlk commit
git commit -m "Initial commit: Shopify stok kontrol uygulaması"

# Remote ekle (GitHub'daki repo URL'inizi buraya yazın)
git remote add origin https://github.com/kullaniciadi/stok-kontrol.git

# Main branch'e push et
git branch -M main
git push -u origin main
```

#### Adım 3: Netlify'da Site Oluşturma

1. [Netlify](https://app.netlify.com/)'a giriş yapın (GitHub hesabınızla)
2. **Add new site** butonuna tıklayın
3. **Import an existing project** seçin
4. **GitHub** butonuna tıklayın
5. Authorize edin
6. `stok-kontrol` repo'nuzu seçin

**Build Settings:**
- Build command: `npm run build`
- Publish directory: `dist`
- Functions directory: `netlify/functions`

(Bu ayarlar `netlify.toml` dosyasından otomatik gelecek)

#### Adım 4: Environment Variables Ekleme

**Site Settings → Environment variables** bölümüne gidin:

1. **Add a variable** butonuna tıklayın
2. Şu değişkenleri tek tek ekleyin:

```
Key: MONGODB_URI
Value: mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/stok-kontrol?retryWrites=true&w=majority

Key: ENCRYPTION_KEY
Value: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2

Key: JWT_SECRET
Value: x1y2z3a4b5c6d7e8f9g0h1i2j3k4l5m6n7o8p9q0r1s2t3u4v5w6x7y8z9a0b1c2
```

⚠️ **Önemli:** Her değişkeni ekledikten sonra **Save** butonuna basın!

#### Adım 5: Deploy Etme

1. **Deploys** sekmesine gidin
2. **Trigger deploy → Deploy site** butonuna tıklayın
3. Build loglarını takip edin (2-3 dakika sürer)
4. Deploy tamamlandığında siteniz hazır! 🎉

Site URL'iniz: `https://your-site-name.netlify.app`

### Yöntem 2: Netlify CLI ile Manuel Deploy

#### Adım 1: Netlify CLI Kurulumu

```bash
npm install -g netlify-cli
```

#### Adım 2: Login

```bash
netlify login
```

Browser açılacak, authorize edin.

#### Adım 3: Site Oluşturma

```bash
cd /Users/emre/stok-kontrol
netlify init
```

Sorulara cevaplar:
- **Create & configure a new site**
- **Team:** Personal
- **Site name:** stok-kontrol (veya istediğiniz isim)
- **Build command:** `npm run build`
- **Directory to deploy:** `dist`
- **Netlify Functions folder:** `netlify/functions`

#### Adım 4: Environment Variables (CLI ile)

```bash
netlify env:set MONGODB_URI "mongodb+srv://..."
netlify env:set ENCRYPTION_KEY "a1b2c3d4e5f6..."
netlify env:set JWT_SECRET "x1y2z3a4b5c6..."
```

#### Adım 5: Deploy

```bash
# Production deploy
netlify deploy --prod
```

Build bitince site URL'i gösterilecek!

## ✅ Deploy Sonrası Kontroller

### 1. Site Çalışıyor mu?

Site URL'ini açın. Ana sayfa yüklenmeli.

### 2. API Çalışıyor mu?

Browser console'da:
```javascript
fetch('https://your-site.netlify.app/api/stores')
  .then(r => r.json())
  .then(console.log)
```

`{"success":true,"data":[]}` benzeri bir response gelmeli.

### 3. Mağaza Ekleme Testi

1. **Mağazalar → Yeni Mağaza Ekle** sayfasına gidin
2. Shopify credentials girin
3. **Bağlantıyı Test Et** butonuna tıklayın
4. Başarılı olmalı ✅

### 4. Dashboard Testi

1. Mağaza ekledikten sonra Dashboard'a gidin
2. Stoklar görünmeli

## 🔧 Sorun Giderme

### Build Hatası

**Hata:** `npm ERR! missing script: build`

**Çözüm:** `package.json` dosyasında `"build": "vite build"` script'inin olduğundan emin olun.

---

**Hata:** Functions build failed

**Çözüm:** 
```bash
cd netlify/functions
npm install
git add package.json package-lock.json
git commit -m "Add functions dependencies"
git push
```

### Environment Variables Hatası

**Hata:** `ENCRYPTION_KEY must be 64 hex characters`

**Çözüm:** 
- Netlify Dashboard → Site Settings → Environment variables
- `ENCRYPTION_KEY` değerinin tam 64 karakter (32 byte hex) olduğundan emin olun
- Redeploy edin: **Deploys → Trigger deploy → Clear cache and deploy site**

### MongoDB Bağlantı Hatası

**Hata:** `MongoNetworkError: connection refused`

**Çözüm:**
1. MongoDB Atlas → Network Access → 0.0.0.0/0 ekli mi kontrol edin
2. Connection string'de username/password doğru mu?
3. Database adı ekli mi? (`.../stok-kontrol?retryWrites=...`)

### Functions Timeout

**Hata:** `Function exceeded 10 second timeout`

**Çözüm:**
- Free plan'de 10 saniye limit var
- Çok mağaza varsa senkronizasyonu parçalara ayırın
- Veya Netlify Pro plan'e geçin (26 saniye timeout)

## 🔄 Güncellemeler

Kod değişikliği yaptığınızda:

```bash
git add .
git commit -m "Update: açıklama"
git push
```

Netlify otomatik olarak yeni deploy başlatacak!

## 🎯 Custom Domain Ekleme

1. Netlify Dashboard → **Domain settings**
2. **Add custom domain** butonuna tıklayın
3. Domain adınızı girin (örn: `stokkontrol.com`)
4. DNS ayarlarını yapın (Netlify talimatları verecek)
5. SSL otomatik aktif olacak (Let's Encrypt)

## 📊 Monitoring

Netlify Dashboard'da:
- **Analytics:** Ziyaretçi istatistikleri
- **Functions:** API çağrı sayıları, hatalar
- **Deploys:** Build history, logs

## 💡 İpuçları

- ✅ Her push otomatik deploy tetikler
- ✅ Branch previews için PR açın
- ✅ Environment variables değişince redeploy gerekir
- ✅ Functions cold start olabilir (ilk çağrıda 1-2 sn gecikme)

---

🎉 **Tebrikler!** Uygulamanız artık canlı!

Herhangi bir sorun yaşarsanız Netlify support veya documentation'a bakabilirsiniz.


