import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Page,
  Card,
  ResourceList,
  ResourceItem,
  Text,
  Badge,
  Button,
  EmptyState,
  Banner,
  Stack,
  TextContainer,
} from '@shopify/polaris';
import { getIntegrations, getStores } from '../utils/api';

export default function PolarisIntegrations() {
  const navigate = useNavigate();
  const [integrations, setIntegrations] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [intResponse, storesResponse] = await Promise.all([
        getIntegrations(),
        getStores(),
      ]);

      if (intResponse.success) {
        setIntegrations(intResponse.data);
      }
      if (storesResponse.success) {
        setStores(storesResponse.data);
      }
    } catch (err) {
      setError('Veriler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const getStoreName = (storeId) => {
    const store = stores.find(s => s.id === storeId);
    return store ? store.name : 'Bilinmeyen Mağaza';
  };

  const getStatusBadge = (integration) => {
    if (!integration.lastSync) {
      return <Badge>Henüz Senkronize Edilmedi</Badge>;
    }

    const status = integration.lastSyncStatus;
    if (status === 'completed') {
      return <Badge status="success">Başarılı</Badge>;
    } else if (status === 'failed') {
      return <Badge status="critical">Hatalı</Badge>;
    } else {
      return <Badge status="attention">İşleniyor</Badge>;
    }
  };

  const renderIntegrationItem = (item) => {
    const { id, name, sourceStoreId, targetStoreId, lastSync, totalSyncs } = item;

    return (
      <ResourceItem
        id={id}
        onClick={() => navigate(`/integrations/${id}`)}
        accessibilityLabel={`${name} entegrasyonunu görüntüle`}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <div style={{ flex: 1 }}>
            <Text variant="bodyMd" fontWeight="semibold" as="h3">
              {name}
            </Text>
            <div style={{ marginTop: '8px' }}>
              <Text variant="bodySm" as="p" color="subdued">
                🏪 {getStoreName(sourceStoreId)} → 🏪 {getStoreName(targetStoreId)}
              </Text>
            </div>
            <div style={{ marginTop: '4px' }}>
              <Text variant="bodySm" as="p" color="subdued">
                {totalSyncs || 0} senkronizasyon
                {lastSync && ` • Son: ${new Date(lastSync).toLocaleDateString('tr-TR')}`}
              </Text>
            </div>
          </div>
          
          <div style={{ marginLeft: '16px' }}>
            {getStatusBadge(item)}
          </div>
        </div>
      </ResourceItem>
    );
  };

  const emptyStateMarkup = !loading && integrations.length === 0 && (
    <EmptyState
      heading="İlk entegrasyonunuzu oluşturun"
      action={{
        content: '➕ Yeni Entegrasyon',
        onAction: () => navigate('/integrations/new'),
        disabled: stores.length < 2,
      }}
      secondaryAction={
        stores.length < 2
          ? {
              content: '🏪 Mağaza Ekle',
              onAction: () => navigate('/stores/add'),
            }
          : undefined
      }
      image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
    >
      <p>
        {stores.length < 2
          ? 'Entegrasyon oluşturmak için en az 2 mağaza eklemelisiniz.'
          : 'Mağazalar arası otomatik senkronizasyon için entegrasyon oluşturun.'}
      </p>
    </EmptyState>
  );

  const errorBannerMarkup = error && (
    <Banner status="critical" onDismiss={() => setError('')}>
      <p>{error}</p>
    </Banner>
  );

  return (
    <Page
      fullWidth
      title="🔗 Entegrasyonlar"
      subtitle={`${integrations.length} entegrasyon • ${stores.length} mağaza`}
      primaryAction={{
        content: '➕ Yeni Entegrasyon',
        onAction: () => navigate('/integrations/new'),
        disabled: stores.length < 2,
      }}
      secondaryActions={[
        {
          content: '🔄 Yenile',
          onAction: loadData,
        },
      ]}
    >
      {errorBannerMarkup}

      {stores.length < 2 && !loading && (
        <Banner
          status="info"
          action={{ content: 'Mağaza Ekle', onAction: () => navigate('/stores/add') }}
        >
          <p>
            <strong>Entegrasyon oluşturmak için en az 2 mağaza gerekli.</strong>
            <br />
            Önce mağazalarınızı ekleyin, sonra aralarında entegrasyon oluşturun.
          </p>
        </Banner>
      )}

      <Card>
        {!loading && integrations.length > 0 && (
          <ResourceList
            resourceName={{ singular: 'entegrasyon', plural: 'entegrasyonlar' }}
            items={integrations}
            renderItem={renderIntegrationItem}
            loading={loading}
          />
        )}

        {emptyStateMarkup}
      </Card>

      {integrations.length > 0 && (
        <Card title="💡 İpucu" sectioned>
          <TextContainer>
            <p>
              Entegrasyonlara tıklayarak detaylı senkronizasyon ayarlarına erişebilir,
              geçmiş logları görüntüleyebilir ve manuel senkronizasyon başlatabilirsiniz.
            </p>
          </TextContainer>
        </Card>
      )}
    </Page>
  );
}

