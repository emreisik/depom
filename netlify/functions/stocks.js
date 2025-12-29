const { getStores, getStoreById, updateStore } = require('./utils/db');
const { ShopifyAPI } = require('./utils/shopify');
const { decryptToken } = require('./utils/crypto');
const { handleCORS, response } = require('./utils/cors');

async function getStoreInventory(store) {
  try {
    const accessToken = decryptToken(store.access_token);
    const shopify = new ShopifyAPI(store.shop_domain, accessToken);

    // Paralel olarak products ve locations'ı al
    const [products, locations] = await Promise.all([
      shopify.getProducts(),
      shopify.getLocations()
    ]);

    console.log(`📦 Store: ${store.name} - Products: ${products?.length || 0}, Locations: ${locations?.length || 0}`);

    // Güvenlik kontrolleri
    if (!products || !Array.isArray(products)) {
      console.error(`❌ Products is not an array for ${store.name}:`, products);
      throw new Error('Products could not be fetched');
    }

    if (!locations || !Array.isArray(locations)) {
      console.error(`❌ Locations is not an array for ${store.name}:`, locations);
      throw new Error('Locations could not be fetched');
    }

    const inventory = [];

    // Her location için inventory bilgilerini al
    for (const location of locations) {
      let inventoryLevels = [];
      
      try {
        inventoryLevels = await shopify.getInventoryLevels(location.id);
        // inventoryLevels array değilse boş array yap
        if (!Array.isArray(inventoryLevels)) {
          inventoryLevels = [];
        }
      } catch (error) {
        console.error(`Error fetching inventory levels for location ${location.id}:`, error.message);
        inventoryLevels = [];
      }

      const locationProducts = products.map(product => {
        const variant = product.variants?.[0];
        if (!variant) {
          return null; // Variant yoksa atla
        }

        const invLevel = inventoryLevels.find(
          inv => inv.inventory_item_id === variant.inventory_item_id
        );

        return {
          productId: product.id,
          variantId: variant.id,
          title: product.title,
          sku: variant.sku || 'N/A',
          price: variant.price,
          compareAtPrice: variant.compare_at_price,
          inventory: invLevel ? invLevel.available : 0,
          inventoryItemId: variant.inventory_item_id,
          image: product.image?.src || null
        };
      }).filter(p => p !== null); // null olanları filtrele

      inventory.push({
        location: location.name,
        locationId: location.id,
        products: locationProducts
      });
    }

    return {
      storeId: store.id.toString(),
      storeName: store.name,
      shopDomain: store.shop_domain,
      currency: store.shop_info?.currency || 'USD',
      inventory,
      success: true
    };

  } catch (error) {
    console.error(`Error fetching inventory for ${store.name}:`, error.message);
    return {
      storeId: store.id.toString(),
      storeName: store.name,
      shopDomain: store.shop_domain,
      error: error.message,
      success: false
    };
  }
}

exports.handler = async (event, context) => {
  // Handle CORS
  const corsResponse = handleCORS(event);
  if (corsResponse) return corsResponse;

  if (event.httpMethod !== 'GET') {
    return response(405, { error: 'Method not allowed' });
  }

  try {
    const userId = event.headers.authorization || 'demo-user';
    const storeId = event.queryStringParameters?.storeId;

    let userStores;
    
    if (storeId) {
      const store = await getStoreById(storeId, userId);
      userStores = store ? [store] : [];
    } else {
      userStores = await getStores(userId);
    }

    if (userStores.length === 0) {
      return response(404, {
        success: false,
        error: 'Mağaza bulunamadı'
      });
    }

    // Tüm mağazaların stok bilgilerini paralel olarak çek
    const inventoryPromises = userStores.map(store => getStoreInventory(store));
    const allInventory = await Promise.all(inventoryPromises);

    // Başarılı olan mağazalar için lastSync'i güncelle
    const successfulStores = allInventory.filter(inv => inv.success);
    for (const inv of successfulStores) {
      await updateStore(inv.storeId, userId, { lastSync: new Date() });
    }

    // İstatistikler hesapla
    const stats = {
      totalStores: allInventory.length,
      successfulStores: successfulStores.length,
      totalProducts: allInventory.reduce((sum, store) => {
        if (!store.success) return sum;
        return sum + store.inventory.reduce((pSum, loc) => pSum + loc.products.length, 0);
      }, 0),
      totalLocations: allInventory.reduce((sum, store) => {
        return sum + (store.inventory?.length || 0);
      }, 0),
      lowStockCount: allInventory.reduce((sum, store) => {
        if (!store.success) return sum;
        return sum + store.inventory.reduce((pSum, loc) => {
          return pSum + loc.products.filter(p => p.inventory > 0 && p.inventory < 10).length;
        }, 0);
      }, 0),
      outOfStockCount: allInventory.reduce((sum, store) => {
        if (!store.success) return sum;
        return sum + store.inventory.reduce((pSum, loc) => {
          return pSum + loc.products.filter(p => p.inventory === 0).length;
        }, 0);
      }, 0)
    };

    return response(200, {
      success: true,
      data: allInventory,
      stats
    });

  } catch (error) {
    console.error('Stocks API error:', error);
    return response(500, {
      success: false,
      error: error.message
    });
  }
};
