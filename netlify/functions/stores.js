const { getStores, getStoreById, createStore, deleteStore, updateStore } = require('./utils/db');
const { ShopifyAPI } = require('./utils/shopify');
const { encryptToken } = require('./utils/crypto');
const { handleCORS, response } = require('./utils/cors');

// Updated: 2025-12-29 - Fixed duplicate key error
exports.handler = async (event, context) => {
  // Handle CORS
  const corsResponse = handleCORS(event);
  if (corsResponse) return corsResponse;

  try {
    const userId = event.headers.authorization || 'demo-user';

    // GET - Tüm mağazaları listele
    if (event.httpMethod === 'GET') {
      // Demo mode: Eğer query parameter'da userId varsa onu kullan, yoksa tüm mağazaları getir
      const queryUserId = event.queryStringParameters?.userId;
      const stores = queryUserId ? await getStores(queryUserId) : await getStores(userId);
      
      return response(200, {
        success: true,
        data: stores.map(s => ({
          id: s.id.toString(),
          name: s.name,
          shopDomain: s.shop_domain,
          lastSync: s.last_sync,
          isActive: s.is_active,
          createdAt: s.created_at,
          shopInfo: s.shop_info
        }))
      });
    }

    // POST - Yeni mağaza ekle
    if (event.httpMethod === 'POST') {
      const { storeName, shopDomain, accessToken } = JSON.parse(event.body);

      if (!shopDomain || !accessToken) {
        return response(400, {
          success: false,
          error: 'shopDomain ve accessToken gerekli'
        });
      }

      // Domain formatını düzelt
      const formattedDomain = shopDomain.includes('.myshopify.com') 
        ? shopDomain 
        : `${shopDomain}.myshopify.com`;

      // Shopify'a test bağlantısı yap
      const shopify = new ShopifyAPI(formattedDomain, accessToken);
      const shopInfo = await shopify.getShopInfo();

      // Token'ı şifrele ve kaydet
      const encryptedToken = encryptToken(accessToken);

      // createStore artık UPSERT yapıyor (INSERT or UPDATE)
      console.log(`💾 Saving store: ${formattedDomain}`);
      
      const savedStore = await createStore(userId, {
        name: storeName || shopInfo.name,
        shopDomain: formattedDomain,
        accessToken: encryptedToken,
        shopInfo: {
          name: shopInfo.name,
          email: shopInfo.email,
          currency: shopInfo.currency,
          timezone: shopInfo.timezone,
          shopOwner: shopInfo.shop_owner
        }
      });
      
      console.log(`✅ Store saved successfully: ${formattedDomain} (ID: ${savedStore.id})`);

      return response(200, {
        success: true,
        message: 'Mağaza başarıyla kaydedildi',
        store: {
          id: savedStore.id.toString(),
          name: savedStore.name,
          shopDomain: savedStore.shop_domain,
          shopInfo: savedStore.shop_info
        }
      });
    }

    // DELETE - Mağazayı sil (soft delete)
    if (event.httpMethod === 'DELETE') {
      const storeId = event.queryStringParameters?.id;

      if (!storeId) {
        return response(400, {
          success: false,
          error: 'Store ID gerekli'
        });
      }

      const deletedStore = await deleteStore(storeId, userId);

      if (!deletedStore) {
        return response(404, {
          success: false,
          error: 'Mağaza bulunamadı'
        });
      }

      return response(200, {
        success: true,
        message: 'Mağaza silindi'
      });
    }

    return response(405, { error: 'Method not allowed' });

  } catch (error) {
    console.error('Stores API error:', error);
    return response(500, {
      success: false,
      error: error.message
    });
  }
};
