const { getSettings, updateSettings } = require('./utils/db');
const { handleCORS, response } = require('./utils/cors');

exports.handler = async (event, context) => {
  const corsResponse = handleCORS(event);
  if (corsResponse) return corsResponse;

  try {
    const userId = event.headers.authorization || 'demo-user';

    // GET - Ayarları getir
    if (event.httpMethod === 'GET') {
      const settings = await getSettings(userId);

      return response(200, {
        success: true,
        data: {
          userId: settings.user_id,
          syncTitle: settings.sync_title,
          syncDescription: settings.sync_description,
          syncPrice: settings.sync_price,
          syncComparePrice: settings.sync_compare_price,
          syncSKU: settings.sync_sku,
          syncBarcode: settings.sync_barcode,
          syncInventory: settings.sync_inventory,
          syncImages: settings.sync_images,
          syncTags: settings.sync_tags,
          syncVendor: settings.sync_vendor,
          syncProductType: settings.sync_product_type,
          syncWeight: settings.sync_weight,
          syncStatus: settings.sync_status,
          autoSync: settings.auto_sync,
          syncInterval: settings.sync_interval,
          createdAt: settings.created_at,
          updatedAt: settings.updated_at
        }
      });
    }

    // PUT/POST - Ayarları güncelle
    if (event.httpMethod === 'PUT' || event.httpMethod === 'POST') {
      const newSettings = JSON.parse(event.body);
      
      const updatedSettings = await updateSettings(userId, newSettings);

      return response(200, {
        success: true,
        message: 'Ayarlar başarıyla güncellendi',
        data: {
          userId: updatedSettings.user_id,
          syncTitle: updatedSettings.sync_title,
          syncDescription: updatedSettings.sync_description,
          syncPrice: updatedSettings.sync_price,
          syncComparePrice: updatedSettings.sync_compare_price,
          syncSKU: updatedSettings.sync_sku,
          syncBarcode: updatedSettings.sync_barcode,
          syncInventory: updatedSettings.sync_inventory,
          syncImages: updatedSettings.sync_images,
          syncTags: updatedSettings.sync_tags,
          syncVendor: updatedSettings.sync_vendor,
          syncProductType: updatedSettings.sync_product_type,
          syncWeight: updatedSettings.sync_weight,
          syncStatus: updatedSettings.sync_status,
          autoSync: updatedSettings.auto_sync,
          syncInterval: updatedSettings.sync_interval
        }
      });
    }

    return response(405, { error: 'Method not allowed' });

  } catch (error) {
    console.error('Settings error:', error);
    return response(500, {
      success: false,
      error: error.message
    });
  }
};
