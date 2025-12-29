const { query } = require('./utils/db');
const { encryptToken } = require('./utils/crypto');
const axios = require('axios');
const crypto = require('crypto');
const { handleCORS, response } = require('./utils/cors');

/**
 * OAuth 2.0 Callback Handler
 * Shopify'dan gelen authorization code'u access token'a çevirir
 */
exports.handler = async (event, context) => {
  const corsResponse = handleCORS(event);
  if (corsResponse) return corsResponse;

  try {
    const { shop, code, hmac, timestamp, state } = event.queryStringParameters || {};

    // Gerekli parametreleri kontrol et
    if (!shop || !code) {
      return response(400, {
        success: false,
        error: 'Missing shop or code parameter'
      });
    }

    // HMAC doğrulama (security)
    const isValid = validateHmac(event.queryStringParameters);
    if (!isValid) {
      console.error('❌ Invalid HMAC signature');
      return response(403, {
        success: false,
        error: 'Invalid HMAC signature'
      });
    }

    // Access token al
    const tokenResponse = await axios.post(
      `https://${shop}/admin/oauth/access_token`,
      {
        client_id: process.env.SHOPIFY_API_KEY,
        client_secret: process.env.SHOPIFY_API_SECRET,
        code
      }
    );

    const { access_token, scope } = tokenResponse.data;

    // Shop bilgilerini al
    const shopResponse = await axios.get(
      `https://${shop}/admin/api/2024-01/shop.json`,
      {
        headers: {
          'X-Shopify-Access-Token': access_token
        }
      }
    );

    const shopInfo = shopResponse.data.shop;

    // Encrypted token
    const encryptedToken = encryptToken(access_token);

    // Database'e kaydet (veya güncelle)
    const pool = await require('./utils/db').connectToDatabase();
    
    await pool.query(`
      INSERT INTO stores (user_id, name, shop_domain, access_token, shop_info, is_active, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, true, NOW(), NOW())
      ON CONFLICT (user_id, shop_domain) 
      DO UPDATE SET 
        access_token = $4,
        shop_info = $5,
        is_active = true,
        updated_at = NOW()
    `, [
      'oauth-' + shop, // OAuth kullanıcıları için özel prefix
      shopInfo.name || shop,
      shop,
      encryptedToken,
      JSON.stringify({
        name: shopInfo.name,
        email: shopInfo.email,
        currency: shopInfo.currency,
        timezone: shopInfo.iana_timezone,
        shopOwner: shopInfo.shop_owner
      })
    ]);

    console.log(`✅ Store authenticated: ${shop}`);

    // Shopify Admin'e yönlendir veya embedded app'e
    const redirectUrl = `https://${shop}/admin/apps/${process.env.SHOPIFY_API_KEY}`;
    
    return {
      statusCode: 302,
      headers: {
        'Location': redirectUrl,
        'Access-Control-Allow-Origin': '*'
      },
      body: ''
    };

  } catch (error) {
    console.error('❌ OAuth error:', error.message);
    
    return response(500, {
      success: false,
      error: 'Authentication failed: ' + error.message
    });
  }
};

/**
 * HMAC imzasını doğrula (Shopify security)
 */
function validateHmac(params) {
  const { hmac, ...rest } = params;
  
  if (!hmac) return false;

  // Parametreleri sırala ve query string oluştur
  const sortedParams = Object.keys(rest)
    .sort()
    .map(key => `${key}=${rest[key]}`)
    .join('&');

  // HMAC hesapla
  const hash = crypto
    .createHmac('sha256', process.env.SHOPIFY_API_SECRET)
    .update(sortedParams)
    .digest('hex');

  return hash === hmac;
}

