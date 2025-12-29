import { useState, useCallback } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import {
  Frame,
  Navigation,
} from '@shopify/polaris';

export default function PolarisLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileNavigationActive, setMobileNavigationActive] = useState(false);

  const toggleMobileNavigationActive = useCallback(
    () =>
      setMobileNavigationActive(
        (mobileNavigationActive) => !mobileNavigationActive,
      ),
    [],
  );

  // Navigation configuration
  const navigationMarkup = (
    <Navigation location={location.pathname}>
      <Navigation.Section
        items={[
          {
            label: 'Ana Sayfa',
            onClick: () => navigate('/'),
            selected: location.pathname === '/',
          },
          {
            label: 'Mağazalar',
            onClick: () => navigate('/stores'),
            selected: location.pathname.startsWith('/stores'),
          },
          {
            label: 'Entegrasyonlar',
            onClick: () => navigate('/integrations'),
            selected: location.pathname.startsWith('/integrations'),
          },
        ]}
      />
    </Navigation>
  );

  return (
    <Frame
      navigation={navigationMarkup}
      showMobileNavigation={mobileNavigationActive}
      onNavigationDismiss={toggleMobileNavigationActive}
    >
      <div style={{ padding: '20px' }}>
        <Outlet />
      </div>
    </Frame>
  );
}

