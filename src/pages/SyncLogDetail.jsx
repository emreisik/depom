import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getSyncLog } from '../utils/api'
import LoadingSpinner from '../components/LoadingSpinner'

const SyncLogDetail = () => {
  const { id, logId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [log, setLog] = useState(null);
  const [filter, setFilter] = useState('all'); // all, created, updated, failed, skipped
  const [searchTerm, setSearchTerm] = useState('');
  const [displayLimit, setDisplayLimit] = useState(50);

  useEffect(() => {
    const fetchLog = async () => {
      try {
        const response = await getSyncLog(logId);
        if (response.success) {
          setLog(response.data);
        } else {
          navigate(`/integrations/${id}`);
        }
      } catch (err) {
        console.error('Error:', err);
        navigate(`/integrations/${id}`);
      } finally {
        setLoading(false);
      }
    };
    fetchLog();
  }, [logId, id, navigate]);

  const formatDuration = (seconds) => {
    if (!seconds) return '-';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins} dakika ${secs} saniye` : `${secs} saniye`;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'created': return '➕';
      case 'updated': return '🔄';
      case 'failed': return '❌';
      case 'skipped': return '⏭️';
      default: return '●';
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'created': return 'status-created';
      case 'updated': return 'status-updated';
      case 'failed': return 'status-failed';
      case 'skipped': return 'status-skipped';
      default: return '';
    }
  };

  if (loading) {
    return <LoadingSpinner message="Log yükleniyor..." />;
  }

  if (!log) {
    return null;
  }

  const products = log.details?.products || [];
  const warnings = log.details?.warnings || [];
  const errors = log.details?.errors || [];

  // Filtreleme
  const filteredProducts = products.filter(p => {
    if (filter !== 'all' && p.status !== filter) return false;
    if (searchTerm && !p.sku?.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !p.title?.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    return true;
  });

  const displayedProducts = filteredProducts.slice(0, displayLimit);

  return (
    <div className="sync-log-detail-page">
      {/* Header */}
      <div className="page-header-simple">
        <button onClick={() => navigate(`/integrations/${id}`)} className="btn-secondary-simple">
          ← Geri
        </button>
        <h1>📄 Sync Log #{log.id}</h1>
      </div>

      {/* Summary Card */}
      <div className="log-summary-card">
        <h3>📊 Özet</h3>
        <div className="summary-grid">
          <div className="summary-item">
            <span className="summary-label">Tip:</span>
            <span className="summary-value">
              {log.sync_type === 'full' ? '🔄 Tam Senkronizasyon' : '📊 Stok Senkronizasyonu'}
            </span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Durum:</span>
            <span className={`summary-value status-${log.status}`}>
              {log.status === 'completed' ? '✅ Başarılı' : 
               log.status === 'failed' ? '❌ Başarısız' :
               log.status === 'running' ? '⏳ Devam Ediyor' : '⚠️ Kısmi'}
            </span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Başlangıç:</span>
            <span className="summary-value">{new Date(log.started_at).toLocaleString('tr-TR')}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Bitiş:</span>
            <span className="summary-value">
              {log.completed_at ? new Date(log.completed_at).toLocaleString('tr-TR') : '-'}
            </span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Süre:</span>
            <span className="summary-value">{formatDuration(log.duration_seconds)}</span>
          </div>
        </div>
      </div>

      {/* Stats Card */}
      <div className="stats-card">
        <h3>📈 İstatistikler</h3>
        <div className="stats-grid-large">
          <div className="stat-box-large info">
            <div className="stat-icon">📦</div>
            <div className="stat-value">{log.total_products}</div>
            <div className="stat-label">Toplam Ürün</div>
          </div>
          {log.products_created > 0 && (
            <div className="stat-box-large success">
              <div className="stat-icon">➕</div>
              <div className="stat-value">{log.products_created}</div>
              <div className="stat-label">Oluşturulan</div>
            </div>
          )}
          {log.products_updated > 0 && (
            <div className="stat-box-large success">
              <div className="stat-icon">🔄</div>
              <div className="stat-value">{log.products_updated}</div>
              <div className="stat-label">Güncellenen</div>
            </div>
          )}
          {log.inventory_updated > 0 && (
            <div className="stat-box-large info">
              <div className="stat-icon">📊</div>
              <div className="stat-value">{log.inventory_updated}</div>
              <div className="stat-label">Stok Güncellendi</div>
            </div>
          )}
          {log.products_failed > 0 && (
            <div className="stat-box-large error">
              <div className="stat-icon">❌</div>
              <div className="stat-value">{log.products_failed}</div>
              <div className="stat-label">Hatalı</div>
            </div>
          )}
          {log.products_skipped > 0 && (
            <div className="stat-box-large warning">
              <div className="stat-icon">⏭️</div>
              <div className="stat-value">{log.products_skipped}</div>
              <div className="stat-label">Atlanan</div>
            </div>
          )}
        </div>
      </div>

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="warnings-card">
          <h3>⚠️ Uyarılar ({warnings.length})</h3>
          <ul className="warnings-list">
            {warnings.map((warning, idx) => (
              <li key={idx}>{warning}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Error Message */}
      {log.error_message && (
        <div className="error-card">
          <h3>❌ Hata Mesajı</h3>
          <p>{log.error_message}</p>
        </div>
      )}

      {/* Products List */}
      {products.length > 0 && (
        <div className="products-card">
          <div className="products-header">
            <h3>📝 Ürün Detayları ({products.length})</h3>
            <div className="products-filters">
              <select 
                value={filter} 
                onChange={(e) => setFilter(e.target.value)}
                className="filter-select"
              >
                <option value="all">Tümü ({products.length})</option>
                <option value="created">Oluşturulan ({products.filter(p => p.status === 'created').length})</option>
                <option value="updated">Güncellenen ({products.filter(p => p.status === 'updated').length})</option>
                <option value="failed">Hatalı ({products.filter(p => p.status === 'failed').length})</option>
                <option value="skipped">Atlanan ({products.filter(p => p.status === 'skipped').length})</option>
              </select>
              <input
                type="text"
                placeholder="SKU veya ürün adı ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input-small"
              />
            </div>
          </div>

          <div className="products-list">
            {displayedProducts.map((product, idx) => (
              <div key={idx} className={`product-log-item ${getStatusClass(product.status)}`}>
                <div className="product-log-header">
                  <span className="product-icon">{getStatusIcon(product.status)}</span>
                  <span className="product-sku">{product.sku || 'No SKU'}</span>
                  <span className="product-status">{product.status}</span>
                </div>
                <div className="product-log-title">{product.title}</div>
                {product.message && (
                  <div className="product-log-message">{product.message}</div>
                )}
                {product.error && (
                  <div className="product-log-error">❌ {product.error}</div>
                )}
              </div>
            ))}
          </div>

          {displayedProducts.length < filteredProducts.length && (
            <div className="load-more-section">
              <button 
                onClick={() => setDisplayLimit(displayLimit + 50)}
                className="btn-secondary-simple"
              >
                Daha Fazla Yükle ({filteredProducts.length - displayedProducts.length} kaldı)
              </button>
            </div>
          )}

          {displayedProducts.length === 0 && (
            <div className="empty-state-simple">
              <p>Filtre kriterlerine uygun ürün bulunamadı</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default SyncLogDetail

