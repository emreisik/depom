import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { 
  getIntegration, 
  syncInventoryOnly, 
  startFullSync, 
  getSyncLogs,
  getProductsBrowser,
  getCollectionMappings,
  createCollectionMapping,
  deleteCollectionMapping,
  getSyncSettings,
  updateSyncSettings
} from '../utils/api'
import LoadingSpinner from '../components/LoadingSpinner'

const IntegrationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [integration, setIntegration] = useState(null);
  const [syncLogs, setSyncLogs] = useState([]);
  const [result, setResult] = useState(null);
  
  // Product Management Tab
  const [activeTab, setActiveTab] = useState('overview'); // overview, products, history, settings
  const [productsData, setProductsData] = useState(null);
  const [loadingProducts, setLoadingProducts] = useState(false);
  
  // Product Filters
  const [productFilters, setProductFilters] = useState({
    vendor: 'all',
    collectionId: 'all',
    hasStock: false
  });
  
  // Collection Mappings
  const [collectionMappings, setCollectionMappings] = useState([]);
  const [showMappingModal, setShowMappingModal] = useState(false);
  const [sourceCollections, setSourceCollections] = useState([]);
  const [targetCollections, setTargetCollections] = useState([]);
  
  // Sync Settings
  const [syncSettings, setSyncSettings] = useState(null);
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  const fetchIntegration = async () => {
    try {
      const response = await getIntegration(id);
      if (response.success) {
        setIntegration(response.data);
      } else {
        navigate('/integrations');
      }
    } catch (err) {
      console.error('Error:', err);
      navigate('/integrations');
    } finally {
      setLoading(false);
    }
  };

  const fetchSyncLogs = async () => {
    try {
      const response = await getSyncLogs(id, 10);
      if (response.success) {
        setSyncLogs(response.data);
      }
    } catch (err) {
      console.error('Error fetching sync logs:', err);
    }
  };

  const fetchProducts = async (filters = productFilters) => {
    if (!integration) return;
    
    setLoadingProducts(true);
    try {
      const response = await getProductsBrowser(integration.source_store_id, true, filters);
      if (response.success) {
        setProductsData(response.data);
        setSourceCollections(response.data.collections || []);
      }
      
      // Hedef mağaza collections
      const targetResponse = await getProductsBrowser(integration.target_store_id, true);
      if (targetResponse.success) {
        setTargetCollections(targetResponse.data.collections || []);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleFilterChange = (filterName, value) => {
    const newFilters = { ...productFilters, [filterName]: value };
    setProductFilters(newFilters);
    fetchProducts(newFilters);
  };

  const fetchCollectionMappings = async () => {
    try {
      console.log(`📥 Koleksiyon eşleştirmeleri yükleniyor... integrationId=${id}`);
      const response = await getCollectionMappings(id);
      console.log('📥 Mappings response:', response);
      
      if (response.success) {
        console.log(`✅ ${response.data.length} eşleştirme yüklendi`);
        setCollectionMappings(response.data);
      }
    } catch (err) {
      console.error('❌ Error fetching mappings:', err);
    }
  };

  useEffect(() => {
    fetchIntegration();
    fetchSyncLogs();
  }, [id]);

  useEffect(() => {
    if (activeTab === 'products' && integration && !productsData) {
      fetchProducts();
      fetchCollectionMappings();
    }
    if (activeTab === 'settings' && integration && !syncSettings) {
      fetchSettings();
    }
  }, [activeTab, integration]);

  const fetchSettings = async () => {
    setLoadingSettings(true);
    try {
      const response = await getSyncSettings(id);
      if (response.success) {
        setSyncSettings(response.data);
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    } finally {
      setLoadingSettings(false);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      console.log('💾 Ayarlar kaydediliyor:', syncSettings);
      const response = await updateSyncSettings(id, syncSettings);
      console.log('✅ Backend response:', response);
      
      if (response.success) {
        alert('✅ Ayarlar kaydedildi');
        setSyncSettings(response.data);
        console.log('✅ Settings state güncellendi:', response.data);
      }
    } catch (err) {
      console.error('❌ Settings kaydetme hatası:', err);
      alert('Hata: ' + err.message);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleSettingChange = (field, value) => {
    setSyncSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFullSync = async () => {
    let filterMsg = '';
    if (productFilters.vendor && productFilters.vendor !== 'all') {
      filterMsg += `\n📌 Sadece "${productFilters.vendor}" satıcısı`;
    }
    if (productFilters.collectionId && productFilters.collectionId !== 'all') {
      const collection = sourceCollections.find(c => String(c.id) === String(productFilters.collectionId));
      filterMsg += `\n📚 Sadece "${collection?.title || 'Seçili'}" koleksiyonu`;
    }
    if (productFilters.hasStock) {
      filterMsg += `\n✅ Sadece stokta olan ürünler`;
    }

    const confirmMsg = `🔄 TOPLU SENKRONİZASYON (5 ürün/seferde)\n\n${integration.source_store_name} → ${integration.target_store_name}\n\n✅ Her seferde 5 ürün işlenecek\n✅ Yeni ürünler oluşturulacak\n✅ Mevcut ürünler güncellenecek\n✅ Stoklar senkronize edilecek${filterMsg ? '\n\n🔍 FİLTRELER:' + filterMsg : ''}\n\n💡 Çok ürün varsa birkaç kez "Aktar" yapın!\n\nOnaylıyor musunuz?`;

    if (!confirm(confirmMsg)) return;

    setSyncing(true);
    setResult(null);

    try {
      const response = await startFullSync(id, productFilters);

      if (response.success) {
        setResult(response);
        fetchIntegration();
        fetchSyncLogs();
        
        // Batch uyarısı göster
        if (response.hasMoreProducts) {
          alert(`✅ ${response.message}\n\n💡 TOPLU SENKRONİZASYON: Her seferde 5 ürün işlenir.\nTüm ürünleri aktarmak için tekrar "Aktar" butonuna basın.\n\n📜 "Geçmiş" sekmesinden ilerlemeyi takip edebilirsiniz.`);
        } else {
          alert(`✅ ${response.message}\n\n🎉 Tüm ürünler başarıyla aktarıldı!`);
        }
      }
    } catch (err) {
      console.error('❌ Sync error:', err);
      
      // Eğer timeout hatası ise, özel mesaj göster
      if (err.code === 'ECONNABORTED' || err.message.includes('timeout')) {
        alert('⚠️ TIMEOUT: İşlem arka planda devam ediyor.\n\nÜrünler aktarılıyor, lütfen birkaç saniye bekleyip "Geçmiş" sekmesini kontrol edin.\n\nSonra tekrar "Aktar" yapın (kalan ürünler için).');
      } else {
        alert('Hata: ' + (err.response?.data?.error || err.message));
      }
      
      // Yine de verileri yenile (backend işlemi tamamlanmış olabilir)
      setTimeout(() => {
        fetchIntegration();
        fetchSyncLogs();
      }, 2000);
    } finally {
      setSyncing(false);
    }
  };

  const handleInventorySync = async () => {
    const confirmMsg = `📊 STOK SENKRONİZASYONU (Her seferde: 10 ürün)\n\n${integration.source_store_name} → ${integration.target_store_name}\n\n✅ Sadece stoklar güncellenecek\n❌ Yeni ürün oluşturulmayacak\n✅ Her seferde 10 ürün işlenir\n\n💡 Çok ürün varsa birkaç kez yapın!\n\nOnaylıyor musunuz?`;

    if (!confirm(confirmMsg)) return;

    setSyncing(true);
    setResult(null);

    try {
      const response = await syncInventoryOnly(
        integration.source_store_id,
        integration.target_store_id
      );

      if (response.success) {
        setResult(response);
        fetchIntegration();
        fetchSyncLogs();
        
        // Batch uyarısı
        if (response.hasMoreProducts) {
          alert(`✅ ${response.message}\n\n💡 Tekrar "Stok Senkronizasyonu" yaparak kalan ürünleri güncelleyin.`);
        } else {
          alert(`✅ ${response.message}`);
        }
      }
    } catch (err) {
      console.error('❌ Inventory sync error:', err);
      alert('Hata: ' + (err.response?.data?.error || err.message));
    } finally {
      setSyncing(false);
    }
  };

  const handleCreateMapping = async (sourceId, sourceTitle, targetId, targetTitle) => {
    try {
      await createCollectionMapping(id, {
        sourceCollectionId: sourceId,
        sourceCollectionTitle: sourceTitle,
        targetCollectionId: targetId,
        targetCollectionTitle: targetTitle
      });
      fetchCollectionMappings();
      setShowMappingModal(false);
    } catch (err) {
      alert('Hata: ' + err.message);
    }
  };

  const handleDeleteMapping = async (mappingId) => {
    if (!confirm('Bu eşleştirmeyi silmek istediğinize emin misiniz?')) return;
    
    try {
      console.log(`🗑️ Eşleştirme siliniyor: mappingId=${mappingId}, integrationId=${id}`);
      const response = await deleteCollectionMapping(id, mappingId);
      console.log('✅ Silme response:', response);
      
      if (response.success) {
        alert('✅ Eşleştirme silindi');
        await fetchCollectionMappings();
        console.log('✅ Eşleştirmeler yenilendi');
      }
    } catch (err) {
      console.error('❌ Silme hatası:', err);
      alert('Hata: ' + err.message);
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '-';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}dk ${secs}sn` : `${secs}sn`;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return '✅';
      case 'running': return '⏳';
      case 'failed': return '❌';
      case 'partial': return '⚠️';
      default: return '●';
    }
  };

  const getSyncTypeLabel = (type) => {
    switch (type) {
      case 'full': return '🔄 Tam Senkronizasyon';
      case 'inventory_only': return '📊 Stok Senkronizasyonu';
      case 'new_products': return '➕ Yeni Ürünler';
      case 'incremental': return '⚡ Artırımlı';
      default: return type;
    }
  };

  if (loading) {
    return <LoadingSpinner message="Yükleniyor..." />;
  }

  if (!integration) {
    return null;
  }

  return (
    <div className="integration-detail-page">
      {/* Syncing Overlay */}
      {syncing && (
        <div className="syncing-overlay">
          <div className="syncing-card">
            <div className="spinner"></div>
            <h3>⏳ Senkronizasyon Devam Ediyor...</h3>
            <p>Lütfen bekleyin, bu işlem 2-5 dakika sürebilir.</p>
            <p><strong>Sayfayı KAPATMAYIN!</strong></p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="page-header-simple">
        <button onClick={() => navigate('/integrations')} className="btn-secondary-simple">
          ← Geri
        </button>
        <h1>{integration.name}</h1>
      </div>

      {/* Integration Info */}
      <div className="integration-info-card-compact">
        <div className="integration-flow-compact">
          <div className="store-box-compact">
            <span className="store-label-sm">📤 Kaynak</span>
            <span className="store-name-sm">{integration.source_store_name}</span>
          </div>
          <div className="arrow-sm">→</div>
          <div className="store-box-compact">
            <span className="store-label-sm">📥 Hedef</span>
            <span className="store-name-sm">{integration.target_store_name}</span>
          </div>
        </div>
        <div className="integration-stats-compact">
          {integration.last_sync && (
            <span>Son sync: {new Date(integration.last_sync).toLocaleDateString('tr-TR')}</span>
          )}
          <span>Toplam: {integration.total_syncs || 0} sync</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="integration-tabs">
        <button
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          🎯 Senkronizasyon
        </button>
        <button
          className={`tab-btn ${activeTab === 'products' ? 'active' : ''}`}
          onClick={() => setActiveTab('products')}
        >
          📦 Ürünler & Koleksiyonlar
        </button>
        <button
          className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          📜 Geçmiş
        </button>
        <button
          className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          ⚙️ Ayarlar
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {/* OVERVIEW TAB - Sync Actions */}
        {activeTab === 'overview' && (
          <div className="overview-tab">
            <div className="sync-actions-grid">
              <div className="action-card-compact">
                <h3>🔄 Tam Senkronizasyon</h3>
                <p>Tüm ürünleri çeker, yeni ürünler oluşturur ve stokları senkronize eder.</p>
                <button onClick={handleFullSync} disabled={syncing} className="btn-primary-simple btn-full">
                  {syncing ? '⏳ İşleniyor...' : '🚀 Başlat'}
                </button>
              </div>

              <div className="action-card-compact">
                <h3>📊 Stok Senkronizasyonu</h3>
                <p>Sadece mevcut ürünlerin stok seviyelerini günceller.</p>
                <button onClick={handleInventorySync} disabled={syncing} className="btn-secondary-simple btn-full">
                  {syncing ? '⏳ İşleniyor...' : '📊 Başlat'}
                </button>
              </div>
            </div>

            {result && (
              <div className="result-card-compact">
                <h3>✅ Tamamlandı</h3>
                <div className="stats-row">
                  <div className="stat">
                    <span className="stat-value">{result.stats?.total || result.stats?.totalProducts || 0}</span>
                    <span className="stat-label">Toplam</span>
                  </div>
                  <div className="stat success">
                    <span className="stat-value">{result.stats?.success || result.stats?.productsUpdated || 0}</span>
                    <span className="stat-label">Başarılı</span>
                  </div>
                  {result.stats?.productsCreated > 0 && (
                    <div className="stat success">
                      <span className="stat-value">{result.stats.productsCreated}</span>
                      <span className="stat-label">Oluşturulan</span>
                    </div>
                  )}
                </div>
                {result.syncLogId && (
                  <Link to={`/integrations/${id}/logs/${result.syncLogId}`} className="link-simple">
                    📄 Detaylı Rapor →
                  </Link>
                )}
              </div>
            )}
          </div>
        )}

        {/* PRODUCTS TAB */}
        {activeTab === 'products' && (
          <div className="products-tab">
            {loadingProducts ? (
              <LoadingSpinner message="Ürünler yükleniyor..." />
            ) : productsData ? (
              <>
                {/* Product Filters */}
                <div className="product-filters">
                  <h3>🔍 Ürün Filtreleme</h3>
                  <div className="filter-row">
                    <div className="filter-group">
                      <label>Satıcı:</label>
                      <select 
                        value={productFilters.vendor}
                        onChange={(e) => handleFilterChange('vendor', e.target.value)}
                        className="filter-select"
                      >
                        <option value="all">Tüm Satıcılar ({productsData.stats.totalVendors})</option>
                        {productsData.vendors.map((v, idx) => (
                          <option key={idx} value={v.vendor}>
                            {v.vendor} ({v.productCount})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="filter-group">
                      <label>Koleksiyon:</label>
                      <select 
                        value={productFilters.collectionId}
                        onChange={(e) => handleFilterChange('collectionId', e.target.value)}
                        className="filter-select"
                      >
                        <option value="all">Tüm Koleksiyonlar ({productsData.stats.totalCollections})</option>
                        {sourceCollections.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.title}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="filter-group">
                      <label className="checkbox-label">
                        <input 
                          type="checkbox"
                          checked={productFilters.hasStock}
                          onChange={(e) => handleFilterChange('hasStock', e.target.checked)}
                        />
                        Sadece stokta olanlar
                      </label>
                    </div>

                    {(productFilters.vendor !== 'all' || productFilters.collectionId !== 'all' || productFilters.hasStock) && (
                      <button
                        onClick={() => {
                          setProductFilters({ vendor: 'all', collectionId: 'all', hasStock: false });
                          fetchProducts({ vendor: 'all', collectionId: 'all', hasStock: false });
                        }}
                        className="btn-clear-filters"
                      >
                        ✕ Filtreleri Temizle
                      </button>
                    )}
                  </div>

                  {/* Sync Action with Filters */}
                  <div className="filter-sync-action">
                    <button
                      onClick={handleFullSync}
                      disabled={syncing}
                      className="btn-sync-filtered"
                    >
                      {syncing ? '⏳ Aktarılıyor...' : '🚀 Seçili Ürünleri Aktar'}
                    </button>
                    <div className="filter-sync-info">
                      {productsData.stats.filteredProducts !== productsData.stats.totalProducts ? (
                        <span className="filter-info-text">
                          📊 {productsData.stats.filteredProducts} ürün aktarılacak
                          {productFilters.vendor !== 'all' && <span className="filter-badge">👔 {productFilters.vendor}</span>}
                          {productFilters.collectionId !== 'all' && (
                            <span className="filter-badge">
                              📚 {sourceCollections.find(c => String(c.id) === String(productFilters.collectionId))?.title || 'Koleksiyon'}
                            </span>
                          )}
                          {productFilters.hasStock && <span className="filter-badge">✅ Stokta</span>}
                        </span>
                      ) : (
                        <span className="filter-info-text">
                          📊 Tüm ürünler aktarılacak ({productsData.stats.totalProducts})
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Stats Row */}
                <div className="products-stats-row">
                  <div className="stat-box-sm">
                    <span className="stat-icon">📦</span>
                    <span className="stat-value">{productsData.stats.filteredProducts || productsData.stats.totalProducts}</span>
                    <span className="stat-label">{productsData.stats.filteredProducts !== productsData.stats.totalProducts ? 'Filtreli Ürün' : 'Ürün'}</span>
                  </div>
                  <div className="stat-box-sm-secondary">
                    <span className="stat-value-sm">Toplam: {productsData.stats.totalProducts}</span>
                  </div>
                  <div className="stat-box-sm">
                    <span className="stat-icon">👔</span>
                    <span className="stat-value">{productsData.stats.totalVendors}</span>
                    <span className="stat-label">Satıcı</span>
                  </div>
                  <div className="stat-box-sm">
                    <span className="stat-icon">📚</span>
                    <span className="stat-value">{productsData.stats.totalCollections}</span>
                    <span className="stat-label">Koleksiyon</span>
                  </div>
                  <div className="stat-box-sm">
                    <span className="stat-icon">🏷️</span>
                    <span className="stat-value">{productsData.stats.totalVariants}</span>
                    <span className="stat-label">Varyant</span>
                  </div>
                </div>

                {/* Vendors */}
                <div className="section-compact">
                  <h3>👔 Satıcılar</h3>
                  <div className="vendors-list-compact">
                    {productsData.vendors.slice(0, 10).map((vendor, idx) => (
                      <div key={idx} className="vendor-row">
                        <span className="vendor-name">{vendor.vendor}</span>
                        <span className="vendor-count">{vendor.productCount} ürün</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Collection Mappings */}
                {sourceCollections.length > 0 && (
                  <div className="section-compact">
                    <div className="section-header">
                      <h3>📚 Koleksiyon Eşleştirmeleri</h3>
                      <button 
                        onClick={() => setShowMappingModal(true)}
                        className="btn-sm-primary"
                      >
                        + Yeni Eşleştirme
                      </button>
                    </div>

                    {collectionMappings.length > 0 ? (
                      <div className="mappings-list">
                        {collectionMappings.map((mapping) => (
                          <div key={mapping.id} className="mapping-row">
                            <div className="mapping-flow">
                              <span className="collection-badge">{mapping.source_collection_title}</span>
                              <span className="arrow-sm">→</span>
                              <span className="collection-badge">{mapping.target_collection_title}</span>
                            </div>
                            <button 
                              onClick={() => handleDeleteMapping(mapping.id)}
                              className="btn-icon-sm"
                              title="Sil"
                            >
                              🗑️
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="empty-text">Henüz eşleştirme yok</p>
                    )}
                  </div>
                )}

                {/* Mapping Modal */}
                {showMappingModal && (
                  <div className="modal-overlay" onClick={() => setShowMappingModal(false)}>
                    <div className="modal-content-sm" onClick={(e) => e.stopPropagation()}>
                      <h3>Yeni Koleksiyon Eşleştirmesi</h3>
                      <form onSubmit={(e) => {
                        e.preventDefault();
                        const formData = new FormData(e.target);
                        const sourceId = formData.get('source');
                        const targetId = formData.get('target');
                        const sourceCol = sourceCollections.find(c => c.id == sourceId);
                        const targetCol = targetCollections.find(c => c.id == targetId);
                        if (sourceCol && targetCol) {
                          handleCreateMapping(sourceId, sourceCol.title, targetId, targetCol.title);
                        }
                      }}>
                        <div className="form-group-sm">
                          <label>📤 Kaynak Koleksiyon</label>
                          <select name="source" required>
                            <option value="">Seçin...</option>
                            {sourceCollections.map(c => (
                              <option key={c.id} value={c.id}>{c.title}</option>
                            ))}
                          </select>
                        </div>
                        <div className="form-group-sm">
                          <label>📥 Hedef Koleksiyon</label>
                          <select name="target" required>
                            <option value="">Seçin...</option>
                            {targetCollections.map(c => (
                              <option key={c.id} value={c.id}>{c.title}</option>
                            ))}
                          </select>
                        </div>
                        <div className="modal-actions">
                          <button type="button" onClick={() => setShowMappingModal(false)} className="btn-secondary-simple">
                            İptal
                          </button>
                          <button type="submit" className="btn-primary-simple">
                            Oluştur
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p className="empty-text">Ürün verileri yüklenemedi</p>
            )}
          </div>
        )}

        {/* HISTORY TAB */}
        {activeTab === 'history' && (
          <div className="history-tab">
            {syncLogs.length > 0 ? (
              <div className="sync-logs-compact">
                {syncLogs.map(log => (
                  <div key={log.id} className="log-row">
                    <div className="log-info">
                      <span className="log-icon">{getStatusIcon(log.status)}</span>
                      <div className="log-details">
                        <span className="log-type">{getSyncTypeLabel(log.sync_type)}</span>
                        <span className="log-date">{new Date(log.started_at).toLocaleString('tr-TR')}</span>
                      </div>
                    </div>
                    <div className="log-stats-compact">
                      {log.products_created > 0 && <span>+{log.products_created}</span>}
                      {log.products_updated > 0 && <span>↻{log.products_updated}</span>}
                      {log.products_failed > 0 && <span className="error">✕{log.products_failed}</span>}
                      <span className="duration">{formatDuration(log.duration_seconds)}</span>
                    </div>
                    <Link to={`/integrations/${id}/logs/${log.id}`} className="link-arrow">
                      →
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <p className="empty-text">Henüz sync geçmişi yok</p>
            )}
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div className="settings-tab">
            {loadingSettings ? (
              <LoadingSpinner />
            ) : syncSettings ? (
              <form onSubmit={handleSaveSettings} className="settings-form">
                <h3>📦 Ürün Özellikleri</h3>
                <p className="section-description">Mağazalar arası ürün aktarımında hangi özelliklerin kopyalanacağını seçin</p>
                
                <div className="settings-section">
                  <div className="setting-row">
                    <div className="setting-item">
                      <input
                        type="checkbox"
                        id="sync_title"
                        checked={syncSettings.sync_title ?? true}
                        onChange={(e) => handleSettingChange('sync_title', e.target.checked)}
                      />
                      <label htmlFor="sync_title">
                        <strong>Ürün Başlığı</strong>
                        <small>Ürün adını aktar</small>
                      </label>
                    </div>
                    
                    <div className="setting-item">
                      <input
                        type="checkbox"
                        id="sync_description"
                        checked={syncSettings.sync_description ?? true}
                        onChange={(e) => handleSettingChange('sync_description', e.target.checked)}
                      />
                      <label htmlFor="sync_description">
                        <strong>Açıklama</strong>
                        <small>Ürün açıklamasını aktar</small>
                      </label>
                    </div>

                    <div className="setting-item">
                      <input
                        type="checkbox"
                        id="sync_price"
                        checked={syncSettings.sync_price ?? true}
                        onChange={(e) => handleSettingChange('sync_price', e.target.checked)}
                      />
                      <label htmlFor="sync_price">
                        <strong>Fiyat</strong>
                        <small>Ürün fiyatını aktar</small>
                      </label>
                    </div>
                  </div>

                  <div className="setting-row">
                    <div className="setting-item">
                      <input
                        type="checkbox"
                        id="sync_compare_at_price"
                        checked={syncSettings.sync_compare_at_price ?? true}
                        onChange={(e) => handleSettingChange('sync_compare_at_price', e.target.checked)}
                      />
                      <label htmlFor="sync_compare_at_price">
                        <strong>Karşılaştırma Fiyatı</strong>
                        <small>İndirimli fiyat için</small>
                      </label>
                    </div>

                    <div className="setting-item">
                      <input
                        type="checkbox"
                        id="sync_sku"
                        checked={syncSettings.sync_sku ?? true}
                        onChange={(e) => handleSettingChange('sync_sku', e.target.checked)}
                      />
                      <label htmlFor="sync_sku">
                        <strong>SKU</strong>
                        <small>Stok kodu</small>
                      </label>
                    </div>

                    <div className="setting-item">
                      <input
                        type="checkbox"
                        id="sync_barcode"
                        checked={syncSettings.sync_barcode ?? true}
                        onChange={(e) => handleSettingChange('sync_barcode', e.target.checked)}
                      />
                      <label htmlFor="sync_barcode">
                        <strong>Barkod</strong>
                        <small>Ürün barkodu</small>
                      </label>
                    </div>
                  </div>

                  <div className="setting-row">
                    <div className="setting-item">
                      <input
                        type="checkbox"
                        id="sync_inventory"
                        checked={syncSettings.sync_inventory ?? true}
                        onChange={(e) => handleSettingChange('sync_inventory', e.target.checked)}
                      />
                      <label htmlFor="sync_inventory">
                        <strong>Stok Miktarı</strong>
                        <small>Envanter sayısı</small>
                      </label>
                    </div>

                    <div className="setting-item">
                      <input
                        type="checkbox"
                        id="sync_images"
                        checked={syncSettings.sync_images ?? true}
                        onChange={(e) => handleSettingChange('sync_images', e.target.checked)}
                      />
                      <label htmlFor="sync_images">
                        <strong>Görseller</strong>
                        <small>Ürün fotoğrafları</small>
                      </label>
                    </div>

                    <div className="setting-item">
                      <input
                        type="checkbox"
                        id="sync_tags"
                        checked={syncSettings.sync_tags ?? true}
                        onChange={(e) => handleSettingChange('sync_tags', e.target.checked)}
                      />
                      <label htmlFor="sync_tags">
                        <strong>Etiketler</strong>
                        <small>Ürün tag'leri</small>
                      </label>
                    </div>
                  </div>

                  <div className="setting-row">
                    <div className="setting-item">
                      <input
                        type="checkbox"
                        id="sync_vendor"
                        checked={syncSettings.sync_vendor ?? true}
                        onChange={(e) => handleSettingChange('sync_vendor', e.target.checked)}
                      />
                      <label htmlFor="sync_vendor">
                        <strong>Tedarikçi</strong>
                        <small>Vendor bilgisi</small>
                      </label>
                    </div>

                    <div className="setting-item">
                      <input
                        type="checkbox"
                        id="sync_product_type"
                        checked={syncSettings.sync_product_type ?? true}
                        onChange={(e) => handleSettingChange('sync_product_type', e.target.checked)}
                      />
                      <label htmlFor="sync_product_type">
                        <strong>Ürün Tipi</strong>
                        <small>Kategori bilgisi</small>
                      </label>
                    </div>

                    <div className="setting-item">
                      <input
                        type="checkbox"
                        id="sync_weight"
                        checked={syncSettings.sync_weight ?? true}
                        onChange={(e) => handleSettingChange('sync_weight', e.target.checked)}
                      />
                      <label htmlFor="sync_weight">
                        <strong>Ağırlık</strong>
                        <small>Ürün ağırlığı</small>
                      </label>
                    </div>
                  </div>

                  <div className="setting-row">
                    <div className="setting-item">
                      <input
                        type="checkbox"
                        id="sync_published"
                        checked={syncSettings.sync_published ?? true}
                        onChange={(e) => handleSettingChange('sync_published', e.target.checked)}
                      />
                      <label htmlFor="sync_published">
                        <strong>Yayın Durumu</strong>
                        <small>Aktif/Pasif durumu</small>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="settings-actions">
                  <button 
                    type="button" 
                    className="btn-secondary"
                    onClick={() => {
                      const allTrue = Object.keys(syncSettings).reduce((acc, key) => {
                        if (key.startsWith('sync_')) acc[key] = true;
                        return acc;
                      }, {...syncSettings});
                      setSyncSettings(allTrue);
                    }}
                  >
                    Tümünü Seç
                  </button>
                  <button 
                    type="button" 
                    className="btn-secondary"
                    onClick={() => {
                      const allFalse = Object.keys(syncSettings).reduce((acc, key) => {
                        if (key.startsWith('sync_')) acc[key] = false;
                        return acc;
                      }, {...syncSettings});
                      setSyncSettings(allFalse);
                    }}
                  >
                    Tümünü Kaldır
                  </button>
                  <button 
                    type="submit" 
                    className="btn-primary"
                    disabled={savingSettings}
                  >
                    {savingSettings ? '💾 Kaydediliyor...' : '💾 Ayarları Kaydet'}
                  </button>
                </div>
              </form>
            ) : (
              <p className="empty-text">Ayarlar yüklenemedi</p>
            )}
          </div>
        )}
      </div>

    </div>
  )
}

export default IntegrationDetail
