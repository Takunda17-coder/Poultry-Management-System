import { useEffect, useState } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, DollarSign, CreditCard, Coins, AlertCircle } from 'lucide-react';
import { Card } from '../components/FormComponents';

export default function Reports() {
  const [revenueData, setRevenueData] = useState([]);
  const [paymentMethodData, setPaymentMethodData] = useState([]);
  const [debtsData, setDebtsData] = useState([]);
  const [changeData, setChangeData] = useState([]);
  const [loading, setLoading] = useState(true);

  const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

  useEffect(() => {
    loadReportData();
  }, []);

  const loadReportData = async () => {
    try {
      // Load sales data
      const allSales = await window.api.sales.getAll();
      const paymentMethods = await window.api.sales.getByPaymentMethod();
      const totalDebt = await window.api.debt.getTotalOutstanding();
      const outstandingDebts = await window.api.debt.getOutstanding();
      const totalChange = await window.api.change.getTotalOutstanding();
      const outstandingChange = await window.api.change.getOutstanding();

      // Process revenue data (group by date)
      const revenueByDate = {};
      allSales.forEach(sale => {
        const date = sale.sale_date;
        if (!revenueByDate[date]) {
          revenueByDate[date] = 0;
        }
        revenueByDate[date] += sale.total_amount;
      });

      const revenueSorted = Object.entries(revenueByDate)
        .map(([date, amount]) => ({ date, amount: parseFloat(amount.toFixed(2)) }))
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(-30); // Last 30 days

      setRevenueData(revenueSorted);

      // Process payment method data
      const paymentData = (paymentMethods || []).map(method => ({
        name: method.payment_method.charAt(0).toUpperCase() + method.payment_method.slice(1),
        value: parseFloat(method.total.toFixed(2)),
        count: method.count,
      }));
      setPaymentMethodData(paymentData);

      // Process debts data
      const debtsByCustomer = {};
      outstandingDebts.forEach(debt => {
        const customer = debt.customer_name || 'Unknown';
        if (!debtsByCustomer[customer]) {
          debtsByCustomer[customer] = 0;
        }
        debtsByCustomer[customer] += debt.debt_amount;
      });

      const debtsForChart = Object.entries(debtsByCustomer)
        .map(([name, debt]) => ({ name, debt: parseFloat(debt.toFixed(2)) }))
        .sort((a, b) => b.debt - a.debt)
        .slice(0, 10);

      setDebtsData(debtsForChart);

      // Process change data
      const changeByCustomer = {};
      outstandingChange.forEach(change => {
        const customer = change.customer_name || 'Unknown';
        if (!changeByCustomer[customer]) {
          changeByCustomer[customer] = 0;
        }
        changeByCustomer[customer] += change.change_amount;
      });

      const changeForChart = Object.entries(changeByCustomer)
        .map(([name, change]) => ({ name, change: parseFloat(change.toFixed(2)) }))
        .sort((a, b) => b.change - a.change)
        .slice(0, 10);

      setChangeData(changeForChart);
    } catch (error) {
      console.error('Error loading report data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading reports...</div>;

  // Calculate summary stats
  const totalRevenue = revenueData.reduce((sum, item) => sum + item.amount, 0);
  const paymentMethodTotal = paymentMethodData.reduce((sum, item) => sum + item.value, 0);
  const totalDebts = debtsData.reduce((sum, item) => sum + item.debt, 0);
  const totalChange = changeData.reduce((sum, item) => sum + item.change, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp className="text-blue-600" size={32} />
        <h1 className="text-3xl font-bold">Business Reports</h1>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card title="Total Revenue">
          <p className="text-3xl font-bold text-green-600">${totalRevenue.toFixed(2)}</p>
          <p className="text-sm text-gray-600 mt-2">{revenueData.length} days tracked</p>
        </Card>
        <Card title="Outstanding Debts">
          <p className="text-3xl font-bold text-red-600">${totalDebts.toFixed(2)}</p>
          <p className="text-sm text-gray-600 mt-2">{debtsData.length} customers</p>
        </Card>
        <Card title="Outstanding Change">
          <p className="text-3xl font-bold text-blue-600">${totalChange.toFixed(2)}</p>
          <p className="text-sm text-gray-600 mt-2">{changeData.length} customers</p>
        </Card>
        <Card title="Payment Methods">
          <p className="text-3xl font-bold text-purple-600">${paymentMethodTotal.toFixed(2)}</p>
          <p className="text-sm text-gray-600 mt-2">{paymentMethodData.length} methods</p>
        </Card>
      </div>

      {/* Revenue Trend */}
      <Card title="Revenue Trend (Last 30 Days)">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={revenueData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
            <Legend />
            <Line type="monotone" dataKey="amount" stroke="#3b82f6" name="Daily Revenue" />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Payment Methods Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Revenue by Payment Method">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={paymentMethodData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: $${value.toFixed(2)}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {paymentMethodData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Payment Method Details">
          <div className="space-y-3">
            {paymentMethodData.map((method, idx) => (
              <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <div>
                  <p className="font-semibold text-gray-900">{method.name}</p>
                  <p className="text-sm text-gray-600">{method.count} transactions</p>
                </div>
                <p className="text-lg font-bold text-gray-900">${method.value.toFixed(2)}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Outstanding Debts */}
      {debtsData.length > 0 && (
        <Card title="Top 10 Outstanding Debts">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={debtsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
              <Legend />
              <Bar dataKey="debt" fill="#ef4444" name="Debt Amount" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Outstanding Change */}
      {changeData.length > 0 && (
        <Card title="Top 10 Outstanding Customer Change">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={changeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
              <Legend />
              <Bar dataKey="change" fill="#10b981" name="Change Amount" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* No Data States */}
      {revenueData.length === 0 && (
        <Card>
          <div className="text-center py-12">
            <AlertCircle size={48} className="mx-auto text-gray-400 mb-3" />
            <p className="text-gray-600 text-lg">No revenue data available yet. Start recording sales!</p>
          </div>
        </Card>
      )}
    </div>
  );
}
