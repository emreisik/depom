import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { AppProvider } from '@shopify/polaris';
import en from '@shopify/polaris/locales/en.json';
import { useShopifyNavigation } from '../hooks/useShopifyNavigation';

function AppContent() {
  // Initialize Shopify navigation menu
  useShopifyNavigation();

  return (
    <div style={{ padding: '20px' }}>
      <Outlet />
    </div>
  );
}

export default function PolarisLayout() {
  return (
    <AppProvider i18n={en}>
      <AppContent />
    </AppProvider>
  );
}
