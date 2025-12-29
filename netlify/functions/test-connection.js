const { ShopifyAPI } = require('./utils/shopify');
const { handleCORS, response } = require('./utils/cors');

exports.handler = async (event, context) => {
  // Handle CORS
  const corsResponse = handleCORS(event);
  if (corsResponse) return corsResponse;

  if (event.httpMethod !== 'POST') {
    return response(405, { error: 'Method not allowed' });
  }

  try {
    const { shopDomain, accessToken } = JSON.parse(event.body);

    if (!shopDomain || !accessToken) {
      return response(400, {
        success: false,
        error: 'shopDomain ve accessToken gerekli'
      });
    }

    // Shopify API'ye bağlan ve test et
    const shopify = new ShopifyAPI(shopDomain, accessToken);
    const shop = await shopify.getShopInfo();

    return response(200, {
      success: true,
      message: 'Bağlantı başarılı! ✅',
      shopInfo: {
        name: shop.name,
        email: shop.email,
        domain: shop.domain,
        currency: shop.currency,
        timezone: shop.timezone,
        shopOwner: shop.shop_owner
      }
    });

  } catch (error) {
    console.error('Connection test error:', error);
    
    return response(400, {
      success: false,
      error: error.message || 'Bağlantı hatası'
    });
  }
};


