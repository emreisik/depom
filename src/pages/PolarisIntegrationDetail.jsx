import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Page,
  Layout,
  Card,
  Button,
  ButtonGroup,
  Banner,
  Badge,
  TextContainer,
  SkeletonBodyText,
  Tabs,
} from '@shopify/polaris';
import { getIntegration, startFullSync, syncInventoryOnly } from '../utils/api';

export default function PolarisIntegrationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [integration, setIntegration] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedTab, setSelectedTab] = useState(0);

  useEffect(() => {
    loadIntegration();
  }, [id]);

  const loadIntegration = async () => {
    try {
      setLoading(true);
      const response = await getIntegration(id);
      if (response.success) {
        setIntegration(response.data);
      }
    } catch (err) {
      setError('Entegrasyon yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleFullSync = async () => {
    try {
      setSyncing(true);
      setError('');
      const response = await startFullSync(id);
      
      if (response.success) {
        setSuccess(`Senkronizasyon başarılı! ${response.data.productsCreated} ürün oluşturuldu, ${response.data.productsUpdated} ürün güncellendi.`);
        loadIntegration();
      }
    } catch (err) {
      setError('Senkronizasyon hatası: ' + err.message);
    } finally {
      setSyncing(false);
    }
  };

  const handleInventorySync = async () => {
    try {
      setSyncing(true);
      setError('');
      const response = await syncInventoryOnly(id);
      
      if (response.success) {
        setSuccess(`Stok senkronizasyonu başarılı! ${response.data.inventoryUpdated || 0} stok güncellendi.`);
        loadIntegration();
      }
    } catch (err) {
      setError('Stok senkronizasyonu hatası: ' + err.message);
    } finally {
      setSyncing(false);
    }
  };

  const tabs = [
    { id: 'sync', content: 'Senkronizasyon', panelID: 'sync-panel' },
    { id: 'products', content: 'Ürünler & Koleksiyonlar', panelID: 'products-panel' },
    { id: 'history', content: 'Geçmiş', panelID: 'history-panel' },
    { id: 'settings', content: 'Ayarlar', panelID: 'settings-panel' },
  ];

  if (loading) {
    return (
      <Page title="Yükleniyor...">
        <Card sectioned>
          <SkeletonBodyText lines={5} />
        </Card>
      </Page>
    );
  }

  if (!integration) {
    return (
      <Page title="Entegrasyon Bulunamadı">
        <Banner status="critical">
          <p>Bu entegrasyon bulunamadı.</p>
        </Banner>
      </Page>
    );
  }

  return (
    <Page
      fullWidth
      title={integration.name}
      subtitle={`${integration.sourceStore?.name || 'Kaynak'} → ${integration.targetStore?.name || 'Hedef'}`}
      breadcrumbs={[{ content: 'Entegrasyonlar', onAction: () => navigate('/integrations') }]}
      secondaryActions={[
        {
          content: 'Yenile',
          onAction: loadIntegration,
        },
      ]}
    >
      <Layout>
        {error && (
          <Layout.Section>
            <Banner status="critical" onDismiss={() => setError('')}>
              <p>{error}</p>
            </Banner>
          </Layout.Section>
        )}

        {success && (
          <Layout.Section>
            <Banner status="success" onDismiss={() => setSuccess('')}>
              <p>{success}</p>
            </Banner>
          </Layout.Section>
        )}

        <Layout.Section>
          <Card>
            <Tabs tabs={tabs} selected={selectedTab} onSelect={setSelectedTab} />
            
            <div style={{ padding: '20px' }}>
              {selectedTab === 0 && (
                <Layout>
                  <Layout.Section>
                    <Card title="Senkronizasyon İşlemleri" sectioned>
                      <TextContainer>
                        <p>Mağazalar arasında ürün ve stok senkronizasyonu yapın.</p>
                      </TextContainer>
                      <div style={{ marginTop: '16px' }}>
                        <ButtonGroup>
                          <Button
                            primary
                            onClick={handleFullSync}
                            loading={syncing}
                            disabled={syncing}
                          >
                            Tam Senkronizasyon
                          </Button>
                          <Button
                            onClick={handleInventorySync}
                            loading={syncing}
                            disabled={syncing}
                          >
                            Stok Senkronizasyonu
                          </Button>
                        </ButtonGroup>
                      </div>
                    </Card>
                  </Layout.Section>

                  <Layout.Section secondary>
                    <Card title="İstatistikler" sectioned>
                      <TextContainer>
                        <p>Toplam Senkronizasyon: {integration.totalSyncs || 0}</p>
                        {integration.lastSync && (
                          <p>
                            Son Senkronizasyon:{' '}
                            {new Date(integration.lastSync).toLocaleString('tr-TR')}
                          </p>
                        )}
                        <p>
                          Durum:{' '}
                          {integration.lastSyncStatus === 'completed' ? (
                            <Badge status="success">Başarılı</Badge>
                          ) : integration.lastSyncStatus === 'failed' ? (
                            <Badge status="critical">Hatalı</Badge>
                          ) : (
                            <Badge>Beklemede</Badge>
                          )}
                        </p>
                      </TextContainer>
                    </Card>
                  </Layout.Section>
                </Layout>
              )}

              {selectedTab === 1 && (
                <Card sectioned>
                  <TextContainer>
                    <p>Ürünler ve koleksiyonlar bölümü geliştiriliyor...</p>
                  </TextContainer>
                </Card>
              )}

              {selectedTab === 2 && (
                <Card sectioned>
                  <TextContainer>
                    <p>Senkronizasyon geçmişi yakında eklenecek...</p>
                  </TextContainer>
                </Card>
              )}

              {selectedTab === 3 && (
                <Card sectioned>
                  <TextContainer>
                    <p>Senkronizasyon ayarları bölümü geliştiriliyor...</p>
                  </TextContainer>
                </Card>
              )}
            </div>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

