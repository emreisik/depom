import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Page,
  Layout,
  Card,
  EmptyState,
  Button,
  ButtonGroup,
  Banner,
  SkeletonBodyText,
  SkeletonDisplayText,
  ResourceList,
  ResourceItem,
  Text,
  Badge,
  Icon,
} from '@shopify/polaris';
import {
  StoreMajor,
  CirclePlusMajor,
  RefreshMajor,
} from '@shopify/polaris-icons';
import { getStores } from '../utils/api';

export default function PolarisDashboard() {
  const navigate = useNavigate();
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadStores();
  }, []);

  const loadStores = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await getStores();
      if (response.success) {
        setStores(response.data);
      }
    } catch (err) {
      setError('Mağazalar yüklenirken hata oluştu: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderStoreItem = (item) => {
    const { id, name, shopDomain, isActive } = item;

    return (
      <ResourceItem
        id={id}
        onClick={() => navigate(`/stores`)}
        accessibilityLabel={`${name} mağazasını görüntüle`}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Icon source={StoreMajor} color="base" />
            <div>
              <Text variant="bodyMd" fontWeight="semibold" as="h3">
                {name}
              </Text>
              <Text variant="bodySm" as="p" color="subdued">
                {shopDomain}
              </Text>
            </div>
          </div>
          <Badge status={isActive ? 'success' : 'critical'}>
            {isActive ? 'Aktif' : 'Pasif'}
          </Badge>
        </div>
      </ResourceItem>
    );
  };

  const emptyStateMarkup = !loading && stores.length === 0 && (
    <EmptyState
      heading="İlk mağazanızı ekleyin"
      action={{
        content: 'Mağaza Ekle',
        onAction: () => navigate('/stores/add'),
        icon: CirclePlusMajor,
      }}
      image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
    >
      <p>Shopify mağazalarınızı bağlayarak stok yönetimine başlayın.</p>
    </EmptyState>
  );

  const loadingMarkup = loading && (
    <Card sectioned>
      <SkeletonDisplayText size="small" />
      <SkeletonBodyText lines={3} />
    </Card>
  );

  const errorMarkup = error && (
    <Banner status="critical" onDismiss={() => setError('')}>
      <p>{error}</p>
    </Banner>
  );

  return (
    <Page
      fullWidth
      title="🏪 Depom"
      subtitle="Mağazalar arası stok yönetimi"
      primaryAction={{
        content: 'Yeni Mağaza',
        icon: CirclePlusMajor,
        onAction: () => navigate('/stores/add'),
      }}
      secondaryActions={[
        {
          content: 'Yenile',
          icon: RefreshMajor,
          onAction: loadStores,
        },
      ]}
    >
      <Layout>
        {errorMarkup}

        <Layout.Section>
          <Card>
            <div style={{ padding: '20px' }}>
              <Text variant="headingMd" as="h2">
                Bağlı Mağazalar
              </Text>
              <div style={{ marginTop: '4px' }}>
                <Text variant="bodySm" as="p" color="subdued">
                  {stores.length} mağaza bağlı
                </Text>
              </div>
            </div>

            {loadingMarkup}
            
            {!loading && stores.length > 0 && (
              <ResourceList
                resourceName={{ singular: 'mağaza', plural: 'mağazalar' }}
                items={stores}
                renderItem={renderStoreItem}
              />
            )}

            {emptyStateMarkup}
          </Card>
        </Layout.Section>

        <Layout.Section secondary>
          <Card title="Hızlı Başlangıç" sectioned>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Button onClick={() => navigate('/stores/add')}>
                1. Mağaza Ekle
              </Button>
              <Button onClick={() => navigate('/integrations/new')} disabled={stores.length < 2}>
                2. Entegrasyon Oluştur
              </Button>
              <Button onClick={() => navigate('/integrations')} disabled={stores.length < 2}>
                3. Senkronize Et
              </Button>
            </div>
          </Card>

          <Card title="İstatistikler" sectioned>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text as="span" color="subdued">Toplam Mağaza:</Text>
                <Text as="span" fontWeight="semibold">{stores.length}</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text as="span" color="subdued">Aktif Mağaza:</Text>
                <Text as="span" fontWeight="semibold">
                  {stores.filter(s => s.isActive).length}
                </Text>
              </div>
            </div>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

