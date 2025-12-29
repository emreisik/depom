import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider } from '@shopify/polaris'
import '@shopify/polaris/build/esm/styles.css'
import trTranslations from '@shopify/polaris/locales/tr.json'

import Dashboard from './pages/Dashboard'
import PolarisDashboard from './pages/PolarisDashboard'
import Stores from './pages/Stores'
import PolarisStores from './pages/PolarisStores'
import AddStore from './pages/AddStore'
import ProductTransfer from './pages/ProductTransfer'
import Integrations from './pages/Integrations'
import NewIntegration from './pages/NewIntegration'
import IntegrationDetail from './pages/IntegrationDetail'
import SyncLogDetail from './pages/SyncLogDetail'
import Install from './pages/Install'
import PrivacyPolicy from './pages/PrivacyPolicy'
import TermsOfService from './pages/TermsOfService'
import Layout from './components/Layout'
import PolarisLayout from './components/PolarisLayout'
import './App.css'

function App() {
  return (
    <AppProvider i18n={trTranslations}>
      <Router>
        <Routes>
          {/* Public routes (no layout) */}
          <Route path="/install" element={<Install />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
          
          {/* App routes (with layout) */}
          <Route element={<PolarisLayout />}>
            <Route path="/" element={<PolarisDashboard />} />
            <Route path="/stores" element={<PolarisStores />} />
            <Route path="/stores/add" element={<AddStore />} />
            <Route path="/integrations" element={<Integrations />} />
            <Route path="/integrations/new" element={<NewIntegration />} />
            <Route path="/integrations/:id" element={<IntegrationDetail />} />
            <Route path="/integrations/:id/logs/:logId" element={<SyncLogDetail />} />
            <Route path="/transfer" element={<ProductTransfer />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </Router>
    </AppProvider>
  )
}

export default App

