const { 
  getIntegrationById, 
  getStoreById,
  getSyncSettings,
  createSyncLog,
  updateSyncLog,
  createOrUpdateMapping,
  updateIntegrationStats
} = require('./utils/db');
const { ShopifyAPI } = require('./utils/shopify');
const { decryptToken } = require('./utils/crypto');
const { handleCORS, response } = require('./utils/cors');

// Rate limiting helper (azaltıldı: 500ms → 300ms)
const delay = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Full Sync İşlemi
 * - Tüm ürünleri çeker
 * - SKU'ya göre eşleştirir
 * - Hedefte yoksa oluşturur
 * - Mevcutsa günceller
 * - Mapping'leri kaydeder
 * - Detaylı log tutar
 */
async function performFullSync(integration, sourceShopify, targetShopify, syncSettings, syncLog, filters = {}) {
  const details = {
    products: [],
    warnings: [],
    errors: []
  };

  let stats = {
    totalProducts: 0,
    productsCreated: 0,
    productsUpdated: 0,
    productsFailed: 0,
    productsSkipped: 0,
    inventoryUpdated: 0
  };

  try {
    console.log(`🔄 Full Sync başlatılıyor: Integration #${integration.id}`);

    // Kaynak ürünlerini çek (TÜM ÜRÜNLER)
    console.log('📥 Kaynak mağazadan TÜM ürünler alınıyor...');
    let sourceProducts = await sourceShopify.getAllProducts();
    await delay(200); // Hızlandırıldı

    console.log(`✅ Kaynak mağazadan ${sourceProducts.length} ürün alındı`);

    // FİLTRELEME UYGULA
    const { vendor, collectionId, hasStock } = filters;

    if (vendor && vendor !== 'all') {
      console.log(`🔍 Vendor filtresi uygulanıyor: ${vendor}`);
      sourceProducts = sourceProducts.filter(p => p.vendor === vendor);
    }

    if (hasStock) {
      console.log(`🔍 Stokta olan ürünler filtreleniyor...`);
      sourceProducts = sourceProducts.filter(p => {
        return p.variants?.some(v => (v.inventory_quantity || 0) > 0);
      });
    }

    if (collectionId && collectionId !== 'all') {
      console.log(`🔍 Collection filtresi uygulanıyor: ${collectionId}`);
      try {
        const collectionProducts = await sourceShopify.getCollectionProducts(collectionId);
        const collectionProductIds = new Set(collectionProducts.map(p => String(p.id)));
        sourceProducts = sourceProducts.filter(p => collectionProductIds.has(String(p.id)));
      } catch (err) {
        console.error('Collection products fetch error:', err);
        details.warnings.push(`Collection filtresi uygulanamadı: ${err.message}`);
      }
    }

    console.log(`✅ Filtreleme sonrası: ${sourceProducts.length} ürün işlenecek`);

    // Hedef ürünleri çek
    console.log('📥 Hedef mağazadan ürünler alınıyor...');
    const targetProducts = await targetShopify.getAllProducts();
    await delay(200); // Hızlandırıldı

    console.log(`✅ Hedef: ${targetProducts.length} ürün`);
    
    // Hedef ürünleri SKU map'ine çevir
    const targetSkuMap = new Map();
    for (const product of targetProducts) {
      for (const variant of product.variants || []) {
        if (variant.sku) {
          targetSkuMap.set(variant.sku, { product, variant });
        }
      }
    }

    // Hedef location
    const targetLocations = await targetShopify.getLocations();
    await delay(200); // Hızlandırıldı
    if (!targetLocations || targetLocations.length === 0) {
      throw new Error('Hedef mağazada location bulunamadı');
    }
    const primaryLocation = targetLocations[0];

    // Her kaynak ürünü işle (BATCH limit: 5 ürün - strict timeout önleme)
    const BATCH_SIZE = 5;
    const limitedSourceProducts = sourceProducts.slice(0, BATCH_SIZE);
    stats.totalProducts = sourceProducts.length;

    if (sourceProducts.length > BATCH_SIZE) {
      console.log(`⚠️ İlk ${BATCH_SIZE} ürün işlenecek (strict 30sn timeout önleme). Toplam: ${sourceProducts.length}`);
      details.warnings.push(`⚠️ BATCH SYNC: Toplam ${sourceProducts.length} ürün bulundu. İlk ${BATCH_SIZE} ürün işlendi. Kalanlar için tekrar sync yapın.`);
    } else {
      console.log(`🔄 ${sourceProducts.length} ürün işlenecek`);
    }

    for (const sourceProduct of limitedSourceProducts) {
      try {
        // SKU kontrolü
        const sourceVariant = sourceProduct.variants?.[0];
        if (!sourceVariant || !sourceVariant.sku) {
          stats.productsSkipped++;
          details.products.push({
            sourceProductId: sourceProduct.id,
            sku: null,
            title: sourceProduct.title,
            status: 'skipped',
            message: 'SKU eksik'
          });
          continue;
        }

        const sku = sourceVariant.sku;
        const targetMatch = targetSkuMap.get(sku);

        if (targetMatch) {
          // Ürün hedefte var - Güncelle
          const { product: targetProduct, variant: targetVariant } = targetMatch;

          // Inventory tracking aktif et
          try {
            await targetShopify.makeRequest(
              `inventory_items/${targetVariant.inventory_item_id}`,
              'PUT',
              { inventory_item: { tracked: true } }
            );
            await delay(); // 300ms
          } catch (err) {
            console.error(`⚠️ Tracking error (${sku}):`, err.message);
          }

          // Variant güncelle (fiyat, stok vs)
          const variantUpdateData = {};
          
          if (syncSettings.sync_price || syncSettings.sync_prices) {
            variantUpdateData.price = sourceVariant.price;
          }
          
          if (syncSettings.sync_compare_at_price || syncSettings.sync_prices) {
            variantUpdateData.compare_at_price = sourceVariant.compare_at_price;
          }
          
          if (syncSettings.sync_sku) {
            variantUpdateData.sku = sourceVariant.sku;
          }
          
          if (syncSettings.sync_barcode) {
            variantUpdateData.barcode = sourceVariant.barcode;
          }
          
          if (syncSettings.sync_weight) {
            variantUpdateData.weight = sourceVariant.weight;
            variantUpdateData.weight_unit = sourceVariant.weight_unit;
          }

          // Variant'ı güncelle
          if (Object.keys(variantUpdateData).length > 0) {
            try {
              await targetShopify.makeRequest(
                `variants/${targetVariant.id}`,
                'PUT',
                { variant: variantUpdateData }
              );
              await delay(); // 300ms
              console.log(`💰 Fiyat güncellendi: ${sourceVariant.price}`);
            } catch (err) {
              console.error(`⚠️ Variant update error (${sku}):`, err.message);
            }
          }

          // Product güncelle (title, description vs)
          const productUpdateData = {};
          
          if (syncSettings.sync_title) {
            productUpdateData.title = sourceProduct.title;
          }
          
          if (syncSettings.sync_description || syncSettings.sync_descriptions) {
            productUpdateData.body_html = sourceProduct.body_html;
          }
          
          if (syncSettings.sync_vendor) {
            productUpdateData.vendor = sourceProduct.vendor;
          }
          
          if (syncSettings.sync_product_type) {
            productUpdateData.product_type = sourceProduct.product_type;
          }
          
          if (syncSettings.sync_tags) {
            productUpdateData.tags = sourceProduct.tags;
          }
          
          if (syncSettings.sync_published) {
            productUpdateData.status = sourceProduct.status;
          }

          // Product'ı güncelle
          if (Object.keys(productUpdateData).length > 0) {
            try {
              await targetShopify.makeRequest(
                `products/${targetProduct.id}`,
                'PUT',
                { product: productUpdateData }
              );
              await delay(); // 300ms
              console.log(`📝 Ürün bilgileri güncellendi`);
            } catch (err) {
              console.error(`⚠️ Product update error (${sku}):`, err.message);
            }
          }

          // Stok güncelle
          if (syncSettings.sync_inventory) {
            try {
              await targetShopify.makeRequest(
                'inventory_levels/set',
                'POST',
                {
                  location_id: primaryLocation.id,
                  inventory_item_id: targetVariant.inventory_item_id,
                  available: sourceVariant.inventory_quantity || 0
                }
              );
              await delay(); // 300ms
              stats.inventoryUpdated++;
              console.log(`📦 Stok güncellendi: ${sourceVariant.inventory_quantity}`);
            } catch (err) {
              console.error(`❌ Inventory update error (${sku}):`, err.message);
            }
          }

          // Mapping kaydet
          await createOrUpdateMapping(integration.id, {
            sourceProductId: sourceProduct.id.toString(),
            targetProductId: targetProduct.id.toString(),
            sku: sku,
            mappingType: 'auto_sku'
          });

          stats.productsUpdated++;
          details.products.push({
            sourceProductId: sourceProduct.id,
            targetProductId: targetProduct.id,
            sku: sku,
            title: sourceProduct.title,
            status: 'updated',
            message: `Güncellendi (Fiyat: ${sourceVariant.price}, Stok: ${sourceVariant.inventory_quantity})`
          });

          console.log(`✅ [${stats.productsUpdated}] ${sku}: Güncellendi`);

        } else {
          // Ürün hedefte yok - Oluştur
          if (syncSettings.sync_new_products) {
            try {
              const newProductData = {
                product: {
                  title: (syncSettings.sync_title !== false) ? sourceProduct.title : 'Yeni Ürün',
                  body_html: (syncSettings.sync_description || syncSettings.sync_descriptions) ? sourceProduct.body_html : '',
                  vendor: (syncSettings.sync_vendor !== false) ? sourceProduct.vendor : '',
                  product_type: (syncSettings.sync_product_type !== false) ? sourceProduct.product_type : '',
                  tags: (syncSettings.sync_tags !== false) ? sourceProduct.tags : '',
                  status: (syncSettings.sync_published !== false) ? sourceProduct.status : 'draft',
                  variants: [{
                    sku: (syncSettings.sync_sku !== false) ? sourceVariant.sku : '',
                    price: (syncSettings.sync_price || syncSettings.sync_prices) ? sourceVariant.price : '0.00',
                    compare_at_price: (syncSettings.sync_compare_at_price || syncSettings.sync_prices) ? sourceVariant.compare_at_price : null,
                    inventory_quantity: (syncSettings.sync_inventory) ? (sourceVariant.inventory_quantity || 0) : 0,
                    inventory_management: (syncSettings.sync_inventory) ? 'shopify' : null,
                    inventory_policy: (syncSettings.sync_inventory) ? 'deny' : null,
                    barcode: (syncSettings.sync_barcode !== false) ? sourceVariant.barcode : null,
                    weight: (syncSettings.sync_weight !== false) ? sourceVariant.weight : null,
                    weight_unit: (syncSettings.sync_weight !== false) ? sourceVariant.weight_unit : 'kg'
                  }]
                }
              };

              // Görseller ekle
              if ((syncSettings.sync_images !== false) && sourceProduct.images && sourceProduct.images.length > 0) {
                newProductData.product.images = sourceProduct.images.map(img => ({
                  src: img.src
                }));
              }

              const createdProduct = await targetShopify.makeRequest('products', 'POST', newProductData);
              await delay(); // 300ms

              if (createdProduct && createdProduct.product) {
                // Mapping kaydet
                await createOrUpdateMapping(integration.id, {
                  sourceProductId: sourceProduct.id.toString(),
                  targetProductId: createdProduct.product.id.toString(),
                  sku: sku,
                  mappingType: 'auto_sku'
                });

                stats.productsCreated++;
                details.products.push({
                  sourceProductId: sourceProduct.id,
                  targetProductId: createdProduct.product.id,
                  sku: sku,
                  title: sourceProduct.title,
                  status: 'created',
                  message: `Oluşturuldu (Fiyat: ${sourceVariant.price}, Stok: ${sourceVariant.inventory_quantity})`
                });

                console.log(`✅ [${stats.productsCreated}] ${sku}: Oluşturuldu (Fiyat: ${sourceVariant.price}, Stok: ${sourceVariant.inventory_quantity})`);
              }

            } catch (err) {
              stats.productsFailed++;
              details.products.push({
                sourceProductId: sourceProduct.id,
                sku: sku,
                title: sourceProduct.title,
                status: 'failed',
                error: err.message
              });
              console.error(`❌ Create error (${sku}):`, err.message);
              await delay(1000); // Hata sonrası daha uzun bekle
            }
          } else {
            stats.productsSkipped++;
            details.products.push({
              sourceProductId: sourceProduct.id,
              sku: sku,
              title: sourceProduct.title,
              status: 'skipped',
              message: 'Yeni ürün oluşturma kapalı'
            });
          }
        }

      } catch (err) {
        stats.productsFailed++;
        details.errors.push({
          productId: sourceProduct.id,
          error: err.message
        });
        console.error(`❌ Product processing error (${sourceProduct.id}):`, err.message);
      }
    }

    // Warnings
    if (stats.productsSkipped > 0) {
      details.warnings.push(`${stats.productsSkipped} ürün SKU eksik olduğu için atlandı`);
    }
    if (stats.productsFailed > 0) {
      details.warnings.push(`${stats.productsFailed} ürün işlenirken hata oluştu`);
    }

    return { stats, details, status: 'completed' };

  } catch (error) {
    console.error('Full sync error:', error);
    return {
      stats,
      details,
      status: 'failed',
      error: error.message
    };
  }
}

exports.handler = async (event, context) => {
  const corsResponse = handleCORS(event);
  if (corsResponse) return corsResponse;

  if (event.httpMethod !== 'POST') {
    return response(405, { error: 'Method not allowed' });
  }

  const startTime = Date.now();
  let syncLog = null;

  try {
    const { 
      integrationId, 
      filters = {} 
    } = JSON.parse(event.body);
    const userId = event.headers.authorization || 'demo-user';

    if (!integrationId) {
      return response(400, {
        success: false,
        error: 'Integration ID gerekli'
      });
    }

    const { vendor, collectionId, hasStock } = filters;
    console.log(`🚀 Full Sync başlatılıyor: Integration #${integrationId}`, {
      filters: { vendor, collectionId, hasStock }
    });

    // Integration bilgilerini al
    const integration = await getIntegrationById(integrationId, userId);
    if (!integration) {
      return response(404, {
        success: false,
        error: 'Entegrasyon bulunamadı'
      });
    }

    // Sync settings al
    const syncSettings = await getSyncSettings(integrationId);

    // Sync log oluştur
    syncLog = await createSyncLog(integrationId, 'full');
    console.log(`📝 Sync log oluşturuldu: #${syncLog.id}`);

    // Store bilgilerini al
    const [sourceStore, targetStore] = await Promise.all([
      getStoreById(integration.source_store_id, userId),
      getStoreById(integration.target_store_id, userId)
    ]);

    if (!sourceStore || !targetStore) {
      throw new Error('Mağaza bulunamadı');
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

    // Full sync işlemini başlat
    const result = await performFullSync(
      integration,
      sourceShopify,
      targetShopify,
      syncSettings,
      syncLog,
      { vendor, collectionId, hasStock }
    );

    // Sync süresini hesapla
    const endTime = Date.now();
    const durationSeconds = Math.floor((endTime - startTime) / 1000);

    // Sync log'u güncelle
    await updateSyncLog(syncLog.id, {
      status: result.status,
      totalProducts: result.stats.totalProducts,
      productsCreated: result.stats.productsCreated,
      productsUpdated: result.stats.productsUpdated,
      productsFailed: result.stats.productsFailed,
      productsSkipped: result.stats.productsSkipped,
      inventoryUpdated: result.stats.inventoryUpdated,
      completedAt: new Date(),
      durationSeconds: durationSeconds,
      errorMessage: result.error || null,
      details: result.details
    });

    // Integration stats güncelle
    await updateIntegrationStats(integrationId, result.status === 'completed' ? 'success' : 'failed');

    console.log(`✅ Full Sync tamamlandı: ${result.status} (${durationSeconds}s)`);
    console.log(`📊 Stats: ${result.stats.productsCreated} oluşturuldu, ${result.stats.productsUpdated} güncellendi, ${result.stats.productsFailed} hata`);

    // Batch warning oluştur
    const hasMoreProducts = result.stats.totalProducts > (result.stats.productsCreated + result.stats.productsUpdated + result.stats.productsSkipped);
    let message = `${result.stats.productsCreated} ürün oluşturuldu, ${result.stats.productsUpdated} ürün güncellendi${result.stats.productsFailed > 0 ? `, ${result.stats.productsFailed} hata` : ''}`;
    
    if (hasMoreProducts) {
      const processed = result.stats.productsCreated + result.stats.productsUpdated + result.stats.productsSkipped;
      message += `\n⚠️ ${result.stats.totalProducts} üründen ${processed} tanesi işlendi. Kalanlar için tekrar sync yapın.`;
    }

    return response(200, {
      success: result.status === 'completed',
      syncLogId: syncLog.id,
      status: result.status,
      stats: result.stats,
      duration: durationSeconds,
      message: message,
      hasMoreProducts: hasMoreProducts
    });

  } catch (error) {
    console.error('Sync handler error:', error);

    // Hata durumunda log güncelle
    if (syncLog) {
      const endTime = Date.now();
      const durationSeconds = Math.floor((endTime - startTime) / 1000);
      
      await updateSyncLog(syncLog.id, {
        status: 'failed',
        completedAt: new Date(),
        durationSeconds: durationSeconds,
        errorMessage: error.message
      });
    }

    return response(500, {
      success: false,
      error: error.message
    });
  }
};

