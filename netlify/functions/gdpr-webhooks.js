const crypto = require('crypto');
const { handleCORS, response } = require('./utils/cors');

/**
 * GDPR Compliance Webhooks
 * Shopify App Store için zorunlu 3 webhook:
 * 1. customers/data_request - Müşteri verilerini döndür
 * 2. customers/redact - Müşteri verilerini sil
 * 3. shop/redact - Mağaza verilerini sil (app uninstall)
 */

exports.handler = async (event, context) => {
  const corsResponse = handleCORS(event);
  if (corsResponse) return corsResponse;

  try {
    // Webhook doğrulama
    const hmac = event.headers['x-shopify-hmac-sha256'];
    const isValid = verifyWebhook(event.body, hmac);

    if (!isValid) {
      console.error('❌ Invalid webhook signature');
      return response(401, { error: 'Unauthorized' });
    }

    const webhookData = JSON.parse(event.body);
    const topic = event.headers['x-shopify-topic'];

    console.log(`📨 GDPR Webhook received: ${topic}`);

    switch (topic) {
      case 'customers/data_request':
        await handleCustomerDataRequest(webhookData);
        break;

      case 'customers/redact':
        await handleCustomerRedact(webhookData);
        break;

      case 'shop/redact':
        await handleShopRedact(webhookData);
        break;

      default:
        console.log(`⚠️  Unknown GDPR webhook topic: ${topic}`);
    }

    return response(200, { success: true });

  } catch (error) {
    console.error('❌ GDPR webhook error:', error.message);
    return response(500, { error: error.message });
  }
};

/**
 * 1. Customer Data Request
 * Müşterinin tüm verilerini döndür
 */
async function handleCustomerDataRequest(data) {
  const { shop_domain, customer } = data;

  console.log(`📋 Customer data request for: ${customer.email} from ${shop_domain}`);

  // TODO: Müşteri verilerini topla ve Shopify'a gönder
  // Not: Depom müşteri verisi saklamıyor, sadece ürün/stok bilgisi tutuyor
  // Bu yüzden boş response dönebiliriz

  // Gerçek uygulamada: Müşteri ile ilgili tüm verileri topla
  // ve Shopify'ın belirttiği endpoint'e POST et

  return {
    customer_id: customer.id,
    customer_email: customer.email,
    data: 'No customer data stored in Depom app'
  };
}

/**
 * 2. Customer Redact
 * Müşteri verilerini sil
 */
async function handleCustomerRedact(data) {
  const { shop_domain, customer } = data;

  console.log(`🗑️  Customer redact request for: ${customer.email} from ${shop_domain}`);

  // TODO: Müşteri ile ilgili tüm verileri database'den sil
  // Depom müşteri verisi saklamıyor ama log kayıtlarında varsa temizle

  const pool = await require('./utils/db').connectToDatabase();
  
  // Sync logs'da customer reference varsa temizle (opsiyonel)
  // await pool.query('DELETE FROM sync_logs WHERE customer_email = $1', [customer.email]);

  console.log(`✅ Customer data redacted: ${customer.email}`);
}

/**
 * 3. Shop Redact
 * App uninstall edildiğinde mağaza verilerini sil
 */
async function handleShopRedact(data) {
  const { shop_domain } = data;

  console.log(`🗑️  Shop redact request for: ${shop_domain}`);

  try {
    const pool = await require('./utils/db').connectToDatabase();

    // Mağazayı soft delete (48 saat sonra kalıcı silinebilir)
    await pool.query(`
      UPDATE stores 
      SET is_active = false, updated_at = NOW() 
      WHERE shop_domain = $1
    `, [shop_domain]);

    console.log(`✅ Shop data redacted: ${shop_domain}`);

    // İlgili tüm verileri temizle (opsiyonel - 48 saat sonra yapılabilir)
    // await pool.query('DELETE FROM sync_logs WHERE integration_id IN (SELECT id FROM integrations WHERE source_store_id IN (SELECT id FROM stores WHERE shop_domain = $1))', [shop_domain]);
    // await pool.query('DELETE FROM integrations WHERE source_store_id IN (SELECT id FROM stores WHERE shop_domain = $1)', [shop_domain]);

  } catch (error) {
    console.error(`❌ Shop redact failed for ${shop_domain}:`, error.message);
    throw error;
  }
}

/**
 * Webhook HMAC doğrulama
 */
function verifyWebhook(body, hmac) {
  if (!hmac) return false;

  const hash = crypto
    .createHmac('sha256', process.env.SHOPIFY_API_SECRET)
    .update(body, 'utf8')
    .digest('base64');

  return hash === hmac;
}

