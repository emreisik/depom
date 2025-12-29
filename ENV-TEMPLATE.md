# Environment Variables Template

Depom için gerekli environment variables listesi.

## 📋 SHOPIFY API CREDENTIALS

Partner Dashboard'dan alınacak: https://partners.shopify.com

```bash
SHOPIFY_API_KEY=your_shopify_api_key_here
SHOPIFY_API_SECRET=your_shopify_api_secret_here
SHOPIFY_SCOPES=read_products,write_products,read_inventory,write_inventory
```

## 🌐 APP URLS

```bash
APP_URL=https://lighthearted-licorice-c736cb.netlify.app
```

## 💾 DATABASE (Neon PostgreSQL)

Neon Console'dan alınacak: https://console.neon.tech

```bash
DATABASE_URL=postgresql://neondb_owner:npg_3eaPW4yOuhtd@ep-floral-sky-ah7wrwz5-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require
```

## 🔐 SECURITY & ENCRYPTION

```bash
ENCRYPTION_KEY=a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2
JWT_SECRET=stok-kontrol-secret-2025
```

## 🚀 NETLIFY'E EKLEME

### Option 1: CLI ile
```bash
netlify env:set SHOPIFY_API_KEY "your_key_here"
netlify env:set SHOPIFY_API_SECRET "your_secret_here"
netlify env:set SHOPIFY_SCOPES "read_products,write_products,read_inventory,write_inventory"
netlify env:set APP_URL "https://your-app-url.netlify.app"
netlify env:set DATABASE_URL "your_database_url"
netlify env:set ENCRYPTION_KEY "your_encryption_key"
netlify env:set JWT_SECRET "your_jwt_secret"
```

### Option 2: Web Dashboard
1. Netlify Dashboard → Site → **Environment variables**
2. Her bir variable'ı manuel ekle
3. **Save** ve **Deploy site**

## ⚠️ GÜVENLİK NOTLARI

- ❌ Environment variables'ı ASLA Git'e commit etme!
- ✅ `.env` dosyası `.gitignore`'da olmalı
- ✅ Production ve development için farklı değerler kullan
- ✅ API secrets'ı düzenli olarak rotate et
- ✅ ENCRYPTION_KEY ve JWT_SECRET güçlü olmalı (32+ karakter)

## 🧪 TEST İÇİN

Lokal test için `.env` dosyası oluştur:

```bash
cp ENV-TEMPLATE.md .env
# Sonra .env dosyasını düzenle
```

