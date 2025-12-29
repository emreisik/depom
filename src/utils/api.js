import axios from 'axios';

const API_BASE = '/api';

// Demo user ID (gerçek uygulamada authentication sistemi olacak)
const getUserId = () => {
  let userId = localStorage.getItem('userId');
  if (!userId) {
    userId = 'user-' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('userId', userId);
  }
  return userId;
};

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 300000 // 5 dakika timeout
});

// Her request'e userId ekle
api.interceptors.request.use((config) => {
  config.headers['Authorization'] = getUserId();
  return config;
});

export const testConnection = async (shopDomain, accessToken) => {
  const response = await api.post('/test-connection', {
    shopDomain,
    accessToken
  });
  return response.data;
};

export const addStore = async (storeName, shopDomain, accessToken) => {
  const response = await api.post('/stores', {
    storeName,
    shopDomain,
    accessToken
  });
  return response.data;
};

export const getStores = async () => {
  const response = await api.get('/stores');
  return response.data;
};

export const deleteStore = async (storeId) => {
  const response = await api.delete(`/stores?id=${storeId}`);
  return response.data;
};

export const getStocks = async (storeId = null) => {
  const url = storeId ? `/stocks?storeId=${storeId}` : '/stocks';
  const response = await api.get(url);
  return response.data;
};

// Settings API
export const getSettings = async () => {
  const response = await api.get('/settings');
  return response.data;
};

export const updateSettings = async (settings) => {
  const response = await api.put('/settings', settings);
  return response.data;
};

// Product Sync API
export const syncProducts = async (sourceStoreId, targetStoreId, productIds = null, syncAll = false) => {
  const response = await api.post('/sync-products', {
    sourceStoreId,
    targetStoreId,
    productIds,
    syncAll
  });
  return response.data;
};

// Inventory Only Sync API
export const syncInventoryOnly = async (sourceStoreId, targetStoreId) => {
  const response = await api.post('/sync-inventory-only', {
    sourceStoreId,
    targetStoreId
  });
  return response.data;
};

// Integrations API
export const getIntegrations = async () => {
  const response = await api.get('/integrations');
  return response.data;
};

export const getIntegration = async (id) => {
  const response = await api.get(`/integrations?id=${id}`);
  return response.data;
};

export const createIntegration = async (name, sourceStoreId, targetStoreId) => {
  const response = await api.post('/integrations', {
    name,
    sourceStoreId,
    targetStoreId
  });
  return response.data;
};

export const deleteIntegration = async (id) => {
  const response = await api.delete(`/integrations?id=${id}`);
  return response.data;
};

// Sync Operations API
export const startFullSync = async (integrationId, filters = {}) => {
  const response = await api.post('/sync-full', { integrationId, filters });
  return response.data;
};

export const getSyncLogs = async (integrationId, limit = 10) => {
  const response = await api.get(`/sync-logs?integrationId=${integrationId}&limit=${limit}`);
  return response.data;
};

export const getSyncLog = async (logId) => {
  const response = await api.get(`/sync-logs?logId=${logId}`);
  return response.data;
};

export const getSyncSettings = async (integrationId) => {
  const response = await api.get(`/sync-settings?integrationId=${integrationId}`);
  return response.data;
};

export const updateSyncSettings = async (integrationId, settings) => {
  const response = await api.put(`/sync-settings?integrationId=${integrationId}`, settings);
  return response.data;
};

// Products Browser API (with collections)
export const getProductsBrowser = async (storeId, includeCollections = true, filters = {}) => {
  let url = `/products-browser?storeId=${storeId}&includeCollections=${includeCollections}`;
  
  if (filters.vendor && filters.vendor !== 'all') {
    url += `&vendor=${encodeURIComponent(filters.vendor)}`;
  }
  if (filters.collectionId && filters.collectionId !== 'all') {
    url += `&collectionId=${filters.collectionId}`;
  }
  if (filters.hasStock) {
    url += `&hasStock=true`;
  }
  
  const response = await api.get(url);
  return response.data;
};

// Collection Mappings API
export const getCollectionMappings = async (integrationId) => {
  const response = await api.get(`/collection-mappings?integrationId=${integrationId}`);
  return response.data;
};

export const createCollectionMapping = async (integrationId, mapping) => {
  const response = await api.post(`/collection-mappings?integrationId=${integrationId}`, mapping);
  return response.data;
};

export const deleteCollectionMapping = async (integrationId, mappingId) => {
  console.log(`🌐 API DELETE request: /collection-mappings?integrationId=${integrationId}&mappingId=${mappingId}`);
  const response = await api.delete(`/collection-mappings?integrationId=${integrationId}&mappingId=${mappingId}`);
  console.log('🌐 API DELETE response:', response.data);
  return response.data;
};

export default api;
