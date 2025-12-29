const { getSyncLogs, getSyncLogById, getIntegrationById } = require('./utils/db');
const { handleCORS, response } = require('./utils/cors');

exports.handler = async (event, context) => {
  const corsResponse = handleCORS(event);
  if (corsResponse) return corsResponse;

  if (event.httpMethod !== 'GET') {
    return response(405, { error: 'Method not allowed' });
  }

  try {
    const userId = event.headers.authorization || 'demo-user';
    const { integrationId, logId, limit } = event.queryStringParameters || {};

    // Tek bir log detayı getir
    if (logId) {
      const log = await getSyncLogById(logId);
      
      if (!log) {
        return response(404, {
          success: false,
          error: 'Log bulunamadı'
        });
      }

      return response(200, {
        success: true,
        data: log
      });
    }

    // Integration'a ait logları getir
    if (integrationId) {
      // Integration'ın bu user'a ait olduğunu kontrol et
      const integration = await getIntegrationById(integrationId, userId);
      if (!integration) {
        return response(404, {
          success: false,
          error: 'Entegrasyon bulunamadı'
        });
      }

      const logs = await getSyncLogs(integrationId, limit ? parseInt(limit) : 10);
      
      return response(200, {
        success: true,
        data: logs
      });
    }

    return response(400, {
      success: false,
      error: 'Integration ID veya Log ID gerekli'
    });

  } catch (error) {
    console.error('Sync logs API error:', error);
    return response(500, {
      success: false,
      error: error.message
    });
  }
};


