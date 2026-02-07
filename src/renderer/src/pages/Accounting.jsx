import { useEffect, useState } from 'react';
import { BarChart3, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';

export default function Accounting() {
  const [financialSummary, setFinancialSummary] = useState(null);
  const [expenseBreakdown, setExpenseBreakdown] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAccountingData();
  }, []);

  const loadAccountingData = async () => {
    try {
      const [summary, expenses, methods] = await Promise.all([
        window.api.accounting.getFinancialSummary(),
        window.api.accounting.getExpenseBreakdown(),
        window.api.accounting.getRevenueByPaymentMethod()
      ]);
      setFinancialSummary(summary);
      setExpenseBreakdown(expenses || []);
      setPaymentMethods(methods || []);
    } catch (error) {
      console.error('Error loading accounting data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading financial data...</div>;
  if (!financialSummary) return <div className="p-8 text-center">No financial data available</div>;

  const isProfitable = financialSummary.profit >= 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <BarChart3 className="text-blue-600" size={32} />
        <h1 className="text-3xl font-bold">Accounting & Financial Report</h1>
      </div>

      {/* Main Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Revenue */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg shadow p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-700 text-sm font-medium">Total Revenue</p>
              <p className="text-2xl font-bold text-green-600 mt-2">
                ${financialSummary.totalRevenue.toFixed(2)}
              </p>
            </div>
            <TrendingUp className="text-green-500" size={40} />
          </div>
        </div>

        {/* Total Costs */}
        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg shadow p-6 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-700 text-sm font-medium">Total Costs</p>
              <p className="text-2xl font-bold text-red-600 mt-2">
                ${financialSummary.totalCosts.toFixed(2)}
              </p>
            </div>
            <TrendingDown className="text-red-500" size={40} />
          </div>
        </div>

        {/* Net Profit/Loss */}
        <div className={`rounded-lg shadow p-6 border-l-4 ${isProfitable ? 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-500' : 'bg-gradient-to-br from-orange-50 to-orange-100 border-orange-500'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-700 text-sm font-medium">Net Profit</p>
              <p className={`text-2xl font-bold mt-2 ${isProfitable ? 'text-blue-600' : 'text-orange-600'}`}>
                ${financialSummary.profit.toFixed(2)}
              </p>
            </div>
            <DollarSign className={isProfitable ? 'text-blue-500' : 'text-orange-500'} size={40} />
          </div>
        </div>

        {/* Profit Margin */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg shadow p-6 border-l-4 border-purple-500">
          <div>
            <p className="text-gray-700 text-sm font-medium">Profit Margin</p>
            <p className="text-2xl font-bold text-purple-600 mt-2">{financialSummary.profitMargin}%</p>
          </div>
        </div>

        {/* Egg Revenue */}
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg shadow p-6 border-l-4 border-yellow-500">
          <div>
            <p className="text-gray-700 text-sm font-medium">Egg Revenue</p>
            <p className="text-2xl font-bold text-yellow-600 mt-2">
              ${financialSummary.eggRevenue.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Detailed Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Breakdown */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Revenue Breakdown</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Egg Revenue</span>
              <div>
                <p className="font-semibold text-yellow-600">
                  ${financialSummary.eggRevenue.toFixed(2)}
                </p>
                <p className="text-xs text-gray-500">
                  {((financialSummary.eggRevenue / financialSummary.totalRevenue) * 100).toFixed(1)}%
                </p>
              </div>
            </div>
            <div className="border-t border-gray-200 pt-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Broiler Revenue</span>
                <div>
                  <p className="font-semibold text-blue-600">
                    ${financialSummary.broilerRevenue.toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {((financialSummary.broilerRevenue / financialSummary.totalRevenue) * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Expense Breakdown */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Expense Breakdown</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Broiler Batches</span>
              <div>
                <p className="font-semibold text-blue-600">
                  ${financialSummary.broilerCosts.toFixed(2)}
                </p>
                <p className="text-xs text-gray-500">
                  {((financialSummary.broilerCosts / financialSummary.totalCosts) * 100).toFixed(1)}%
                </p>
              </div>
            </div>
            <div className="border-t border-gray-200 pt-4 flex justify-between items-center">
              <span className="text-gray-700">Egg Batches</span>
              <div>
                <p className="font-semibold text-yellow-600">
                  ${financialSummary.eggCosts.toFixed(2)}
                </p>
                <p className="text-xs text-gray-500">
                  {((financialSummary.eggCosts / financialSummary.totalCosts) * 100).toFixed(1)}%
                </p>
              </div>
            </div>
            <div className="border-t border-gray-200 pt-4 flex justify-between items-center">
              <span className="text-gray-700">Inventory/Supplies</span>
              <div>
                <p className="font-semibold text-green-600">
                  ${financialSummary.inventoryCosts.toFixed(2)}
                </p>
                <p className="text-xs text-gray-500">
                  {((financialSummary.inventoryCosts / financialSummary.totalCosts) * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Methods */}
      {paymentMethods.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Revenue by Payment Method</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Payment Method</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Transactions</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Total Amount</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Percentage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paymentMethods.map((method, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm capitalize text-gray-900 font-medium">
                      {method.payment_method}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{method.transaction_count}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-green-600">
                      ${method.amount.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {((method.amount / financialSummary.totalRevenue) * 100).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="bg-blue-50 rounded-lg shadow p-6 border-l-4 border-blue-500">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Financial Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-gray-600">Revenue Efficiency</p>
            <p className="text-xl font-bold text-blue-600">
              {((financialSummary.totalRevenue / (financialSummary.totalRevenue + financialSummary.totalCosts)) * 100).toFixed(1)}%
            </p>
          </div>
          <div>
            <p className="text-gray-600">Average Transaction Value</p>
            <p className="text-xl font-bold text-blue-600">
              ${paymentMethods.length > 0 
                ? (financialSummary.totalRevenue / paymentMethods.reduce((sum, m) => sum + m.transaction_count, 0)).toFixed(2)
                : '0.00'
              }
            </p>
          </div>
          <div>
            <p className="text-gray-600">Total Transactions</p>
            <p className="text-xl font-bold text-blue-600">
              {paymentMethods.reduce((sum, m) => sum + m.transaction_count, 0)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
