const { 
  getCollectionMappings, 
  createCollectionMapping, 
  deleteCollectionMapping,
  getIntegrationById 
} = require('./utils/db');
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

    // Integration kontrolü
    const integration = await getIntegrationById(integrationId, userId);
    if (!integration) {
      return response(404, {
        success: false,
        error: 'Entegrasyon bulunamadı'
      });
    }

    // GET - Mapping'leri getir
    if (event.httpMethod === 'GET') {
      const mappings = await getCollectionMappings(integrationId);
      
      return response(200, {
        success: true,
        data: mappings
      });
    }

    // POST - Yeni mapping oluştur
    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body);
      const { sourceCollectionId, sourceCollectionTitle, targetCollectionId, targetCollectionTitle } = body;

      if (!sourceCollectionId || !targetCollectionId) {
        return response(400, {
          success: false,
          error: 'Source ve target collection ID gerekli'
        });
      }

      const mapping = await createCollectionMapping(integrationId, {
        sourceCollectionId,
        sourceCollectionTitle,
        targetCollectionId,
        targetCollectionTitle
      });

      return response(201, {
        success: true,
        message: 'Koleksiyon eşleştirmesi oluşturuldu',
        data: mapping
      });
    }

    // DELETE - Mapping sil
    if (event.httpMethod === 'DELETE') {
      const { mappingId } = event.queryStringParameters || {};

      if (!mappingId) {
        return response(400, {
          success: false,
          error: 'Mapping ID gerekli'
        });
      }

      console.log(`🗑️ Koleksiyon eşleştirmesi siliniyor: mappingId=${mappingId}, integrationId=${integrationId}`);
      
      await deleteCollectionMapping(mappingId, integrationId);

      console.log('✅ Koleksiyon eşleştirmesi silindi');

      return response(200, {
        success: true,
        message: 'Eşleştirme silindi'
      });
    }

    return response(405, { error: 'Method not allowed' });

  } catch (error) {
    console.error('Collection mappings API error:', error);
    return response(500, {
      success: false,
      error: error.message
    });
  }
};
