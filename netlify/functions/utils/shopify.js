const axios = require('axios');

class ShopifyAPI {
  constructor(shopDomain, accessToken) {
    // Ensure .myshopify.com domain
    this.shopDomain = shopDomain.includes('.myshopify.com') 
      ? shopDomain 
      : `${shopDomain}.myshopify.com`;
      
    this.accessToken = accessToken;
    this.apiVersion = '2024-01';
    this.baseUrl = `https://${this.shopDomain}/admin/api/${this.apiVersion}`;
  }

  async makeRequest(endpoint, method = 'GET', data = null) {
    try {
      // .json extension'ı query string'den ÖNCE olmalı
      let url;
      if (endpoint.includes('?')) {
        // Parametreli endpoint: products?limit=250 → products.json?limit=250
        const [path, queryString] = endpoint.split('?');
        url = `${this.baseUrl}/${path}.json?${queryString}`;
      } else {
        // Parametresiz endpoint: shop → shop.json
        url = `${this.baseUrl}/${endpoint}.json`;
      }
      
      console.log('🔍 Shopify API Request:', {
        url,
        method,
        shop: this.shopDomain,
        hasToken: !!this.accessToken,
        tokenPrefix: this.accessToken?.substring(0, 10) + '...'
      });

      const config = {
        method,
        url,
        headers: {
          'X-Shopify-Access-Token': this.accessToken,
          'Content-Type': 'application/json'
        },
        timeout: 8000
      };

      // Only include data for POST, PUT, PATCH requests
      if (data && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
        config.data = data;
      }

      const response = await axios(config);

      // Response'u logla
      console.log('✅ Shopify API Response:', {
        status: response.status,
        dataType: typeof response.data,
        dataIsArray: Array.isArray(response.data),
        dataPreview: typeof response.data === 'string' 
          ? response.data.substring(0, 200) 
          : JSON.stringify(response.data).substring(0, 200)
      });

      return response.data;
    } catch (error) {
      // URL'yi düzgün oluştur (yukarıdaki mantığı tekrarla)
      let errorUrl;
      if (endpoint.includes('?')) {
        const [path, queryString] = endpoint.split('?');
        errorUrl = `${this.baseUrl}/${path}.json?${queryString}`;
      } else {
        errorUrl = `${this.baseUrl}/${endpoint}.json`;
      }
      
      // Detaylı hata loglaması
      console.error('❌ Shopify API Error Details:', {
        url: errorUrl,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        code: error.code,
        message: error.message
      });

      if (error.response) {
        const status = error.response.status;
        const errorData = error.response.data;
        
        if (status === 401) {
          throw new Error('Geçersiz access token');
        } else if (status === 402) {
          throw new Error('Shopify hesabı askıya alınmış');
        } else if (status === 403) {
          throw new Error('Erişim izni yok');
        } else if (status === 404) {
          throw new Error('Kaynak bulunamadı');
        } else if (status === 429) {
          throw new Error('API limit aşıldı, lütfen bekleyin');
        } else if (status === 400) {
          // 400 için özel mesaj
          const errorMsg = errorData?.errors || errorData?.error || JSON.stringify(errorData);
          throw new Error(`Geçersiz istek: ${errorMsg}`);
        }
        
        throw new Error(`Shopify API Error: ${status} - ${JSON.stringify(errorData)}`);
      }
      
      if (error.code === 'ENOTFOUND') {
        throw new Error(`Shop domain bulunamadı: ${this.shopDomain}`);
      }
      
      throw error;
    }
  }

  async getShopInfo() {
    const data = await this.makeRequest('shop');
    return data.shop;
  }

  async getProducts(limit = 250) {
    const data = await this.makeRequest(`products?limit=${limit}`);
    
    console.log('🔍 RAW API RESPONSE:', {
      type: typeof data,
      isArray: Array.isArray(data),
      hasProducts: !!(data && data.products),
      dataKeys: data ? Object.keys(data).slice(0, 10) : [],
      firstItem: Array.isArray(data) ? data[0] : null,
      productsLength: data?.products?.length,
      dataLength: Array.isArray(data) ? data.length : null
    });
    
    // Eğer string gelirse (hata mesajı), konsola yazdır
    if (typeof data === 'string') {
      console.error('❌ SHOPIFY API ERROR (STRING RESPONSE):', data.substring(0, 500));
      return [];
    }
    
    // API bazen {products: [...]} bazen direkt array döndürebilir
    let products = [];
    
    if (Array.isArray(data)) {
      // Direkt array geldi
      products = data;
    } else if (data && data.products && Array.isArray(data.products)) {
      // {products: [...]} formatında geldi
      products = data.products;
    }
    
    console.log(`📊 Products fetched: ${products.length} items`);
    return products;
  }

  // Get ALL products with pagination
  async getAllProducts() {
    console.log('🔄 Fetching ALL products with pagination...');
    let allProducts = [];
    let sinceId = 0;
    let hasMore = true;
    let pageCount = 0;

    while (hasMore) {
      pageCount++;
      const endpoint = sinceId > 0 
        ? `products?limit=250&since_id=${sinceId}` 
        : 'products?limit=250';
      
      console.log(`📄 Fetching page ${pageCount} (since_id: ${sinceId})...`);
      
      const data = await this.makeRequest(endpoint);
      
      let products = [];
      if (typeof data === 'string') {
        console.error('❌ Error fetching products page:', data);
        break;
      }
      
      if (Array.isArray(data)) {
        products = data;
      } else if (data && data.products && Array.isArray(data.products)) {
        products = data.products;
      }

      if (products.length === 0) {
        hasMore = false;
      } else {
        allProducts = allProducts.concat(products);
        sinceId = products[products.length - 1].id;
        console.log(`✅ Page ${pageCount}: ${products.length} products (Total: ${allProducts.length})`);
        
        // If we got less than 250, we're done
        if (products.length < 250) {
          hasMore = false;
        }
        
        // Rate limiting: wait 500ms between requests
        if (hasMore) {
          await this.delay(500);
        }
      }
    }

    console.log(`✅ Total products fetched: ${allProducts.length}`);
    return allProducts;
  }

  // Helper function for delay
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async getLocations() {
    const data = await this.makeRequest('locations');
    
    if (Array.isArray(data)) {
      return data;
    } else if (data && data.locations && Array.isArray(data.locations)) {
      return data.locations;
    }
    
    return [];
  }

  // Get custom collections
  async getCustomCollections(limit = 250) {
    const data = await this.makeRequest(`custom_collections?limit=${limit}`);
    
    if (Array.isArray(data)) {
      return data;
    } else if (data && data.custom_collections && Array.isArray(data.custom_collections)) {
      return data.custom_collections;
    }
    
    return [];
  }

  // Get smart collections
  async getSmartCollections(limit = 250) {
    const data = await this.makeRequest(`smart_collections?limit=${limit}`);
    
    if (Array.isArray(data)) {
      return data;
    } else if (data && data.smart_collections && Array.isArray(data.smart_collections)) {
      return data.smart_collections;
    }
    
    return [];
  }

  // Get all collections (both custom and smart)
  async getAllCollections() {
    const [customCollections, smartCollections] = await Promise.all([
      this.getCustomCollections(),
      this.getSmartCollections()
    ]);

    const allCollections = [
      ...customCollections.map(c => ({ ...c, type: 'custom' })),
      ...smartCollections.map(c => ({ ...c, type: 'smart' }))
    ];

    return allCollections.sort((a, b) => a.title.localeCompare(b.title));
  }

  // Get products in a collection
  async getCollectionProducts(collectionId) {
    const data = await this.makeRequest(`collections/${collectionId}/products`);
    
    if (Array.isArray(data)) {
      return data;
    } else if (data && data.products && Array.isArray(data.products)) {
      return data.products;
    }
    
    return [];
  }

  async getInventoryLevels(locationId, limit = 250) {
    const data = await this.makeRequest(`inventory_levels?location_ids=${locationId}&limit=${limit}`);
    
    if (Array.isArray(data)) {
      return data;
    } else if (data && data.inventory_levels && Array.isArray(data.inventory_levels)) {
      return data.inventory_levels;
    }
    
    return [];
  }

  async getInventoryItems(ids) {
    const idsString = ids.join(',');
    const data = await this.makeRequest(`inventory_items?ids=${idsString}`);
    return data.inventory_items;
  }

  async getCollections(limit = 250) {
    const data = await this.makeRequest(`custom_collections?limit=${limit}`);
    
    if (Array.isArray(data)) {
      return data;
    }
    
    return data.custom_collections || [];
  }

  async getSmartCollections(limit = 250) {
    const data = await this.makeRequest(`smart_collections?limit=${limit}`);
    
    if (Array.isArray(data)) {
      return data;
    }
    
    return data.smart_collections || [];
  }

  async getAllCollections(limit = 250) {
    // Fetch both custom and smart collections
    const [customCollections, smartCollections] = await Promise.all([
      this.getCollections(limit),
      this.getSmartCollections(limit)
    ]);

    // Combine and add type field
    const allCollections = [
      ...customCollections.map(c => ({ ...c, collection_type: 'custom' })),
      ...smartCollections.map(c => ({ ...c, collection_type: 'smart' }))
    ];

    return allCollections;
  }

  async getProductsByVendor() {
    const products = await this.getProducts(250);
    const vendorMap = new Map();

    products.forEach(product => {
      const vendor = product.vendor || 'No Vendor';
      if (!vendorMap.has(vendor)) {
        vendorMap.set(vendor, []);
      }
      vendorMap.get(vendor).push(product);
    });

    return Array.from(vendorMap.entries()).map(([vendor, products]) => ({
      vendor,
      count: products.length,
      products
    }));
  }
}

module.exports = { ShopifyAPI };

