import { useState, useCallback } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import {
  Frame,
  Navigation,
  TopBar,
  Toast,
  Loading,
} from '@shopify/polaris';

export default function PolarisLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileNavigationActive, setMobileNavigationActive] = useState(false);
  const [userMenuActive, setUserMenuActive] = useState(false);

  const toggleMobileNavigationActive = useCallback(
    () =>
      setMobileNavigationActive(
        (mobileNavigationActive) => !mobileNavigationActive,
      ),
    [],
  );

  const toggleUserMenuActive = useCallback(
    () => setUserMenuActive((userMenuActive) => !userMenuActive),
    [],
  );

  // Top Bar configuration
  const userMenuMarkup = (
    <TopBar.UserMenu
      actions={[
        {
          items: [{ content: '⚙️ Ayarlar' }],
        },
      ]}
      name="Depom"
      detail="Mağaza Yönetimi"
      initials="D"
      open={userMenuActive}
      onToggle={toggleUserMenuActive}
    />
  );

  const topBarMarkup = (
    <TopBar
      showNavigationToggle
      userMenu={userMenuMarkup}
      onNavigationToggle={toggleMobileNavigationActive}
    />
  );

  // Navigation configuration
  const navigationMarkup = (
    <Navigation location={location.pathname}>
      <Navigation.Section
        items={[
          {
            label: '🏠 Ana Sayfa',
            onClick: () => navigate('/'),
            selected: location.pathname === '/',
          },
          {
            label: '🏪 Mağazalar',
            onClick: () => navigate('/stores'),
            selected: location.pathname.startsWith('/stores'),
          },
          {
            label: '🔗 Entegrasyonlar',
            onClick: () => navigate('/integrations'),
            selected: location.pathname.startsWith('/integrations'),
          },
        ]}
      />
    </Navigation>
  );

  return (
    <Frame
      topBar={topBarMarkup}
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

