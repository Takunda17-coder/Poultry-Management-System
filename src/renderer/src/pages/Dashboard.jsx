import React, { useEffect, useState } from 'react';
import { Bird, Egg, Users, TrendingUp, CreditCard, Coins, DollarSign } from 'lucide-react';
import { Card } from '../components/FormComponents';

export default function Dashboard() {
  const [broilerCount, setBroilerCount] = useState(0);
  const [eggCount, setEggCount] = useState(0);
  const [supplierCount, setSupplierCount] = useState(0);
  const [revenue, setRevenue] = useState(0);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [totalDebt, setTotalDebt] = useState(0);
  const [totalChange, setTotalChange] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [broilers, eggs, suppliers, rev, payMethods, debt, change] = await Promise.all([
        window.api.stats.getBroilerCount(),
        window.api.stats.getEggCount(),
        window.api.stats.getSupplierCount(),
        window.api.stats.getRevenue(),
        window.api.sales.getByPaymentMethod(),
        window.api.debt.getTotalOutstanding(),
        window.api.change.getTotalOutstanding(),
      ]);
      setBroilerCount(broilers);
      setEggCount(eggs);
      setSupplierCount(suppliers);
      setRevenue(rev);
      setPaymentMethods(payMethods || []);
      setTotalDebt(debt || 0);
      setTotalChange(change || 0);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    { label: 'Total Broiler Batches', value: broilerCount.toString(), icon: Bird, color: 'bg-blue-500' },
    { label: 'Egg Batches', value: eggCount.toString(), icon: Egg, color: 'bg-yellow-500' },
    { label: 'Suppliers', value: supplierCount.toString(), icon: Users, color: 'bg-green-500' },
    { label: 'Total Revenue', value: `$${revenue.toFixed(2)}`, icon: TrendingUp, color: 'bg-purple-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg shadow-lg p-8 text-white">
        <h1 className="text-4xl font-bold mb-2">Welcome to Poultry Manager</h1>
        <p className="text-blue-100 text-lg">
          Manage your poultry farm efficiently with our comprehensive management system.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">{stat.label}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
              </div>
              <div className={`${stat.color} p-4 rounded-lg`}>
                <stat.icon size={32} className="text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <a
            href="/add-broiler"
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg transition flex items-center justify-center space-x-2"
          >
            <Bird size={20} />
            <span>Add Broiler</span>
          </a>
          <a
            href="/add-eggs"
            className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 px-4 rounded-lg transition flex items-center justify-center space-x-2"
          >
            <Egg size={20} />
            <span>Add Eggs</span>
          </a>
          <a
            href="/add-supplier"
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-lg transition flex items-center justify-center space-x-2"
          >
            <Users size={20} />
            <span>Add Supplier</span>
          </a>
          <a
            href="/sales"
            className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg transition flex items-center justify-center space-x-2"
          >
            <DollarSign size={20} />
            <span>New Sale</span>
          </a>
          <a
            href="/reports"
            className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 px-4 rounded-lg transition flex items-center justify-center space-x-2"
          >
            <TrendingUp size={20} />
            <span>Reports</span>
          </a>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card title="Outstanding Debts">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-red-600">${totalDebt.toFixed(2)}</p>
              <p className="text-sm text-gray-600 mt-2">Credit sales needing payment</p>
            </div>
            <CreditCard className="text-red-600" size={48} />
          </div>
          <a href="/debt" className="text-blue-600 hover:text-blue-700 font-semibold text-sm mt-4 block">View Debts →</a>
        </Card>

        <Card title="Outstanding Change">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-blue-600">${totalChange.toFixed(2)}</p>
              <p className="text-sm text-gray-600 mt-2">Cash owed to customers</p>
            </div>
            <Coins className="text-blue-600" size={48} />
          </div>
          <a href="/change" className="text-blue-600 hover:text-blue-700 font-semibold text-sm mt-4 block">View Change →</a>
        </Card>

        <Card title="Payment Methods">
          <div className="space-y-2">
            {paymentMethods.length > 0 ? (
              paymentMethods.map((method, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span className="text-gray-700 capitalize font-medium">{method.payment_method}</span>
                  <span className="text-gray-900 font-bold">${method.total.toFixed(2)}</span>
                </div>
              ))
            ) : (
              <p className="text-gray-600 text-sm">No sales data available</p>
            )}
          </div>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Recent Activity</h2>
        <div className="space-y-4">
          <div className="border-l-4 border-blue-500 pl-4 py-2">
            <p className="font-semibold text-gray-900">New Broiler Batch Added</p>
            <p className="text-sm text-gray-600">Added batch #BR-2026-001 with 500 birds</p>
          </div>
          <div className="border-l-4 border-yellow-500 pl-4 py-2">
            <p className="font-semibold text-gray-900">Egg Batch Recorded</p>
            <p className="text-sm text-gray-600">Recorded 2000 eggs from supplier A</p>
          </div>
          <div className="border-l-4 border-green-500 pl-4 py-2">
            <p className="font-semibold text-gray-900">New Supplier Added</p>
            <p className="text-sm text-gray-600">Registered new egg supplier: Farm Fresh</p>
          </div>
        </div>
      </div>
    </div>
  );
}
