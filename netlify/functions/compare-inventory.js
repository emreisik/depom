const { getStoreById } = require('./utils/db');
const { ShopifyAPI } = require('./utils/shopify');
const { decryptToken } = require('./utils/crypto');
const { handleCORS, response } = require('./utils/cors');

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

    console.log(`📊 Stok karşılaştırması başlatılıyor: ${sourceStoreId} ↔ ${targetStoreId}`);

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

    console.log(`📥 Kaynak mağazadan ürünler alınıyor...`);
    const sourceProducts = await sourceShopify.getAllProducts();
    
    console.log(`📥 Hedef mağazadan ürünler alınıyor...`);
    const targetProducts = await targetShopify.getAllProducts();

    console.log(`✅ Kaynak: ${sourceProducts.length} ürün, Hedef: ${targetProducts.length} ürün`);

    // Hedef ürünleri SKU map'ine çevir
    const targetMap = new Map();
    for (const targetProduct of targetProducts) {
      for (const variant of targetProduct.variants || []) {
        if (variant.sku) {
          targetMap.set(variant.sku, {
            product: targetProduct,
            variant: variant,
            inventory: variant.inventory_quantity || 0
          });
        }
      }
    }

    // Kaynak ürünlerle karşılaştır
    const comparison = [];
    let matchCount = 0;
    let differenceCount = 0;
    let notFoundCount = 0;
    let zeroStockCount = 0;

    for (const sourceProduct of sourceProducts) {
      for (const sourceVariant of sourceProduct.variants || []) {
        if (!sourceVariant.sku) continue;

        const targetMatch = targetMap.get(sourceVariant.sku);
        const sourceInventory = sourceVariant.inventory_quantity || 0;

        if (targetMatch) {
          matchCount++;
          const targetInventory = targetMatch.inventory;
          const difference = sourceInventory - targetInventory;

          if (difference !== 0) {
            differenceCount++;
          }

          if (sourceInventory === 0 && targetInventory === 0) {
            zeroStockCount++;
          }

          comparison.push({
            sku: sourceVariant.sku,
            productTitle: sourceProduct.title,
            sourceInventory,
            targetInventory,
            difference,
            status: difference === 0 ? 'matched' : (difference > 0 ? 'source_higher' : 'target_higher'),
            sourcePrice: sourceVariant.price,
            targetPrice: targetMatch.variant.price
          });
        } else {
          notFoundCount++;
          comparison.push({
            sku: sourceVariant.sku,
            productTitle: sourceProduct.title,
            sourceInventory,
            targetInventory: null,
            difference: null,
            status: 'not_found',
            sourcePrice: sourceVariant.price,
            targetPrice: null
          });
        }
      }
    }

    // Sonuçları farka göre sırala (en büyük fark önce)
    comparison.sort((a, b) => Math.abs(b.difference || 0) - Math.abs(a.difference || 0));

    console.log(`✅ Karşılaştırma tamamlandı: ${matchCount} eşleşme, ${differenceCount} fark, ${notFoundCount} bulunamadı`);

    return response(200, {
      success: true,
      data: comparison,
      stats: {
        totalSourceProducts: sourceProducts.length,
        totalTargetProducts: targetProducts.length,
        matched: matchCount,
        withDifference: differenceCount,
        notFound: notFoundCount,
        zeroStock: zeroStockCount,
        synced: matchCount - differenceCount
      },
      sourceStore: {
        id: sourceStore.id,
        name: sourceStore.name
      },
      targetStore: {
        id: targetStore.id,
        name: targetStore.name
      }
    });

  } catch (error) {
    console.error('Compare inventory error:', error);
    return response(500, {
      success: false,
      error: error.message
    });
  }
};


