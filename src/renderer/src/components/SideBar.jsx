import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Plus, Users, Egg, Bird, X, ShoppingCart, BarChart3, Package, AlertTriangle, Droplet, CreditCard, Coins } from 'lucide-react';

export default function Sidebar({ isOpen, onClose }) {
  const menuItems = [
    { label: 'Home', path: '/', icon: Home },
    { label: 'Add Broiler Batch', path: '/add-broiler', icon: Bird },
    { label: 'Add Egg Batch', path: '/add-eggs', icon: Egg },
    { label: 'Add Supplier', path: '/add-supplier', icon: Users },
    { label: 'Inventory', path: '/inventory', icon: Package },
    { label: 'Bird Events', path: '/bird-events', icon: AlertTriangle },
    { label: 'Egg Loss', path: '/egg-loss', icon: Droplet },
    { label: 'Sales', path: '/sales', icon: ShoppingCart },
    { label: 'Accounting', path: '/accounting', icon: BarChart3 },
    { label: 'Outstanding Debts', path: '/debt', icon: CreditCard },
    { label: 'Customer Change', path: '/change', icon: Coins },
  ];

  return (
    <>
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-gray-800 text-white transform transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6 border-b border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-bold">Menu</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-700 rounded transition"
          >
            <X size={20} />
          </button>
        </div>
        <nav className="mt-6 space-y-2">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={onClose}
              className="flex items-center space-x-3 px-6 py-3 hover:bg-gray-700 transition rounded"
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 backdrop-blur-sm bg-black/20"
          onClick={onClose}
        ></div>
      )}
    </>
  );
}
