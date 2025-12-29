import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { testConnection, addStore } from '../utils/api'

const AddStore = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    storeName: '',
    shopDomain: '',
    accessToken: ''
  });
  const [testing, setTesting] = useState(false);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [testResult, setTestResult] = useState(null);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
    setSuccess('');
  };

  const handleTestConnection = async (e) => {
    e.preventDefault();
    
    if (!formData.shopDomain || !formData.accessToken) {
      setError('Shop domain ve access token gerekli');
      return;
    }

    setTesting(true);
    setError('');
    setTestResult(null);
    
    try {
      const response = await testConnection(formData.shopDomain, formData.accessToken);
      
      if (response.success) {
        setSuccess('Bağlantı başarılı! ✅');
        setTestResult(response.shopInfo);
        
        // Eğer store name boşsa, Shopify'dan gelen ismi kullan
        if (!formData.storeName && response.shopInfo.name) {
          setFormData(prev => ({
            ...prev,
            storeName: response.shopInfo.name
          }));
        }
      }
    } catch (err) {
      console.error('Test connection error:', err);
      setError(err.response?.data?.error || 'Bağlantı testi başarısız');
      setTestResult(null);
    } finally {
      setTesting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.shopDomain || !formData.accessToken) {
      setError('Tüm gerekli alanları doldurun');
      return;
    }

    setAdding(true);
    setError('');
    
    try {
      const response = await addStore(
        formData.storeName,
        formData.shopDomain,
        formData.accessToken
      );
      
      if (response.success) {
        alert('Mağaza başarıyla eklendi! 🎉');
        navigate('/stores');
      }
    } catch (err) {
      console.error('Add store error:', err);
      setError(err.response?.data?.error || 'Mağaza eklenirken hata oluştu');
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="add-store-page">
      <div className="page-header">
        <h1>Yeni Mağaza Ekle</h1>
        <p className="subtitle">Shopify mağazanızı bağlayın</p>
      </div>

      <div className="add-store-container">
        <div className="add-store-form-section">
          <form onSubmit={handleSubmit} className="add-store-form">
            <div className="form-group">
              <label htmlFor="storeName">
                Mağaza Adı <span className="optional">(İsteğe bağlı)</span>
              </label>
              <input
                type="text"
                id="storeName"
                name="storeName"
                value={formData.storeName}
                onChange={handleChange}
                placeholder="Örn: Ana Mağaza"
                disabled={adding}
              />
              <small>Mağazanıza vermek istediğiniz isim</small>
            </div>

            <div className="form-group">
              <label htmlFor="shopDomain">
                Shop Domain <span className="required">*</span>
              </label>
              <input
                type="text"
                id="shopDomain"
                name="shopDomain"
                value={formData.shopDomain}
                onChange={handleChange}
                placeholder="mystore.myshopify.com"
                required
                disabled={adding}
              />
              <small>Shopify admin URL'inizdeki store adı</small>
            </div>

            <div className="form-group">
              <label htmlFor="accessToken">
                Admin API Access Token <span className="required">*</span>
              </label>
              <input
                type="password"
                id="accessToken"
                name="accessToken"
                value={formData.accessToken}
                onChange={handleChange}
                placeholder="shpat_xxxxxxxxxxxxxxxx"
                required
                disabled={adding}
              />
              <small>
                <a href="#how-to" className="help-link">
                  Token nasıl alınır? 📖
                </a>
              </small>
            </div>

            {error && (
              <div className="alert alert-error">
                ❌ {error}
              </div>
            )}

            {success && (
              <div className="alert alert-success">
                ✅ {success}
              </div>
            )}

            {testResult && (
              <div className="test-result">
                <h4>✅ Bağlantı Başarılı</h4>
                <div className="test-result-info">
                  <p><strong>Mağaza:</strong> {testResult.name}</p>
                  <p><strong>Domain:</strong> {testResult.domain}</p>
                  <p><strong>Email:</strong> {testResult.email}</p>
                  <p><strong>Para Birimi:</strong> {testResult.currency}</p>
                </div>
              </div>
            )}

            <div className="form-actions">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testing || adding || !formData.shopDomain || !formData.accessToken}
                className="btn-secondary"
              >
                {testing ? '⏳ Test ediliyor...' : '🔍 Bağlantıyı Test Et'}
              </button>
              
              <button
                type="submit"
                disabled={adding || testing}
                className="btn-primary"
              >
                {adding ? '⏳ Ekleniyor...' : '+ Mağazayı Ekle'}
              </button>
            </div>
          </form>
        </div>

        <div className="add-store-help-section" id="how-to">
          <div className="help-card">
            <h3>📖 Nasıl Kurulum Yapılır?</h3>
            <ol className="help-steps">
              <li>
                <strong>Shopify Admin</strong> panelinize giriş yapın
              </li>
              <li>
                <strong>Settings → Apps and sales channels</strong> menüsüne gidin
              </li>
              <li>
                <strong>"Develop apps"</strong> sekmesine tıklayın
              </li>
              <li>
                <strong>"Create an app"</strong> ile yeni app oluşturun
              </li>
              <li>
                <strong>Configuration → Admin API integration</strong> bölümünden şu izinleri verin:
                <ul>
                  <li>✓ read_products</li>
                  <li>✓ read_inventory</li>
                  <li>✓ read_locations</li>
                </ul>
              </li>
              <li>
                <strong>"Install app"</strong> butonuna tıklayın
              </li>
              <li>
                <strong>Admin API access token</strong>'ı kopyalayın
              </li>
              <li>
                Token'ı yukarıdaki forma yapıştırın ve test edin
              </li>
            </ol>
          </div>

          <div className="help-card security">
            <h3>🔒 Güvenlik</h3>
            <p>
              Access token'larınız şifrelenmiş olarak saklanır ve sadece 
              Shopify API'ye bağlanmak için kullanılır. Token'larınızı 
              kimseyle paylaşmayın.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AddStore


