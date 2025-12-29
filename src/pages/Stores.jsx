import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getStores, deleteStore } from '../utils/api'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'

const Stores = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stores, setStores] = useState([]);

  const fetchStores = async () => {
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

  const handleDelete = async (storeId, storeName) => {
    if (!confirm(`"${storeName}" mağazasını silmek istediğinize emin misiniz?`)) {
      return;
    }

    try {
      const response = await deleteStore(storeId);
      if (response.success) {
        alert('Mağaza başarıyla silindi');
        fetchStores();
      }
    } catch (err) {
      console.error('Error deleting store:', err);
      alert('Mağaza silinirken hata oluştu: ' + (err.response?.data?.error || err.message));
    }
  };

  useEffect(() => {
    fetchStores();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return 'Henüz senkronize edilmedi';
    const date = new Date(dateString);
    return date.toLocaleString('tr-TR');
  };

  if (loading) {
    return <LoadingSpinner message="Mağazalar yükleniyor..." />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={fetchStores} />;
  }

  return (
    <div className="stores-page">
      <div className="page-header">
        <div>
          <h1>Mağazalar</h1>
          <p className="subtitle">Shopify mağazalarınızı yönetin</p>
        </div>
        <Link to="/stores/add" className="btn-primary">
          + Yeni Mağaza Ekle
        </Link>
      </div>

      {stores.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🏪</div>
          <h2>Henüz Mağaza Eklenmemiş</h2>
          <p>İlk mağazanızı ekleyerek başlayın</p>
          <Link to="/stores/add" className="btn-primary">
            + Mağaza Ekle
          </Link>
        </div>
      ) : (
        <div className="stores-grid">
          {stores.map(store => (
            <div key={store.id} className="store-item">
              <div className="store-item-header">
                <h3>{store.name}</h3>
                <span className={`badge ${store.isActive ? 'success' : 'danger'}`}>
                  {store.isActive ? '✓ Aktif' : '✗ Pasif'}
                </span>
              </div>
              
              <div className="store-item-body">
                <div className="store-info-row">
                  <span className="label">Domain:</span>
                  <span className="value">{store.shopDomain}</span>
                </div>
                
                {store.shopInfo && (
                  <>
                    <div className="store-info-row">
                      <span className="label">Email:</span>
                      <span className="value">{store.shopInfo.email}</span>
                    </div>
                    
                    <div className="store-info-row">
                      <span className="label">Para Birimi:</span>
                      <span className="value">{store.shopInfo.currency}</span>
                    </div>
                  </>
                )}
                
                <div className="store-info-row">
                  <span className="label">Son Senkronizasyon:</span>
                  <span className="value">{formatDate(store.lastSync)}</span>
                </div>
                
                <div className="store-info-row">
                  <span className="label">Eklenme Tarihi:</span>
                  <span className="value">{formatDate(store.createdAt)}</span>
                </div>
              </div>
              
              <div className="store-item-footer">
                <button 
                  onClick={() => handleDelete(store.id, store.name)}
                  className="btn-danger-outline"
                >
                  🗑️ Sil
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Stores


