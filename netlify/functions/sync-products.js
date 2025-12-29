const { getStoreById, getSettings } = require('./utils/db');
const { ShopifyAPI } = require('./utils/shopify');
const { decryptToken } = require('./utils/crypto');
const { handleCORS, response } = require('./utils/cors');

// Rate limiting helper
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function syncInventory(sourceShopify, targetShopify, sourceProduct, targetProduct, settings) {
  if (!settings.sync_inventory) {
    return { success: true, message: 'Envanter senkronizasyonu kapalı' };
  }

  try {
    // Hedef store'un location'larını al
    const targetLocations = await targetShopify.getLocations();
    if (!targetLocations || targetLocations.length === 0) {
      return { success: false, error: 'Hedef mağazada location bulunamadı' };
    }

    const primaryLocation = targetLocations[0]; // İlk location'ı kullan
    const updates = [];
    const errors = [];

    // Her variant için stok güncelle
    for (let i = 0; i < sourceProduct.variants.length; i++) {
      const sourceVariant = sourceProduct.variants[i];
      const targetVariant = targetProduct.variants[i];

      if (targetVariant && targetVariant.inventory_item_id) {
        try {
          // Önce inventory tracking'in aktif olduğundan emin ol
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
            console.log(`✅ Inventory tracking aktif edildi: ${sourceVariant.sku}`);
            await delay(500); // Rate limit
          } catch (trackingError) {
            console.log(`⚠️ Inventory tracking zaten aktif: ${sourceVariant.sku}`);
          }

          // Inventory level'ı güncelle
          await targetShopify.makeRequest(
            'inventory_levels/set',
            'POST',
            {
              location_id: primaryLocation.id,
              inventory_item_id: targetVariant.inventory_item_id,
              available: sourceVariant.inventory_quantity || 0
            }
          );

          updates.push({
            sku: sourceVariant.sku,
            quantity: sourceVariant.inventory_quantity
          });
          console.log(`✅ Stok güncellendi: ${sourceVariant.sku} → ${sourceVariant.inventory_quantity}`);
          
          // Rate limit: Her stok güncellemesinden sonra bekle
          await delay(500);
        } catch (error) {
          console.error(`❌ Envanter güncelleme hatası (${sourceVariant.sku}):`, error.message);
          errors.push({
            sku: sourceVariant.sku,
            error: error.message
          });
          // Hata durumunda daha uzun bekle
          await delay(1000);
        }
      }
    }

    return { 
      success: updates.length > 0, 
      updates,
      errors: errors.length > 0 ? errors : undefined
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function syncProduct(sourceShopify, targetShopify, product, settings) {
  const syncData = {
    title: settings.sync_title ? product.title : undefined,
    body_html: settings.sync_description ? product.body_html : undefined,
    vendor: settings.sync_vendor ? product.vendor : undefined,
    product_type: settings.sync_product_type ? product.product_type : undefined,
    tags: settings.sync_tags ? product.tags : undefined,
    published: settings.sync_status ? product.status === 'active' : undefined,
    images: settings.sync_images ? product.images.map(img => ({ src: img.src })) : undefined,
    variants: []
  };

  // Variant bilgilerini ekle
  for (const variant of product.variants) {
    const variantData = {
      title: variant.title,
      sku: settings.sync_sku ? variant.sku : undefined,
      price: settings.sync_price ? variant.price : undefined,
      compare_at_price: settings.sync_compare_price ? variant.compare_at_price : undefined,
      weight: settings.sync_weight ? variant.weight : undefined,
      weight_unit: settings.sync_weight ? variant.weight_unit : undefined,
      inventory_quantity: settings.sync_inventory ? variant.inventory_quantity : 0,
      barcode: settings.sync_barcode ? variant.barcode : undefined,
      option1: variant.option1,
      option2: variant.option2,
      option3: variant.option3,
      // Inventory tracking'i aktif et
      inventory_management: 'shopify',
      inventory_policy: 'deny'
    };

    // Undefined değerleri temizle
    Object.keys(variantData).forEach(key => 
      variantData[key] === undefined && delete variantData[key]
    );

    syncData.variants.push(variantData);
  }

  // Options ekle
  if (product.options && product.options.length > 0) {
    syncData.options = product.options.map(opt => ({
      name: opt.name,
      values: opt.values
    }));
  }

  // Undefined değerleri temizle
  Object.keys(syncData).forEach(key => 
    syncData[key] === undefined && delete syncData[key]
  );

  try {
    // Hedef mağazada aynı SKU'ya sahip ürün var mı kontrol et
    const existingProducts = await targetShopify.getProducts();
    let existingProduct = null;

    if (settings.sync_sku && product.variants[0]?.sku) {
      existingProduct = existingProducts.find(p => 
        p.variants.some(v => v.sku === product.variants[0].sku)
      );
    }

    let resultProduct;
    let action;

    if (existingProduct) {
      // Güncelle
      const updateData = await targetShopify.makeRequest(
        `products/${existingProduct.id}`,
        'PUT',
        { product: syncData }
      );
      resultProduct = updateData.product;
      action = 'updated';
    } else {
      // Yeni oluştur
      const createData = await targetShopify.makeRequest(
        'products',
        'POST',
        { product: syncData }
      );
      resultProduct = createData.product;
      action = 'created';
    }

    // Envanter senkronizasyonu
    let inventoryResult = null;
    if (settings.sync_inventory && resultProduct) {
      inventoryResult = await syncInventory(sourceShopify, targetShopify, product, resultProduct, settings);
    }

    return { 
      success: true, 
      action, 
      product: resultProduct,
      inventory: inventoryResult
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

exports.handler = async (event, context) => {
  const corsResponse = handleCORS(event);
  if (corsResponse) return corsResponse;

  if (event.httpMethod !== 'POST') {
    return response(405, { error: 'Method not allowed' });
  }

  try {
    const { sourceStoreId, targetStoreId, productIds, syncAll } = JSON.parse(event.body);
    const userId = event.headers.authorization || 'demo-user';

    if (!sourceStoreId || !targetStoreId) {
      return response(400, {
        success: false,
        error: 'Kaynak ve hedef mağaza ID gerekli'
      });
    }

    // Mağazaları ve ayarları al
    const [sourceStore, targetStore, userSettings] = await Promise.all([
      getStoreById(sourceStoreId, userId),
      getStoreById(targetStoreId, userId),
      getSettings(userId)
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

    let productsToSync = [];

    if (syncAll) {
      productsToSync = await sourceShopify.getProducts();
    } else if (productIds && productIds.length > 0) {
      for (const productId of productIds) {
        const data = await sourceShopify.makeRequest(`products/${productId}`);
        productsToSync.push(data.product);
      }
    } else {
      return response(400, {
        success: false,
        error: 'Senkronize edilecek ürünler belirtilmeli'
      });
    }

    // Ürünleri senkronize et
    const results = [];
    for (const product of productsToSync) {
      const result = await syncProduct(sourceShopify, targetShopify, product, userSettings);
      results.push({
        productId: product.id,
        productTitle: product.title,
        ...result
      });
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    return response(200, {
      success: true,
      message: `${successCount} ürün başarıyla senkronize edildi, ${failCount} hata`,
      results,
      stats: {
        total: results.length,
        success: successCount,
        failed: failCount,
        created: results.filter(r => r.action === 'created').length,
        updated: results.filter(r => r.action === 'updated').length
      }
    });

  } catch (error) {
    console.error('Sync products error:', error);
    return response(500, {
      success: false,
      error: error.message
    });
  }
};
