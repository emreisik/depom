const crypto = require('crypto');
const { handleCORS, response } = require('./utils/cors');

/**
 * Shopify App Installation Handler
 * Kullanıcıyı Shopify OAuth flow'una yönlendirir
 */
exports.handler = async (event, context) => {
  const corsResponse = handleCORS(event);
  if (corsResponse) return corsResponse;

  try {
    const { shop } = event.queryStringParameters || {};

    if (!shop) {
      return response(400, {
        success: false,
        error: 'Missing shop parameter. Usage: /api/install?shop=your-store.myshopify.com'
      });
    }

    // Shop domain formatını kontrol et
    const shopDomain = shop.includes('.myshopify.com') ? shop : `${shop}.myshopify.com`;

    // Shopify API credentials
    const apiKey = process.env.SHOPIFY_API_KEY;
    const scopes = process.env.SHOPIFY_SCOPES || 'read_products,write_products,read_inventory,write_inventory';
    const redirectUri = `${process.env.APP_URL}/api/auth-callback`;
    
    // State parameter (CSRF protection)
    const state = crypto.randomBytes(16).toString('hex');
    
    // OAuth URL oluştur
    const installUrl = `https://${shopDomain}/admin/oauth/authorize?` +
      `client_id=${apiKey}&` +
      `scope=${scopes}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `state=${state}&` +
      `grant_options[]=per-user`;

    console.log(`🔐 Redirecting to Shopify OAuth: ${shopDomain}`);

    // Shopify OAuth'a yönlendir
    return {
      statusCode: 302,
      headers: {
        'Location': installUrl,
        'Access-Control-Allow-Origin': '*'
      },
      body: ''
    };

  } catch (error) {
    console.error('❌ Installation error:', error.message);
    
    return response(500, {
      success: false,
      error: 'Installation failed: ' + error.message
    });
  }
};

