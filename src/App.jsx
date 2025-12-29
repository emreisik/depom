import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import '@shopify/polaris/build/esm/styles.css'

import PolarisDashboard from './pages/PolarisDashboard'
import PolarisStores from './pages/PolarisStores'
import PolarisAddStore from './pages/PolarisAddStore'
import PolarisIntegrations from './pages/PolarisIntegrations'
import PolarisNewIntegration from './pages/PolarisNewIntegration'
import PolarisIntegrationDetail from './pages/PolarisIntegrationDetail'
import SyncLogDetail from './pages/SyncLogDetail'
import Install from './pages/Install'
import PrivacyPolicy from './pages/PrivacyPolicy'
import TermsOfService from './pages/TermsOfService'
import PolarisLayout from './components/PolarisLayout'
import './App.css'

function App() {
  return (
    <Router>
      <Routes>
        {/* Public routes (no layout) */}
        <Route path="/install" element={<Install />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms-of-service" element={<TermsOfService />} />
        
        {/* App routes (with Shopify App Bridge layout) */}
        <Route element={<PolarisLayout />}>
          <Route path="/" element={<PolarisDashboard />} />
          <Route path="/stores" element={<PolarisStores />} />
          <Route path="/stores/add" element={<PolarisAddStore />} />
          <Route path="/integrations" element={<PolarisIntegrations />} />
          <Route path="/integrations/new" element={<PolarisNewIntegration />} />
          <Route path="/integrations/:id" element={<PolarisIntegrationDetail />} />
          <Route path="/integrations/:id/logs/:logId" element={<SyncLogDetail />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App

