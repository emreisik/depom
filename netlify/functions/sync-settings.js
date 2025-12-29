const { getSyncSettings, updateSyncSettings, getIntegrationById } = require('./utils/db');
const { handleCORS, response } = require('./utils/cors');

exports.handler = async (event, context) => {
  const corsResponse = handleCORS(event);
  if (corsResponse) return corsResponse;

  try {
    const userId = event.headers.authorization || 'demo-user';
    const { integrationId } = event.queryStringParameters || {};

    if (!integrationId) {
      return response(400, {
        success: false,
        error: 'Integration ID gerekli'
      });
    }

    // Integration'ın bu user'a ait olduğunu kontrol et
    const integration = await getIntegrationById(integrationId, userId);
    if (!integration) {
      return response(404, {
        success: false,
        error: 'Entegrasyon bulunamadı'
      });
    }

    // GET - Ayarları getir
    if (event.httpMethod === 'GET') {
      const settings = await getSyncSettings(integrationId);
      
      return response(200, {
        success: true,
        data: settings
      });
    }

    // PUT - Ayarları güncelle
    if (event.httpMethod === 'PUT') {
      const body = JSON.parse(event.body);
      
      console.log('📝 Sync settings güncelleniyor:', {
        integrationId,
        settingsCount: Object.keys(body).length,
        settings: body
      });
      
      // Tüm gönderilen ayarları kaydet (dynamic fields)
      const updatedSettings = await updateSyncSettings(integrationId, body);

      console.log('✅ Sync settings kaydedildi:', updatedSettings);

      return response(200, {
        success: true,
        message: 'Ayarlar güncellendi',
        data: updatedSettings
      });
    }

    return response(405, { error: 'Method not allowed' });

  } catch (error) {
    console.error('Sync settings API error:', error);
    return response(500, {
      success: false,
      error: error.message
    });
  }
};

