import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getStores, createIntegration } from '../utils/api'
import LoadingSpinner from '../components/LoadingSpinner'

const NewIntegration = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [stores, setStores] = useState([]);
  const [name, setName] = useState('');
  const [sourceStore, setSourceStore] = useState('');
  const [targetStore, setTargetStore] = useState('');

  useEffect(() => {
    const fetchStores = async () => {
      try {
        const response = await getStores();
        if (response.success) {
          setStores(response.data);
        }
      } catch (err) {
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStores();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name || !sourceStore || !targetStore) {
      alert('Lütfen tüm alanları doldurun');
      return;
    }

    if (sourceStore === targetStore) {
      alert('Kaynak ve hedef mağaza aynı olamaz');
      return;
    }

    setSaving(true);
    try {
      const response = await createIntegration(name, sourceStore, targetStore);
      if (response.success) {
        navigate('/integrations');
      }
    } catch (err) {
      alert('Hata: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Yükleniyor..." />;
  }

  return (
    <div className="new-integration-page">
      <div className="page-header-simple">
        <h1>➕ Yeni Entegrasyon</h1>
        <button onClick={() => navigate('/integrations')} className="btn-secondary-simple">
          ← Geri
        </button>
      </div>

      <div className="form-card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Entegrasyon Adı</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Örn: Ana Mağaza → Yedek Mağaza"
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label>📤 Kaynak Mağaza</label>
            <select value={sourceStore} onChange={(e) => setSourceStore(e.target.value)} required>
              <option value="">Seçin...</option>
              {stores.map(store => (
                <option key={store.id} value={store.id}>
                  {store.name} ({store.shopDomain})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>📥 Hedef Mağaza</label>
            <select value={targetStore} onChange={(e) => setTargetStore(e.target.value)} required>
              <option value="">Seçin...</option>
              {stores.map(store => (
                <option key={store.id} value={store.id} disabled={store.id === sourceStore}>
                  {store.name} ({store.shopDomain})
                </option>
              ))}
            </select>
          </div>

          <button 
            type="submit" 
            disabled={saving}
            className="btn-primary-simple btn-full"
          >
            {saving ? '⏳ Oluşturuluyor...' : '✅ Entegrasyon Oluştur'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default NewIntegration


