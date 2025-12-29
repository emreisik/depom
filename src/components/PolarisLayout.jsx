import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { Provider as AppBridgeProvider } from '@shopify/app-bridge-react';
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
  const navigate = useNavigate();
  const location = useLocation();

  // Shopify App Bridge configuration
  const appBridgeConfig = {
    apiKey: import.meta.env.VITE_SHOPIFY_API_KEY || 'your-api-key',
    host: new URLSearchParams(location.search).get('host') || window.btoa('admin.shopify.com/store/demo'),
    forceRedirect: false,
  };

  // Custom router for Shopify App Bridge
  const router = {
    location: location.pathname,
    history: {
      push: (path) => navigate(path),
      replace: (path) => navigate(path, { replace: true }),
    },
  };

  return (
    <AppBridgeProvider config={appBridgeConfig} router={router}>
      <AppProvider i18n={en}>
        <AppContent />
      </AppProvider>
    </AppBridgeProvider>
  );
}
