import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function Install() {
  const [searchParams] = useSearchParams();
  const [shop, setShop] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // URL'den shop parametresini al
    const shopParam = searchParams.get('shop');
    if (shopParam) {
      // Otomatik yönlendirme
      handleInstall(shopParam);
    }
  }, [searchParams]);

  const handleInstall = async (shopDomain = shop) => {
    if (!shopDomain) {
      setError('Lütfen mağaza adresinizi girin');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Shopify OAuth flow'una yönlendir
      const cleanShop = shopDomain.replace('https://', '').replace('http://', '');
      window.location.href = `/api/install?shop=${cleanShop}`;
    } catch (err) {
      setError('Kurulum başlatılamadı: ' + err.message);
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h1 style={styles.title}>🏪 Depom</h1>
          <p style={styles.subtitle}>Shopify Mağazaları Arası Stok Yönetimi</p>
        </div>

        <div style={styles.content}>
          <h2 style={styles.heading}>Hoş Geldiniz!</h2>
          <p style={styles.description}>
            Depom'u Shopify mağazanıza yüklemek için aşağıdaki adımları takip edin.
          </p>

          <div style={styles.features}>
            <div style={styles.feature}>
              <span style={styles.icon}>✅</span>
              <span>Otomatik stok senkronizasyonu</span>
            </div>
            <div style={styles.feature}>
              <span style={styles.icon}>🔄</span>
              <span>Çoklu mağaza desteği</span>
            </div>
            <div style={styles.feature}>
              <span style={styles.icon}>📊</span>
              <span>Detaylı raporlama</span>
            </div>
            <div style={styles.feature}>
              <span style={styles.icon}>🚀</span>
              <span>Hızlı ve güvenli</span>
            </div>
          </div>

          <div style={styles.form}>
            <label style={styles.label}>Shopify Mağaza Adresiniz:</label>
            <div style={styles.inputGroup}>
              <input
                type="text"
                placeholder="your-store"
                value={shop}
                onChange={(e) => setShop(e.target.value)}
                style={styles.input}
                disabled={loading}
              />
              <span style={styles.suffix}>.myshopify.com</span>
            </div>

            {error && (
              <div style={styles.error}>
                ⚠️ {error}
              </div>
            )}

            <button
              onClick={() => handleInstall()}
              disabled={loading || !shop}
              style={{
                ...styles.button,
                ...(loading || !shop ? styles.buttonDisabled : {})
              }}
            >
              {loading ? '🔄 Yönlendiriliyor...' : '🚀 Depom\'u Yükle'}
            </button>
          </div>

          <div style={styles.note}>
            <p style={styles.noteText}>
              <strong>Not:</strong> Kurulum sırasında Shopify hesabınıza giriş yapmanız istenecektir.
              Depom sadece ürün ve stok bilgilerine erişim talep eder.
            </p>
          </div>
        </div>

        <div style={styles.footer}>
          <a href="/privacy-policy" style={styles.link}>Gizlilik Politikası</a>
          <span style={styles.separator}>•</span>
          <a href="/terms-of-service" style={styles.link}>Kullanım Koşulları</a>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '20px'
  },
  card: {
    background: 'white',
    borderRadius: '12px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
    maxWidth: '500px',
    width: '100%',
    overflow: 'hidden'
  },
  header: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    padding: '40px 30px',
    textAlign: 'center'
  },
  title: {
    margin: '0 0 10px 0',
    fontSize: '48px',
    fontWeight: 'bold'
  },
  subtitle: {
    margin: 0,
    fontSize: '16px',
    opacity: 0.9
  },
  content: {
    padding: '40px 30px'
  },
  heading: {
    margin: '0 0 10px 0',
    fontSize: '24px',
    color: '#333'
  },
  description: {
    color: '#666',
    marginBottom: '30px',
    lineHeight: '1.6'
  },
  features: {
    marginBottom: '30px'
  },
  feature: {
    display: 'flex',
    alignItems: 'center',
    padding: '10px 0',
    color: '#555'
  },
  icon: {
    fontSize: '20px',
    marginRight: '12px'
  },
  form: {
    marginTop: '30px'
  },
  label: {
    display: 'block',
    marginBottom: '10px',
    color: '#333',
    fontWeight: '500'
  },
  inputGroup: {
    display: 'flex',
    alignItems: 'center',
    border: '2px solid #ddd',
    borderRadius: '8px',
    overflow: 'hidden',
    marginBottom: '15px'
  },
  input: {
    flex: 1,
    border: 'none',
    padding: '14px 16px',
    fontSize: '16px',
    outline: 'none'
  },
  suffix: {
    padding: '14px 16px',
    background: '#f5f5f5',
    color: '#666',
    fontSize: '14px'
  },
  button: {
    width: '100%',
    padding: '16px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'transform 0.2s',
    marginTop: '10px'
  },
  buttonDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed'
  },
  error: {
    background: '#fee',
    color: '#c33',
    padding: '12px',
    borderRadius: '6px',
    marginBottom: '15px',
    fontSize: '14px'
  },
  note: {
    marginTop: '25px',
    padding: '15px',
    background: '#f9f9f9',
    borderRadius: '8px',
    borderLeft: '4px solid #667eea'
  },
  noteText: {
    margin: 0,
    fontSize: '13px',
    color: '#666',
    lineHeight: '1.6'
  },
  footer: {
    padding: '20px 30px',
    background: '#f9f9f9',
    textAlign: 'center',
    fontSize: '14px'
  },
  link: {
    color: '#667eea',
    textDecoration: 'none',
    fontWeight: '500'
  },
  separator: {
    margin: '0 10px',
    color: '#ccc'
  }
};

