import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Stores from './pages/Stores'
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
import './App.css'

function App() {
  return (
    <Router>
      <Routes>
        {/* Public routes (no layout) */}
        <Route path="/install" element={<Install />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms-of-service" element={<TermsOfService />} />
        
        {/* App routes (with layout) */}
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/stores" element={<Stores />} />
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
  )
}

export default App

