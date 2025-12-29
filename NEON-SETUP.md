# 🐘 Neon PostgreSQL Kurulumu

Bu proje **Neon PostgreSQL** kullanıyor - hızlı, serverless ve ücretsiz!

## ✅ Neon Avantajları

- 🚀 **Serverless** - Otomatik scale
- ⚡ **Hızlı** - MongoDB'den çok daha hızlı
- 💰 **Ücretsiz** - 0.5 GB storage, 500 MB transfer/ay
- 🔒 **Güvenli** - SSL zorunlu
- 🌍 **Global** - Dünyanın her yerinden hızlı erişim

## 📋 Kurulum (5 dakika)

### 1. Neon Hesabı (Zaten var!)

Neon connection string'iniz var:
```
postgresql://neondb_owner:npg_3eaPW4yOuhtd@ep-floral-sky-ah7wrwz5-pooler.c-3.us-east-1.aws.neon.tech/stoky?sslmode=require
```

### 2. Dependencies Yükle

Terminal'de:

```bash
# Functions için pg paketi
cd netlify/functions
npm install
cd ../..

# Ana proje dependencies
npm install
```

### 3. Environment Variables

`.env` dosyası zaten oluşturuldu! İçeriği:

```env
DATABASE_URL=postgresql://neondb_owner:npg_3eaPW4yOuhtd@ep-floral-sky-ah7wrwz5-pooler.c-3.us-east-1.aws.neon.tech/stoky?sslmode=require
ENCRYPTION_KEY=a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2
JWT_SECRET=stok-kontrol-secret-2025
```

### 4. Başlat!

```bash
# Netlify Dev ile (önerilen)
netlify dev
```

Tarayıcıda: http://localhost:8888

## 📊 Database Tabloları

Tablolar otomatik oluşturulur! İlk başlatmada:

### `stores` tablosu:
```sql
CREATE TABLE stores (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  shop_domain VARCHAR(255) NOT NULL,
  access_token TEXT NOT NULL,
  shop_info JSONB,
  is_active BOOLEAN DEFAULT true,
  last_sync TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, shop_domain)
);
```

### `settings` tablosu:
```sql
CREATE TABLE settings (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL UNIQUE,
  sync_title BOOLEAN DEFAULT true,
  sync_description BOOLEAN DEFAULT true,
  sync_price BOOLEAN DEFAULT true,
  sync_compare_price BOOLEAN DEFAULT true,
  sync_sku BOOLEAN DEFAULT true,
  sync_barcode BOOLEAN DEFAULT true,
  sync_inventory BOOLEAN DEFAULT true,
  sync_images BOOLEAN DEFAULT true,
  sync_tags BOOLEAN DEFAULT true,
  sync_vendor BOOLEAN DEFAULT true,
  sync_product_type BOOLEAN DEFAULT true,
  sync_weight BOOLEAN DEFAULT true,
  sync_status BOOLEAN DEFAULT true,
  auto_sync BOOLEAN DEFAULT false,
  sync_interval VARCHAR(50) DEFAULT 'manual',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🔍 Neon Console

Veritabanınızı Neon Console'da görebilirsiniz:

1. https://console.neon.tech/ adresine gidin
2. Projenizi seçin: `ep-floral-sky-ah7wrwz5`
3. **SQL Editor** ile sorgu çalıştırabilirsiniz:

```sql
-- Tüm mağazaları görüntüle
SELECT * FROM stores;

-- Kullanıcı ayarlarını görüntüle
SELECT * FROM settings;

-- Tablo boyutlarını kontrol et
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public';
```

## 🚀 Netlify'a Deploy

Netlify'a deploy ederken environment variable'ı ekleyin:

1. Netlify Dashboard → Site Settings → Environment variables
2. **Add a variable**:
   ```
   Key: DATABASE_URL
   Value: postgresql://neondb_owner:npg_3eaPW4yOuhtd@ep-floral-sky-ah7wrwz5-pooler.c-3.us-east-1.aws.neon.tech/stoky?sslmode=require
   
   Key: ENCRYPTION_KEY
   Value: a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2
   
   Key: JWT_SECRET
   Value: stok-kontrol-secret-2025
   ```
3. **Save**
4. **Deploys** → **Trigger deploy**

## ⚡ Connection Pooling

Neon otomatik connection pooling sağlar:
- **Pooler endpoint** kullanıyoruz (zaten URL'de var)
- Max 20 connection
- Otomatik idle timeout
- Serverless-friendly

## 🔒 Güvenlik

- ✅ SSL zorunlu (`sslmode=require`)
- ✅ API token'ları şifreli saklanır
- ✅ Prepared statements (SQL injection koruması)
- ✅ Connection pooling

## 📈 Monitoring

Neon Console'da:
- CPU kullanımı
- Memory kullanımı
- Connection sayısı
- Query performance

## 🐛 Sorun Giderme

### "connection refused"
```bash
# .env dosyasını kontrol edin
cat .env

# Netlify dev'i yeniden başlatın
pkill netlify
netlify dev
```

### "SSL required"
Connection string'de `sslmode=require` olmalı (zaten var!)

### "too many connections"
Neon free tier: 20 connection limit
- Connection pooling otomatik
- Functions her kullanımda connection'ı serbest bırakır

### Tables oluşturulmadı
İlk API çağrısında otomatik oluşturulur. Manuel oluşturmak için:

```bash
# Neon Console → SQL Editor'da:
# Yukarıdaki CREATE TABLE komutlarını çalıştırın
```

## 💡 İpuçları

1. **Development**: `netlify dev` kullanın (hem frontend hem backend)
2. **Production**: Netlify otomatik deploy eder
3. **Backup**: Neon otomatik backup alır (7 gün)
4. **Monitoring**: Neon Console'da tüm metrikleri görün
5. **Scaling**: İhtiyaç duyduğunuzda Neon Pro'ya geçin

---

🎉 **Hazır!** Artık PostgreSQL ile çalışan modern bir Shopify yönetim sisteminiz var!


