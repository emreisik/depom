import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getStocks, getStores } from '../utils/api'
import StatsCard from '../components/StatsCard'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stocks, setStocks] = useState([]);
  const [stats, setStats] = useState(null);
  const [stores, setStores] = useState([]);
  const [selectedVendor, setSelectedVendor] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [displayLimit, setDisplayLimit] = useState(20);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [storesResponse, stocksResponse] = await Promise.all([
        getStores(),
        getStocks()
      ]);

      if (storesResponse.success) {
        setStores(storesResponse.data);
      }

      if (stocksResponse.success) {
        setStocks(stocksResponse.data);
        setStats(stocksResponse.stats);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.response?.data?.error || 'Veri yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = () => {
    setDisplayLimit(prev => prev + 250);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Tüm ürünleri topla ve unique vendor'ları çıkar
  const allProducts = stocks.flatMap(store => 
    store.inventory?.flatMap(loc => loc.products) || []
  );
  const vendors = [...new Set(allProducts.map(p => p.vendor).filter(Boolean))].sort();

  // Filtreleme fonksiyonu
  const filterProducts = (products) => {
    return products.filter(product => {
      const matchesVendor = selectedVendor === 'all' || product.vendor === selectedVendor;
      const matchesSearch = searchTerm === '' || 
        product.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesVendor && matchesSearch;
    });
  };

  if (loading) {
    return <LoadingSpinner message="Stok bilgileri yükleniyor..." />;
  }

  if (stores.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">🏪</div>
        <h2>Henüz Mağaza Eklenmemiş</h2>
        <p>Stok kontrolüne başlamak için ilk mağazanızı ekleyin</p>
        <Link to="/stores/add" className="btn-primary">
          + Mağaza Ekle
        </Link>
      </div>
    );
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={fetchData} />;
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Ana Sayfa</h1>
          <p className="subtitle">Tüm mağazalarınızın stok özeti</p>
        </div>
        <button onClick={fetchData} className="btn-secondary">
          🔄 Yenile
        </button>
      </div>

      {stats && (
        <div className="stats-grid">
          <StatsCard
            title="Toplam Mağaza"
            value={stats.totalStores}
            icon="🏪"
          />
          <StatsCard
            title="Toplam Ürün"
            value={stats.totalProducts}
            icon="📦"
          />
          <StatsCard
            title="Düşük Stok"
            value={stats.lowStockCount}
            icon="⚠️"
            className="warning"
          />
          <StatsCard
            title="Tükenen Ürün"
            value={stats.outOfStockCount}
            icon="🚫"
            className="danger"
          />
        </div>
      )}

      {/* Filtreleme Kontrolleri */}
      {allProducts.length > 0 && (
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
                <option value="all">Tüm Satıcılar</option>
                {vendors.map(vendor => {
                  const count = allProducts.filter(p => p.vendor === vendor).length;
                  return (
                    <option key={vendor} value={vendor}>
                      {vendor || '(Satıcı Yok)'} ({count})
                    </option>
                  );
                })}
              </select>
            </div>

            {(selectedVendor !== 'all' || searchTerm !== '') && (
              <div className="filter-item">
                <label>📊 Filtreler</label>
                <button
                  onClick={() => {
                    setSelectedVendor('all');
                    setSearchTerm('');
                  }}
                  className="btn-link"
                >
                  ✕ Filtreleri Temizle
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="stores-section">
        {stocks.map((store, index) => (
          <div key={index} className="store-card">
            <div className="store-header">
              <div>
                <h2>{store.storeName}</h2>
                <p className="store-domain">{store.shopDomain}</p>
              </div>
              {store.success ? (
                <span className="badge success">✓ Aktif</span>
              ) : (
                <span className="badge danger">✗ Hata</span>
              )}
            </div>

            {store.error ? (
              <div className="store-error">
                <p>❌ {store.error}</p>
              </div>
            ) : (
              store.inventory?.map((location, locIndex) => (
                <div key={locIndex} className="location-section">
                  <h3 className="location-title">📍 {location.location}</h3>
                  
                  <div className="table-container">
                    <table className="stock-table">
                      <thead>
                        <tr>
                          <th>Ürün</th>
                          <th>SKU</th>
                          <th>Satıcı</th>
                          <th>Fiyat</th>
                          <th>Stok</th>
                          <th>Durum</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(() => {
                          const filteredProducts = filterProducts(location.products);
                          if (filteredProducts.length === 0) {
                            return (
                              <tr>
                                <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>
                                  🔍 Filtreye uygun ürün bulunamadı
                                </td>
                              </tr>
                            );
                          }
                          const displayedProducts = filteredProducts.slice(0, displayLimit);
                          return displayedProducts.map(product => (
                          <tr 
                            key={product.productId} 
                            className={product.inventory === 0 ? 'out-of-stock' : product.inventory < 10 ? 'low-stock' : ''}
                          >
                            <td>
                              <div className="product-cell">
                                {product.image && (
                                  <img 
                                    src={product.image} 
                                    alt={product.title}
                                    className="product-image"
                                  />
                                )}
                                <span>{product.title}</span>
                              </div>
                            </td>
                            <td>{product.sku}</td>
                            <td>{product.vendor || '-'}</td>
                            <td>{product.price} {store.currency}</td>
                            <td>
                              <strong>{product.inventory}</strong>
                            </td>
                            <td>
                              <span className={`badge ${
                                product.inventory === 0 ? 'danger' :
                                product.inventory < 10 ? 'warning' : 'success'
                              }`}>
                                {product.inventory === 0 ? 'Tükendi' :
                                 product.inventory < 10 ? 'Düşük' : 'Normal'}
                              </span>
                            </td>
                          </tr>
                          ));
                        })()}
                      </tbody>
                    </table>
                  </div>

                  {(() => {
                    const filteredProducts = filterProducts(location.products);
                    const hasMore = filteredProducts.length > displayLimit;
                    return hasMore && (
                      <div className="load-more-section">
                        <div className="load-more-info">
                          <p>
                            Gösterilen: <strong>{displayLimit}</strong> / {filteredProducts.length} ürün
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={handleLoadMore}
                          className="btn-secondary"
                        >
                          📦 250 Ürün Daha Göster
                        </button>
                      </div>
                    );
                  })()}
                </div>
              ))
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default Dashboard

