import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Page,
  Card,
  ResourceList,
  ResourceItem,
  Text,
  Badge,
  Button,
  ButtonGroup,
  EmptyState,
  Banner,
  Modal,
  TextContainer,
  Icon,
  Thumbnail,
} from '@shopify/polaris';
import { getStores, deleteStore } from '../utils/api';

export default function PolarisStores() {
  const navigate = useNavigate();
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteModalActive, setDeleteModalActive] = useState(false);
  const [storeToDelete, setStoreToDelete] = useState(null);

  useEffect(() => {
    loadStores();
  }, []);

  const loadStores = async () => {
    try {
      setLoading(true);
      const response = await getStores();
      if (response.success) {
        setStores(response.data);
      }
    } catch (err) {
      setError('Mağazalar yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (store) => {
    setStoreToDelete(store);
    setDeleteModalActive(true);
  };

  const handleDeleteConfirm = async () => {
    if (!storeToDelete) return;

    try {
      await deleteStore(storeToDelete.id);
      setStores(stores.filter(s => s.id !== storeToDelete.id));
      setDeleteModalActive(false);
      setStoreToDelete(null);
    } catch (err) {
      setError('Mağaza silinirken hata oluştu');
    }
  };

  const renderStoreItem = (item) => {
    const { id, name, shopDomain, isActive, shopInfo, lastSync } = item;
    
    const shortcutActions = [
      {
        content: 'Sil',
        destructive: true,
        onAction: () => handleDeleteClick(item),
      },
    ];

    return (
      <ResourceItem
        id={id}
        shortcutActions={shortcutActions}
        accessibilityLabel={`${name} mağazasını görüntüle`}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', flex: 1 }}>
            <div style={{ flex: 1 }}>
              <Text variant="bodyMd" fontWeight="semibold" as="h3">
                {name}
              </Text>
              <Text variant="bodySm" as="p" color="subdued">
                {shopDomain}
              </Text>
              {shopInfo && (
                <div style={{ marginTop: '8px' }}>
                  <Text variant="bodySm" as="p" color="subdued">
                    {shopInfo.shopOwner} • {shopInfo.email}
                  </Text>
                </div>
              )}
              {lastSync && (
                <Text variant="bodySm" as="p" color="subdued">
                  Son Senkronizasyon: {new Date(lastSync).toLocaleDateString('tr-TR')}
                </Text>
              )}
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Badge status={isActive ? 'success' : 'critical'}>
              {isActive ? 'Aktif' : 'Pasif'}
            </Badge>
          </div>
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
      }}
      image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
    >
      <p>
        Depom ile mağazalar arası stok yönetimine başlamak için Shopify mağazalarınızı bağlayın.
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
      title="Mağazalar"
      subtitle={`${stores.length} mağaza bağlı`}
      primaryAction={{
        content: 'Mağaza Ekle',
        onAction: () => navigate('/stores/add'),
      }}
      secondaryActions={[
        {
          content: 'Yenile',
          onAction: loadStores,
        },
      ]}
    >
      {errorBannerMarkup}

      <Card>
        {!loading && stores.length > 0 && (
          <ResourceList
            resourceName={{ singular: 'mağaza', plural: 'mağazalar' }}
            items={stores}
            renderItem={renderStoreItem}
            loading={loading}
          />
        )}

        {emptyStateMarkup}
      </Card>

      <Modal
        open={deleteModalActive}
        onClose={() => setDeleteModalActive(false)}
        title="Mağazayı Sil"
        primaryAction={{
          content: 'Sil',
          destructive: true,
          onAction: handleDeleteConfirm,
        }}
        secondaryActions={[
          {
            content: 'İptal',
            onAction: () => setDeleteModalActive(false),
          },
        ]}
      >
        <Modal.Section>
          <TextContainer>
            <p>
              <strong>{storeToDelete?.name}</strong> mağazasını silmek istediğinize emin misiniz?
            </p>
            <p>Bu işlem geri alınamaz.</p>
          </TextContainer>
        </Modal.Section>
      </Modal>
    </Page>
  );
}

