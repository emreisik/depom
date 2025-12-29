import { useState, useEffect } from 'react'
import { getStores, getStocks, syncProducts, syncInventoryOnly } from '../utils/api'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'

const ProductTransfer = () => {
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState(null);
  const [stores, setStores] = useState([]);
  const [sourceStore, setSourceStore] = useState('');
  const [targetStore, setTargetStore] = useState('');
  const [products, setProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [syncAll, setSyncAll] = useState(false);
  const [syncResult, setSyncResult] = useState(null);
  const [selectedVendor, setSelectedVendor] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [displayLimit, setDisplayLimit] = useState(50);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await getStores();
      if (response.success) {
        setStores(response.data);
      }
    } catch (err) {
      console.error('Error fetching stores:', err);
      setError(err.response?.data?.error || 'Mağazalar yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async (storeId) => {
    if (!storeId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await getStocks(storeId);
      if (response.success && response.data.length > 0) {
        const storeData = response.data[0];
        if (storeData.inventory && storeData.inventory.length > 0) {
          const allProducts = storeData.inventory.flatMap(loc => loc.products);
          setProducts(allProducts);
        }
      }
    } catch (err) {
      console.error('Error fetching products:', err);
      setError(err.response?.data?.error || 'Ürünler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleSourceChange = (storeId) => {
    setSourceStore(storeId);
    setProducts([]);
    setSelectedProducts([]);
    setSyncResult(null);
    setSelectedVendor('all');
    setSearchTerm('');
    setDisplayLimit(50);
    if (storeId) {
      fetchProducts(storeId);
    }
  };

  const handleLoadMore = () => {
    setDisplayLimit(prev => prev + 250);
  };

  const handleInventorySync = async () => {
    if (!sourceStore || !targetStore) {
      alert('Lütfen kaynak ve hedef mağaza seçin');
      return;
    }

    if (sourceStore === targetStore) {
      alert('Kaynak ve hedef mağaza aynı olamaz');
      return;
    }

    const sourceName = stores.find(s => s.id === sourceStore)?.name;
    const targetName = stores.find(s => s.id === targetStore)?.name;
    
    const confirmMessage = `${sourceName} → ${targetName}\n\n✅ MEVCUT ürünler SKU'ya göre eşleştirilecek\n✅ Sadece stok miktarları güncellenecek\n❌ Yeni ürün OLUŞTURULMAYACAK\n\n⏱️ İşlem 2-5 dakika sürebilir!\n\nLütfen bekleyin, sayfa KAPANMASIN!\n\nOnaylıyor musunuz?`;

    if (!confirm(confirmMessage)) {
      return;
    }

    setSyncing(true);
    setError(null);
    setSyncResult(null);

    try {
      const response = await syncInventoryOnly(sourceStore, targetStore);

      if (response.success) {
        setSyncResult(response);
        alert(`✅ Stok senkronizasyonu tamamlandı!\n\n✅ Başarılı: ${response.stats.success}\n❌ Hatalı: ${response.stats.failed}\n⚠️ Bulunamadı: ${response.stats.notFound}`);
      }
    } catch (err) {
      console.error('Error syncing inventory:', err);
      setError(err.response?.data?.error || 'Stok senkronizasyonunda hata oluştu');
    } finally {
      setSyncing(false);
    }
  };

  // Unique vendor'ları al
  const vendors = [...new Set(products.map(p => p.vendor).filter(Boolean))].sort();

  // Filtrelenmiş ürünler
  const filteredProducts = products.filter(product => {
    const matchesVendor = selectedVendor === 'all' || product.vendor === selectedVendor;
    const matchesSearch = searchTerm === '' || 
      product.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesVendor && matchesSearch;
  });

  // Gösterilecek ürünler
  const displayedProducts = filteredProducts.slice(0, displayLimit);
  const hasMore = filteredProducts.length > displayLimit;

  const handleProductToggle = (productId) => {
    setSelectedProducts(prev => {
      if (prev.includes(productId)) {
        return prev.filter(id => id !== productId);
      } else {
        return [...prev, productId];
      }
    });
  };

  const handleSelectAllProducts = () => {
    const visibleProductIds = filteredProducts.map(p => p.productId);
    const allSelected = visibleProductIds.every(id => selectedProducts.includes(id));
    
    if (allSelected) {
      setSelectedProducts(prev => prev.filter(id => !visibleProductIds.includes(id)));
    } else {
      setSelectedProducts(prev => [...new Set([...prev, ...visibleProductIds])]);
    }
  };

  const handleSync = async () => {
    if (!sourceStore || !targetStore) {
      alert('Lütfen kaynak ve hedef mağaza seçin');
      return;
    }

    if (!syncAll && selectedProducts.length === 0) {
      alert('Lütfen en az bir ürün seçin veya "Tüm Ürünler" seçeneğini işaretleyin');
      return;
    }

    if (sourceStore === targetStore) {
      alert('Kaynak ve hedef mağaza aynı olamaz');
      return;
    }

    const confirmMessage = syncAll 
      ? `Tüm ürünler (${products.length} adet) ${stores.find(s => s.id === sourceStore)?.name} mağazasından ${stores.find(s => s.id === targetStore)?.name} mağazasına aktarılacak. Onaylıyor musunuz?`
      : `${selectedProducts.length} ürün ${stores.find(s => s.id === sourceStore)?.name} mağazasından ${stores.find(s => s.id === targetStore)?.name} mağazasına aktarılacak. Onaylıyor musunuz?`;

    if (!confirm(confirmMessage)) {
      return;
    }

    setSyncing(true);
    setError(null);
    setSyncResult(null);

    try {
      const response = await syncProducts(
        sourceStore,
        targetStore,
        syncAll ? null : selectedProducts,
        syncAll
      );

      if (response.success) {
        setSyncResult(response);
        setSelectedProducts([]);
        setSyncAll(false);
      }
    } catch (err) {
      console.error('Error syncing products:', err);
      setError(err.response?.data?.error || 'Ürün senkronizasyonunda hata oluştu');
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading && stores.length === 0) {
    return <LoadingSpinner message="Yükleniyor..." />;
  }

  if (stores.length < 2) {
    return (
      <div className="empty-state">
        <div className="empty-icon">🔄</div>
        <h2>En Az İki Mağaza Gerekli</h2>
        <p>Ürün aktarımı için en az iki mağazanızın olması gerekiyor</p>
      </div>
    );
  }

  return (
    <div className="product-transfer-page">
      <div className="page-header">
        <div>
          <h1>Ürün Aktarımı</h1>
          <p className="subtitle">Mağazalar arası ürün senkronizasyonu</p>
        </div>
      </div>

      <div className="transfer-container">
        <div className="transfer-section">
          <div className="store-selectors">
            <div className="store-selector">
              <label>📤 Kaynak Mağaza</label>
              <select
                value={sourceStore}
                onChange={(e) => handleSourceChange(e.target.value)}
                disabled={syncing}
              >
                <option value="">Mağaza Seçin</option>
                {stores.map(store => (
                  <option key={store.id} value={store.id}>
                    {store.name} ({store.shopDomain})
                  </option>
                ))}
              </select>
            </div>

            <div className="transfer-arrow">→</div>

            <div className="store-selector">
              <label>📥 Hedef Mağaza</label>
              <select
                value={targetStore}
                onChange={(e) => setTargetStore(e.target.value)}
                disabled={syncing}
              >
                <option value="">Mağaza Seçin</option>
                {stores
                  .filter(store => store.id !== sourceStore)
                  .map(store => (
                    <option key={store.id} value={store.id}>
                      {store.name} ({store.shopDomain})
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {error && (
            <div className="alert alert-error">
              ❌ {error}
            </div>
          )}

          {syncResult && (
            <div className="sync-result">
              <h3>✅ Senkronizasyon Tamamlandı</h3>
              <div className="sync-stats">
                <div className="sync-stat">
                  <span className="stat-label">Toplam:</span>
                  <span className="stat-value">{syncResult.stats.total}</span>
                </div>
                <div className="sync-stat success">
                  <span className="stat-label">Başarılı:</span>
                  <span className="stat-value">{syncResult.stats.success}</span>
                </div>
                <div className="sync-stat">
                  <span className="stat-label">Yeni Oluşturulan:</span>
                  <span className="stat-value">{syncResult.stats.created}</span>
                </div>
                <div className="sync-stat">
                  <span className="stat-label">Güncellenen:</span>
                  <span className="stat-value">{syncResult.stats.updated}</span>
                </div>
                {syncResult.stats.failed > 0 && (
                  <div className="sync-stat danger">
                    <span className="stat-label">Hatalı:</span>
                    <span className="stat-value">{syncResult.stats.failed}</span>
                  </div>
                )}
              </div>
              <p className="sync-message">{syncResult.message}</p>
              
              {/* Envanter Güncellemeleri */}
              {syncResult.results.some(r => r.inventory?.updates?.length > 0) && (
                <div className="inventory-updates">
                  <h4>📦 Envanter Güncellemeleri</h4>
                  <div className="inventory-list">
                    {syncResult.results.map((result, idx) => (
                      result.inventory?.updates?.length > 0 && (
                        <div key={idx} className="inventory-item">
                          <strong>{result.productTitle}</strong>
                          <ul>
                            {result.inventory.updates.map((update, i) => (
                              <li key={i}>
                                <span className="sku">{update.sku}</span> 
                                → <span className="quantity">{update.quantity} adet</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {products.length > 0 && (
            <>
              {/* Filtreleme Kontrolleri */}
              <div className="filter-controls">
                <div className="filter-row">
                  <div className="filter-item">
                    <label>🔍 Ürün Ara</label>
                    <input
                      type="text"
                      placeholder="Ürün adı veya SKU ile ara..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="search-input"
                    />
                  </div>
                  
                  <div className="filter-item">
                    <label>🏭 Satıcı / Vendor</label>
                    <select
                      value={selectedVendor}
                      onChange={(e) => setSelectedVendor(e.target.value)}
                      className="vendor-select"
                    >
                      <option value="all">Tüm Satıcılar ({products.length})</option>
                      {vendors.map(vendor => {
                        const count = products.filter(p => p.vendor === vendor).length;
                        return (
                          <option key={vendor} value={vendor}>
                            {vendor || '(Satıcı Yok)'} ({count})
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div className="filter-item">
                    <label>📊 Sonuç</label>
                    <div className="filter-result">
                      <strong>{filteredProducts.length}</strong> / {products.length} ürün
                    </div>
                  </div>
                </div>
              </div>

              <div className="product-selection-header">
                <h3>Aktarılacak Ürünler</h3>
                <div className="selection-actions">
                  <label className="sync-all-checkbox">
                    <input
                      type="checkbox"
                      checked={syncAll}
                      onChange={(e) => setSyncAll(e.target.checked)}
                      disabled={syncing}
                    />
                    <span>Tüm Ürünleri Aktar ({products.length} adet)</span>
                  </label>
                  {!syncAll && filteredProducts.length > 0 && (
                    <button
                      type="button"
                      onClick={handleSelectAllProducts}
                      className="btn-link"
                      disabled={syncing}
                    >
                      Görünenleri Seç/Kaldır ({filteredProducts.length})
                    </button>
                  )}
                  {!syncAll && selectedProducts.length > 0 && (
                    <span className="selected-count">{selectedProducts.length} ürün seçildi</span>
                  )}
                </div>
              </div>

              <div className="products-list">
                {filteredProducts.length === 0 ? (
                  <div className="empty-state-small">
                    <p>🔍 Filtreye uygun ürün bulunamadı</p>
                  </div>
                ) : (
                  displayedProducts.map(product => (
                  <div
                    key={product.productId}
                    className={`product-item ${selectedProducts.includes(product.productId) ? 'selected' : ''} ${syncAll ? 'sync-all' : ''}`}
                  >
                    <label>
                      <input
                        type="checkbox"
                        checked={syncAll || selectedProducts.includes(product.productId)}
                        onChange={() => handleProductToggle(product.productId)}
                        disabled={syncing || syncAll}
                      />
                      {product.image && (
                        <img src={product.image} alt={product.title} className="product-thumb" />
                      )}
                      <div className="product-details">
                        <strong>{product.title}</strong>
                        <div className="product-meta">
                          <span>SKU: {product.sku}</span>
                          {product.vendor && <span>Satıcı: {product.vendor}</span>}
                          <span>Stok: {product.inventory}</span>
                          <span>Fiyat: {product.price}</span>
                        </div>
                      </div>
                    </label>
                  </div>
                  ))
                )}
              </div>

              {/* Daha Fazla Göster Butonu */}
              {hasMore && (
                <div className="load-more-section">
                  <div className="load-more-info">
                    <p>
                      Gösterilen: <strong>{displayedProducts.length}</strong> / {filteredProducts.length} ürün
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleLoadMore}
                    className="btn-secondary"
                    disabled={syncing}
                  >
                    📦 250 Ürün Daha Göster
                  </button>
                </div>
              )}
            </>
          )}

          {syncing && (
            <div className="syncing-overlay">
              <div className="syncing-card">
                <div className="spinner"></div>
                <h3>⏳ Senkronizasyon Devam Ediyor...</h3>
                <p>Lütfen bekleyin, bu işlem 2-5 dakika sürebilir.</p>
                <p><strong>Sayfayı KAPATMAYIN!</strong></p>
                <p className="hint">Terminal'de (VS Code) ilerlemeyi canlı izleyebilirsiniz.</p>
              </div>
            </div>
          )}

          <div className="transfer-actions">
            <button
              onClick={handleInventorySync}
              disabled={syncing || !sourceStore || !targetStore}
              className="btn-secondary btn-large"
              title="Mevcut ürünleri SKU'ya göre eşleştirir ve sadece stok miktarlarını günceller. Yeni ürün oluşturmaz."
            >
              {syncing ? '⏳ İşlem devam ediyor...' : '📊 Sadece Stokları Senkronize Et'}
            </button>
            <button
              onClick={handleSync}
              disabled={syncing || !sourceStore || !targetStore || (!syncAll && selectedProducts.length === 0)}
              className="btn-primary btn-large"
            >
              {syncing ? '⏳ İşlem devam ediyor...' : `🔄 ${syncAll ? 'Tüm Ürünleri' : `${selectedProducts.length} Ürünü`} Aktar`}
            </button>
          </div>

          <div className="transfer-info">
            <div className="info-card">
              <h4>🔄 Tam Ürün Aktarımı</h4>
              <p>
                Seçili ürünler hedef mağazaya aktarılır. Ürün bilgileri, görseller, fiyatlar ve stoklar 
                "Ayarlar" sayfasındaki yapılandırmaya göre kopyalanır.
              </p>
            </div>
            <div className="info-card">
              <h4>📊 Sadece Stok Senkronizasyonu</h4>
              <p>
                <strong>Mevcut ürünleri SKU'ya göre eşleştirir</strong> ve sadece stok miktarlarını günceller. 
                Yeni ürün oluşturmaz. Ürün bilgilerini değiştirmez. Hızlı ve güvenlidir.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductTransfer

