const { getStoreById } = require('./utils/db');
const { ShopifyAPI } = require('./utils/shopify');
const { decryptToken } = require('./utils/crypto');
const { handleCORS, response } = require('./utils/cors');

// Rate limiting helper (optimize edildi: 500ms → 300ms)
const delay = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms));

async function syncInventoryBySKU(sourceShopify, targetShopify, sourceProducts, targetProducts) {
  const results = [];
  const targetProductsMap = new Map();

  // Hedef ürünleri SKU'ya göre map'le
  for (const targetProduct of targetProducts) {
    for (const variant of targetProduct.variants || []) {
      if (variant.sku) {
        targetProductsMap.set(variant.sku, {
          product: targetProduct,
          variant: variant
        });
      }
    }
  }

  console.log(`📊 Hedef mağazada ${targetProductsMap.size} SKU bulundu`);

  // Hedef location'ı al
  const targetLocations = await targetShopify.getLocations();
  if (!targetLocations || targetLocations.length === 0) {
    throw new Error('Hedef mağazada location bulunamadı');
  }
  const primaryLocation = targetLocations[0];

  // Kaynak ürünleri işle (rate limiting ile)
  let processedCount = 0;
  for (const sourceProduct of sourceProducts) {
    for (const sourceVariant of sourceProduct.variants || []) {
      if (!sourceVariant.sku) continue;

      const targetMatch = targetProductsMap.get(sourceVariant.sku);
      
      if (targetMatch) {
        const { product: targetProduct, variant: targetVariant } = targetMatch;
        
        const oldQty = targetVariant.inventory_quantity || 0;
        const newQty = sourceVariant.inventory_quantity || 0;
        
        // Eğer stok aynıysa skip (zaman kazanır)
        if (oldQty === newQty) {
          results.push({
            success: true,
            sku: sourceVariant.sku,
            productTitle: sourceProduct.title,
            oldQuantity: oldQty,
            newQuantity: newQty,
            targetProduct: targetProduct.title,
            skipped: true
          });
          console.log(`⏭️  ${sourceVariant.sku}: ${oldQty} (zaten eşit, atlandı)`);
          continue;
        }
        
        try {
          // Inventory tracking'i aktif et
          try {
            await targetShopify.makeRequest(
              `inventory_items/${targetVariant.inventory_item_id}`,
              'PUT',
              {
                inventory_item: {
                  tracked: true
                }
              }
            );
            await delay(100); // Optimize: 300ms → 100ms
          } catch (trackingError) {
            // Zaten aktif veya hata, devam et
          }

          // Stok güncelle
          await targetShopify.makeRequest(
            'inventory_levels/set',
            'POST',
            {
              location_id: primaryLocation.id,
              inventory_item_id: targetVariant.inventory_item_id,
              available: newQty
            }
          );

          results.push({
            success: true,
            sku: sourceVariant.sku,
            productTitle: sourceProduct.title,
            oldQuantity: oldQty,
            newQuantity: newQty,
            targetProduct: targetProduct.title
          });

          processedCount++;
          console.log(`✅ [${processedCount}] ${sourceVariant.sku}: ${oldQty} → ${newQty}`);
          
          // Rate limit: 200ms (timeout optimizasyonu)
          await delay(200);
        } catch (error) {
          results.push({
            success: false,
            sku: sourceVariant.sku,
            productTitle: sourceProduct.title,
            error: error.message
          });
          console.error(`❌ ${sourceVariant.sku}: ${error.message}`);
          
          // Hata durumunda biraz daha uzun bekle
          await delay(1000);
        }
      } else {
        results.push({
          success: false,
          sku: sourceVariant.sku,
          productTitle: sourceProduct.title,
          error: 'Hedef mağazada SKU bulunamadı'
        });
      }
    }
  }
  
  console.log(`✅ Toplam ${processedCount} stok güncellendi`);

  return results;
}

exports.handler = async (event, context) => {
  const corsResponse = handleCORS(event);
  if (corsResponse) return corsResponse;

  if (event.httpMethod !== 'POST') {
    return response(405, { error: 'Method not allowed' });
  }

  try {
    const { sourceStoreId, targetStoreId } = JSON.parse(event.body);
    const userId = event.headers.authorization || 'demo-user';

    if (!sourceStoreId || !targetStoreId) {
      return response(400, {
        success: false,
        error: 'Kaynak ve hedef mağaza ID gerekli'
      });
    }

    if (sourceStoreId === targetStoreId) {
      return response(400, {
        success: false,
        error: 'Kaynak ve hedef mağaza aynı olamaz'
      });
    }

    console.log(`🔄 Stok senkronizasyonu başlatılıyor: ${sourceStoreId} → ${targetStoreId}`);

    // Mağazaları al
    const [sourceStore, targetStore] = await Promise.all([
      getStoreById(sourceStoreId, userId),
      getStoreById(targetStoreId, userId)
    ]);

    if (!sourceStore || !targetStore) {
      return response(404, {
        success: false,
        error: 'Mağaza bulunamadı'
      });
    }

    // Shopify API client'ları oluştur
    const sourceShopify = new ShopifyAPI(
      sourceStore.shop_domain,
      decryptToken(sourceStore.access_token)
    );

    const targetShopify = new ShopifyAPI(
      targetStore.shop_domain,
      decryptToken(targetStore.access_token)
    );

    console.log(`📥 Kaynak mağazadan TÜM ürünler alınıyor...`);
    const sourceProducts = await sourceShopify.getAllProducts();
    await delay(100); // Optimize: 200ms → 100ms
    
    console.log(`📥 Hedef mağazadan TÜM ürünler alınıyor...`);
    const targetProducts = await targetShopify.getAllProducts();
    await delay(100); // Optimize: 200ms → 100ms

    console.log(`✅ Kaynak: ${sourceProducts.length} ürün, Hedef: ${targetProducts.length} ürün`);
    
    // AKILLI BATCH: Hedefte olan ürünleri batch'le
    const BATCH_SIZE = 10; // 30sn timeout için düşük tutulmalı
    
    // Kaynak ürünleri SKU map'ine çevir
    const sourceMap = new Map();
    for (const sourceProduct of sourceProducts) {
      for (const variant of sourceProduct.variants || []) {
        if (variant.sku) {
          sourceMap.set(variant.sku, {
            product: sourceProduct,
            variant: variant
          });
        }
      }
    }
    
    console.log(`📊 Kaynak mağazada ${sourceMap.size} SKU bulundu`);
    
    // Hedefte olan ürünlerden kaynak mağazada da olanları bul
    const matchedProducts = [];
    for (const targetProduct of targetProducts) {
      for (const targetVariant of targetProduct.variants || []) {
        if (targetVariant.sku && sourceMap.has(targetVariant.sku)) {
          const sourceMatch = sourceMap.get(targetVariant.sku);
          matchedProducts.push(sourceMatch.product);
          break; // Bir ürün için sadece bir kez ekle
        }
      }
    }
    
    console.log(`✅ ${matchedProducts.length} ürün eşleşti (hedefte de var)`);
    
    // İlk BATCH_SIZE kadarını işle
    const limitedSourceProducts = matchedProducts.slice(0, BATCH_SIZE);
    
    if (matchedProducts.length > BATCH_SIZE) {
      console.log(`⚠️ BATCH: ${matchedProducts.length} eşleşmeden ilk ${BATCH_SIZE} tanesi işlenecek`);
    } else {
      console.log(`🔄 ${limitedSourceProducts.length} ürün işlenecek`);
    }

    // SKU'ya göre eşleştir ve stok güncelle
    const results = await syncInventoryBySKU(
      sourceShopify,
      targetShopify,
      limitedSourceProducts,
      targetProducts
    );

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;
    const notFoundCount = results.filter(r => r.error === 'Hedef mağazada SKU bulunamadı').length;

    let message = `${successCount} stok güncellendi`;
    if (failCount > 0) message += `, ${failCount} hata`;
    if (notFoundCount > 0) message += `, ${notFoundCount} SKU bulunamadı`;
    
    // Batch uyarısı (matchedProducts'ı kullan)
    const totalMatched = matchedProducts.length; // Bu değişken yukarda tanımlı olmalı
    if (totalMatched > BATCH_SIZE) {
      const processed = limitedSourceProducts.length;
      message += `\n\n⚠️ BATCH: ${totalMatched} eşleşmeden ${processed} tanesi işlendi. Kalanlar için tekrar sync yapın.`;
    }

    return response(200, {
      success: true,
      message: message,
      results,
      stats: {
        total: results.length,
        success: successCount,
        failed: failCount,
        notFound: notFoundCount,
        totalMatched: totalMatched,
        processedProducts: limitedSourceProducts.length
      },
      hasMoreProducts: totalMatched > BATCH_SIZE
    });

  } catch (error) {
    console.error('Inventory sync error:', error);
    return response(500, {
      success: false,
      error: error.message
    });
  }
};

