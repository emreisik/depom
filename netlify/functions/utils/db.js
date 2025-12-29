const { Pool } = require('pg');

let pool = null;

async function connectToDatabase() {
  if (pool) {
    return pool;
  }

  // Neon PostgreSQL connection
  pool = new Pool({
    connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
    ssl: { rejectUnauthorized: false },
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });

  // Test connection
  try {
    await pool.query('SELECT NOW()');
    console.log('✅ Neon PostgreSQL bağlantısı başarılı');
  } catch (error) {
    console.error('❌ PostgreSQL bağlantı hatası:', error);
    throw error;
  }

  // Create tables if they don't exist
  await initializeTables(pool);

  return pool;
}

async function initializeTables(pool) {
  const client = await pool.connect();
  
  try {
    // Stores table
    await client.query(`
      CREATE TABLE IF NOT EXISTS stores (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        shop_domain VARCHAR(255) NOT NULL,
        access_token TEXT NOT NULL,
        shop_info JSONB,
        is_active BOOLEAN DEFAULT true,
        last_sync TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, shop_domain)
      )
    `);

    // Settings table
    await client.query(`
      CREATE TABLE IF NOT EXISTS settings (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL UNIQUE,
        sync_title BOOLEAN DEFAULT true,
        sync_description BOOLEAN DEFAULT true,
        sync_price BOOLEAN DEFAULT true,
        sync_compare_price BOOLEAN DEFAULT true,
        sync_sku BOOLEAN DEFAULT true,
        sync_barcode BOOLEAN DEFAULT true,
        sync_inventory BOOLEAN DEFAULT true,
        sync_images BOOLEAN DEFAULT true,
        sync_tags BOOLEAN DEFAULT true,
        sync_vendor BOOLEAN DEFAULT true,
        sync_product_type BOOLEAN DEFAULT true,
        sync_weight BOOLEAN DEFAULT true,
        sync_status BOOLEAN DEFAULT true,
        auto_sync BOOLEAN DEFAULT false,
        sync_interval VARCHAR(50) DEFAULT 'manual',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Integrations table (updated with new fields)
    await client.query(`
      CREATE TABLE IF NOT EXISTS integrations (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        source_store_id INTEGER NOT NULL,
        target_store_id INTEGER NOT NULL,
        is_active BOOLEAN DEFAULT true,
        status VARCHAR(20) DEFAULT 'active',
        last_sync TIMESTAMP,
        last_sync_status VARCHAR(20),
        total_syncs INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_source_store FOREIGN KEY (source_store_id) REFERENCES stores(id) ON DELETE CASCADE,
        CONSTRAINT fk_target_store FOREIGN KEY (target_store_id) REFERENCES stores(id) ON DELETE CASCADE,
        UNIQUE(user_id, source_store_id, target_store_id)
      )
    `);

    // Add new columns to existing integrations table (migration)
    try {
      await client.query(`ALTER TABLE integrations ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active'`);
      await client.query(`ALTER TABLE integrations ADD COLUMN IF NOT EXISTS last_sync_status VARCHAR(20)`);
      await client.query(`ALTER TABLE integrations ADD COLUMN IF NOT EXISTS total_syncs INTEGER DEFAULT 0`);
      
      // Add new sync settings columns for detailed product sync control
      await client.query(`ALTER TABLE sync_settings ADD COLUMN IF NOT EXISTS sync_title BOOLEAN DEFAULT true`);
      await client.query(`ALTER TABLE sync_settings ADD COLUMN IF NOT EXISTS sync_description BOOLEAN DEFAULT true`);
      await client.query(`ALTER TABLE sync_settings ADD COLUMN IF NOT EXISTS sync_price BOOLEAN DEFAULT true`);
      await client.query(`ALTER TABLE sync_settings ADD COLUMN IF NOT EXISTS sync_compare_at_price BOOLEAN DEFAULT true`);
      await client.query(`ALTER TABLE sync_settings ADD COLUMN IF NOT EXISTS sync_sku BOOLEAN DEFAULT true`);
      await client.query(`ALTER TABLE sync_settings ADD COLUMN IF NOT EXISTS sync_barcode BOOLEAN DEFAULT true`);
      await client.query(`ALTER TABLE sync_settings ADD COLUMN IF NOT EXISTS sync_tags BOOLEAN DEFAULT true`);
      await client.query(`ALTER TABLE sync_settings ADD COLUMN IF NOT EXISTS sync_vendor BOOLEAN DEFAULT true`);
      await client.query(`ALTER TABLE sync_settings ADD COLUMN IF NOT EXISTS sync_product_type BOOLEAN DEFAULT true`);
      await client.query(`ALTER TABLE sync_settings ADD COLUMN IF NOT EXISTS sync_weight BOOLEAN DEFAULT true`);
      await client.query(`ALTER TABLE sync_settings ADD COLUMN IF NOT EXISTS sync_published BOOLEAN DEFAULT true`);
    } catch (err) {
      // Column might already exist, ignore error
      console.log('⚠️ Migration warning (can be ignored):', err.message);
    }

    // Sync logs table
    await client.query(`
      CREATE TABLE IF NOT EXISTS sync_logs (
        id SERIAL PRIMARY KEY,
        integration_id INTEGER NOT NULL,
        sync_type VARCHAR(50) NOT NULL,
        status VARCHAR(20) DEFAULT 'running',
        total_products INTEGER DEFAULT 0,
        products_created INTEGER DEFAULT 0,
        products_updated INTEGER DEFAULT 0,
        products_failed INTEGER DEFAULT 0,
        products_skipped INTEGER DEFAULT 0,
        inventory_updated INTEGER DEFAULT 0,
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP,
        duration_seconds INTEGER,
        error_message TEXT,
        details JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_sync_integration FOREIGN KEY (integration_id) REFERENCES integrations(id) ON DELETE CASCADE
      )
    `);

    // Product mappings table
    await client.query(`
      CREATE TABLE IF NOT EXISTS product_mappings (
        id SERIAL PRIMARY KEY,
        integration_id INTEGER NOT NULL,
        source_product_id VARCHAR(255) NOT NULL,
        target_product_id VARCHAR(255) NOT NULL,
        sku VARCHAR(255),
        mapping_type VARCHAR(50) DEFAULT 'auto_sku',
        last_synced TIMESTAMP,
        sync_count INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_mapping_integration FOREIGN KEY (integration_id) REFERENCES integrations(id) ON DELETE CASCADE,
        UNIQUE(integration_id, source_product_id, target_product_id)
      )
    `);

    // Sync settings table
    await client.query(`
      CREATE TABLE IF NOT EXISTS sync_settings (
        id SERIAL PRIMARY KEY,
        integration_id INTEGER NOT NULL UNIQUE,
        auto_sync BOOLEAN DEFAULT false,
        sync_frequency VARCHAR(50) DEFAULT 'manual',
        sync_new_products BOOLEAN DEFAULT true,
        sync_inventory BOOLEAN DEFAULT true,
        sync_prices BOOLEAN DEFAULT false,
        sync_images BOOLEAN DEFAULT false,
        sync_descriptions BOOLEAN DEFAULT false,
        vendor_filter TEXT[],
        tag_filter TEXT[],
        notify_on_error BOOLEAN DEFAULT true,
        notify_on_complete BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_settings_integration FOREIGN KEY (integration_id) REFERENCES integrations(id) ON DELETE CASCADE
      )
    `);

    // Collection mappings table
    await client.query(`
      CREATE TABLE IF NOT EXISTS collection_mappings (
        id SERIAL PRIMARY KEY,
        integration_id INTEGER NOT NULL,
        source_collection_id VARCHAR(255) NOT NULL,
        target_collection_id VARCHAR(255) NOT NULL,
        source_collection_title VARCHAR(255),
        target_collection_title VARCHAR(255),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_collection_integration FOREIGN KEY (integration_id) REFERENCES integrations(id) ON DELETE CASCADE,
        UNIQUE(integration_id, source_collection_id)
      )
    `);

    console.log('✅ Database tables initialized');
  } catch (error) {
    console.error('Error initializing tables:', error);
  } finally {
    client.release();
  }
}

// Helper functions for common operations
async function getStores(userId) {
  const pool = await connectToDatabase();
  const result = await pool.query(
    'SELECT * FROM stores WHERE user_id = $1 AND is_active = true ORDER BY created_at DESC',
    [userId]
  );
  return result.rows;
}

async function getStoreById(storeId, userId) {
  const pool = await connectToDatabase();
  const result = await pool.query(
    'SELECT * FROM stores WHERE id = $1 AND user_id = $2',
    [storeId, userId]
  );
  return result.rows[0];
}

async function createStore(userId, storeData) {
  const pool = await connectToDatabase();
  const result = await pool.query(
    `INSERT INTO stores (user_id, name, shop_domain, access_token, shop_info) 
     VALUES ($1, $2, $3, $4, $5) 
     ON CONFLICT (user_id, shop_domain) 
     DO UPDATE SET 
       name = EXCLUDED.name,
       access_token = EXCLUDED.access_token,
       shop_info = EXCLUDED.shop_info,
       updated_at = CURRENT_TIMESTAMP,
       is_active = true
     RETURNING *`,
    [userId, storeData.name, storeData.shopDomain, storeData.accessToken, JSON.stringify(storeData.shopInfo)]
  );
  return result.rows[0];
}

async function updateStore(storeId, userId, updates) {
  const pool = await connectToDatabase();
  const setClause = [];
  const values = [];
  let paramIndex = 1;

  Object.keys(updates).forEach(key => {
    if (key === 'shopInfo') {
      setClause.push(`shop_info = $${paramIndex}`);
      values.push(JSON.stringify(updates[key]));
    } else if (key === 'lastSync') {
      setClause.push(`last_sync = $${paramIndex}`);
      values.push(updates[key]);
    } else if (key === 'isActive') {
      setClause.push(`is_active = $${paramIndex}`);
      values.push(updates[key]);
    }
    paramIndex++;
  });

  setClause.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(storeId, userId);

  const result = await pool.query(
    `UPDATE stores SET ${setClause.join(', ')} WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1} RETURNING *`,
    values
  );
  return result.rows[0];
}

async function deleteStore(storeId, userId) {
  const pool = await connectToDatabase();
  const result = await pool.query(
    'UPDATE stores SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND user_id = $2 RETURNING *',
    [storeId, userId]
  );
  return result.rows[0];
}

async function getSettings(userId) {
  const pool = await connectToDatabase();
  let result = await pool.query(
    'SELECT * FROM settings WHERE user_id = $1',
    [userId]
  );

  if (result.rows.length === 0) {
    // Create default settings
    result = await pool.query(
      `INSERT INTO settings (user_id) VALUES ($1) RETURNING *`,
      [userId]
    );
  }

  return result.rows[0];
}

async function updateSettings(userId, settings) {
  const pool = await connectToDatabase();
  
  const setClause = [];
  const values = [];
  let paramIndex = 1;

  const fieldMap = {
    syncTitle: 'sync_title',
    syncDescription: 'sync_description',
    syncPrice: 'sync_price',
    syncComparePrice: 'sync_compare_price',
    syncSKU: 'sync_sku',
    syncBarcode: 'sync_barcode',
    syncInventory: 'sync_inventory',
    syncImages: 'sync_images',
    syncTags: 'sync_tags',
    syncVendor: 'sync_vendor',
    syncProductType: 'sync_product_type',
    syncWeight: 'sync_weight',
    syncStatus: 'sync_status',
    autoSync: 'auto_sync',
    syncInterval: 'sync_interval'
  };

  Object.keys(settings).forEach(key => {
    if (fieldMap[key]) {
      setClause.push(`${fieldMap[key]} = $${paramIndex}`);
      values.push(settings[key]);
      paramIndex++;
    }
  });

  if (setClause.length === 0) {
    // No valid fields to update, just return current settings
    return await getSettings(userId);
  }

  setClause.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(userId);

  // Try to update first
  const updateResult = await pool.query(
    `UPDATE settings SET ${setClause.join(', ')} WHERE user_id = $${paramIndex} RETURNING *`,
    values
  );

  if (updateResult.rows.length > 0) {
    return updateResult.rows[0];
  }

  // If no rows updated, insert new record with default values then update
  await pool.query(
    `INSERT INTO settings (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING`,
    [userId]
  );

  // Now update with the provided values
  const secondUpdate = await pool.query(
    `UPDATE settings SET ${setClause.join(', ')} WHERE user_id = $${paramIndex} RETURNING *`,
    values
  );

  return secondUpdate.rows[0];
}

// Integrations CRUD
async function getIntegrations(userId) {
  const pool = await connectToDatabase();
  const result = await pool.query(
    `SELECT i.*, 
      s1.name as source_store_name, s1.shop_domain as source_store_domain,
      s2.name as target_store_name, s2.shop_domain as target_store_domain
     FROM integrations i
     JOIN stores s1 ON i.source_store_id = s1.id
     JOIN stores s2 ON i.target_store_id = s2.id
     WHERE i.user_id = $1 AND i.is_active = true
     ORDER BY i.created_at DESC`,
    [userId]
  );
  return result.rows;
}

async function getIntegrationById(integrationId, userId) {
  const pool = await connectToDatabase();
  const result = await pool.query(
    `SELECT i.*, 
      s1.name as source_store_name, s1.shop_domain as source_store_domain,
      s2.name as target_store_name, s2.shop_domain as target_store_domain
     FROM integrations i
     JOIN stores s1 ON i.source_store_id = s1.id
     JOIN stores s2 ON i.target_store_id = s2.id
     WHERE i.id = $1 AND i.user_id = $2`,
    [integrationId, userId]
  );
  return result.rows[0];
}

async function createIntegration(userId, data) {
  const pool = await connectToDatabase();
  const result = await pool.query(
    `INSERT INTO integrations (user_id, name, source_store_id, target_store_id)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (user_id, source_store_id, target_store_id)
     DO UPDATE SET 
       name = EXCLUDED.name,
       updated_at = CURRENT_TIMESTAMP
     RETURNING *`,
    [userId, data.name, data.sourceStoreId, data.targetStoreId]
  );
  return result.rows[0];
}

async function deleteIntegration(integrationId, userId) {
  const pool = await connectToDatabase();
  const result = await pool.query(
    `UPDATE integrations SET is_active = false WHERE id = $1 AND user_id = $2 RETURNING *`,
    [integrationId, userId]
  );
  return result.rows[0];
}

async function updateIntegrationLastSync(integrationId) {
  const pool = await connectToDatabase();
  const result = await pool.query(
    `UPDATE integrations SET last_sync = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
    [integrationId]
  );
  return result.rows[0];
}

// Sync Logs CRUD
async function createSyncLog(integrationId, syncType) {
  const pool = await connectToDatabase();
  const result = await pool.query(
    `INSERT INTO sync_logs (integration_id, sync_type, status)
     VALUES ($1, $2, 'running')
     RETURNING *`,
    [integrationId, syncType]
  );
  return result.rows[0];
}

async function updateSyncLog(logId, updates) {
  const pool = await connectToDatabase();
  const {
    status,
    totalProducts,
    productsCreated,
    productsUpdated,
    productsFailed,
    productsSkipped,
    inventoryUpdated,
    completedAt,
    durationSeconds,
    errorMessage,
    details
  } = updates;

  const result = await pool.query(
    `UPDATE sync_logs SET
      status = COALESCE($2, status),
      total_products = COALESCE($3, total_products),
      products_created = COALESCE($4, products_created),
      products_updated = COALESCE($5, products_updated),
      products_failed = COALESCE($6, products_failed),
      products_skipped = COALESCE($7, products_skipped),
      inventory_updated = COALESCE($8, inventory_updated),
      completed_at = COALESCE($9, completed_at),
      duration_seconds = COALESCE($10, duration_seconds),
      error_message = COALESCE($11, error_message),
      details = COALESCE($12, details)
     WHERE id = $1
     RETURNING *`,
    [logId, status, totalProducts, productsCreated, productsUpdated, productsFailed, 
     productsSkipped, inventoryUpdated, completedAt, durationSeconds, errorMessage, 
     details ? JSON.stringify(details) : null]
  );
  return result.rows[0];
}

async function getSyncLogs(integrationId, limit = 10) {
  const pool = await connectToDatabase();
  const result = await pool.query(
    `SELECT * FROM sync_logs 
     WHERE integration_id = $1 
     ORDER BY created_at DESC 
     LIMIT $2`,
    [integrationId, limit]
  );
  return result.rows;
}

async function getSyncLogById(logId) {
  const pool = await connectToDatabase();
  const result = await pool.query(
    `SELECT * FROM sync_logs WHERE id = $1`,
    [logId]
  );
  return result.rows[0];
}

// Product Mappings CRUD
async function createOrUpdateMapping(integrationId, mapping) {
  const pool = await connectToDatabase();
  const { sourceProductId, targetProductId, sku, mappingType } = mapping;
  
  const result = await pool.query(
    `INSERT INTO product_mappings (integration_id, source_product_id, target_product_id, sku, mapping_type, last_synced, sync_count)
     VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, 1)
     ON CONFLICT (integration_id, source_product_id, target_product_id)
     DO UPDATE SET
       sku = EXCLUDED.sku,
       mapping_type = EXCLUDED.mapping_type,
       last_synced = CURRENT_TIMESTAMP,
       sync_count = product_mappings.sync_count + 1,
       updated_at = CURRENT_TIMESTAMP
     RETURNING *`,
    [integrationId, sourceProductId, targetProductId, sku, mappingType || 'auto_sku']
  );
  return result.rows[0];
}

async function getMappings(integrationId) {
  const pool = await connectToDatabase();
  const result = await pool.query(
    `SELECT * FROM product_mappings 
     WHERE integration_id = $1 AND is_active = true
     ORDER BY last_synced DESC`,
    [integrationId]
  );
  return result.rows;
}

async function getMappingBySourceProduct(integrationId, sourceProductId) {
  const pool = await connectToDatabase();
  const result = await pool.query(
    `SELECT * FROM product_mappings 
     WHERE integration_id = $1 AND source_product_id = $2 AND is_active = true`,
    [integrationId, sourceProductId]
  );
  return result.rows[0];
}

// Sync Settings CRUD
async function getSyncSettings(integrationId) {
  const pool = await connectToDatabase();
  const result = await pool.query(
    `SELECT * FROM sync_settings WHERE integration_id = $1`,
    [integrationId]
  );
  
  // If no settings exist, create default settings
  if (result.rows.length === 0) {
    const createResult = await pool.query(
      `INSERT INTO sync_settings (integration_id) VALUES ($1) RETURNING *`,
      [integrationId]
    );
    return createResult.rows[0];
  }
  
  return result.rows[0];
}

async function updateSyncSettings(integrationId, settings) {
  const pool = await connectToDatabase();
  
  // Extract all possible fields from settings
  const {
    autoSync, syncFrequency, syncNewProducts, syncInventory,
    syncPrices, syncImages, syncDescriptions, vendorFilter, tagFilter,
    notifyOnError, notifyOnComplete,
    sync_title, sync_description, sync_price, sync_compare_at_price,
    sync_sku, sync_barcode, sync_tags, sync_vendor, sync_product_type,
    sync_weight, sync_published
  } = settings;

  const result = await pool.query(
    `INSERT INTO sync_settings (
      integration_id, auto_sync, sync_frequency, sync_new_products, sync_inventory,
      sync_prices, sync_images, sync_descriptions, vendor_filter, tag_filter,
      notify_on_error, notify_on_complete,
      sync_title, sync_description, sync_price, sync_compare_at_price,
      sync_sku, sync_barcode, sync_tags, sync_vendor, sync_product_type,
      sync_weight, sync_published
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
    ON CONFLICT (integration_id)
    DO UPDATE SET
      auto_sync = COALESCE($2, sync_settings.auto_sync),
      sync_frequency = COALESCE($3, sync_settings.sync_frequency),
      sync_new_products = COALESCE($4, sync_settings.sync_new_products),
      sync_inventory = COALESCE($5, sync_settings.sync_inventory),
      sync_prices = COALESCE($6, sync_settings.sync_prices),
      sync_images = COALESCE($7, sync_settings.sync_images),
      sync_descriptions = COALESCE($8, sync_settings.sync_descriptions),
      vendor_filter = COALESCE($9, sync_settings.vendor_filter),
      tag_filter = COALESCE($10, sync_settings.tag_filter),
      notify_on_error = COALESCE($11, sync_settings.notify_on_error),
      notify_on_complete = COALESCE($12, sync_settings.notify_on_complete),
      sync_title = COALESCE($13, sync_settings.sync_title),
      sync_description = COALESCE($14, sync_settings.sync_description),
      sync_price = COALESCE($15, sync_settings.sync_price),
      sync_compare_at_price = COALESCE($16, sync_settings.sync_compare_at_price),
      sync_sku = COALESCE($17, sync_settings.sync_sku),
      sync_barcode = COALESCE($18, sync_settings.sync_barcode),
      sync_tags = COALESCE($19, sync_settings.sync_tags),
      sync_vendor = COALESCE($20, sync_settings.sync_vendor),
      sync_product_type = COALESCE($21, sync_settings.sync_product_type),
      sync_weight = COALESCE($22, sync_settings.sync_weight),
      sync_published = COALESCE($23, sync_settings.sync_published),
      updated_at = CURRENT_TIMESTAMP
    RETURNING *`,
    [integrationId, autoSync, syncFrequency, syncNewProducts, syncInventory,
     syncPrices, syncImages, syncDescriptions, vendorFilter, tagFilter,
     notifyOnError, notifyOnComplete,
     sync_title, sync_description, sync_price, sync_compare_at_price,
     sync_sku, sync_barcode, sync_tags, sync_vendor, sync_product_type,
     sync_weight, sync_published]
  );
  return result.rows[0];
}

// Update integration stats
async function updateIntegrationStats(integrationId, lastSyncStatus) {
  const pool = await connectToDatabase();
  const result = await pool.query(
    `UPDATE integrations SET 
      last_sync = CURRENT_TIMESTAMP,
      last_sync_status = $2,
      total_syncs = total_syncs + 1,
      updated_at = CURRENT_TIMESTAMP
     WHERE id = $1
     RETURNING *`,
    [integrationId, lastSyncStatus]
  );
  return result.rows[0];
}

// Collection Mappings CRUD
async function getCollectionMappings(integrationId) {
  const pool = await connectToDatabase();
  const result = await pool.query(
    `SELECT * FROM collection_mappings 
     WHERE integration_id = $1 AND is_active = true
     ORDER BY created_at DESC`,
    [integrationId]
  );
  return result.rows;
}

async function createCollectionMapping(integrationId, mapping) {
  const pool = await connectToDatabase();
  const { sourceCollectionId, targetCollectionId, sourceCollectionTitle, targetCollectionTitle } = mapping;
  
  const result = await pool.query(
    `INSERT INTO collection_mappings 
      (integration_id, source_collection_id, target_collection_id, source_collection_title, target_collection_title)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (integration_id, source_collection_id)
     DO UPDATE SET
       target_collection_id = EXCLUDED.target_collection_id,
       target_collection_title = EXCLUDED.target_collection_title,
       updated_at = CURRENT_TIMESTAMP
     RETURNING *`,
    [integrationId, sourceCollectionId, targetCollectionId, sourceCollectionTitle, targetCollectionTitle]
  );
  return result.rows[0];
}

async function deleteCollectionMapping(mappingId, integrationId) {
  const pool = await connectToDatabase();
  console.log(`🗑️ DB: Deleting collection mapping: mappingId=${mappingId}, integrationId=${integrationId}`);
  
  const result = await pool.query(
    `UPDATE collection_mappings SET is_active = false, updated_at = CURRENT_TIMESTAMP
     WHERE id = $1 AND integration_id = $2
     RETURNING *`,
    [mappingId, integrationId]
  );
  
  console.log(`✅ DB: Deleted mapping result:`, result.rows[0]);
  return result.rows[0];
}

module.exports = {
  connectToDatabase,
  getStores,
  getStoreById,
  getIntegrations,
  getIntegrationById,
  createIntegration,
  deleteIntegration,
  updateIntegrationLastSync,
  updateIntegrationStats,
  createStore,
  updateStore,
  deleteStore,
  getSettings,
  updateSettings,
  // Sync Logs
  createSyncLog,
  updateSyncLog,
  getSyncLogs,
  getSyncLogById,
  // Product Mappings
  createOrUpdateMapping,
  getMappings,
  getMappingBySourceProduct,
  // Sync Settings
  getSyncSettings,
  updateSyncSettings,
  // Collection Mappings
  getCollectionMappings,
  createCollectionMapping,
  deleteCollectionMapping
};
