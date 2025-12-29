import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getIntegrations, deleteIntegration, getStores } from '../utils/api'
import LoadingSpinner from '../components/LoadingSpinner'

const Integrations = () => {
  const [loading, setLoading] = useState(true);
  const [integrations, setIntegrations] = useState([]);
  const [stores, setStores] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [integrationsRes, storesRes] = await Promise.all([
        getIntegrations(),
        getStores()
      ]);
      
      if (integrationsRes.success) {
        setIntegrations(integrationsRes.data);
      }
      if (storesRes.success) {
        setStores(storesRes.data);
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`"${name}" entegrasyonunu silmek istediğinize emin misiniz?`)) {
      return;
    }

    try {
      await deleteIntegration(id);
      fetchData();
    } catch (err) {
      alert('Silme hatası: ' + err.message);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return <LoadingSpinner message="Yükleniyor..." />;
  }

  if (stores.length < 2) {
    return (
      <div className="empty-state">
        <div className="empty-icon">🔗</div>
        <h2>En Az İki Mağaza Gerekli</h2>
        <p>Entegrasyon oluşturmak için en az iki mağazanız olmalı</p>
        <Link to="/stores/add" className="btn-primary">+ Mağaza Ekle</Link>
      </div>
    );
  }

  return (
    <div className="integrations-page">
      {/* Header */}
      <div className="page-header-simple">
        <h1>🔗 Entegrasyonlar</h1>
        <Link to="/integrations/new" className="btn-primary-simple">
          + Yeni Entegrasyon
        </Link>
      </div>

      {/* Empty State */}
      {integrations.length === 0 ? (
        <div className="empty-state-simple">
          <div className="empty-icon-large">📦</div>
          <h3>Henüz entegrasyon yok</h3>
          <p>Mağazalar arası otomatik transfer için entegrasyon oluşturun</p>
          <Link to="/integrations/new" className="btn-primary-simple">
            + İlk Entegrasyonu Oluştur
          </Link>
        </div>
      ) : (
        <div className="integrations-grid">
          {integrations.map(integration => (
            <div key={integration.id} className="integration-card">
              <div className="integration-header">
                <h3>{integration.name}</h3>
                <button
                  onClick={() => handleDelete(integration.id, integration.name)}
                  className="btn-icon-danger"
                  title="Sil"
                >
                  🗑️
                </button>
              </div>

              <div className="integration-flow">
                <div className="store-box">
                  <div className="store-label">Kaynak</div>
                  <div className="store-name">{integration.source_store_name}</div>
                </div>

                <div className="arrow">→</div>

                <div className="store-box">
                  <div className="store-label">Hedef</div>
                  <div className="store-name">{integration.target_store_name}</div>
                </div>
              </div>

              {integration.last_sync && (
                <div className="last-sync">
                  Son senkron: {new Date(integration.last_sync).toLocaleString('tr-TR')}
                </div>
              )}

              <Link 
                to={`/integrations/${integration.id}`} 
                className="btn-primary-simple btn-full"
              >
                Çalıştır →
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Integrations


