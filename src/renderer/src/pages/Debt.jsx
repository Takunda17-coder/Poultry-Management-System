import { useEffect, useState } from 'react';
import { CreditCard, DollarSign, AlertCircle, Check } from 'lucide-react';
import { FormInput, FormButton, Card, Table } from '../components/FormComponents';

export default function Debt() {
  const [debts, setDebts] = useState([]);
  const [totalDebt, setTotalDebt] = useState(0);
  const [loading, setLoading] = useState(true);
  const [paymentForm, setPaymentForm] = useState({ saleId: null, amount: '' });
  const [selectedDebt, setSelectedDebt] = useState(null);

  async function loadData() {
    try {
      const [outstandingDebts, total] = await Promise.all([
        window.api.debt.getOutstanding(),
        window.api.debt.getTotalOutstanding()
      ]);
      setDebts(outstandingDebts || []);
      setTotalDebt(total || 0);
    } catch (error) {
      console.error('Error loading debts:', error);
      alert('Failed to load debts: ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const handlePayDebt = async (e) => {
    e.preventDefault();
    if (!selectedDebt || !paymentForm.amount) {
      alert('Please select a debt and enter amount');
      return;
    }

    try {
      const amount = Number(paymentForm.amount);
      if (amount <= 0) {
        alert('Amount must be greater than 0');
        return;
      }
      if (amount > selectedDebt.debt_amount) {
        alert('Payment cannot exceed outstanding debt');
        return;
      }

      await window.api.debt.pay(selectedDebt.id, amount);
      alert('Debt payment recorded successfully');
      setPaymentForm({ saleId: null, amount: '' });
      setSelectedDebt(null);
      await loadData();
    } catch (error) {
      console.error('Error recording payment:', error);
      alert('Error: ' + error.message);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading debts...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <AlertCircle className="text-red-600" size={32} />
        <h1 className="text-3xl font-bold">Outstanding Debts</h1>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card title="Total Debts">
          <p className="text-3xl font-bold text-red-600">${totalDebt.toFixed(2)}</p>
        </Card>
        <Card title="Total Records">
          <p className="text-3xl font-bold text-orange-600">{debts.length}</p>
        </Card>
        <Card title="Status">
          <p className="text-lg font-semibold text-yellow-600">
            {debts.length > 0 ? 'Action Required' : 'All Clear'}
          </p>
        </Card>
      </div>

      {/* Payment Form */}
      {selectedDebt && (
        <Card title="Record Debt Payment">
          <form onSubmit={handlePayDebt} className="space-y-4">
            <div className="bg-yellow-50 p-4 rounded border-l-4 border-yellow-500">
              <p className="text-sm font-medium text-gray-700">Customer</p>
              <p className="text-lg font-bold text-gray-900">{selectedDebt.customer_name || 'N/A'}</p>
              <p className="text-sm text-gray-600">{selectedDebt.customer_phone || 'No phone'}</p>
            </div>

            <div className="bg-red-50 p-4 rounded">
              <p className="text-sm font-medium text-gray-700">Outstanding Debt</p>
              <p className="text-2xl font-bold text-red-600">${selectedDebt.debt_amount.toFixed(2)}</p>
            </div>

            <FormInput
              type="number"
              label="Payment Amount"
              value={paymentForm.amount}
              onChange={(e) => setPaymentForm(prev => ({ ...prev, amount: e.target.value }))}
              placeholder="Enter amount to pay"
              step="0.01"
              max={selectedDebt.debt_amount}
              required
            />

            <div className="flex gap-3">
              <FormButton type="submit" variant="success" className="flex-1">
                <Check size={18} className="inline mr-2" />
                Record Payment
              </FormButton>
              <FormButton
                type="button"
                onClick={() => {
                  setSelectedDebt(null);
                  setPaymentForm({ saleId: null, amount: '' });
                }}
                variant="secondary"
                className="flex-1"
              >
                Cancel
              </FormButton>
            </div>
          </form>
        </Card>
      )}

      {/* Debts Table */}
      <Card title="Unpaid Credit Sales">
        {debts.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-green-600 text-lg font-semibold">✓ No outstanding debts!</p>
          </div>
        ) : (
          <Table
            headers={['Customer', 'Phone', 'Sale Date', 'Total Amount', 'Outstanding Debt', 'Action']}
            rows={debts.map(debt => ({
              'Customer': debt.customer_name || '-',
              'Phone': debt.customer_phone || '-',
              'Sale Date': debt.sale_date,
              'Total Amount': `$${debt.total_amount.toFixed(2)}`,
              'Outstanding Debt': `$${debt.debt_amount.toFixed(2)}`,
            }))}
            actions={(row) => {
              const debt = debts.find(d => d.customer_name === row['Customer'] && d.sale_date === row['Sale Date']);
              return (
                <button
                  onClick={() => setSelectedDebt(debt)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition"
                  title="Pay Debt"
                >
                  Pay
                </button>
              );
            }}
          />
        )}
      </Card>
    </div>
  );
}
