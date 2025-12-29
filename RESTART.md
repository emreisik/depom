# 🔄 Server Restart Talimatları

## ⚠️ Netlify Functions Cache Temizliği Gerekli

1. **Terminal'de Ctrl+C yapın** (server'ı durdurun)

2. **Cache'i temizleyin:**
```bash
rm -rf .netlify node_modules/.cache
```

3. **Server'ı yeniden başlatın:**
```bash
npm run dev
```

4. **Tarayıcıyı yenileyin:** `http://localhost:8888`

5. **Test edin:**
   - 🔗 Entegrasyonlar sayfasına gidin
   - Bir entegrasyon açın
   - "🚀 Stokları Senkronize Et" butonuna tıklayın

---

## 🐛 Sorun Devam Ederse:

### 1. Terminal Loglarını Kontrol Edin:
```bash
# Başka bir terminal'de:
tail -f ~/.cursor/projects/Users-emre-stok-kontrol/terminals/*.txt
```

### 2. Database Tablosu Kontrolü:
PostgreSQL'de `integrations` tablosu oluştu mu?

### 3. API Test:
```bash
curl http://localhost:8888/api/integrations
```

Boş array `{"success":true,"data":[]}` dönmeli.

---

## ✅ Çalışma Kontrolü:

1. **Entegrasyonlar** sayfası açılıyor mu? ✓
2. **Yeni Entegrasyon** formu çalışıyor mu? ✓  
3. **Entegrasyon detay** sayfası açılıyor mu? ✓
4. **Stok senkronizasyonu** başlıyor mu? ✓

---

**NOT:** Netlify Dev bazen cache'i temizlemek için tam restart gerektirir!


