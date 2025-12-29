export default function PrivacyPolicy() {
  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <h1 style={styles.title}>Gizlilik Politikası</h1>
        <p style={styles.date}>Son Güncelleme: 30 Aralık 2025</p>

        <section style={styles.section}>
          <h2 style={styles.heading}>1. Giriş</h2>
          <p style={styles.paragraph}>
            Depom ("biz", "bizim" veya "uygulama"), Shopify mağazaları arasında stok yönetimi sağlayan bir uygulamadır.
            Bu Gizlilik Politikası, uygulamam

ızın nasıl bilgi topladığını, kullandığını ve koruduğunu açıklar.
          </p>
        </section>

        <section style={styles.section}>
          <h2 style={styles.heading}>2. Topladığımız Bilgiler</h2>
          <p style={styles.paragraph}>Depom aşağıdaki bilgileri toplar:</p>
          <ul style={styles.list}>
            <li><strong>Mağaza Bilgileri:</strong> Mağaza adı, domain, email, saat dilimi</li>
            <li><strong>Ürün Bilgileri:</strong> Ürün adları, SKU'lar, fiyatlar, stok seviyeleri</li>
            <li><strong>Koleksiyon Bilgileri:</strong> Koleksiyon adları ve ürün eşleştirmeleri</li>
            <li><strong>Senkronizasyon Logları:</strong> İşlem tarih ve saatleri, başarı/hata durumları</li>
          </ul>
        </section>

        <section style={styles.section}>
          <h2 style={styles.heading}>3. Bilgileri Nasıl Kullanırız</h2>
          <p style={styles.paragraph}>Topladığımız bilgileri şu amaçlarla kullanırız:</p>
          <ul style={styles.list}>
            <li>Mağazalar arası ürün ve stok senkronizasyonu sağlamak</li>
            <li>Uygulama performansını ve kullanıcı deneyimini iyileştirmek</li>
            <li>Teknik destek sağlamak</li>
            <li>Yasal yükümlülükleri yerine getirmek</li>
          </ul>
        </section>

        <section style={styles.section}>
          <h2 style={styles.heading}>4. Veri Güvenliği</h2>
          <p style={styles.paragraph}>
            Verilerinizi korumak için endüstri standardı güvenlik önlemleri alıyoruz:
          </p>
          <ul style={styles.list}>
            <li>Tüm API token'ları AES-256 şifreleme ile saklanır</li>
            <li>SSL/TLS ile şifreli iletişim</li>
            <li>PostgreSQL veritabanı ile güvenli veri saklama</li>
            <li>Düzenli güvenlik güncellemeleri</li>
          </ul>
        </section>

        <section style={styles.section}>
          <h2 style={styles.heading}>5. Veri Paylaşımı</h2>
          <p style={styles.paragraph}>
            Verilerinizi üçüncü taraflarla <strong>paylaşmıyoruz</strong>. Verileriniz yalnızca:
          </p>
          <ul style={styles.list}>
            <li>Shopify API ile etkileşim için kullanılır</li>
            <li>Sizin mağazalarınız arasında senkronizasyon için işlenir</li>
            <li>Yasal zorunluluk halinde yetkili makamlarla paylaşılabilir</li>
          </ul>
        </section>

        <section style={styles.section}>
          <h2 style={styles.heading}>6. GDPR Uyumluluğu</h2>
          <p style={styles.paragraph}>
            Avrupa Birliği vatandaşları için GDPR haklarınız:
          </p>
          <ul style={styles.list}>
            <li><strong>Erişim Hakkı:</strong> Verilerinizin bir kopyasını talep edebilirsiniz</li>
            <li><strong>Silme Hakkı:</strong> Verilerinizin silinmesini talep edebilirsiniz</li>
            <li><strong>Düzeltme Hakkı:</strong> Hatalı verilerin düzeltilmesini isteyebilirsiniz</li>
            <li><strong>Taşınabilirlik Hakkı:</strong> Verilerinizi başka bir platforma taşıyabilirsiniz</li>
          </ul>
          <p style={styles.paragraph}>
            GDPR talepleriniz için: <a href="mailto:emreisik20@gmail.com" style={styles.link}>emreisik20@gmail.com</a>
          </p>
        </section>

        <section style={styles.section}>
          <h2 style={styles.heading}>7. Veri Saklama</h2>
          <p style={styles.paragraph}>
            Verilerinizi yalnızca uygulama aktif kullanımdayken saklarız. Uygulama kaldırıldığında:
          </p>
          <ul style={styles.list}>
            <li>48 saat içinde tüm verileriniz silinir</li>
            <li>API token'ları derhal devre dışı bırakılır</li>
            <li>Senkronizasyon logları temizlenir</li>
          </ul>
        </section>

        <section style={styles.section}>
          <h2 style={styles.heading}>8. Çerezler</h2>
          <p style={styles.paragraph}>
            Depom, kullanıcı oturum yönetimi için minimal çerez kullanır. Üçüncü taraf izleme çerezleri kullanmıyoruz.
          </p>
        </section>

        <section style={styles.section}>
          <h2 style={styles.heading}>9. Değişiklikler</h2>
          <p style={styles.paragraph}>
            Bu Gizlilik Politikası'nı zaman zaman güncelleyebiliriz. Önemli değişiklikler için email ile bildirim göndereceğiz.
          </p>
        </section>

        <section style={styles.section}>
          <h2 style={styles.heading}>10. İletişim</h2>
          <p style={styles.paragraph}>
            Gizlilik ile ilgili sorularınız için:
          </p>
          <ul style={styles.list}>
            <li>Email: <a href="mailto:emreisik20@gmail.com" style={styles.link}>emreisik20@gmail.com</a></li>
            <li>Website: <a href="https://lighthearted-licorice-c736cb.netlify.app" style={styles.link}>Depom</a></li>
          </ul>
        </section>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    background: '#f5f5f5',
    padding: '40px 20px'
  },
  content: {
    maxWidth: '800px',
    margin: '0 auto',
    background: 'white',
    padding: '40px',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  title: {
    fontSize: '36px',
    color: '#333',
    marginBottom: '10px'
  },
  date: {
    color: '#666',
    marginBottom: '40px',
    fontStyle: 'italic'
  },
  section: {
    marginBottom: '30px'
  },
  heading: {
    fontSize: '24px',
    color: '#444',
    marginBottom: '15px',
    borderBottom: '2px solid #667eea',
    paddingBottom: '10px'
  },
  paragraph: {
    lineHeight: '1.8',
    color: '#555',
    marginBottom: '15px'
  },
  list: {
    paddingLeft: '20px',
    lineHeight: '1.8',
    color: '#555'
  },
  link: {
    color: '#667eea',
    textDecoration: 'none',
    fontWeight: '500'
  }
};

