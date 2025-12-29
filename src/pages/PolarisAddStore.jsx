import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Page,
  Layout,
  Card,
  FormLayout,
  TextField,
  Button,
  Banner,
  TextContainer,
  SkeletonBodyText,
  List,
} from '@shopify/polaris';
import { addStore, testConnection } from '../utils/api';

export default function PolarisAddStore() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    storeName: '',
    shopDomain: '',
    accessToken: '',
  });
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (field) => (value) => {
    setFormData({ ...formData, [field]: value });
    setError('');
    setSuccess('');
  };

  const handleTest = async () => {
    if (!formData.shopDomain || !formData.accessToken) {
      setError('Mağaza domain ve API token gerekli');
      return;
    }

    try {
      setTesting(true);
      setError('');
      const response = await testConnection(formData.shopDomain, formData.accessToken);
      
      if (response.success) {
        setSuccess('✅ Bağlantı başarılı! Mağaza bilgileri doğrulandı.');
      }
    } catch (err) {
      setError('Bağlantı hatası: ' + err.message);
    } finally {
      setTesting(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.storeName || !formData.shopDomain || !formData.accessToken) {
      setError('Tüm alanları doldurun');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const response = await addStore(
        formData.storeName,
        formData.shopDomain,
        formData.accessToken
      );

      if (response.success) {
        navigate('/stores');
      }
    } catch (err) {
      setError('Mağaza eklenirken hata: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Page
      title="🏪 Yeni Mağaza Ekle"
      breadcrumbs={[{ content: 'Mağazalar', onAction: () => navigate('/stores') }]}
      primaryAction={{
        content: loading ? 'Ekleniyor...' : '✅ Mağazayı Ekle',
        onAction: handleSubmit,
        loading,
        disabled: loading || testing,
      }}
      secondaryActions={[
        {
          content: '❌ İptal',
          onAction: () => navigate('/stores'),
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
          <Card sectioned>
            <FormLayout>
              <TextField
                label="Mağaza Adı"
                value={formData.storeName}
                onChange={handleChange('storeName')}
                placeholder="Örn: Ana Mağaza"
                helpText="Mağazanızı tanımlayacak bir isim verin"
                autoComplete="off"
              />

              <TextField
                label="Shopify Domain"
                value={formData.shopDomain}
                onChange={handleChange('shopDomain')}
                placeholder="your-store.myshopify.com"
                helpText=".myshopify.com uzantılı mağaza adresiniz"
                suffix=".myshopify.com"
                autoComplete="off"
              />

              <TextField
                label="Admin API Access Token"
                value={formData.accessToken}
                onChange={handleChange('accessToken')}
                placeholder="shpat_xxxxxxxxxxxxxxxxxxxxxxxx"
                helpText="Shopify Admin → Apps → Private apps → Create private app"
                type="password"
                autoComplete="off"
              />

              <Button
                onClick={handleTest}
                loading={testing}
                disabled={!formData.shopDomain || !formData.accessToken || loading}
              >
                {testing ? '🔄 Test Ediliyor...' : '🧪 Bağlantıyı Test Et'}
              </Button>
            </FormLayout>
          </Card>
        </Layout.Section>

        <Layout.Section secondary>
          <Card title="📋 Nasıl API Token Alınır?" sectioned>
            <TextContainer>
              <List type="number">
                <List.Item>
                  Shopify Admin paneline giriş yapın
                </List.Item>
                <List.Item>
                  <strong>Settings</strong> → <strong>Apps and sales channels</strong>
                </List.Item>
                <List.Item>
                  <strong>Develop apps</strong> tıklayın
                </List.Item>
                <List.Item>
                  <strong>Create an app</strong> butonuna basın
                </List.Item>
                <List.Item>
                  App'e bir isim verin (Örn: Depom)
                </List.Item>
                <List.Item>
                  <strong>Configure Admin API scopes</strong> bölümünde:
                  <br />• read_products
                  <br />• write_products
                  <br />• read_inventory
                  <br />• write_inventory
                </List.Item>
                <List.Item>
                  <strong>Install app</strong> ve <strong>Reveal token once</strong>
                </List.Item>
                <List.Item>
                  Token'ı kopyalayın ve yukarıdaki alana yapıştırın
                </List.Item>
              </List>
            </TextContainer>
          </Card>

          <Card title="🔒 Güvenlik" sectioned>
            <TextContainer>
              <p>
                API token'ınız AES-256 şifreleme ile güvenli bir şekilde saklanır.
                Token'ınızı kimseyle paylaşmayın.
              </p>
            </TextContainer>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

