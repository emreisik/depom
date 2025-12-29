export default function TermsOfService() {
  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <h1 style={styles.title}>Kullanım Koşulları</h1>
        <p style={styles.date}>Son Güncelleme: 30 Aralık 2025</p>

        <section style={styles.section}>
          <h2 style={styles.heading}>1. Kabul</h2>
          <p style={styles.paragraph}>
            Depom uygulamasını ("Uygulama") kullanarak bu Kullanım Koşulları'nı kabul etmiş sayılırsınız.
            Eğer bu koşulları kabul etmiyorsanız, lütfen uygulamayı kullanmayın.
          </p>
        </section>

        <section style={styles.section}>
          <h2 style={styles.heading}>2. Hizmet Tanımı</h2>
          <p style={styles.paragraph}>
            Depom, Shopify mağazaları arasında ürün ve stok senkronizasyonu sağlayan bir SaaS (Software as a Service) uygulamasıdır.
            Hizmetimiz şunları içerir:
          </p>
          <ul style={styles.list}>
            <li>Çoklu mağaza ürün senkronizasyonu</li>
            <li>Otomatik stok güncelleme</li>
            <li>Ürün bilgisi ve fiyat senkronizasyonu</li>
            <li>Koleksiyon eşleştirme</li>
            <li>Detaylı senkronizasyon raporları</li>
          </ul>
        </section>

        <section style={styles.section}>
          <h2 style={styles.heading}>3. Hesap ve Güvenlik</h2>
          <p style={styles.paragraph}>
            Depom'u kullanmak için geçerli bir Shopify mağazasına sahip olmanız gerekir:
          </p>
          <ul style={styles.list}>
            <li>Shopify hesap bilgilerinizin güvenliğinden siz sorumlusunuz</li>
            <li>API token'larınızı üçüncü taraflarla paylaşmamalısınız</li>
            <li>Şüpheli aktiviteleri derhal bize bildirmelisiniz</li>
            <li>Her mağaza için yalnızca bir bağlantı yapabilirsiniz</li>
          </ul>
        </section>

        <section style={styles.section}>
          <h2 style={styles.heading}>4. Kullanım Kısıtlamaları</h2>
          <p style={styles.paragraph}>
            Depom'u kullanırken şunları YAPAMAZSINIZ:
          </p>
          <ul style={styles.list}>
            <li>Uygulamayı yasa dışı amaçlarla kullanmak</li>
            <li>Sistemi hacklemeye veya güvenlik açıkları bulmaya çalışmak</li>
            <li>API limitlerini aşacak şekilde aşırı istek göndermek</li>
            <li>Başka kullanıcıların verilerine yetkisiz erişim sağlamak</li>
            <li>Uygulamayı tersine mühendislik yapmak</li>
          </ul>
        </section>

        <section style={styles.section}>
          <h2 style={styles.heading}>5. Veri ve Gizlilik</h2>
          <p style={styles.paragraph}>
            Verileriniz bizim için önemlidir:
          </p>
          <ul style={styles.list}>
            <li>Tüm veriler şifreli olarak saklanır</li>
            <li>Verilerinizi üçüncü taraflarla paylaşmıyoruz</li>
            <li>Detaylı bilgi için <a href="/privacy-policy" style={styles.link}>Gizlilik Politikası</a>'na bakın</li>
            <li>GDPR ve KVKK uyumluyuz</li>
          </ul>
        </section>

        <section style={styles.section}>
          <h2 style={styles.heading}>6. Fiyatlandırma ve Ödeme</h2>
          <p style={styles.paragraph}>
            Depom şu anda ücretsiz kullanılabilir. Gelecekte ücretli planlar sunabiliriz:
          </p>
          <ul style={styles.list}>
            <li>Ücretsiz Plan: Temel özellikler</li>
            <li>Premium Planlar: Gelecekte duyurulacak</li>
            <li>Fiyat değişiklikleri 30 gün önceden bildirilir</li>
          </ul>
        </section>

        <section style={styles.section}>
          <h2 style={styles.heading}>7. Hizmet Seviyesi</h2>
          <p style={styles.paragraph}>
            Depom'u en iyi şekilde sunmak için çalışıyoruz, ancak:
          </p>
          <ul style={styles.list}>
            <li>%99.5 uptime hedefliyoruz</li>
            <li>Planlı bakımlar önceden duyurulur</li>
            <li>Acil durumlarda kesinti olabilir</li>
            <li>Shopify API limitleri geçerlidir</li>
          </ul>
        </section>

        <section style={styles.section}>
          <h2 style={styles.heading}>8. Sorumluluk Sınırlaması</h2>
          <p style={styles.paragraph}>
            Depom "OLDUĞU GİBİ" sunulmaktadır. Aşağıdakilerden sorumlu değiliz:
          </p>
          <ul style={styles.list}>
            <li>Shopify API'dan kaynaklanan hatalar</li>
            <li>İnternet bağlantı sorunları</li>
            <li>Kullanıcı hataları veya yanlış yapılandırma</li>
            <li>Veri kaybı (yedek alınması önerilir)</li>
            <li>İş kaybı veya gelir kaybı</li>
          </ul>
        </section>

        <section style={styles.section}>
          <h2 style={styles.heading}>9. Sonlandırma</h2>
          <p style={styles.paragraph}>
            Hesabınızı istediğiniz zaman sonlandırabilirsiniz:
          </p>
          <ul style={styles.list}>
            <li>Uygulamayı Shopify'dan kaldırarak</li>
            <li>Destek ekibiyle iletişime geçerek</li>
            <li>Sonlandırma sonrası 48 saat içinde tüm verileriniz silinir</li>
            <li>Kötüye kullanım durumunda hesabınızı sonlandırabiliriz</li>
          </ul>
        </section>

        <section style={styles.section}>
          <h2 style={styles.heading}>10. Değişiklikler</h2>
          <p style={styles.paragraph}>
            Bu Kullanım Koşulları'nı zaman zaman güncelleyebiliriz. Önemli değişiklikler için:
          </p>
          <ul style={styles.list}>
            <li>30 gün önceden email bildirimi gönderilir</li>
            <li>Uygulama içinde bildirim gösterilir</li>
            <li>Değişiklik tarihinden sonra kullanım = kabul</li>
          </ul>
        </section>

        <section style={styles.section}>
          <h2 style={styles.heading}>11. Uyuşmazlık Çözümü</h2>
          <p style={styles.paragraph}>
            Herhangi bir uyuşmazlık durumunda:
          </p>
          <ul style={styles.list}>
            <li>Önce destek ekibiyle iletişime geçin</li>
            <li>Türkiye yasaları geçerlidir</li>
            <li>İstanbul mahkemeleri yetkilidir</li>
          </ul>
        </section>

        <section style={styles.section}>
          <h2 style={styles.heading}>12. İletişim</h2>
          <p style={styles.paragraph}>
            Sorularınız veya önerileriniz için:
          </p>
          <ul style={styles.list}>
            <li>Email: <a href="mailto:emreisik20@gmail.com" style={styles.link}>emreisik20@gmail.com</a></li>
            <li>Website: <a href="https://lighthearted-licorice-c736cb.netlify.app" style={styles.link}>Depom</a></li>
          </ul>
        </section>

        <section style={styles.section}>
          <p style={styles.paragraph}>
            <em>
              Bu Kullanım Koşulları'nı okuyup anladığınızı ve kabul ettiğinizi onaylıyorsunuz.
            </em>
          </p>
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

