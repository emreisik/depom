import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Page,
  Layout,
  Card,
  FormLayout,
  TextField,
  Select,
  Button,
  Banner,
  TextContainer,
  List,
} from '@shopify/polaris';
import { getStores, createIntegration } from '../utils/api';

export default function PolarisNewIntegration() {
  const navigate = useNavigate();
  const [stores, setStores] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    sourceStoreId: '',
    targetStoreId: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadStores();
  }, []);

  const loadStores = async () => {
    try {
      const response = await getStores();
      if (response.success) {
        setStores(response.data);
      }
    } catch (err) {
      setError('Mağazalar yüklenirken hata oluştu');
    }
  };

  const storeOptions = stores.map(store => ({
    label: `${store.name} (${store.shopDomain})`,
    value: store.id,
  }));

  const handleChange = (field) => (value) => {
    setFormData({ ...formData, [field]: value });
    setError('');
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.sourceStoreId || !formData.targetStoreId) {
      setError('Tüm alanları doldurun');
      return;
    }

    if (formData.sourceStoreId === formData.targetStoreId) {
      setError('Kaynak ve hedef mağaza aynı olamaz');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await createIntegration(
        formData.name,
        formData.sourceStoreId,
        formData.targetStoreId
      );

      if (response.success) {
        navigate(`/integrations/${response.data.id}`);
      }
    } catch (err) {
      setError('Entegrasyon oluşturulurken hata: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (stores.length < 2) {
    return (
      <Page
        title="🔗 Yeni Entegrasyon"
        breadcrumbs={[{ content: 'Entegrasyonlar', onAction: () => navigate('/integrations') }]}
      >
        <Layout>
          <Layout.Section>
            <Banner
              status="warning"
              action={{
                content: 'Mağaza Ekle',
                onAction: () => navigate('/stores/add'),
              }}
            >
              <p>
                <strong>Entegrasyon oluşturmak için en az 2 mağaza gerekli.</strong>
                <br />
                Şu anda {stores.length} mağaza bağlı. Lütfen önce mağazalarınızı ekleyin.
              </p>
            </Banner>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }

  return (
    <Page
      title="🔗 Yeni Entegrasyon Oluştur"
      breadcrumbs={[{ content: 'Entegrasyonlar', onAction: () => navigate('/integrations') }]}
      primaryAction={{
        content: loading ? 'Oluşturuluyor...' : '✅ Entegrasyonu Oluştur',
        onAction: handleSubmit,
        loading,
        disabled: loading,
      }}
      secondaryActions={[
        {
          content: '❌ İptal',
          onAction: () => navigate('/integrations'),
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

        <Layout.Section>
          <Card sectioned>
            <FormLayout>
              <TextField
                label="Entegrasyon Adı"
                value={formData.name}
                onChange={handleChange('name')}
                placeholder="Örn: Ana Mağaza → Şube 1"
                helpText="Entegrasyonunuzu tanımlayacak bir isim verin"
                autoComplete="off"
              />

              <Select
                label="🏪 Kaynak Mağaza"
                options={[
                  { label: 'Seçiniz', value: '' },
                  ...storeOptions,
                ]}
                value={formData.sourceStoreId}
                onChange={handleChange('sourceStoreId')}
                helpText="Ürünlerin kopyalanacağı mağaza"
              />

              <Select
                label="🏪 Hedef Mağaza"
                options={[
                  { label: 'Seçiniz', value: '' },
                  ...storeOptions.filter(opt => opt.value !== formData.sourceStoreId),
                ]}
                value={formData.targetStoreId}
                onChange={handleChange('targetStoreId')}
                helpText="Ürünlerin yapıştırılacağı mağaza"
                disabled={!formData.sourceStoreId}
              />
            </FormLayout>
          </Card>
        </Layout.Section>

        <Layout.Section secondary>
          <Card title="ℹ️ Entegrasyon Nedir?" sectioned>
            <TextContainer>
              <p>
                Entegrasyon, iki mağaza arasındaki otomatik senkronizasyon kurallarını tanımlar.
              </p>
              <List>
                <List.Item>
                  <strong>Kaynak Mağaza:</strong> Ürünlerin alınacağı mağaza
                </List.Item>
                <List.Item>
                  <strong>Hedef Mağaza:</strong> Ürünlerin kopyalanacağı mağaza
                </List.Item>
              </List>
            </TextContainer>
          </Card>

          <Card title="🎯 Sonraki Adımlar" sectioned>
            <TextContainer>
              <p>Entegrasyon oluşturduktan sonra:</p>
              <List type="number">
                <List.Item>
                  Senkronizasyon ayarlarını yapılandırın
                </List.Item>
                <List.Item>
                  Hangi özelliklerin senkronize edileceğini seçin
                </List.Item>
                <List.Item>
                  Manuel veya otomatik senkronizasyon başlatın
                </List.Item>
              </List>
            </TextContainer>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

