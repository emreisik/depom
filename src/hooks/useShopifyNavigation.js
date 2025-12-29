import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppBridge } from '@shopify/app-bridge-react';
import { NavigationMenu } from '@shopify/app-bridge/actions';

export function useShopifyNavigation() {
  const app = useAppBridge();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!app) return;

    const navigationMenu = NavigationMenu.create(app, {
      items: [
        {
          label: 'Ana Sayfa',
          destination: '/',
        },
        {
          label: 'Mağazalar',
          destination: '/stores',
        },
        {
          label: 'Entegrasyonlar',
          destination: '/integrations',
        },
      ],
      active: location.pathname,
    });

    // Handle navigation clicks
    navigationMenu.subscribe(NavigationMenu.Action.SELECT, (payload) => {
      navigate(payload.destination);
    });

    return () => {
      navigationMenu.unsubscribe();
    };
  }, [app, navigate, location]);
}

