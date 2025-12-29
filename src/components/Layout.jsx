import { Link, useLocation } from 'react-router-dom'

const Layout = ({ children }) => {
  const location = useLocation();

  return (
    <div className="app-container">
      <nav className="navbar">
        <div className="nav-brand">
          <h1>📦 Stok Kontrol</h1>
          <p className="nav-subtitle">Shopify Mağaza Yönetimi</p>
        </div>
        <div className="nav-links">
          <Link 
            to="/" 
            className={location.pathname === '/' ? 'active' : ''}
          >
            🏠 Ana Sayfa
          </Link>
          <Link 
            to="/stores" 
            className={location.pathname.startsWith('/stores') ? 'active' : ''}
          >
            Mağazalar
          </Link>
          <Link 
            to="/integrations" 
            className={location.pathname.startsWith('/integrations') ? 'active' : ''}
          >
            🔗 Entegrasyonlar
          </Link>
        </div>
      </nav>
      <main className="main-content">
        {children}
      </main>
    </div>
  )
}

export default Layout

