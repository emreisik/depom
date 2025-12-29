const { getIntegrations, getIntegrationById, createIntegration, deleteIntegration } = require('./utils/db');
const { handleCORS, response } = require('./utils/cors');

exports.handler = async (event, context) => {
  const corsResponse = handleCORS(event);
  if (corsResponse) return corsResponse;

  try {
    const userId = event.headers.authorization || 'demo-user';

    // GET - List integrations or get single
    if (event.httpMethod === 'GET') {
      const id = event.queryStringParameters?.id;

      if (id) {
        const integration = await getIntegrationById(id, userId);
        if (!integration) {
          return response(404, {
            success: false,
            error: 'Entegrasyon bulunamadı'
          });
        }
        return response(200, {
          success: true,
          data: integration
        });
      }

      const integrations = await getIntegrations(userId);
      return response(200, {
        success: true,
        data: integrations
      });
    }

    // POST - Create integration
    if (event.httpMethod === 'POST') {
      const { name, sourceStoreId, targetStoreId } = JSON.parse(event.body);

      if (!name || !sourceStoreId || !targetStoreId) {
        return response(400, {
          success: false,
          error: 'Entegrasyon adı, kaynak ve hedef mağaza gerekli'
        });
      }

      if (sourceStoreId === targetStoreId) {
        return response(400, {
          success: false,
          error: 'Kaynak ve hedef mağaza aynı olamaz'
        });
      }

      const integration = await createIntegration(userId, {
        name,
        sourceStoreId,
        targetStoreId
      });

      return response(201, {
        success: true,
        message: 'Entegrasyon oluşturuldu',
        data: integration
      });
    }

    // DELETE - Remove integration
    if (event.httpMethod === 'DELETE') {
      const id = event.queryStringParameters?.id;

      if (!id) {
        return response(400, {
          success: false,
          error: 'Entegrasyon ID gerekli'
        });
      }

      const integration = await deleteIntegration(id, userId);

      if (!integration) {
        return response(404, {
          success: false,
          error: 'Entegrasyon bulunamadı'
        });
      }

      return response(200, {
        success: true,
        message: 'Entegrasyon silindi'
      });
    }

    return response(405, { error: 'Method not allowed' });

  } catch (error) {
    console.error('Integrations API error:', error);
    return response(500, {
      success: false,
      error: error.message
    });
  }
};


