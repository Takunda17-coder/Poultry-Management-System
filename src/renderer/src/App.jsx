import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Navbar from './components/NavBar';
import Sidebar from './components/SideBar';
import Dashboard from './pages/Dashboard';
import AddBroilerBatch from './pages/AddBroilerBatch';
import AddEggsBatch from './pages/AddEggsBatch';
import AddSupplier from './pages/AddSupplier';
import Sales from './pages/Sales';
import Accounting from './pages/Accounting';
import Inventory from './pages/Inventory';
import BirdEvents from './pages/BirdEvents';
import EggLoss from './pages/EggLoss';
import Debt from './pages/Debt';
import Change from './pages/Change';
import Reports from './pages/Reports';
import DataMigration from './pages/DataMigration';

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        {/* Navbar */}
        <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

        {/* Sidebar */}
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Main Content */}
        <main className="lg:ml-0 pt-4">
          <div className="px-4 sm:px-6 lg:px-8 py-8">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/add-broiler" element={<AddBroilerBatch />} />
              <Route path="/add-eggs" element={<AddEggsBatch />} />
              <Route path="/add-supplier" element={<AddSupplier />} />
              <Route path="/sales" element={<Sales />} />
              <Route path="/accounting" element={<Accounting />} />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/bird-events" element={<BirdEvents />} />
              <Route path="/egg-loss" element={<EggLoss />} />
              <Route path="/debt" element={<Debt />} />
              <Route path="/change" element={<Change />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/data-migration" element={<DataMigration />} />
            </Routes>
          </div>
        </main>
      </div>
    </Router>
  );
}
