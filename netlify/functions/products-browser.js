const { getStoreById } = require('./utils/db');
const { ShopifyAPI } = require('./utils/shopify');
const { decryptToken } = require('./utils/crypto');
const { handleCORS, response } = require('./utils/cors');

exports.handler = async (event, context) => {
  const corsResponse = handleCORS(event);
  if (corsResponse) return corsResponse;

  if (event.httpMethod !== 'GET') {
    return response(405, { error: 'Method not allowed' });
  }

  try {
    const { 
      storeId, 
      includeCollections,
      vendor,
      collectionId,
      hasStock
    } = event.queryStringParameters || {};
    const userId = event.headers.authorization || 'demo-user';

    if (!storeId) {
      return response(400, {
        success: false,
        error: 'Store ID gerekli'
      });
    }

    // Store bilgilerini al
    const store = await getStoreById(storeId, userId);
    if (!store) {
      return response(404, {
        success: false,
        error: 'Mağaza bulunamadı'
      });
    }

    // Shopify API client
    const shopify = new ShopifyAPI(
      store.shop_domain,
      decryptToken(store.access_token)
    );

    console.log(`📥 TÜM ürünler alınıyor: ${store.name}`);

    // TÜM ürünleri çek (pagination ile)
    const allProducts = await shopify.getAllProducts();
    
    console.log(`✅ Toplam ${allProducts.length} ürün alındı`);

    // Filtreleme uygula
    let products = allProducts;

    // 1. Vendor filtreleme
    if (vendor && vendor !== 'all') {
      console.log(`🔍 Vendor filtresi: ${vendor}`);
      products = products.filter(p => p.vendor === vendor);
    }

    // 2. Stok filtreleme
    if (hasStock === 'true') {
      console.log(`🔍 Stokta olan ürünler filtreleniyor...`);
      products = products.filter(p => {
        // Herhangi bir variant'ın stok miktarı > 0 ise
        return p.variants?.some(v => (v.inventory_quantity || 0) > 0);
      });
    }

    // 3. Collection filtreleme (API'den collection products'ı çekmek gerekir)
    if (collectionId && collectionId !== 'all') {
      console.log(`🔍 Collection filtresi: ${collectionId}`);
      try {
        const collectionProducts = await shopify.getCollectionProducts(collectionId);
        const collectionProductIds = new Set(collectionProducts.map(p => String(p.id)));
        products = products.filter(p => collectionProductIds.has(String(p.id)));
      } catch (err) {
        console.error('Collection products fetch error:', err);
      }
    }

    console.log(`✅ Filtreleme sonrası: ${products.length} ürün`);

    // İstatistikler (tüm ürünlerden)
    const vendors = new Set();
    const collections = new Set();
    let totalVariants = 0;

    allProducts.forEach(product => {
      if (product.vendor) vendors.add(product.vendor);
      totalVariants += product.variants?.length || 0;
    });

    // Vendor'lara göre grupla
    const vendorGroups = {};
    products.forEach(product => {
      const vendor = product.vendor || 'No Vendor';
      if (!vendorGroups[vendor]) {
        vendorGroups[vendor] = {
          vendor,
          productCount: 0,
          products: []
        };
      }
      vendorGroups[vendor].productCount++;
      vendorGroups[vendor].products.push({
        id: product.id,
        title: product.title,
        variants: product.variants?.length || 0,
        image: product.images?.[0]?.src || null
      });
    });

    const vendorList = Object.values(vendorGroups).sort((a, b) => b.productCount - a.productCount);

    // Collections çek (isteğe bağlı)
    let collectionsData = null;
    if (includeCollections === 'true') {
      console.log(`📚 Koleksiyonlar alınıyor...`);
      collectionsData = await shopify.getAllCollections();
    }

    return response(200, {
      success: true,
      data: {
        store: {
          id: store.id,
          name: store.name,
          domain: store.shop_domain
        },
        stats: {
          totalProducts: allProducts.length,
          filteredProducts: products.length,
          totalVariants: totalVariants,
          totalVendors: vendors.size,
          totalCollections: collectionsData ? collectionsData.length : 0
        },
        filters: {
          vendor: vendor || null,
          collectionId: collectionId || null,
          hasStock: hasStock === 'true'
        },
        vendors: vendorList,
        collections: collectionsData,
        products: products.map(p => ({
          id: p.id,
          title: p.title,
          vendor: p.vendor,
          productType: p.product_type,
          tags: p.tags,
          image: p.images?.[0]?.src,
          variantsCount: p.variants?.length || 0,
          status: p.status,
          hasStock: p.variants?.some(v => (v.inventory_quantity || 0) > 0)
        }))
      }
    });

  } catch (error) {
    console.error('Products browser error:', error);
    return response(500, {
      success: false,
      error: error.message
    });
  }
};

