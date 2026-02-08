import { useEffect, useState } from 'react';
import { CreditCard, DollarSign, AlertCircle, Check, Coins } from 'lucide-react';
import { FormInput, FormButton, Card, Table } from '../components/FormComponents';

export default function Debt() {
  const [debts, setDebts] = useState([]);
  const [totalDebt, setTotalDebt] = useState(0);
  const [changes, setChanges] = useState([]);
  const [totalChange, setTotalChange] = useState(0);
  const [loading, setLoading] = useState(true);
  const [paymentForm, setPaymentForm] = useState({ saleId: null, amount: '' });
  const [selectedDebt, setSelectedDebt] = useState(null);
  const [processingChangeId, setProcessingChangeId] = useState(null);

  async function loadData() {
    try {
      const [outstandingDebts, total, outstandingChanges, totalChangeOw] = await Promise.all([
        window.api.debt.getOutstanding(),
        window.api.debt.getTotalOutstanding(),
        window.api.change.getOutstanding(),
        window.api.change.getTotalOutstanding()
      ]);
      setDebts(outstandingDebts || []);
      setTotalDebt(total || 0);
      setChanges(outstandingChanges || []);
      setTotalChange(totalChangeOw || 0);
    } catch (error) {
      console.error('Error loading debts and change:', error);
      alert('Failed to load data: ' + error.message);
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

  const handleReturnChange = async (changeRecord) => {
    if (!window.confirm(`Write off change of $${changeRecord.change_amount.toFixed(2)} paid to ${changeRecord.customer_name}?`)) {
      return;
    }

    setProcessingChangeId(changeRecord.id);
    try {
      await window.api.change.return(changeRecord.id);
      alert('Change written off successfully');
      await loadData();
    } catch (error) {
      console.error('Error writing off change:', error);
      alert('Error: ' + error.message);
    } finally {
      setProcessingChangeId(null);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading debts and change data...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <AlertCircle className="text-red-600" size={32} />
        <h1 className="text-3xl font-bold">Outstanding Debts & Change Owed</h1>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card title="Total Debts Owed">
          <p className="text-3xl font-bold text-red-600">${totalDebt.toFixed(2)}</p>
          <p className="text-sm text-gray-600 mt-2">{debts.length} record{debts.length !== 1 ? 's' : ''}</p>
        </Card>
        <Card title="Total Change Owed">
          <p className="text-3xl font-bold text-green-600">${totalChange.toFixed(2)}</p>
          <p className="text-sm text-gray-600 mt-2">{changes.length} customer{changes.length !== 1 ? 's' : ''}</p>
        </Card>
        <Card title="Combined Total">
          <p className="text-3xl font-bold text-blue-600">${(totalDebt + totalChange).toFixed(2)}</p>
          <p className="text-sm text-gray-600 mt-2">All outstanding amounts</p>
        </Card>
        <Card title="Status">
          <p className="text-lg font-semibold text-yellow-600">
            {debts.length > 0 || changes.length > 0 ? 'Action Required' : 'All Clear'}
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
      <Card title="Customer Debts (Credit Sales & Underpayments)">
        {debts.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-green-600 text-lg font-semibold">✓ No outstanding debts!</p>
          </div>
        ) : (
          <Table
            headers={['Customer', 'Phone', 'Sale Date', 'Total Amount', 'Outstanding Debt']}
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

      {/* Change Owed Table */}
      <Card title="Change Owed to Customers (Overpayments)">
        {changes.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-green-600 text-lg font-semibold">✓ No outstanding change owed!</p>
          </div>
        ) : (
          <Table
            headers={['Customer', 'Phone', 'Sale Date', 'Sale Total', 'Amount Paid', 'Change Owed']}
            rows={changes.map(change => ({
              'Customer': change.customer_name || '-',
              'Phone': change.customer_phone || '-',
              'Sale Date': change.sale_date,
              'Sale Total': `$${change.total_amount.toFixed(2)}`,
              'Amount Paid': `$${(change.total_amount + change.change_amount).toFixed(2)}`,
              'Change Owed': `$${change.change_amount.toFixed(2)}`,
            }))}
            actions={(row) => {
              const change = changes.find(c => c.customer_name === row['Customer'] && c.sale_date === row['Sale Date']);
              return (
                <button
                  onClick={() => handleReturnChange(change)}
                  disabled={processingChangeId === change.id}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-3 py-1 rounded text-sm transition flex items-center gap-1"
                  title="Write Off as Paid"
                >
                  <Check size={16} />
                  {processingChangeId === change.id ? 'Processing...' : 'Write Off'}
                </button>
              );
            }}
          />
        )}
      </Card>
    </div>
  );
}
